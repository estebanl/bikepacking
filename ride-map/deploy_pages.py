#!/usr/bin/env python3
"""Deploy the static ride-map site to Cloudflare Pages.
Copies the fresh segments.json into site/ and runs wrangler pages deploy
with a freshly minted credential surrogate (never stored or printed)."""
import json, os, shutil, subprocess, sys, urllib.request

BASE = "/home/hatch/workspace/ridewithgps-2026"
sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request

shutil.copy(f"{BASE}/web/segments.json", f"{BASE}/site/segments.json")
req = urllib.request.Request("https://api.cloudflare.com/client/v4/accounts")
add_surrogate_to_request(req, "custom.cloudflare", allowed_hosts=["api.cloudflare.com"])
auth = req.headers.get("Authorization", "")
token = auth.replace("Bearer ", "", 1) if auth.startswith("Bearer ") else auth
if not token:
    print(json.dumps({"ok": False, "error": "could not mint credential surrogate"})); sys.exit(0)
env = dict(os.environ, CLOUDFLARE_API_TOKEN=token)
r = subprocess.run(["/home/hatch/workspace/tools/node_modules/.bin/wrangler", "pages", "deploy",
                    f"{BASE}/site", "--project-name", "every-road-once", "--branch", "main",
                    "--commit-dirty=true"], capture_output=True, text=True, timeout=600, env=env)
tail = (r.stdout + r.stderr)[-400:]
if r.returncode == 0 and "Deployment complete" in tail:
    print(json.dumps({"ok": True, "url": "https://every-road-once.pages.dev"}))
else:
    print(json.dumps({"ok": False, "error": tail}))
