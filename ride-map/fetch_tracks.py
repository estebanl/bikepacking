import json, os, subprocess, sys

BASE = "/home/hatch/workspace/ridewithgps-2026"
HELPER = "/home/hatch/workspace/custom-connectors/custom.ridewithgps/bin/ridewithgps.py"
trips = [t for t in json.load(open(f"{BASE}/trips_raw.json")) if t["departed_at"].startswith("2026")]
done, failed = 0, []
for t in trips:
    out_path = f"{BASE}/tracks/{t['id']}.json"
    if os.path.exists(out_path):
        done += 1
        continue
    r = subprocess.run(["python3", HELPER, "get", f"/api/v1/trips/{t['id']}.json"],
                       capture_output=True, text=True, timeout=300)
    try:
        data = json.loads(r.stdout)
        trip = data["result"]["trip"]
        pts = [(round(p["x"], 6), round(p["y"], 6)) for p in trip["track_points"] if "x" in p and "y" in p]
        json.dump(pts, open(out_path, "w"))
        done += 1
    except Exception as e:
        failed.append((t["id"], str(e)[:120], r.stdout[:120]))
    print(f"progress {done + len(failed)}/{len(trips)} failed={len(failed)}", flush=True)
print("DONE ok:", done, "failed:", failed)
