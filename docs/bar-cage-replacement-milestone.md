# Bar Cage replacement preview milestone — 2026-10-03

The preceding bundled Bar Cage fix (`b9c9e14fad38828604afdfae42fa7e7629e95455`) was published successfully to the existing owner-private Site by deployment `appgdep_6ac04a6aeac08191b211ff5e1ed1a229`. Its four before/after screenshots are available under `/review/bar-cage-bundle-{before,after}-{desktop,mobile}.jpg`.

This batch adds two previously pending exterior variants: Spare Bar Cage (`tailfin-855555-v1`) and Bar Cage Single Clamp (`tailfin-855553-v1`). They are optional replacement previews on an already assembled Bar Cage, including the three cage-and-bag bundles. A replacement suppresses the corresponding original cradle or clamp, preserving exactly one visible assembly. Left/right clamp choices describe scene positions; source handedness and interchangeability are unverified. Removing the host removes its replacements; removing a replacement restores the original included geometry.

Official source scope:

- https://www.tailfin.cc/ca/product/spares/bar-system-spares/spare-bar-cage/ identifies a replacement cage but does not establish included clamps or other hardware.
- https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-cage-single-clamp/ identifies one replacement clamp assembly but does not establish arm or hardware contents.

Neither source establishes replacement mass or dimensions. All source unknowns remain null, and the renderer uses the existing original illustrative assembly rather than claiming newly verified spare geometry. No new complete spare-parts kit is invented.

Because the replaced subcomponent's mass is unknown, the modified host's complete mass is excluded from the known subtotal, once regardless of replacement count. Separate known bag mass and payload remain accounted for. The HUD and exported manifests explain this conservative exclusion; product source specifications remain unchanged. Removing the final replacement restores the unmodified host's published mass.

Catalog reconciliation: **85 mountable + 66 pending + 13 unsupported-fit + 18 internal/service + 9 off-bike = 191**. The two replacement products moved from pending to illustrative preview. The prior Long Top Tube Accessory Pack reclassification remains an internal storage insert, not completed exterior geometry. The per-variant backlog is regenerated from the live catalog to avoid stale entries.

Validation: 75 tests pass, TypeScript passes, 66,850 empty-state combinations and 1,080 provisioned configurations across 10 destination sizes pass. Independent Chromium review at 1440×1000 and 390×1000 confirmed connected single geometry, no overflow/errors, both host-removal cascades, and restoration of the unmodified bundle summary after removing all replacements (9.99 kg total, 0.53 kg gear, 11 L). Screenshot assets: `/review/bar-cage-replacement-{bundle,cage}-{desktop,mobile}.jpg`. Raw evidence and results JSON are in `/workspace/bikepacking-evidence/bar-cage-replacement-review/`.
