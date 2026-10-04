# Frame and top-tube attachment milestone

Eleven exterior snapshot records move to mountable. Current191 =116 mountable +35 pending +13 unsupported-fit +18 internal/service +9 off-bike. These are original illustrative attachment previews. No source JSON, measured dimensions or fit approvals were invented; the frozen source hash remains unchanged.

## Verified source scope

| Part | Source family | Scope |
| --- | --- | --- |
| [Frame Bag V-Mount](https://www.tailfin.cc/ca/product/spares/frame-bag-spares/frame-bag-v-mount/) |661862| Tailfin Frame Bags |
| [Top Tube Pack V-Mount](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-v-mount/) |652831| Front Top Tube Packs |
| [DownTube Pack V-Mount](https://www.tailfin.cc/ca/product/spares/frame-bag-spares/downtube-pack-v-mount/) |762364|1.7L/3L DownTube Packs |
| [Rear Top Tube V-Mount Cover](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/rear-top-tube-v-mount-cover/) |750317| Rear Top Tube Bag |
| [Frame Bag Long Strap](https://www.tailfin.cc/ca/product/spares/frame-bag-spares/frame-bag-strap/) |661863| Individually sold29cm strap, Frame Bags |
| [Top Tube Long Strap](https://www.tailfin.cc/product/spares/top-tube-bag-spares/toptube-long-strap/) |652830| Individually sold36cm strap, Top Tube Packs |
| [Top Tube Short Strap](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/toptube-short-strap/) |652823|18.5cm, Top Tube and Frame Bags |
| [Top Tube Strap Keepers](https://www.tailfin.cc/us/product/spares/top-tube-bag-spares/top-tube-strap-keeper-pack-of-4/) |734868| Pack of four, Top Tube and Frame Bags |
| [Rear Top Tube Seat Post Strap](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/seat-post-strap/) |750325| Rear Top Tube Bag only |
| [V-Mount Straps](https://www.tailfin.cc/ca/product/spares/frame-bag-spares/v-mount-straps/) |130754/130755| DownTube Packs;18.5cm road design /30cm MTB design |

Strap mass and installed geometry remain unknown. The source record labels V-Mount strap width as x20cm; the official listing identifies20mm for the30cm option. The source label is retained with an explicit ambiguity note rather than changing the frozen snapshot or converting loose strap lengths into installed dimensions. Road/MTB design intent does not establish tube circumference fit or universal model incompatibility.

The [Rear Top Tube Bag](https://www.tailfin.cc/us/product/top-tube-cockpit/rear-top-tube-bag/) includes two18.5cm straps plus one14.5cm strap. It recommends at least two straps on the top tube; the seatpost strap is optional additional stability. The published109g/112g weights cover two installed straps, while118g/121g cover three. The spare seatpost SKU is not explicitly identified as the included14.5cm strap, so no9g spare mass is inferred. Its preview adds an unknown-weight third strap while preserving the known two-strap bag mass.

## Rendering and state

Seventeen explicit physical sockets cover fore/aft V-Mount covers and straps, a four-loop keeper pack on one host, and the optional rear seatpost strap. Exact host-family and socket checks prevent shared straps borrowing another host. Swapping a host preserves the newly selected bag and removes only incompatible attachment children.

Normal included attachment geometry and selected replacements share the same fore/aft stations. Mount and strap pieces are suppressed independently; each selected keeper pack draws four loops, not four separately counted catalog records. Station counts and shapes are illustrative, not installation instructions or claims about supplied spare-package quantities. The rear strap stays on the fixed14mm-radius seatpost surface.

Tube loops use the same centerlines and elliptical profiles as the bike renderer. The DownTube Pack now follows the curved down tube instead of standing vertically, with its inboard fabric face outside the modeled tube radius. Other under-tube product placements remain unchanged. Generic bags retain their existing visuals; this replacement geometry is scoped to the sourced Tailfin families.

Replacement-modified host weight is excluded once per physical slot because removed hardware masses are unknown. Known capacity/payload stay included. Multiple copies of a strap remain separate unknown-weight physical items. The optional rear seatpost strap is the explicit additive exception.

Journey Fit Link placement and legacy connector compatibility remain unresolved. Top Tube Flip Buckle is a separate closure assembly and remains in the pending cohort.

## Validation

Before screenshots captured both Santa Cruz models with all four bag hosts from the preceding production export. Independent after review covers the same models, desktop/mobile views, attachment selection and host removal. Final measured results are appended after validation.

110 tests pass, including shared attachment geometry and an exact spline-reference comparison across all ten Santa Cruz sizes. The invariant matrix covers127,970 empty-state combinations,1,680 provisioned configurations across10 destination sizes (16,800 transitions), and460 opposite-side attacks. TypeScript passes. Independent actual rendered review passed on both Santa Cruz models at1440/390px;320px Gear view had no overflow. Mobile fore/aft dropdown selection and mounting worked. Removing four bag hosts cleared their eleven mounted attachments. Optional seatpost strap alone preserved109g known rear-bag weight (Stigmata9.57kg subtotal) and one unknown strap, without inventing9g. Final contexts recorded no browser errors. Screenshots are included in public/review/frame-attachment-*.

The first candidate production build exposed an initial-JavaScript regression (133kB to306kB) because a socket calculation imported Three.js eagerly. That candidate was not deployed. A separate scalar spline helper now computes the same reference position/angle within1e-9 of the actual Three.js curve, preserving the existing deferred renderer load.
