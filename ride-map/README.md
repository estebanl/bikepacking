# Every Road Once — live ride map

A static map of every unique stretch of road ridden in the current year,
with overlaps removed: each ~50 m road segment is drawn exactly once, no
matter how many rides covered it.

Live at **https://map.laturnera.com** (behind a Cloudflare Access email
login) and https://every-road-once.pages.dev

## How it works

```
Garmin Edge ──sync──> RideWithGPS ──API──> update_map.py
                                              │ downloads new tracks only,
                                              │ builds micro-segments between
                                              │ GPS points, keeps each once
                                              ▼
                                     web/segments.json
                                              │ deploy_pages.py
                                              ▼
                              Cloudflare Pages (site/index.html + data)
```

- `fetch_tracks.py` — one-time bulk download of all current-year tracks
  into `tracks/` (resume-safe; skips GPS-gap points without coordinates).
- `update_map.py` — incremental refresh: pulls recent trips through the
  RideWithGPS API, downloads tracks for uncached trips only, rebuilds the
  de-overlapped segment set, writes `web/segments.json` (stats, recent
  rides, segments as `[lng1, lat1, lng2, lat2]`). Segments are the real
  micro-segments between consecutive GPS points (dedupe key: endpoints
  rounded to ~10 m, gaps over 250 m skipped), so drawn lines follow the
  true ridden path — street curves and trails alike — with no map
  matching and nothing sent to a third party.
- `make_poster.py` / `make_map_poster.py` — render the black-background and
  OpenStreetMap poster images from the same segment data.
- `deploy_pages.py` — copies the fresh data into `site/` and deploys to
  Cloudflare Pages with wrangler.
- `daily_run.py` — the daily entry point (fetch → posters → deploy, only
  on days with new rides) run by a scheduled job each morning.
- `site/index.html` — the whole front end: one Leaflet page, street/dark
  basemap toggle, stats card and recent rides, reads `segments.json`.

## Notes

- No credentials live in this code. The RideWithGPS and Cloudflare calls
  go through Muse's connector helpers, which inject credentials at
  request time; `deploy_pages.py` mints a short-lived credential surrogate
  in memory for wrangler and never stores it.
- Generated data (track cache, `segments.json`, posters) is deliberately
  not committed — see `.gitignore`. The deployed site carries its own copy
  of the data file.
- The scripts use a `BASE` path constant pointing at the working directory
  on the machine that runs the daily job; adjust it if you run them
  elsewhere.
- History: the map first shipped as a Lovable + Supabase app on
  2026-11-07 and was replaced by this static stack the same day — same
  data, no database.
