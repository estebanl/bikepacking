import json, math, glob, os, time, urllib.request
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

BASE = "/home/hatch/workspace/ridewithgps-2026"
TILE_CACHE = f"{BASE}/tiles"
os.makedirs(TILE_CACHE, exist_ok=True)

# --- rebuild deduped segments (micro-segments, same builder as update_map.py) ---
COSL = math.cos(math.radians(44.0))
def seg_len(p1, p2):
    return math.hypot((p2[0] - p1[0]) * 111.32 * COSL, (p2[1] - p1[1]) * 110.57)
unique = {}
for path in glob.glob(f"{BASE}/tracks/*.json"):
    pts = json.load(open(path))
    for a, b in zip(pts, pts[1:]):
        if seg_len(a, b) > 0.25: continue
        ka = (round(a[0], 4), round(a[1], 4))
        kb = (round(b[0], 4), round(b[1], 4))
        if ka == kb: continue
        key = (ka, kb) if ka <= kb else (kb, ka)
        if key not in unique: unique[key] = (a, b)
segs = list(unique.values())
unique_km = sum(seg_len(a, b) for a, b in segs)
print("unique segments:", len(segs), "unique km:", round(unique_km))

# --- OSM tiles ---
def tile_range(lng, lat, z):
    n = 2 ** z
    x = int((lng + 180.0) / 360.0 * n)
    latr = math.radians(lat)
    y = int((1.0 - math.log(math.tan(latr) + 1 / math.cos(latr)) / math.pi) / 2.0 * n)
    return x, y

def world_px(lng, lat, z):
    n = 2 ** z * 256
    x = (lng + 180.0) / 360.0 * n
    latr = math.radians(lat)
    y = (1.0 - math.log(math.tan(latr) + 1 / math.cos(latr)) / math.pi) / 2.0 * n
    return x, y

def fetch_tile(z, x, y):
    p = f"{TILE_CACHE}/{z}_{x}_{y}.png"
    if not os.path.exists(p):
        req = urllib.request.Request(f"https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                                     headers={"User-Agent": "Muse personal poster builder (single-user, cached)"})
        with urllib.request.urlopen(req, timeout=30) as r:
            open(p, "wb").write(r.read())
        time.sleep(0.05)
    return plt.imread(p)

def stitch(lng0, lat0, lng1, lat1, z):
    tx0, ty0 = tile_range(lng0, lat1, z)   # top-left tile (lat1 = north)
    tx1, ty1 = tile_range(lng1, lat0, z)   # bottom-right
    rows = []
    for ty in range(ty0, ty1 + 1):
        row = []
        for tx in range(tx0, tx1 + 1):
            img = fetch_tile(z, tx, ty)
            if img.shape[-1] == 4: img = img[..., :3]
            row.append(img)
        rows.append(np.hstack(row))
    mosaic = np.vstack(rows)
    origin_x, origin_y = tx0 * 256, ty0 * 256  # world px of mosaic top-left
    return mosaic, origin_x, origin_y

def render(fname, extent, z, figsize, title, subtitle, lw):
    lng0, lat0, lng1, lat1 = extent
    mosaic, ox, oy = stitch(lng0, lat0, lng1, lat1, z)
    x0, y1 = world_px(lng0, lat0, z)   # bottom-left px (y grows downward in px space)
    x1, y0 = world_px(lng1, lat1, z)   # top-right
    fig = plt.figure(figsize=figsize, dpi=200)
    fig.patch.set_facecolor("white")
    ax = fig.add_axes([0.005, 0.105, 0.99, 0.885]); ax.axis("off")
    ax.imshow(mosaic, extent=[ox, ox + mosaic.shape[1], oy + mosaic.shape[0], oy], zorder=1, interpolation="bilinear")
    lines = []
    for (ax_, ay_), (bx_, by_) in segs:
        lines.append((world_px(ax_, ay_, z), world_px(bx_, by_, z)))
    ax.add_collection(LineCollection(lines, colors="white", linewidths=lw * 2.4, alpha=0.55, zorder=2, capstyle="round"))
    ax.add_collection(LineCollection(lines, colors="#d92b00", linewidths=lw, alpha=0.95, zorder=3, capstyle="round"))
    ax.set_xlim(x0, x1); ax.set_ylim(y1, y0)
    fig.text(0.5, 0.058, title, ha="center", color="#1a1a1a", fontsize=23, fontweight="bold")
    fig.text(0.5, 0.024, subtitle, ha="center", color="#666666", fontsize=12)
    fig.savefig(f"{BASE}/{fname}", facecolor="white")
    plt.close(fig)
    print("wrote", fname)

render("map_ontario_2026.png", (-81.45, 42.82, -77.95, 45.72), 9, (12.5, 13.5),
       "EVERY ROAD, ONCE — 2026",
       f"113 rides · 3,143 km ridden · {unique_km:,.0f} km of unique road · Southern Ontario", 1.1)
render("map_toronto_2026.png", (-79.70, 43.52, -79.05, 43.98), 12, (12.5, 10.5),
       "TORONTO — 2026",
       "Each unique stretch of road drawn once · overlaps removed", 1.5)
