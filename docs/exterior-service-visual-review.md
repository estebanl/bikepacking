# Exterior service parts and soft-panel visual review — 2026-10-03

Independent actual Chromium/WebGL inspection, comparing current production static port3011 with development port3019. Local evidence: `/workspace/bikepacking-evidence/exterior-service-final-before/` and `exterior-service-final-after/`. This review owns this document only; no renderer changes were made by the reviewer. Geometry remains illustrative, not manufacturer CAD or approved physical fit.

## Scope and method

Matched Stigmata M setups contain a Half Frame Bag, Flip Top Tube Bag, Carbon Rack, removable SpeedPack and paired Mini Panniers. Desktop1440×1000, mobile390×1000 and Side View captures use the same rig and4.5-second settling. Additional Blur M captures use a16.5L Ortlieb seat pack plus front Bar Cage bag, including360px phone view. Service-part inspection uses the current22L left pannier, removable SpeedPack and Flip Top Tube Bag with all four new spare parts. Evidence filenames are `matched-{desktop,side,mobile}`, `seatpack-desktop`, `seatpack-360`, `service-rear`, and `shadow-bike-gear-updated`; `results.json` records the interaction checks.

## Functional results

All four service parts mounted on their matching hosts: Pannier Lower Hook661861, Standard Pannier Inserts141888, Removable SpeedPack Connector917654, and Flip Top Tube Buckle734886. Removing the four parts preserved all six host/prerequisite placements and restored their known mass: subtotal9.84kg before replacement removal to11.23kg after, with capacity33.1L unchanged. Remaining unknown count drops8→1, and the modified-host exclusion text disappears. No browser page errors or horizontal overflow were observed in the captured sizes.

Independent WebGL framebuffer-binding instrumentation confirms the shadow cache behavior:0steady-state offscreen binds,10on bottle visibility change,0after settling,10on gear removal,10on bicycle change, then0again. This verifies refresh and bounded work rather than relying on another agent's performance report.

## Visual findings awaiting final resolution

- The small-bag surfaces now have rounder edges, smoother side-panel shading and contour-following zipper/seam lines. No open shell holes or inverted panels were evident in the inspected side and rear views. Rack/pannier and tube attachment positions remain coherent.
- The first soft-shadow pass creates a perceptible floating-bike appearance in the matched desktop view: the front tire's lowest point is separated from the strongest blurred shadow, and the rear patch spreads away from the tangent. There is no opaque rectangular floor, but the missing tight contact is a visual regression from production. The shadow owner is adding a restrained contact patch beneath each wheel; independent reinspection is required before sign-off.
- The16.5L seat pack exposes a pre-existing geometry defect: straight strap segments form a large rectangular outline above/below the tapered shell, and the assembly has no convincing saddle-rail/seatpost fastening. This appears in both before and after images. It should be corrected or explicitly retained as a known limitation; the seat-pack category should not be described as fully realistic on this evidence.

Final visual sign-off and final camera/orbit check remain pending the tire-contact and seat-pack decisions. The functional checks above are complete.
