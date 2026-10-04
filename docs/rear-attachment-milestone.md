# Rear attachment and reverse conversion milestone

Six exterior snapshot records move to mountable: Pannier Upper Parts48947, Mini Pannier Lower Parts652020, Seat Post Connector1032164, Long Seat Post Strap1032167, Long Seat Clamp Strap v1 48964, Carbon Top Stay56062. Current191 =105 mountable +46 pending +13 unsupported-fit +18 internal/service +9 off-bike. The frozen catalog JSON remains unchanged; these are original illustrative previews, not manufacturer CAD or measured fit.

## Source-grounded constraints

- [Conversion kit](https://www.tailfin.cc/ca/product/pannier-rack-top-bags/rear-pannier-bags/mini-pannier-fork-pack-conversion-kit/) advertises both directions for compatible second-generation Mini Panniers/Fork Packs, excluding16L. Its installation instructions say to retain the original Mini Pannier clamp, hook arm, lower hook and screws for reversal. The source snapshot has not normalized directional package options. Therefore its generic kit remains the forward fork interface; it does not silently supply rear parts.
- [Pannier Upper Parts](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/pannier-upper-parts/) is a replacement clamp for all Tailfin panniers. Exact fastener contents, mass and dimensions are unknown.
- [Mini Pannier Lower Parts](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/mini-pannier-lower-parts/) includes hook and bar for5L/10L Mini Panniers; Gen1 uses18mm screws and Gen2 uses12mm. Correct screws/revision must be verified. The16L/22L lower hook is not substituted.
- [Seat Post Connector](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/seat-post-connector-2/) is listed for all rear systems. [Long Seat Post Strap](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/long-seat-post-strap-2/) is the Journey-specific larger-post option. [Long Seat Clamp Strap v1](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/long-seat-clamp-strap/) is listed as included with Carbon Rack/CargoPack/SpeedPack; selecting it replaces the included band.
- [Carbon Top Stay](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-top-stay/) is only for Carbon Pannier Rack. Two length options are advertised, but this generic snapshot does not choose a length. The page lists93.2g without unambiguous per-option attribution; normalized mass remains unknown. The linked dimension image was inaccessible, so no dimensions or fit selection were invented.
- Journey Fit Link placement remains unresolved and the Extended Seat Post Connector V1 is restricted to pre-January2026 fixed Gen1 CargoPacks. Both remain pending rather than being attached to an unsupported current host.

## Assembly and accounting

Rear Fork Packs require the same-side upper clamp and Mini lower parts, representing separately sourced replacements or retained original hardware. Front hardware cannot satisfy rear dependencies or vice versa. Removing either required rear part removes only that converted bag. Normal Mini Panniers can use individual replacements; large panniers cannot use the Mini lower part.

Normal and converted rear bags share an attachment datum on the modeled rack receiver. Right bags rotate180degrees so hardware faces inward. Separate upper/lower models use exactly the same coordinates as included hardware, with original pieces suppressed. This corrects the earlier fixed ±200mm bag anchors and outward-facing right hooks.

The rear stay, connector body and strap share fixed-post endpoints. Selecting each spare suppresses only the corresponding included piece; none follows the moving dropper stanchion. Tailfin rear-pannier exclusivity is scoped to rear sockets so front Fork Packs no longer incorrectly block third-party rear adapters.

Modified rack/bag mass is excluded once per physical socket because removed hardware mass is unknown. Known unmodified opposite bags remain counted. Capacity and payload remain included, and manifests identify uncertain modified hosts. No hardware count is converted into an invented weight.

## Validation

Before/after rendered screenshots cover desktop1440×1000, mobile390×1000 and rear hardware angle. Final test and browser outcomes are recorded after validation below.

102 tests pass, including95,500 empty-state variant/size/socket combinations,1,450 provisioned configurations across10 destination sizes (14,500 transitions) and460 opposite-side attacks. TypeScript passes. Independent rendered QA covered Carbon Rack with all three replacement pieces, Journey strap, and a converted rear5L Fork Pack with an unmodified opposite10L Mini Pannier. All were inspected at1440×1000,390×1000 and rear hardware angle;320px Gear overflow check passed. Final browser contexts had no errors or overflow. Rack removal and side-specific lower-part removal cascaded correctly. Carbon replacement subtotal10.21kg, Journey replacement9.52kg and reverse-conversion10.22kg explicitly exclude uncertain modified hosts. Screenshots are included under public/review/rear-attachment-* and rear-pannier-before-*.
