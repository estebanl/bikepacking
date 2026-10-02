# PR #3 review and Santa Cruz / Tailfin follow-up

Reviewed PR: https://github.com/estebanl/bikepacking/pull/3
Original head: `b0251726ed9d4fa61918bdf76551890179586368`.
First visual improvement: `50e6e96c1867c3e7d069e59e6b73b1279097f09d`.
Follow-up work: isolated branch `review/santa-cruz-tailfin`; no merge or deployment by this executor.
Tracking: https://github.com/estebanl/bikepacking/issues/4 (bicycles), https://github.com/estebanl/bikepacking/issues/5 (catalog), https://github.com/estebanl/bikepacking/issues/6 (fit/state).

## Concrete review findings

Line references below refer to the original PR head, not the revised files.

- P1: `src/components/ui/Sidebar.tsx:91` and `src/app/page.tsx:49`: fixed384px sidebar leaves a6px canvas at390px phone width. Rendered before screenshot confirms it. Responsive panels fixed in50e6.
- P2: `src/components/canvas/CameraController.tsx:38`: every-frame preset interpolation overrides manual orbit/zoom. Fixed in50e6; test includes held orbit and explicit reset.
- P2: `src/components/ui/Sidebar.tsx:64`: stripping fork socket suffix fails full-ID matching and selects left when right was clicked. Fixed in50e6; follow-up uses explicit per-item target selections and supports two instances.
- P2: `src/store/useRigStore.ts:322`: preset computes bottle warnings as mounted but does not restore bottle state. Fixed in50e6.
- P2: `tsconfig.json:5` and `tests/rig-configurator.test.ts:4`: standalone TypeScript check rejects.ts test imports. Fixed in50e6. Original production build nevertheless passes; this was not an observed Netlify build failure.
- P2: `src/lib/clearance.ts:104`: capacity checking omits rear-top-tube, downtube and fork sockets. Follow-up uses a complete socket traversal; independent tests cover five previously omitted positions.
- P2: `src/lib/balance.ts:56`: payload lookup omits rear-top-tube and downtube; `:69` clamps moments behind an axle; `:83` derives axle grams from rounded percentages. Follow-up preserves exact moments, uses selected-size wheelbase and reports unknown equipment weights separately.
- P2: `src/components/canvas/BagMesh.tsx:93`: hard-coded category meshes ignore dimensions. Follow-up shares dimension-driven placement/envelopes with conservative fit checks. Unknown dimensions produce illustrative geometry, not measured clearance.
- P2: `src/store/useRigStore.ts` mount/model/import transitions accept nonexistent or incompatible sockets. Follow-up validates catalog items, categories, capabilities and exclusions; recursively removes dependent gear after parent hardware removal and sanitizes URL payloads/prototype-like keys.

## Source and modelling boundaries

The current manufacturer collection tables identify Blur5 MY2027 with120/120mm suspension and Stigmata4 MY2027. Reference builds are Blur90 (12.50kg) and rigid-fork StigmataApex (9.46kg). Source weights are complete reference-build figures; a weighing protocol and per-size weight table were not established.

- https://www.santacruzbicycles.com/collections/blur
- https://www.santacruzbicycles.com/collections/stigmata
- https://www.santacruzbicycles.com/pages/product-support/stigmata-4-my-26

Geometry uses published reach, stack, wheelbase, angles and size dimensions. Tube surfaces, suspension pivots, saddle height, tire radius and mounting positions are original approximate reconstructions. All visual geometry and textures are generated locally; manufacturer photos are references, not bundled assets. No paid assets or license assumptions.

Stigmata has no rack eyelets. Axle-mounted Tailfin installation requires exact axle and UDH/drivetrain verification. The broad Tailfin Blur2022+ listing and2023 fit guide do not prove Gen5 testing. Current FOX34SL fork-clamp fit and rigid Stigmata fork cargo support remain unverified. Bag templates, full shock/fork/dropper travel, bottles, Glovebox and steering must be checked on the actual bike.

Static weight balance assumes45% unloaded front load and distributes payload by known bag volume at attachment points. It excludes the rider and does not simulate dynamic handling or suspension forces. Unknown mass yields a known subtotal. Conservative rotated equipment envelopes can over-report interference; surfaces/straps are not engineering collision meshes. No exact-fit, physical clearance or photorealism claim.

## Evidence and delivery

Before and first-improvement evidence remains under `/workspace/bikepacking-evidence`. New captures are in its `realism/` subdirectory. Paths are executor-local and are not automatically delivered to another machine.

Library transfer was blocked by the cloud proxy (CONNECT403); no canonical library_file_id was created. No failed reservation ID is presented as a delivered file. Parent owns screenshot transfer and the existing private Site publishing workflow.
