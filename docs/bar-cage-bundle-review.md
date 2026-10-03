# Bar Cage bundle follow-up — 2026-10-03

The bundled Small, Medium and Large Bar Cage bags previously rendered without their included cradle and could not receive either supported accessory mount. Each now renders one cradle with handlebar clamps and accepts the empty computer/light mount at the same attachment point as the equivalent separate cage and bag. Packed envelopes match the separate bags; combined mass remains 499/532/562 g. A separate cage conflicts in both insertion orders. Removing the bundle removes its dependent accessory. These are original illustrative models, not verified physical-fit or device-compatibility claims.

## Catalog accounting

The snapshot still contains exactly 191 variant records. Bundled accessory support changes available combinations, not the number of mountable products.

| Classification | Previous batch | Cargo strap batch / current | Delta |
| --- | ---: | ---: | ---: |
| Mountable | 78 | 83 | +5 |
| Implementation pending | 74 | 68 | −6 |
| Unsupported fit | 13 | 13 | 0 |
| Internal / service / nonvisual | 17 | 18 | +1 |
| Off-bike | 9 | 9 | 0 |
| Total | 191 | 191 | 0 |

The five newly mountable variants were three Cargo Strap lengths and two Bar Cage accessory mounts. The sixth pending item, **Long Top Tube Bag Accessory Pack `tailfin-732058-v1`**, moved to **internal storage insert**, not to completed exterior geometry: it contains a divider, pockets and tool/pump loops. It retains no exterior mounting socket. An explicit regression test checks every total and this item's classification.

This follow-up is isolated on `review/bar-cage-bundles`. No new deployment or GitHub merge was performed in this review turn. Original PR findings remain in `docs/realism-review.md`; line references there target PR #3 head `b0251726ed9d4fa61918bdf76551890179586368`.

## Validation and screenshots

69 tests pass, standalone `npx tsc --noEmit` passes, and the production Next.js static export builds successfully. Chromium inspected the actual static export at 1440×1000 and 390×1000: no browser errors or horizontal overflow; the imported bundled assembly retains its computer mount, and removing the bundle removes the dependent mount. Before/after screenshots were visually reviewed. The illustrative cradle is visibly connected to the handlebar and follows the matching bag envelope.

Files are packaged in `public/review/bar-cage-bundle-{before,after}-{desktop,mobile}.jpg`. Raw screenshots and browser results are executor-local under `/workspace/bikepacking-evidence/bar-bundle-review/`; test and build logs are in its parent directory. Library previously failed with CONNECT403; no Library file ID was created. These new screenshots have not been published, uploaded to GitHub, or delivered through Library.
