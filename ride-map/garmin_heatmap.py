#!/usr/bin/env python3
"""Ride heatmap from Garmin Connect (Personal API).

Downloads this year's rides from Garmin Connect, caches their GPS tracks, and
writes site/heatmap.json for site/heatmap.html: every road drawn once as
continuous lines, colored by how many rides covered it.

Separate from the Every Road Once pipeline (update_map.py / index.html),
which is unchanged.

Run with the Personal API key from Doppler (never stored or printed):
    doppler run --project bikepacking --config dev_personal -- \
        python3 garmin_heatmap.py
Needs Python 3.12+ with: pip install garmin-connect-personal-api-python fitdecode
Prints one JSON summary line.
"""
import io, json, math, os, sys, time, zipfile
from datetime import datetime

import fitdecode
from garmin_personal_api import GarminPersonalApiClient, PersonalApiAuthenticator

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.environ.get("HEATMAP_CACHE", os.path.join(HERE, "garmin"))
OUT = os.environ.get("HEATMAP_OUT", os.path.join(HERE, "site", "heatmap.json"))
YEAR = datetime.now().strftime("%Y")
RIDE_TYPES = ("cycling", "biking")     # cycling, road_biking, mountain_biking, gravel_cycling...
SEMI = 180 / 2**31                     # FIT semicircles -> degrees

COS = math.cos(math.radians(44.0))
def seg_km(p1, p2):
    return math.hypot((p2[0] - p1[0]) * 111.32 * COS, (p2[1] - p1[1]) * 110.57)


def fetch(api_key):
    """Sync this year's rides; download tracks only for uncached activities."""
    os.makedirs(f"{CACHE}/tracks", exist_ok=True)
    with PersonalApiAuthenticator(bearer_token_cache_file=f"{CACHE}/token-cache.json") as auth:
        token = auth.obtain_token(api_key)
    acts, new = [], []
    with GarminPersonalApiClient(token.access_token) as client:
        start = 0
        while True:
            page = client.search_activities(start=start, limit=100,
                                            start_date=f"{YEAR}-01-01", end_date=f"{YEAR}-12-31")
            acts += page or []
            start += len(page or [])
            if not page or len(page) < 100:
                break
        rides = [a for a in acts
                 if any(k in ((a.get("activityType") or {}).get("typeKey") or "") for k in RIDE_TYPES)]
        for a in rides:
            path = f"{CACHE}/tracks/{a['activityId']}.json"
            if os.path.exists(path):
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
            with open(path, "w") as fp:
                json.dump(pts, fp)
            new.append(a["activityId"])
            time.sleep(0.3)
    rides = [{"id": a["activityId"], "name": a.get("activityName") or "Ride",
              "date": a["startTimeLocal"][:10], "km": round((a.get("distance") or 0) / 1000, 1)}
             for a in rides]
    rides.sort(key=lambda r: r["date"], reverse=True)
    with open(f"{CACHE}/rides.json", "w") as fp:
        json.dump(rides, fp, indent=1)
    return rides, new


def build_lines(tracks):
    # Every road once, drawn as continuous lines along the real GPS path.
    # The world is split into ~10 m cells (lng/lat rounded to 4 dp). Tracks are
    # densified to <= 4 m steps so no cell is skipped. GPS jitter puts repeat
    # rides in neighbouring cells, so matching uses a 1-cell tolerance (3x3).
    #   counts[cell] = distinct rides that passed within one cell of it.
    #   A ride draws only the parts of its path no earlier ride already drew
    #   nearby; consecutive drawn steps join into one polyline, broken at GPS
    #   gaps (> 250 m), at already-drawn road, or where the ride count changes.
    STEP_KM = 0.004
    def cell(p):
        return (round(p[0], 4), round(p[1], 4))
    def around(c):
        return [(round(c[0] + dx, 4), round(c[1] + dy, 4))
                for dx in (-1e-4, 0, 1e-4) for dy in (-1e-4, 0, 1e-4)]
    def ride_steps(pts):
        """Yield (a, b) steps of <= STEP_KM, or None at a GPS gap."""
        for a, b in zip(pts, pts[1:]):
            d = seg_km(a, b)
            if d > 0.25:
                yield None
                continue
            n = max(1, math.ceil(d / STEP_KM))
            prev = a
            for i in range(1, n + 1):
                q = (a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n)
                yield prev, q
                prev = q

    rides_steps, near_count = [], {}
    for pts in tracks:
        steps = list(ride_steps(pts))
        rides_steps.append(steps)
        near = set()
        for st in steps:
            if st is not None: near.update(around(cell(st[1])))
        for c in near:
            near_count[c] = near_count.get(c, 0) + 1

    SMOOTH = 7      # median window of +/-7 steps (~30 m) to stop count flicker
    SELF_LAG = 20   # a ride blocks its own path after ~80 m (out-and-backs)
    drawn = set()   # cells within one cell of road already drawn by earlier rides
    lines = []      # [count, lng1, lat1, lng2, lat2, ...]
    for steps in rides_steps:
        raw = [near_count.get(cell(st[1]), 1) if st is not None else None for st in steps]
        counts = []
        for k, c in enumerate(raw):
            if c is None: counts.append(None); continue
            win = []
            for j in range(k - SMOOTH, k + SMOOTH + 1):
                if 0 <= j < len(raw):
                    if raw[j] is None and j != k:
                        if j < k: win = []          # don't smooth across a GPS gap
                        else: break
                        continue
                    win.append(raw[j])
            win.sort()
            counts.append(win[len(win) // 2])
        mine, seen_at = set(), {}
        cur, cur_count = None, None
        for k, st in enumerate(steps):
            draw = False
            if st is not None:
                cb = cell(st[1])
                first = seen_at.get(cb)
                draw = cb not in drawn and (first is None or first > k - SELF_LAG)
            c = counts[k]
            if not draw or c != cur_count:
                if cur and len(cur) > 3: lines.append(cur)
                cur, cur_count = None, None
            if st is not None:
                for n in around(cell(st[1])): seen_at.setdefault(n, k)
            if not draw: continue
            a, b = st
            if cur is None:
                cur, cur_count = [c, round(a[0], 5), round(a[1], 5)], c
            cur += [round(b[0], 5), round(b[1], 5)]
            mine.update(around(cell(b)))
        if cur and len(cur) > 3: lines.append(cur)
        drawn |= mine
    # Douglas-Peucker simplification (2 m tolerance) so the file stays small.
    def simplify(l, tol_km=0.002):
        pts = list(zip(l[1::2], l[2::2]))
        if len(pts) < 3: return l
        keep = [False] * len(pts); keep[0] = keep[-1] = True
        stack = [(0, len(pts) - 1)]
        while stack:
            i, j = stack.pop()
            (x0, y0), (x1, y1) = pts[i], pts[j]
            dx, dy = (x1 - x0) * 111.32 * COS, (y1 - y0) * 110.57
            seg = math.hypot(dx, dy)
            best, idx = 0.0, None
            for k in range(i + 1, j):
                px, py = (pts[k][0] - x0) * 111.32 * COS, (pts[k][1] - y0) * 110.57
                d = abs(dx * py - dy * px) / seg if seg else math.hypot(px, py)
                if d > best: best, idx = d, k
            if idx is not None and best > tol_km:
                keep[idx] = True
                stack += [(i, idx), (idx, j)]
        out = [l[0]]
        for k, p in enumerate(pts):
            if keep[k]: out += [p[0], p[1]]
        return out
    lines = [simplify(l) for l in lines]
    # Least-ridden first, so the hottest roads draw on top.
    lines.sort(key=lambda l: l[0])
    return lines


def main():
    key = os.environ.get("GARMIN_CONNECT", "").strip()
    if not key:
        print(json.dumps({"ok": False, "error": "GARMIN_CONNECT not set (run via doppler run)"}))
        sys.exit(1)
    rides, new = fetch(key)
    rides = [r for r in rides if os.path.exists(f"{CACHE}/tracks/{r['id']}.json")]
    tracks = [json.load(open(f"{CACHE}/tracks/{r['id']}.json")) for r in rides]
    lines = build_lines(tracks)
    line_km = lambda l: sum(seg_km((l[j], l[j + 1]), (l[j + 2], l[j + 3])) for j in range(1, len(l) - 3, 2))
    unique_km = sum(line_km(l) for l in lines)
    repeat_km = sum(line_km(l) for l in lines if l[0] > 1)
    stats = {"rides": len(rides), "total_km": round(sum(r["km"] for r in rides), 1),
             "unique_km": round(unique_km), "repeat_km": round(repeat_km),
             "max_count": max((l[0] for l in lines), default=0), "lines": len(lines)}
    with open(OUT, "w") as fp:
        json.dump({"updated_at": datetime.now().isoformat(timespec="seconds"), "year": int(YEAR),
                   "source": "garmin", "stats": stats,
                   "recent_rides": [{k: r[k] for k in ("name", "date", "km")} for r in rides[:15]],
                   "lines": lines}, fp)
    print(json.dumps({"ok": True, "new_rides": len(new), **stats}))


if __name__ == "__main__":
    main()
