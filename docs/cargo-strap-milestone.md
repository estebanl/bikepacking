# Cargo straps and cockpit accessory milestone — 2026-10-03

83 catalog variants have mountable illustrative previews;68 visible components remain unfinished.18 records are internal/service items,13 unsupported-fit and9 off-bike. The Long Top Tube Bag Accessory Pack is now correctly identified as internal dividers/pockets/tool loops, not a completed exterior component. The exact source JSON remains unchanged.

## Corrected source interpretation and mass

The official [Cage Pack FAQ](https://www.tailfin.cc/product/cargo-cage-system/cage-packs/cage-packs/) explicitly says cargo straps are purchased separately. The previously drawn automatic straps were not reflected in the setup's weight. Cargo Straps are now individual mounted items:40cm/30g,50cm/35g,65cm/42g, with20mm width and2.5mm thickness. The original flat dimensions remain source metadata; installed loop dimensions are unknown, not a400–650mm-wide bounding box.

A Cage Pack requires upper and lower straps on its own side. This preview supports the documented combinations:40cm for1.7L,50cm for3L, and50/65cm for5L. Other combinations are unverified and not enabled. Pack plus two straps weighs175g,224g,253g or267g respectively, excluding cage, fork mount, payload and other hardware. The5L pack's included T-hook side-compression straps are distinct and not counted twice.

Older shared configurations lacking cargo straps remove the incomplete pack and explain the missing parts by product name. They do not silently invent parts or weight. Replacing a strap with an unsupported length or removing it only removes the dependent pack on that side.

## Original rendered geometry

Cage Packs now have a soft elliptical body, separate roll closure and distinct optional cargo bands. The bands engage the cage crossbars and route behind its backplate. Body dimensions are refined illustration estimates, never measured physical envelopes. The strap tail is a tucked illustrative representation, not a measured end-to-end installation. Full fork approval and loaded clearance remain unverified.

The Bar Cage computer mount and22mm light mount now preview on the modeled standalone Cage-only arrangement with optional separate bag. Receivers remain empty: no GPS or lamp is included. The bundled Cage+Bag accessory interface remains unfinished rather than assumed identical. The cradle follows the bag, supports it from below, and connects to actual modeled handlebar clamp positions. Accessory anchors follow the top of the backplate.

Official accessory references:
- https://www.tailfin.cc/ca/product/accessories/bar-cage-mount-cmk/
- https://www.tailfin.cc/us/product/accessories/bar-bag-accessories/bar-cage-mount-22mm/

These pages establish product purpose, not complete geometry or device compatibility. Unknown accessory mass and dimensions remain null. No manufacturer CAD, fork approval or exact fit is claimed.

## Validation

67 automated tests cover strap roles, documented length combinations, individual-copy masses, removal/model/import behavior, and shared placement. The exhaustive catalog matrix now covers61,120 variant/size/socket combinations,1,050 provisioned configurations across10 destinations and300 opposite-side attacks. Independent rendered review passed for representative small/large paired packs, empty cages with straps, both cockpit accessories and a representative390px layout. Production export is checked before publication.
