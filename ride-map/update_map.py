#!/usr/bin/env python3
"""Incremental refresh for the 2026 ride map.

- Asks RideWithGPS for recent trips (via the connector helper).
- Downloads tracks only for trips not already cached.
- Rebuilds the de-overlapped segment set and the web data file.
- Prints a JSON summary: {"new_rides": [...], "rides": N, "total_km": X, "unique_km": Y}
"""
import json, math, os, subprocess, sys, glob
from datetime import datetime

BASE = "/home/hatch/workspace/ridewithgps-2026"
HELPER = "/home/hatch/workspace/custom-connectors/custom.ridewithgps/bin/ridewithgps.py"
YEAR = datetime.now().strftime("%Y")

def helper_get(path):
    r = subprocess.run(["python3", HELPER, "get", path], capture_output=True, text=True, timeout=600)
    return json.loads(r.stdout)

trips_raw = json.load(open(f"{BASE}/trips_raw.json"))
known_ids = {t["id"] for t in trips_raw}
cached_ids = {int(os.path.basename(p)[:-5]) for p in glob.glob(f"{BASE}/tracks/*.json")}

new_rides = []
for page in (1, 2, 3):
    data = helper_get(f"/api/v1/trips.json?page={page}&page_size=50")
    trips = data["result"]["trips"]
    if not trips:
        break
    for t in trips:
        if not t["departed_at"].startswith(YEAR):
            continue
        if t["id"] not in known_ids:
            trips_raw.append(t)
            known_ids.add(t["id"])
        if t["id"] not in cached_ids:
            d = helper_get(f"/api/v1/trips/{t['id']}.json")
            pts = [(round(p["x"], 6), round(p["y"], 6)) for p in d["result"]["trip"]["track_points"]
                   if "x" in p and "y" in p]
            json.dump(pts, open(f"{BASE}/tracks/{t['id']}.json", "w"))
            cached_ids.add(t["id"])
            new_rides.append({"name": t["name"], "date": t["departed_at"][:10],
                              "km": round((t.get("distance") or 0) / 1000, 1)})
    if trips[-1]["departed_at"] < f"{YEAR}-01-01":
        break

trips_raw.sort(key=lambda t: t["departed_at"], reverse=True)
json.dump(trips_raw, open(f"{BASE}/trips_raw.json", "w"), indent=1)

year_trips = [t for t in trips_raw if t["departed_at"].startswith(YEAR)
              and os.path.exists(f"{BASE}/tracks/{t['id']}.json")]
total_km = sum((t.get("distance") or 0) for t in year_trips) / 1000

CELL = 0.0005
def cell_of(x, y): return (math.floor(x / CELL), math.floor(y / CELL))
def center(c): return ((c[0] + 0.5) * CELL, (c[1] + 0.5) * CELL)
unique = {}
for t in year_trips:
    pts = json.load(open(f"{BASE}/tracks/{t['id']}.json"))
    cells = [cell_of(x, y) for x, y in pts]
    for a, b in zip(cells, cells[1:]):
        if a == b: continue
        key = (a, b) if a <= b else (b, a)
        if key not in unique: unique[key] = (center(a), center(b))
COS = math.cos(math.radians(44.0))
def seg_km(p1, p2):
    return math.hypot((p2[0] - p1[0]) * 111.32 * COS, (p2[1] - p1[1]) * 110.57)
unique_km = sum(seg_km(a, b) for a, b in unique.values())

web = {
    "updated_at": datetime.now().isoformat(timespec="seconds"),
    "year": int(YEAR),
    "stats": {"rides": len(year_trips), "total_km": round(total_km, 1),
              "unique_km": round(unique_km), "segments": len(unique)},
    "recent_rides": [{"name": t["name"], "date": t["departed_at"][:10],
                      "km": round((t.get("distance") or 0) / 1000, 1)} for t in year_trips[:15]],
    "segments": [[round(a[0], 5), round(a[1], 5), round(b[0], 5), round(b[1], 5)]
                 for a, b in unique.values()],
}
json.dump(web, open(f"{BASE}/web/segments.json", "w"))
print(json.dumps({"new_rides": new_rides, "rides": len(year_trips),
                  "total_km": round(total_km, 1), "unique_km": round(unique_km),
                  "segments": len(unique)}))
