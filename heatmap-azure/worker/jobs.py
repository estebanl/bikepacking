"""Worker jobs: key changes, per-rider refreshes, the morning run.

Everything authenticates with the Function App's managed identity:
storage (tables, blobs) and Key Vault (secrets + the RSA wrap key).
Riders are identified by an opaque id (uid) the API derives from the
signed-in principal; no names or emails are stored outside the profile.
"""
import base64
import contextvars
import hashlib
import io
import json
import logging
import os
import tempfile
import time
import zipfile
from datetime import datetime, timezone

import fitdecode
from azure.core import MatchConditions
from azure.core.exceptions import (HttpResponseError, ResourceExistsError, ResourceModifiedError,
                                   ResourceNotFoundError)
from azure.data.tables import TableClient, UpdateMode
from azure.identity import DefaultAzureCredential
from azure.keyvault.keys import KeyClient
from azure.keyvault.keys.crypto import CryptographyClient, EncryptionAlgorithm
from azure.keyvault.secrets import SecretClient
from azure.storage.blob import BlobServiceClient, ContentSettings
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicNumbers
from garmin_personal_api import GarminPersonalApiClient, PersonalApiAuthenticator
from garmin_personal_api.errors import GarminPersonalApiError, HttpError

import heatmap_core

log = logging.getLogger("heatmap")

ACCOUNT = os.environ["STORAGE_ACCOUNT_NAME"]
VAULT = os.environ["KEY_VAULT_URI"]
WRAP_KEY = os.environ.get("WRAP_KEY_NAME", "garmin-wrap")
RIDE_TYPES = ("cycling", "biking")   # cycling, road_biking, mountain_biking, gravel_cycling...
SEMI = 180 / 2**31                   # FIT semicircles -> degrees
TRANSIENT = {429, 500, 502, 503, 504}
BACKOFF = (5, 15, 45)                # seconds between attempts; 4 tries per Garmin call
with open(heatmap_core.__file__, "rb") as _f:   # algorithm changes force a rebuild
    CORE_HASH = hashlib.sha256(_f.read()).hexdigest()[:16]

_cred = DefaultAzureCredential()
_blobs = BlobServiceClient(f"https://{ACCOUNT}.blob.core.windows.net", credential=_cred)
_profiles = TableClient(f"https://{ACCOUNT}.table.core.windows.net", "profiles", credential=_cred)
_secrets = SecretClient(VAULT, _cred)
_keys = KeyClient(VAULT, _cred)


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _secret_name(uid):
    return f"garmin-{uid}"


# ---------------------------------------------------------------- deletion fence
# "Delete my data" can run on another instance while a refresh or set-key job
# for the same rider is still going. The API marks the profile (purge=True)
# before it queues the purge, and every profile carries a generation id that
# changes when the rider starts over. A job remembers the generation it started
# with and stops as soon as the profile is marked, gone, or a newer generation;
# anything it wrote in the meantime is removed again.
class Gone(Exception):
    """The rider's data was (or is being) deleted; the job must stop writing."""


_job_gen = contextvars.ContextVar("job_gen", default=None)   # (uid, generation) of the running job


def _live(uid):
    """Return the rider's profile, or raise Gone if this job may no longer write for them."""
    try:
        entity = _profiles.get_entity("user", uid)
    except ResourceNotFoundError:
        raise Gone(uid) from None
    job = _job_gen.get()
    if entity.get("purge") or (job and job[0] == uid and entity.get("gen") != job[1]):
        raise Gone(uid)
    return entity


def _begin(uid):
    """Start a job for this rider: remember which generation of the profile it belongs to."""
    _job_gen.set(None)
    _job_gen.set((uid, _live(uid).get("gen")))


def _merge(uid, etag=None, **fields):
    _profiles.update_entity(
        {"PartitionKey": "user", "RowKey": uid, **fields}, mode=UpdateMode.MERGE, etag=etag,
        match_condition=MatchConditions.IfNotModified if etag else MatchConditions.Unconditionally)


def _set_profile(uid, **fields):
    """Merge fields into the profile. Never recreates a deleted one or writes over a purge mark."""
    for _ in range(5):
        entity = _live(uid)
        try:
            _merge(uid, etag=entity.metadata["etag"], **fields)
            return
        except ResourceModifiedError:                 # changed since we read it: look again
            continue
        except ResourceNotFoundError:
            raise Gone(uid) from None
    raise RuntimeError("profile kept changing")


def _put_blob(uid, container, name, data, **kwargs):
    """Upload a rider's blob, then make sure the rider wasn't deleted while it was in flight."""
    blob = _blobs.get_blob_client(container, name)
    blob.upload_blob(data, overwrite=True, **kwargs)
    try:
        _live(uid)
    except Gone:
        try:
            blob.delete_blob()
        except ResourceNotFoundError:
            pass
        raise


# ---------------------------------------------------------------- wrap key
def publish_public_key():
    """Write the wrap key's public half where the API can read it (idempotent)."""
    blob = _blobs.get_blob_client("config", "wrap-public.json")
    key = _keys.get_key(WRAP_KEY)
    try:
        current = json.loads(blob.download_blob().readall())
        if current.get("kid") == key.id:
            return
    except ResourceNotFoundError:
        pass
    jwk = key.key
    pub = RSAPublicNumbers(int.from_bytes(jwk.e, "big"), int.from_bytes(jwk.n, "big")).public_key()
    pem = pub.public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo).decode()
    blob.upload_blob(json.dumps({"kid": key.id, "pem": pem}), overwrite=True,
                     content_settings=ContentSettings(content_type="application/json"))
    log.info("published wrap public key")


def _decrypt(enc_b64):
    crypto = CryptographyClient(_keys.get_key(WRAP_KEY), _cred)
    return crypto.decrypt(EncryptionAlgorithm.rsa_oaep_256, base64.b64decode(enc_b64)).plaintext.decode()


# ---------------------------------------------------------------- garmin
def _garmin(what, fn, *args, **kwargs):
    """Call Garmin, retrying gateway errors, rate limits and dropped connections."""
    for attempt in range(len(BACKOFF) + 1):
        try:
            return fn(*args, **kwargs)
        except HttpError as e:
            if e.status_code not in TRANSIENT or attempt == len(BACKOFF):
                log.warning("garmin %s failed: HTTP %s (attempt %d)", what, e.status_code, attempt + 1)
                raise
            log.info("garmin %s: HTTP %s, retrying in %ds", what, e.status_code, BACKOFF[attempt])
        except OSError as e:                          # connection reset, timeout, DNS
            if attempt == len(BACKOFF):
                log.warning("garmin %s failed: %s (attempt %d)", what, type(e).__name__, attempt + 1)
                raise
            log.info("garmin %s: %s, retrying in %ds", what, type(e).__name__, BACKOFF[attempt])
        time.sleep(BACKOFF[attempt])


def _token(api_key):
    with tempfile.TemporaryDirectory() as tmp:
        cache = os.path.join(tmp, "token.json")
        with PersonalApiAuthenticator(bearer_token_cache_file=cache) as auth:
            return _garmin("token", auth.obtain_token, api_key).access_token


def _sync_tracks(uid, access_token):
    """Download FIT tracks for this year's rides not cached yet. Returns ride list."""
    year = datetime.now(timezone.utc).strftime("%Y")
    tracks = _blobs.get_container_client("tracks")
    cached = {b.name.rsplit("/", 1)[-1][:-5] for b in tracks.list_blobs(name_starts_with=f"{uid}/")
              if b.name.endswith(".json") and not b.name.endswith("/rides.json")}
    acts = []
    with GarminPersonalApiClient(access_token) as client:
        start = 0
        while True:
            page = _garmin("search", client.search_activities, start=start, limit=100,
                           start_date=f"{year}-01-01", end_date=f"{year}-12-31") or []
            acts += page
            start += len(page)
            if len(page) < 100:
                break
        rides = [a for a in acts
                 if any(k in ((a.get("activityType") or {}).get("typeKey") or "") for k in RIDE_TYPES)]
        new = 0
        for a in rides:
            aid = str(a["activityId"])
            if aid in cached:
                continue
            z = zipfile.ZipFile(io.BytesIO(_garmin("download", client.download_activity, a["activityId"])))
            fit = next((n for n in z.namelist() if n.lower().endswith(".fit")), None)
            pts = []
            if fit:
                with fitdecode.FitReader(io.BytesIO(z.read(fit))) as fr:
                    for f in fr:
                        if isinstance(f, fitdecode.FitDataMessage) and f.name == "record":
                            la = f.get_value("position_lat", fallback=None)
                            lo = f.get_value("position_long", fallback=None)
                            if la is not None and lo is not None:
                                pts.append((round(lo * SEMI, 6), round(la * SEMI, 6)))
            _put_blob(uid, "tracks", f"{uid}/{aid}.json", json.dumps(pts))
            cached.add(aid)
            new += 1
            time.sleep(0.3)
    rides = [{"id": str(a["activityId"]), "name": a.get("activityName") or "Ride",
              "date": a["startTimeLocal"][:10], "km": round((a.get("distance") or 0) / 1000, 1)}
             for a in rides]
    rides.sort(key=lambda r: r["date"], reverse=True)
    return rides, new


def refresh(uid):
    """Rebuild one rider's heatmap from Garmin."""
    try:
        api_key = _secrets.get_secret(_secret_name(uid)).value
    except ResourceNotFoundError:
        _set_profile(uid, hasKey=False, status="no-key", message="")
        return
    _set_profile(uid, status="syncing", message="")
    try:
        _refresh(uid, api_key)
    except HttpError as e:
        if e.status_code in (401, 403):
            _set_profile(uid, status="invalid-key", keyRejected=True,
                         message="Garmin rejected the API key. It may have expired; add a new one.")
        else:
            _set_profile(uid, status="error", message=f"Garmin returned HTTP {e.status_code}. Will retry tomorrow.")
        log.warning("garmin http %s for %s", e.status_code, uid)
    except Gone:
        raise
    except Exception:                                 # never leave the rider stuck on "syncing"
        log.exception("refresh failed for %s", uid)
        _set_profile(uid, status="error", message="Refresh failed. Will retry tomorrow.")


def _refresh(uid, api_key):
    rides, new = _sync_tracks(uid, _token(api_key))
    # Same rides as last time and same algorithm: the map can't have changed.
    fingerprint = hashlib.sha256(json.dumps([CORE_HASH, rides]).encode()).hexdigest()
    try:
        previous = _profiles.get_entity("user", uid).get("ridesHash")
    except ResourceNotFoundError:
        previous = None
    if new == 0 and fingerprint == previous:
        blob = _blobs.get_blob_client("heatmaps", f"{uid}.json")
        try:
            doc = json.loads(blob.download_blob().readall())
        except ResourceNotFoundError:
            doc = None                                # map missing: fall through and rebuild
        if doc is not None:
            doc["updated_at"] = _now()                # "updated" on the page = last checked
            _put_blob(uid, "heatmaps", f"{uid}.json", json.dumps(doc),
                      content_settings=ContentSettings(content_type="application/json"))
            _set_profile(uid, status="ok", message="", lastRun=_now())
            log.info("refreshed %s: %d rides, unchanged", uid, len(rides))
            return
    tracks = _blobs.get_container_client("tracks")
    pts = [json.loads(tracks.download_blob(f"{uid}/{r['id']}.json").readall()) for r in rides]
    lines = heatmap_core.build_lines(pts)
    stats = {"rides": len(rides), "total_km": round(sum(r["km"] for r in rides), 1),
             "unique_km": round(sum(heatmap_core.line_km(l) for l in lines)),
             "repeat_km": round(sum(heatmap_core.line_km(l) for l in lines if l[0] > 1)),
             "max_count": max((l[0] for l in lines), default=0), "lines": len(lines)}
    doc = {"updated_at": _now(), "year": int(datetime.now(timezone.utc).strftime("%Y")), "stats": stats,
           "recent_rides": [{k: r[k] for k in ("name", "date", "km")} for r in rides[:15]], "lines": lines}
    _put_blob(uid, "heatmaps", f"{uid}.json", json.dumps(doc),
              content_settings=ContentSettings(content_type="application/json"))
    _set_profile(uid, status="ok", message="", lastRun=_now(), stats=json.dumps(stats), ridesHash=fingerprint)
    log.info("refreshed %s: %d rides, %d new", uid, len(rides), new)


# ---------------------------------------------------------------- key lifecycle
def set_key(uid, enc):
    try:
        api_key = _decrypt(enc)
    except HttpResponseError:
        _set_profile(uid, status="error", message="Could not read the submitted key. Please submit it again.")
        return
    try:
        _token(api_key)                               # validate before storing
    except Exception as e:
        rejected = (e.status_code in (400, 401, 403) if isinstance(e, HttpError)
                    else isinstance(e, GarminPersonalApiError))
        if rejected:
            _set_profile(uid, hasKey=False, status="invalid-key", keyRejected=True,
                         message="Garmin rejected that API key. Check it and try again.")
            return
        # 429, 5xx, timeout, DNS...: not the key's fault.
        # Leave a state the rider can resubmit from, even if the queue retries run out.
        # keyRejected is left alone: if the saved key was already rejected, the page
        # keeps offering the key form so the replacement can be submitted again.
        log.warning("could not validate key for %s: %s", uid,
                    f"HTTP {e.status_code}" if isinstance(e, HttpError) else type(e).__name__)
        _set_profile(uid, status="error",
                     message="Could not reach Garmin to check the key. Please submit it again.")
        raise
    name = _secret_name(uid)
    _live(uid)                                        # don't store a key for a rider being deleted
    try:
        _secrets.set_secret(name, api_key, content_type="garmin-personal-api-key")
    except ResourceExistsError:                       # soft-deleted earlier: recover, then overwrite
        _secrets.begin_recover_deleted_secret(name).wait()
        _secrets.set_secret(name, api_key, content_type="garmin-personal-api-key")
    try:
        _set_profile(uid, hasKey=True, keyRejected=False, status="syncing", message="", keySetAt=_now())
    except Gone:                                      # deleted while the key was being stored
        _delete_secret(uid)
        raise
    refresh(uid)


def _delete_secret(uid):
    name = _secret_name(uid)
    try:
        _secrets.begin_delete_secret(name).wait()
        try:
            _secrets.purge_deleted_secret(name)
        except HttpResponseError:
            log.info("purge not permitted; secret stays soft-deleted for 7 days")
    except ResourceNotFoundError:
        pass


def delete_key(uid):
    _delete_secret(uid)
    _set_profile(uid, hasKey=False, keyRejected=False, status="no-key", message="")


def purge_user(uid):
    """Delete everything for a rider. Jobs still running for them are fenced off by the purge mark."""
    try:
        if not _profiles.get_entity("user", uid).get("purge"):
            log.warning("ignoring purge for %s: profile is not marked for deletion", uid)
            return
    except ResourceNotFoundError:
        pass                                          # profile already gone: finish the rest
    _delete_secret(uid)
    tracks = _blobs.get_container_client("tracks")
    for b in tracks.list_blobs(name_starts_with=f"{uid}/"):
        tracks.delete_blob(b.name)
    try:
        _blobs.get_blob_client("heatmaps", f"{uid}.json").delete_blob()
    except ResourceNotFoundError:
        pass
    try:
        _profiles.delete_entity("user", uid)
    except ResourceNotFoundError:
        pass
    log.info("purged %s", uid)


def _publish_quietly():
    """Publishing is housekeeping; a Key Vault or storage blip must not fail a rider's job."""
    try:
        publish_public_key()
    except Exception:
        log.exception("could not publish the wrap public key")


def handle(msg):
    op, uid = msg.get("op"), msg.get("uid", "")
    if op == "publish-key":
        publish_public_key()                          # the whole job: let the queue retry it
        return
    _publish_quietly()
    if not (len(uid) == 32 and all(c in "0123456789abcdef" for c in uid)):
        log.error("rejecting job with bad uid")
        return
    try:
        if op == "purge-user":
            purge_user(uid)
            return
        _begin(uid)
        if op == "set-key":
            set_key(uid, msg["enc"])
        elif op == "delete-key":
            delete_key(uid)
        elif op == "refresh":
            refresh(uid)
        else:
            log.error("unknown op %r", op)
    except Gone:
        log.info("job %s stopped for %s: rider data deleted", op, uid)
    except Exception:
        log.exception("job %s failed for %s", op, uid)
        try:
            if op == "purge-user":
                # Keep the purge mark (other jobs stay fenced off) but leave "deleting",
                # so the page stops polling and the rider can ask again.
                _merge(uid, status="error", message="Could not delete your data. Please try again.")
            elif _live(uid).get("status") != "error":  # keep a more specific message if the job set one
                _set_profile(uid, status="error", message="Something went wrong. Please try again.")
        except (Gone, ResourceNotFoundError):
            pass
        raise


def refresh_all():
    _publish_quietly()
    for p in _profiles.query_entities("PartitionKey eq 'user' and hasKey eq true"):
        uid = p["RowKey"]
        try:
            _begin(uid)
            refresh(uid)
        except Gone:
            log.info("skipping %s: rider data deleted", uid)
        except Exception:                             # one rider's failure must not stop the rest
            log.exception("refresh failed for %s", uid)
            try:
                _set_profile(uid, status="error", message="Refresh failed. Will retry tomorrow.")
            except Exception:
                log.exception("could not record the failure for %s", uid)
