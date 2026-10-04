# First Santa Cruz / Tailfin review milestone

Base: `50e6e96c1867c3e7d069e59e6b73b1279097f09d`.
Parent-owned existing private Site source adds static export separately; retain its `next.config.mjs` hosting setting when cherry-picking this commit. No Site ID, access level, deployment or original PR branch was changed here.

Implemented both current Santa Cruz reference models, all ten sourced frame sizes, original component geometry, dimension-driven bags/hardware, corrected shared fit/state/mass logic, and a searchable Tailfin snapshot. Snapshot is 50 main families plus95 spares (145 families,191 variants);62 have mounting previews and129 are reference only. Unknown124 weights and incomplete189 dimension envelopes remain explicit. Two entries have complete verified envelope dimensions. No broad exact-fit or photorealism claim.

Validation:37 tests pass; standalone TypeScript passes; production build passes. Stable production Chromium browser checks pass1440/1024/768/390/320px, both models, size changes, catalog191records, same-side mounting dependencies, paired fork placements, recursive hardware removal, rear axle/UDH/CargoPack assembly, search, payload, share URL, export and Escape; no page errors or horizontal overflow.

Actual final captures are executor-local in `/workspace/bikepacking-evidence/realism-final/`. Source captions: Blur desktop/current MTB; Stigmata desktop/current rigid gravel; loaded Stigmata/CargoPack and front luggage; phone versions demonstrate364px canvas and reachable controls. Prior original PR before captures remain under `/workspace/bikepacking-evidence`.

Remaining visual refinements: top-tube bag has an approximately15–20mm preview gap because frame-surface and anchor offsets differ; CargoPack seatpost connector is not yet modelled; most product shapes/straps are original illustrative envelopes rather than exact manufacturer meshes.120mm dropper movement is a shared demonstration setting, not every reference build's full stroke; StigmataApex has a rigid post. Conditional mounting previews do not establish FOX34SL fork-clamp or newBlur5 hardware approval. Complete loaded/rider/dynamic limits are not certified.

Next delta should start at this milestone commit, preserve the frozen evidence, align top-tube surface exactly and add the missing rear-system connector before deeper product-by-product fidelity work.
