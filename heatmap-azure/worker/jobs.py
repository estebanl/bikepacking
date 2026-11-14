"""Worker jobs: key changes, per-rider refreshes, the morning run.

Everything authenticates with the Function App's managed identity:
storage (tables, blobs) and Key Vault (secrets + the RSA wrap key).
Riders are identified by an opaque id (uid) the API derives from the
signed-in principal; no names or emails are stored outside the profile.
"""
import base64
import io
import json
import logging
import os
import tempfile
import time
import zipfile
from datetime import datetime, timezone

import fitdecode
from azure.core.exceptions import HttpResponseError, ResourceExistsError, ResourceNotFoundError
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

_cred = DefaultAzureCredential()
_blobs = BlobServiceClient(f"https://{ACCOUNT}.blob.core.windows.net", credential=_cred)
_profiles = TableClient(f"https://{ACCOUNT}.table.core.windows.net", "profiles", credential=_cred)
_secrets = SecretClient(VAULT, _cred)
_keys = KeyClient(VAULT, _cred)


def _now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _secret_name(uid):
    return f"garmin-{uid}"


def _set_profile(uid, **fields):
    _profiles.upsert_entity({"PartitionKey": "user", "RowKey": uid, **fields}, mode=UpdateMode.MERGE)


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
def _token(api_key):
    with tempfile.TemporaryDirectory() as tmp:
        cache = os.path.join(tmp, "token.json")
        with PersonalApiAuthenticator(bearer_token_cache_file=cache) as auth:
            return auth.obtain_token(api_key).access_token


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
            page = client.search_activities(start=start, limit=100,
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
            z = zipfile.ZipFile(io.BytesIO(client.download_activity(a["activityId"])))
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
            tracks.upload_blob(f"{uid}/{aid}.json", json.dumps(pts), overwrite=True)
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
        rides, new = _sync_tracks(uid, _token(api_key))
    except HttpError as e:
        if e.status_code in (401, 403):
            _set_profile(uid, status="invalid-key",
                         message="Garmin rejected the API key. It may have expired; add a new one.")
        else:
            _set_profile(uid, status="error", message=f"Garmin returned HTTP {e.status_code}. Will retry tomorrow.")
        log.warning("garmin http %s for %s", e.status_code, uid)
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
    _blobs.get_blob_client("heatmaps", f"{uid}.json").upload_blob(
        json.dumps(doc), overwrite=True, content_settings=ContentSettings(content_type="application/json"))
    _set_profile(uid, status="ok", message="", lastRun=_now(), stats=json.dumps(stats))
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
    except (HttpError, GarminPersonalApiError):
        _set_profile(uid, hasKey=False, status="invalid-key",
                     message="Garmin rejected that API key. Check it and try again.")
        return
    except Exception:                                 # timeout, DNS...: not the key's fault
        # Leave a state the rider can resubmit from, even if the queue retries run out.
        _set_profile(uid, status="error",
                     message="Could not reach Garmin to check the key. Please submit it again.")
        raise
    name = _secret_name(uid)
    try:
        _secrets.set_secret(name, api_key, content_type="garmin-personal-api-key")
    except ResourceExistsError:                       # soft-deleted earlier: recover, then overwrite
        _secrets.begin_recover_deleted_secret(name).wait()
        _secrets.set_secret(name, api_key, content_type="garmin-personal-api-key")
    _set_profile(uid, hasKey=True, status="syncing", message="", keySetAt=_now())
    refresh(uid)


def delete_key(uid):
    name = _secret_name(uid)
    try:
        _secrets.begin_delete_secret(name).wait()
        try:
            _secrets.purge_deleted_secret(name)
        except HttpResponseError:
            log.info("purge not permitted; secret stays soft-deleted for 7 days")
    except ResourceNotFoundError:
        pass
    _set_profile(uid, hasKey=False, status="no-key", message="")


def purge_user(uid):
    delete_key(uid)
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


def handle(msg):
    publish_public_key()
    op, uid = msg.get("op"), msg.get("uid", "")
    if op == "publish-key":
        return
    if not (len(uid) == 32 and all(c in "0123456789abcdef" for c in uid)):
        log.error("rejecting job with bad uid")
        return
    try:
        if op == "set-key":
            set_key(uid, msg["enc"])
        elif op == "delete-key":
            delete_key(uid)
        elif op == "refresh":
            refresh(uid)
        elif op == "purge-user":
            purge_user(uid)
        else:
            log.error("unknown op %r", op)
    except Exception:
        log.exception("job %s failed for %s", op, uid)
        try:                                          # keep a more specific message if the job set one
            current = _profiles.get_entity("user", uid)
        except ResourceNotFoundError:
            current = {}
        if current.get("status") != "error":
            _set_profile(uid, status="error", message="Something went wrong. Please try again.")
        raise


def refresh_all():
    publish_public_key()
    for p in _profiles.query_entities("PartitionKey eq 'user' and hasKey eq true"):
        try:
            refresh(p["RowKey"])
        except Exception:                             # one rider's failure must not stop the rest
            log.exception("refresh failed for %s", p["RowKey"])
            _set_profile(p["RowKey"], status="error", message="Refresh failed. Will retry tomorrow.")
