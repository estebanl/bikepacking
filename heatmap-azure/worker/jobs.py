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
from azure.storage.queue import QueueClient
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
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
_queue = QueueClient(f"https://{ACCOUNT}.queue.core.windows.net", "jobs", credential=_cred)
_profiles = TableClient(f"https://{ACCOUNT}.table.core.windows.net", "profiles", credential=_cred)
_secrets = SecretClient(VAULT, _cred)
_keys = KeyClient(VAULT, _cred)


def _enqueue(msg):
    _queue.send_message(base64.b64encode(json.dumps(msg).encode()).decode())


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


_ANY = object()


def _begin(uid, gen=_ANY):
    """Start a job for this rider, tied to one generation of the profile.

    Queued jobs carry the generation they were submitted for, so one that is
    delayed or retried until after the rider deleted their data and started
    over is refused. The morning run has none and takes the current one.
    """
    _job_gen.set(None)
    current = _live(uid).get("gen")
    if gen is not _ANY and gen != current:
        raise Gone(uid)
    _job_gen.set((uid, current))


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
    written = blob.upload_blob(data, overwrite=True, **kwargs)
    try:
        _live(uid)
    except Gone:
        # Remove only what this job wrote: blob names are per rider, so after a
        # fresh start the same name may already hold the new profile's data.
        try:
            blob.delete_blob(etag=written["etag"], match_condition=MatchConditions.IfNotModified)
        except (ResourceNotFoundError, ResourceModifiedError):
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


class BadEnvelope(Exception):
    """The submitted key could not be decrypted (malformed or tampered with)."""


def _decrypt(enc):
    """Open a key sealed by the API: v2.<RSA-wrapped AES key>.<iv>.<ciphertext>.<tag>."""
    crypto = CryptographyClient(_keys.get_key(WRAP_KEY), _cred)
    unwrap = lambda b: crypto.decrypt(EncryptionAlgorithm.rsa_oaep_256, b).plaintext
    if not enc.startswith("v2."):                     # queued before v2: the key itself, RSA-encrypted
        return unwrap(base64.b64decode(enc)).decode()
    try:
        wrapped, iv, sealed, tag = (base64.b64decode(p, validate=True) for p in enc.split(".")[1:])
    except ValueError as e:                           # wrong number of parts or bad base64
        raise BadEnvelope() from e
    try:
        return AESGCM(unwrap(wrapped)).decrypt(iv, sealed + tag, None).decode()
    except (InvalidTag, ValueError) as e:
        raise BadEnvelope() from e


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


def _sync_tracks(uid, access_token, start_date, end_date):
    """Download FIT tracks for rides in [start_date, end_date] not cached yet. Returns (rides, new_count, total_acts)."""
    tracks = _blobs.get_container_client("tracks")
    cached = {b.name.rsplit("/", 1)[-1][:-5] for b in tracks.list_blobs(name_starts_with=f"{uid}/")
              if b.name.endswith(".json") and not b.name.endswith("/rides.json")}
    acts = []
    with GarminPersonalApiClient(access_token) as client:
        start = 0
        while True:
            page = _garmin("search", client.search_activities, start=start, limit=100,
                           start_date=start_date, end_date=end_date) or []
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
    return rides, new, len(acts)


def _load_rides_cache(uid):
    try:
        return json.loads(_blobs.get_blob_client("tracks", f"{uid}/rides.json").download_blob().readall())
    except ResourceNotFoundError:
        return []


def _merge_rides(existing, fetched, replace_year):
    by_id = {r["id"]: r for r in existing if r["date"][:4] != replace_year}
    for r in fetched:
        by_id[r["id"]] = r
    merged = list(by_id.values())
    merged.sort(key=lambda r: r["date"], reverse=True)
    return merged


def _build_heatmap_doc(uid, year_key, year_rides, prev_hashes, touch_updated=False):
    """Build or reuse a single heatmap blob (year_key is 'YYYY' or 'all')."""
    fingerprint = hashlib.sha256(json.dumps([CORE_HASH, year_rides]).encode()).hexdigest()
    blob_name = f"{uid}/{year_key}.json"
    if fingerprint == prev_hashes.get(year_key):
        blob = _blobs.get_blob_client("heatmaps", blob_name)
        try:
            doc = json.loads(blob.download_blob().readall())
        except ResourceNotFoundError:
            doc = None
        if doc is not None:
            if touch_updated:
                doc["updated_at"] = _now()
                _put_blob(uid, "heatmaps", blob_name, json.dumps(doc),
                          content_settings=ContentSettings(content_type="application/json"))
            return fingerprint, doc["stats"]
    tracks = _blobs.get_container_client("tracks")
    pts = [json.loads(tracks.download_blob(f"{uid}/{r['id']}.json").readall()) for r in year_rides]
    lines = heatmap_core.build_lines(pts)
    stats = {"rides": len(year_rides), "total_km": round(sum(r["km"] for r in year_rides), 1),
             "unique_km": round(sum(heatmap_core.line_km(l) for l in lines)),
             "repeat_km": round(sum(heatmap_core.line_km(l) for l in lines if l[0] > 1)),
             "max_count": max((l[0] for l in lines), default=0), "lines": len(lines)}
    doc = {"updated_at": _now(), "year": "all" if year_key == "all" else int(year_key), "stats": stats,
           "recent_rides": [{k: r[k] for k in ("name", "date", "km")} for r in year_rides[:15]], "lines": lines}
    _put_blob(uid, "heatmaps", blob_name, json.dumps(doc),
              content_settings=ContentSettings(content_type="application/json"))
    return fingerprint, stats


def _rebuild_years(uid, all_rides, cur_year, touch_all=False):
    """Rebuild changed year heatmaps and 'all', returning (years, hashes, cur_stats)."""
    entity = _live(uid)
    prev_hashes = json.loads(entity["yearHashes"]) if entity.get("yearHashes") else {}
    by_year = {}
    for r in all_rides:
        by_year.setdefault(r["date"][:4], []).append(r)
    by_year.setdefault(cur_year, [])
    years = sorted((int(y) for y in by_year), reverse=True)
    new_hashes = {}
    cur_stats = None
    for y in years:
        yk = str(y)
        fp, st = _build_heatmap_doc(uid, yk, by_year[yk], prev_hashes, touch_updated=(yk == cur_year))
        new_hashes[yk] = fp
        if yk == cur_year:
            cur_stats = st
    all_fp, _ = _build_heatmap_doc(uid, "all", all_rides, prev_hashes, touch_updated=touch_all)
    new_hashes["all"] = all_fp
    return years, new_hashes, cur_stats


def refresh(uid, full=False):
    """Rebuild one rider's heatmap from Garmin."""
    try:
        api_key = _secrets.get_secret(_secret_name(uid)).value
    except ResourceNotFoundError:
        _set_profile(uid, hasKey=False, status="no-key", message="")
        return
    _set_profile(uid, status="syncing", message="")
    try:
        _refresh(uid, api_key, full=full)
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


def _refresh(uid, api_key, full=False):
    cur_year = datetime.now(timezone.utc).strftime("%Y")
    token = _token(api_key)
    yr_rides, new, _ = _sync_tracks(uid, token, start_date=f"{cur_year}-01-01", end_date=f"{cur_year}-12-31")
    all_rides = _merge_rides(_load_rides_cache(uid), yr_rides, replace_year=cur_year)
    _put_blob(uid, "tracks", f"{uid}/rides.json", json.dumps(all_rides),
              content_settings=ContentSettings(content_type="application/json"))
    years, new_hashes, cur_stats = _rebuild_years(uid, all_rides, cur_year, touch_all=full)
    entity = _live(uid)
    need_backfill = full or (not entity.get("historySynced") and not entity.get("backfilling"))
    fields = {"status": "ok", "message": "", "lastRun": _now(),
              "stats": json.dumps(cur_stats), "years": json.dumps(years),
              "yearHashes": json.dumps(new_hashes)}
    if need_backfill:
        fields["backfilling"] = True
    _set_profile(uid, **fields)
    if need_backfill:
        _enqueue({"op": "backfill", "uid": uid, "year": int(cur_year) - 1,
                  "empty_streak": 0, "gen": entity.get("gen")})
    log.info("refreshed %s (full=%s): %d rides, %d new, years=%s", uid, full, len(all_rides), new, years)


MIN_BACKFILL_YEAR = 2010
MAX_EMPTY_YEARS = 3


def backfill(uid, year=None, empty_streak=0):
    """Sync one historical year at a time in the background without blocking the UI."""
    cur_year = datetime.now(timezone.utc).strftime("%Y")
    if year is None:
        year = int(cur_year) - 1
    if year < MIN_BACKFILL_YEAR or empty_streak >= MAX_EMPTY_YEARS:
        _set_profile(uid, backfilling=False, historySynced=True)
        return
    try:
        api_key = _secrets.get_secret(_secret_name(uid)).value
    except ResourceNotFoundError:
        _set_profile(uid, backfilling=False)
        return
    _set_profile(uid, backfilling=True)
    try:
        yr_rides, new, total_acts = _sync_tracks(
            uid, _token(api_key), start_date=f"{year}-01-01", end_date=f"{year}-12-31")
        all_rides = _merge_rides(_load_rides_cache(uid), yr_rides, replace_year=str(year))
        _put_blob(uid, "tracks", f"{uid}/rides.json", json.dumps(all_rides),
                  content_settings=ContentSettings(content_type="application/json"))
        years, new_hashes, cur_stats = _rebuild_years(uid, all_rides, cur_year, touch_all=True)
        next_empty = 0 if total_acts > 0 else empty_streak + 1
        done = (year - 1 < MIN_BACKFILL_YEAR) or (next_empty >= MAX_EMPTY_YEARS)
        _set_profile(uid, backfilling=not done, historySynced=done or bool(_live(uid).get("historySynced")),
                     lastRun=_now(), stats=json.dumps(cur_stats), years=json.dumps(years),
                     yearHashes=json.dumps(new_hashes))
        log.info("backfilled %s year=%d: %d rides (%d acts), %d new, years=%s",
                 uid, year, len(yr_rides), total_acts, new, years)
        if not done:
            job = _job_gen.get()
            _enqueue({"op": "backfill", "uid": uid, "year": year - 1,
                      "empty_streak": next_empty, "gen": job[1] if job else None})
    except HttpError as e:
        if e.status_code in (401, 403):
            _set_profile(uid, status="invalid-key", keyRejected=True, backfilling=False,
                         message="Garmin rejected the API key. It may have expired; add a new one.")
        else:
            _set_profile(uid, backfilling=False)
        log.warning("backfill garmin http %s for %s (year=%d)", e.status_code, uid, year)
    except Gone:
        raise
    except Exception:
        log.exception("backfill failed for %s (year=%d)", uid, year)
        _set_profile(uid, backfilling=False)


# ---------------------------------------------------------------- key lifecycle
def set_key(uid, enc):
    try:
        api_key = _decrypt(enc)
    except (HttpResponseError, BadEnvelope):
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
    heatmaps = _blobs.get_container_client("heatmaps")
    for b in heatmaps.list_blobs(name_starts_with=f"{uid}/"):
        heatmaps.delete_blob(b.name)
    try:
        heatmaps.delete_blob(f"{uid}.json")
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
        _begin(uid, msg["gen"]) if "gen" in msg else _begin(uid)   # no gen: queued by an older API
        if op == "set-key":
            set_key(uid, msg["enc"])
        elif op == "delete-key":
            delete_key(uid)
        elif op == "refresh":
            refresh(uid, full=bool(msg.get("full")))
        elif op == "backfill":
            backfill(uid, year=msg.get("year"), empty_streak=msg.get("empty_streak", 0))
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
            elif op == "backfill":
                _set_profile(uid, backfilling=False)
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
