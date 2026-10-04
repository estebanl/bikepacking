# Independent validation — realistic rig update

## Numerical acceptance criteria

`tests/fit-engine.test.ts` uses an independent synthetic bicycle rather than deriving expected answers from application helpers. A 10,000g bicycle has a 1,000mm size-specific wheelbase and an assumed unloaded front load of 4,500g. The intentionally different model-level wheelbase catches failure to use selected-size geometry.

For 1,000g dry bag plus 3,000g payload, moment equilibrium gives these front loads:

| Attachment | Distance from rear axle | Expected front load |
|---|---:|---:|
| Rear top tube | 0.25m | 5,500g |
| Downtube underside | 0.75m | 7,500g |
| Rack behind rear axle | −0.10m | 4,100g |

Loads behind an axle contribute negative moments; clamping their position to the axle is physically wrong. Display percentage rounding must not feed back into calculated axle mass. Front + rear loads must equal total known mass.

Zero-volume hardware contributes dry mass and no volume-proportional payload. Unknown weight is omitted from the numerical subtotal and separately identified; omission must not be presented as a complete measured weight. Unknown physical dimensions and approximate display geometry must never generate a measured clearance guarantee.

Coverage includes all socket capacity checks, dependency capabilities, and equal-volume bags with different physical heights. Additional workflow checks will cover invalid socket/category combinations, sanitizing imported configurations, and changing bicycle models.

Baseline before new fit engine: 13 tests, 1 pass / 12 expected failures. This is a regression baseline, not a release result.

## Required limits in the review

- Original custom geometry is a visualization, not manufacturer CAD or an exact scan. Visual plausibility needs actual desktop/mobile renders; passing numerical tests cannot establish photorealism.
- Frame size, tire radius, fork offset, cockpit setup, seat height, and exact equipment generation affect appearance and fit.
- Static bounding volumes cannot guarantee suspension-travel, cable, pedal/heel, steering, strap, or rider clearance.
- An unloaded 45/55 bicycle balance and capacity-proportional payload allocation are assumptions. Rider mass/position, individual contents, water, and unlisted hardware can materially change axle loads.
- Family-level axle/hardware compatibility is not proof that a new frame generation is manufacturer-approved.
- All product entries must distinguish measured/verified dimensions from estimates and unknowns. Catalog coverage, selectable variants, spares and purchasable parent products are separate counts.
- App-level physical clearance thresholds are heuristics unless explicitly supported by a manufacturer specification.

## Runtime validation

Pending integrated build and actual browser inspection. No final visual-quality claim is made in this checkpoint.

## Integrated numerical checkpoint

Command: `node --experimental-strip-types --test tests/fit-engine.test.ts`

31/31 tests passed after integration (Oct 2, cloud executor). The suite additionally verifies selected-size geometry, quarter-turn envelope rotation, invalid mount rejection, right/left capability distinction, recursive removal of invalid hardware/dependents, insertion-order independent valid imports, malformed/prototype-like URL inputs, unknown-spec manifests, same saddle/bag dropper displacement on all ten Santa Cruz sizes, and separated/overlapping known-dimensional envelopes.

Remaining model limitations observed in the implementation:

- Tire checks compare the envelope lower edge with the tire top without horizontal intersection; this deliberately conservative approximation can warn where the bag is ahead of or behind the tire.
- Loaded socket limits now include capacity-proportional payload estimates; the 100g bag + 3,000g payload versus 2,000g limit regression is covered. Actual contents are not assigned individually, so this remains an estimate.
- Geometry source fidelity and model-generation fit are distinct. Surface shapes and tire radii remain estimates even where wheelbase, reach, stack, rear center and head angle are exact inputs.

No browser acceptance result is included in this numerical checkpoint.

## Catalog coverage audit

Command: `node --experimental-strip-types scripts/independent-validation-catalog.ts`

The indexed snapshot contains 191 unique Tailfin variant records (145 product families). Of these, 129 are reference-only and 62 have configured mounting actions. There are no duplicate IDs, missing Tailfin source URLs, missing dependency providers, or mountable entries without a structural socket on either Santa Cruz model. This is a software reachability audit, not manufacturer fit approval.

Only 2 entries have complete verified dimensions accepted by the physical-envelope checks. 124 weights and 134 capacities are unknown. Missing facts remain null and visibly identified, rather than assigned invented specifications. The snapshot is not exhaustive: the source's banners advertise more families than the enumerated dataset.

Actual catalog regression tests now verify that a left fork adapter/cage cannot authorize a right fork pack and that right-side providers can. All 191 records have unverified fit status; reference-only records expose no mount action.

## Stable production browser acceptance — passed

The final integrated production build at `http://localhost:3002` passed `scripts/independent-validation.cjs` on the cloud executor. This replaces the preliminary development screenshots, which were affected by live Fast Refresh during active editing.

Verified in headless Chromium with software WebGL:

- Both Santa Cruz models, size M, side/isometric camera selection and actual rendered desktop/phone captures.
- 1440×1000, 1024×768, 768×1024, 390×844 and 320×740: no horizontal overflow, usable canvas, and reachable mobile summary. Canvas at 390px is 364×241px; at 320px it is 294×241px.
- All 191 Tailfin cards searchable. Empty search state works.
- Missing hardware disables fork-bag mounting. Left hardware cannot enable a right fork bag.
- Two identical Cage Packs mount independently on both fork sides. Removing the left adapter removes its dependent left cage/pack and preserves the right assembly.
- Universal Thru Axle → UDH Adaptor → CargoPack System rear mounting workflow works.
- Payload adjustment, share-link contents, Markdown export and Escape-to-close work.
- No browser JavaScript errors during the full run.

Evidence on this cloud executor:

`/workspace/bikepacking-evidence/realism-final/runtime-results.json`

PNG files: `blur-desktop.png`, `blur-mobile.png`, `blur-side.png`, `blur-iso.png`, `stigmata-desktop.png`, `stigmata-mobile.png`, `stigmata-side.png`, `stigmata-iso.png`, `stigmata-loaded-desktop.png`, `stigmata-loaded-mobile.png`, `stigmata-loaded-canvas.png`.

Actual visual inspection of the final side/loaded/mobile frames confirms distinct mountain/gravel silhouettes, improved Blur frame contrast, visible dropbar/rigid-fork versus suspension-fork differences, readable frames on mobile, and modeled rear bag/hardware. These are original illustrative meshes, not photorealistic manufacturer CAD. The loaded sample retains explicit unknown-mass and unverified-fit notices. Numerical or browser passes do not establish real physical compatibility. Hardware touch performance has not been tested; Chromium software rendering is not a phone GPU benchmark.

Transport JPEG previews are captured separately at quality 75 by `scripts/independent-validation-jpeg.cjs`; names follow `{blur,stigmata}[-loaded]-{desktop,mobile}-review.jpg`. Files are local evidence, not confirmed Library uploads.

## Component and attachment follow-up

The next slice has 68 mounting previews and 84 visible components still pending, plus 13 unsupported-fit variants, 17 internal/service spares and 9 off-bike variants. It adds four replacement handlebar rolls, the separate bike-side mounting kit, and a SpeedPack top-bag/fixed-connector kit. Their unknown source specs remain null; integrated-system masses are not reused.

Corrected top-tube surface anchors and underside straps, added an illustrative rack-to-fixed-seatpost connector, and aligned bar-kit supports to the actual bar and bag. Stigmata's rigid seatpost now ignores imported/toggled dropper requests. Blur's control explicitly describes a 120 mm preview, not full manufacturer travel. Hardware without storage no longer produces unknown-capacity warnings.

44 tests, TypeScript and production build pass. Production port 3005 browser checks at 1440/390 px confirm no overflow or JavaScript errors, disabled rigid-post control and working Blur preview. Evidence: `/workspace/bikepacking-evidence/realism-final/refinements-{1440,390}.png`, `equipment-connectors-{desktop,mobile}.png`, `equipment-kit-aligned-cockpit.png`. Additional hardware stays illustrative and is not included in certified physical clearance bounds.

Earlier tool-output base64 chunks were not accessible to the parent; those transfers were not completed. No Library file IDs were obtained. Site publishing ownership was subsequently explicitly transferred to this cloud executor for direct private publication and screenshot delivery.
