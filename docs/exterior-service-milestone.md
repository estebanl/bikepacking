# Exterior service parts, softer bags and contact shadows

Four snapshot records gain illustrative host-specific placements: current 16/22L Pannier Lower Hook (661861), Standard Pannier Inserts (141888), Removable SpeedPack Connector Kit (917654), and Flip Top Tube Buckle (734886). Current accounting is **128 mountable + 23 pending + 13 unsupported-fit + 18 internal/service + 9 off-bike = 191**. The remaining request is open; `remaining-exterior-source-audit.md` separates evidence/host gaps, missing implementation, and option normalization.

## Assembly correctness

- Lower hooks require the actual same-side current 16/22L pannier, excluding Mini and legacy SL/UD parts. Sanitizing a host change discards a stale incompatible lower replacement before it can evict the new bag.
- Standard inserts require the actual same-side rear pannier/clamp. Converted Fork Packs require their compatible upper parts. Two modeled clamp inserts illustrate the attachment, not a verified source package quantity.
- The removable SpeedPack connector requires the actual removable 930095 bag on a complete rack. It cannot enable the fixed SpeedPack kit on a standard rack. The shared original connector adds an explicitly estimated 6mm stack between the reinforced bag floor and rack rails.
- The Flip buckle and elastic cord require the 1.1L/1.5L Flip bag variants, not zippered bags. The generic zipper is suppressed on these Flip variants.

Included and selected replacement geometry share attachment poses, suppressing duplicates. Replacement-modified host mass is excluded once by physical socket, preserving capacity and payload. Published 430g for the removable SpeedPack bag has unspecified connector scope: the model does not establish whether that mass includes connectors, and the conservative replacement calculation does not invent a delta. All four spare masses remain unknown.

Fixed SpeedPack kit894177 remains disabled on ordinary racks. Bare-arch conversion is separate implementation work; it is not made valid by selecting this removable connector.

## Visual work

Smaller bags use rounded corners, gently crowned panels, sewn perimeters and contour-following zipper ribbons. Catalog outlines and envelopes remain unchanged. Procedural materials and original geometry require no purchased/external assets.

A cached 512×512 soft contact projection replaces the continuous 2048×2048 directional shadow pass. Geometry changes refresh it; steady views and orbit reuse it. Two small procedural tire footprints provide local grounding without extra render targets. Their planes are below the capture camera so the depth override cannot bake opaque rectangles into the ambient projection. This is a visual approximation, not a physical light or tire-deformation simulation.

The independent rendered review found and prompted correction of a floating-tire appearance in the first soft-shadow version and a preexisting oversized strap frame on seat packs. The estimated Santa Cruz seat-pack anchor now sits close to the post below the rails; dedicated contour-following webbing replaces the oversized rectangular strap frame. Published bike geometry, bag dimensions and 120mm modeled dropper travel are preserved. The shared socket keeps rendering, clearance and mass moments consistent. An all-size regression checks the nose and rigid/dropper behavior. Final findings and exact screenshot evidence are in `exterior-service-visual-review.md`.

## Verification

123 automated tests pass: 150,890 empty-state catalog combinations, 1,820 provisioned configurations × 10 destinations, and 500 opposite-side attempts. TypeScript passes. Browser checks exercise two independent pannier insert copies, same-side parent removal, opposite-side preservation, connector removal preserving its bag, Flip-buckle cascade, explicit unknown mass and phone layout.

Software-renderer instrumentation recorded zero offscreen framebuffer bindings after settling, ten during a geometry refresh, then zero again. This is evidence of bounded cached shadow work, not a hardware-device FPS measurement. Publication includes a fresh production build and static-export checks.
