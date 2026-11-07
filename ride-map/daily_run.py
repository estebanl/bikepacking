#!/usr/bin/env python3
"""Daily refresh: RideWithGPS -> local cache -> posters -> Cloudflare Pages deploy.
The static site (site/index.html + segments.json) is deployed only on days
with new rides; quiet days do no network writes beyond RideWithGPS reads.
Prints one JSON line: {"ok": bool, "update": {...}, "deploy": {...}|null, "error": str|null}"""
import json, subprocess, sys

BASE = "/home/hatch/workspace/ridewithgps-2026"

def run(cmd, timeout=1200):
    return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=BASE)

try:
    r = run(["python3", f"{BASE}/update_map.py"])
    if r.returncode != 0:
        print(json.dumps({"ok": False, "error": f"update_map failed: {r.stderr[-400:]}"})); sys.exit(0)
    update = json.loads(r.stdout.strip().splitlines()[-1])
    deploy = None
    if update["new_rides"]:
        run(["python3", f"{BASE}/make_poster.py"])
        run(["python3", f"{BASE}/make_map_poster.py"])
        r = run(["python3", f"{BASE}/deploy_pages.py"])
        if r.returncode != 0:
            print(json.dumps({"ok": False, "update": update,
                              "error": f"deploy failed: {(r.stdout + r.stderr)[-500:]}"})); sys.exit(0)
        deploy = json.loads(r.stdout.strip().splitlines()[-1])
        if not deploy.get("ok"):
            print(json.dumps({"ok": False, "update": update, "error": f"deploy: {deploy.get('error')}"})); sys.exit(0)
    print(json.dumps({"ok": True, "update": update, "deploy": deploy, "error": None}))
except Exception as e:
    print(json.dumps({"ok": False, "error": str(e)[:500]}))
