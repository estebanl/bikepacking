# Fork Pack attachments and conditional conversion — 2026-10-03

The preceding rear arch/bottle batch was published as `8031521e638d612e85d82216b7aeadf10ea8ad4d` by successful private deployment `appgdep_6ac0513bdb548191b3da8edabbf4c2af`.

This next grouped pass adds four pending hardware records: Fork Pack Kit (`661740`), Fork Pack Mount (`661731`), Fork Pack Lower Hook (`676061`) and Mini Pannier/Fork Pack Conversion Kit (`675876`). **99 previews + 52 pending + 13 unsupported-fit + 18 internal/service + 9 off-bike = 191 snapshot records.** The all-components request remains open.

## Source scope

- https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/fork-pack-kit/ names Fork Packs and second-generation Mini Panniers as hosts, but does not list kit contents.
- https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/fork-pack-mount/ identifies a replacement for 5/10 L Fork Packs, with bolts/washers, and describes adapting current Mini Panniers by swapping hardware.
- https://www.tailfin.cc/product/spares/pannier-fork-bag-spares/fork-pack-hook/ identifies the replacement lower hook for 5/10 L Fork Packs. The regional page failed; the official canonical page supplied the source.
- https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rear-pannier-bags/mini-pannier-fork-pack-conversion-kit/ and its linked instructions specify second-generation Mini Panniers, not 16 L Panniers. Included conversion components overlap the separate mount/hook: X-clamp, fork mount, lower bumper, hook and screws/washers.

No replacement weight or full dimensions were established. Source unknowns remain null. The mounting plate, crossed receiver, lower bumper/hook and bolt stations are original illustrative geometry, not manufacturer CAD or approved fork installation. FOX 34 SL and rigid Stigmata fork support remain unverified.

## Behavior

Complete Fork Packs already include their mount; they now visibly render this attachment hardware once. Individual replacements suppress the corresponding included geometry. Whole/conversion kits occupy one mounting-hardware slot per side and cannot coexist with a separate hook on that side. Opposite-side assemblies remain independent.

A conversion kit on the same side enables the 5/10 L Mini Pannier at that fork position, conditional on a compatible second-generation bag. This does not identify an already-owned bag's generation. The currently implemented conversion preview is Mini Pannier-to-Fork Pack; reverse conversion is not represented. Rear placement retains the normal pannier interface. The bag's old rear hook geometry is suppressed in fork conversion mode. Removing the conversion kit removes its dependent converted bag; removing a fork attachment clears only that side.

Modified bag mass is excluded because the removed hardware mass is unknown. Luggage capacity and payload remain allocated. Mass uncertainty is tracked by mounting socket, not product ID: replacing hardware on one of two identical Fork Packs must not exclude the unmodified opposite bag's mass. Export rows preserve this physical-copy distinction.

The generic Fork Pack Kit is a schematic replacement-interface preview on an existing Fork Pack. Its exact included parts are unspecified; it does not claim an additional verified conversion kit or extra hardware inventory.

Validation:94 tests and TypeScript pass, including82,130 empty-state mount combinations,1,330 provisioned configurations×10 destinations,420 opposite-side dependency attacks, physical-copy-specific mass and CSV export, conditional conversion and URL/cascade checks. Independent actual rendered review passed at1440×1000/390×1000 for Blur Fork Packs and Stigmata converted Mini Panniers, plus manual orbit/hardware angles: no observed duplicate mounts/hooks, tire intersections, overflow or browser errors. Left collar removal and conversion-kit removal preserved the opposite assembly; the unmodified right Fork Pack retained390g known mass. Screenshots are published as `/review/fork-pack-{fork-pack,conversion}-{desktop,mobile,hardware}.jpg`; raw results are in `/workspace/bikepacking-evidence/fork-pack-review/`.
