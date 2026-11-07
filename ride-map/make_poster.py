import json, math, glob
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.collections import LineCollection

BASE = "/home/hatch/workspace/ridewithgps-2026"
CELL = 0.0005  # ~55 m N-S, ~40 m E-W at lat 44
COS = math.cos(math.radians(44.0))

def cell_of(x, y):
    return (math.floor(x / CELL), math.floor(y / CELL))

def center(c):
    return ((c[0] + 0.5) * CELL, (c[1] + 0.5) * CELL)

unique = {}   # undirected key -> (p1, p2) snapped coords
total_segs = 0
for path in glob.glob(f"{BASE}/tracks/*.json"):
    pts = json.load(open(path))
    cells = [cell_of(x, y) for x, y in pts]
    for a, b in zip(cells, cells[1:]):
        if a == b:
            continue
        total_segs += 1
        key = (a, b) if a <= b else (b, a)
        if key not in unique:
            unique[key] = (center(a), center(b))

segs = list(unique.values())
def seg_km(p1, p2):
    dx = (p2[0] - p1[0]) * 111.32 * COS
    dy = (p2[1] - p1[1]) * 110.57
    return math.hypot(dx, dy)
unique_km = sum(seg_km(a, b) for a, b in segs)
print(f"segments total={total_segs} unique={len(segs)} unique_km={unique_km:.0f}")
json.dump({"total_segments": total_segs, "unique_segments": len(segs), "unique_km": round(unique_km)},
          open(f"{BASE}/poster_stats.json", "w"))

LINE = "#ff5a26"
BG = "#0b0e13"

def render(fname, xlim, ylim, figsize, title, subtitle, lw):
    fig = plt.figure(figsize=figsize, dpi=200)
    fig.patch.set_facecolor(BG)
    ax = fig.add_axes([0.015, 0.115, 0.97, 0.865])
    ax.set_facecolor(BG)
    xy = [((a[0] * COS, a[1]), (b[0] * COS, b[1])) for a, b in segs]
    ax.add_collection(LineCollection(xy, colors=LINE, linewidths=lw, alpha=0.9, capstyle="round"))
    ax.set_xlim(xlim[0] * COS, xlim[1] * COS)
    ax.set_ylim(*ylim)
    ax.set_aspect("equal")
    ax.axis("off")
    fig.text(0.5, 0.062, title, ha="center", color="#f2f2f2", fontsize=25, fontweight="bold",
             family="DejaVu Sans", )
    fig.text(0.5, 0.028, subtitle, ha="center", color="#9aa3ad", fontsize=12.5, family="DejaVu Sans")
    fig.savefig(f"{BASE}/{fname}", facecolor=BG)
    plt.close(fig)
    print("wrote", fname)

sub_all = f"113 rides  ·  3,143 km ridden  ·  {unique_km:,.0f} km of unique road  ·  Ontario, 2026"
render("poster_all_2026.png", (-81.45, -77.95), (42.82, 45.72), (12.5, 14.5),
       "E V E R Y   R O A D ,   O N C E", sub_all, 0.55)
render("poster_toronto_2026.png", (-79.70, -79.05), (43.52, 43.98), (12.5, 11),
       "T O R O N T O", f"Home turf  ·  each unique stretch drawn once  ·  2026", 0.8)
