"""Heatmap builder: every road drawn once as continuous lines, colored by ride count.

Same algorithm as ride-map/garmin_heatmap.py (kept in sync by hand).
Input: list of tracks, each a list of (lng, lat). Output: list of
[count, lng1, lat1, lng2, lat2, ...] polylines, least-ridden first.
"""
import math

COS = math.cos(math.radians(44.0))


def seg_km(p1, p2):
    return math.hypot((p2[0] - p1[0]) * 111.32 * COS, (p2[1] - p1[1]) * 110.57)


def line_km(l):
    return sum(seg_km((l[j], l[j + 1]), (l[j + 2], l[j + 3])) for j in range(1, len(l) - 3, 2))


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
