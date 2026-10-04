# Rear arches, paired adapters and catalog bottles — 2026-10-03

This grouped pass adds ten previously pending catalog records using shared component geometry and mounting rules. The catalog now has **95 illustrative previews + 56 pending + 13 unsupported-fit + 18 internal/service + 9 off-bike = 191 snapshot records**. The remaining exterior backlog stays open.

## Rear arch families and source limits

Six snapshot IDs share two source families: Alloy `642` (without mounts), `591` (with mounts), `43567` (generic); Carbon `641` (without), `446` (with), `43576` (generic). The two generic records are overlapping family entries with unspecified options, not evidence of extra distinct physical variants. They retain their snapshot identity and render a conservative mount-unspecified arch with no pannier capability. No duplicate arch is added to an assembled rack.

- https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/alloy-arch/ identifies Alloy Racks/AeroPack Alloy and publishes 370 g without mounts, 471 g with mounts. Those two option-specific masses are supplemental normalization; the frozen source JSON is unchanged.
- https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch/ identifies Carbon Racks/AeroPack Carbon. Carbon mass and all complete arch dimensions remain unknown.

Replacements require a matching-material rear-system family; Journey is excluded. Current CargoPack/SpeedPack previews use this family mapping illustratively, not as proof of exact revision compatibility. A shared original arch now includes two legs, a continuous top bridge, axle feet and optional receivers. Carbon and alloy finishes differ. Decks, top bags and seatpost connectors remain separate scene components. Source unknowns remain null; dimensions and surface geometry are estimates, not manufacturer CAD or measured fit.

Replacing an arch updates the effective pannier interface. Without-mount and unspecified-option arches remove incompatible dependent panniers/adapters. With-mount options can supply the interface to an otherwise without-mount host. Modified host mass and axle moments exclude the unknown removed hardware; known replacement mass is retained. Host capacity, luggage payload and separate known bag mass remain accounted for. Removing the replacement restores the original host and interface.

## Third-party pannier adapter pair

`tailfin-20115-v1` is modeled once as a pair, with two 10 mm rods and original estimated brackets/length. https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/third-party-pannier-adaptors/ specifies 82.5 g per pair and a host rack/AeroPack with pannier mounts; T1 is excluded. Third-party panniers and inserts are not included. Conventional adapter rails occupy a different interface from modeled Tailfin pannier hooks, so simultaneous fitting is blocked. Exact bag compatibility, including QL3.1, remains unverified.

## Bottles and frame attachment

`643500` Black/Teal, `643499` Black and `643496` Smoke use one original bottle model with cap, spout, waist and color/label differences. Two independent frame locations follow the selected bike/size and their own adapter. Bottle Dropper offsets are 45 mm toward the bottom bracket and 5 mm outward, without accumulating offsets across repeated renders.

Source URLs remain on the catalog records. The official Smoke page was readable; Black and Black/Teal page opens failed, so their existing snapshot identities were retained. No missing numeric specifications were inferred. Bottle mass, water capacity and dimensions remain null. The 74×230×74 mm envelope is an illustration. Bottles do not become luggage capacity or receive luggage payload allocation; carried water must be entered manually as payload.

The illustrated reference cage includes a backing plate and estimated boss attachment but is not a supplied or weighed catalog product. A selected down-tube bottle suppresses the previous generic reference bottle, avoiding duplicate geometry. The reference-bottle toggle affects only that placeholder; catalog bottles remain mounted items. Fit, bosses, cage and actual bottle dimensions require physical confirmation.

## Validation

86 tests pass and standalone TypeScript passes, including 74,490 empty-state mount combinations and 1,210 provisioned configurations across all 10 destination sizes. Dedicated tests cover material gating, arch mount-option changes, adapter conflicts in both insertion orders, removal cascades, URL roundtrip, paired mass, conservative modified-host accounting, bottle offsets, reference suppression and water/luggage capacity separation. Rendered validation and final production export are recorded with the publication checkpoint.

Independent rendered review passed at1440×1000 and390×1000 for both material assemblies, bottle colors and adapter pairs, plus rear views. No observed duplicate geometry, floating attachments, tire intersections, overflow or browser errors. Host cascades, live without-mount replacement switching, reference-toggle independence and Smoke bottle search/mount passed. Raw captures and results: `/workspace/bikepacking-evidence/rear-bottle-review/`; published assets `/review/rear-arch-bottles-{alloy,carbon}-{desktop,mobile,rear}.jpg`. A Next-only misplaced client directive and stale development assets were caught and corrected before production publication.
