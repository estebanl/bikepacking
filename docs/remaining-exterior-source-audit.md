# Remaining exterior source audit

The live `TAILFIN_CATALOG` currently has **23 `implementation-pending` variants** (128 mountable, 13 unsupported-fit, 18 nonvisual-spare, 9 off-bike). This note distinguishes work that has sufficient product evidence to implement from work blocked on source/host evidence and from choices that need option normalization. A mountable preview is illustrative and does not certify physical fit.

Each entry gives the literal Tailfin source product ID and the live catalog variant ID (`-v1`). Product links match the live source record. Unknown masses, dimensions, package counts, and fit remain unknown unless explicitly given below.

## Host-generation dependency unresolved

These eight products have source-supported host relationships, but the required host generation is absent or compatibility with a current host is not established. Keep them pending until the right host is represented and compatibility is supported.

| Product ID (live variant) and official source | Supported host relationship | Unresolved generation/host gap |
| --- | --- | --- |
| [`tailfin-972191` (`tailfin-972191-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/cargopack-fixed-connector-v2/) Fixed CargoPack Connector Parts v2 | Attaches a Gen 2 Cargo Top Bag to Carbon or Alloy Arch; not for Top Stay rack/removable configuration. | Current CargoPack Top Bag uses new hardware from January 2026 but is not explicitly called Gen 2; SKU equivalence is unproven. |
| [`tailfin-972190` (`tailfin-972190-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/cargopack-removable-connector/) Removable CargoPack Connector Parts v2 | Connects a Gen 2 CargoPack Top Bag to a Carbon or Alloy Tailfin Rack; not for Fixed CargoPack. | Source does not equate the January 2026 current bag with the stated Gen 2 host. |
| [`tailfin-656` (`tailfin-656-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-trunk-connector-parts/) Removable CargoPack Connector Parts v1 | Connects AP Trunk/CargoPack V1 bags to Carbon or Alloy racks; explicitly Gen 1 only, not fixed system. | No Gen 1 Cargo Top Bag host is represented. Current `tailfin-670` is the January 2026 revision, not an established Gen 1 host. |
| [`tailfin-653` (`tailfin-653-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/aeropack-connector-parts/) Fixed CargoPack Connector Parts v1 | Attaches a Gen 1 Cargo Top Bag to Carbon or Alloy Arch; Extended Seat Post Connector is required for the stated small-to-large frame case. | No Gen 1 Cargo Top Bag host is represented. Do not attach it to current `tailfin-670`. |
| [`tailfin-16404` (`tailfin-16404-v1`)](https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/extended-seat-post-connector/) Extended Seat Post Connector V1 | Required with fixed CargoPack Connector Parts v1 for source's small-to-large frame fit case; page lists 37 mm and 22 g. | Dependency is the legacy v1 fixed system, whose Gen 1 bag host is absent. Exact frame-size boundary and current-system compatibility are unresolved. |
| [`tailfin-48955` (`tailfin-48955-v1`)](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/22l-pannier-lower-parts/) SL/UD 22 L Pannier Lower Spare Parts | Replacement lower parts for historical 22 L SL and UD Panniers; current 16 L/22 L owners are pointed to a separate lower-hook item. | No separate SL/UD-generation pannier host exists. Do not attach to the generic current 22 L pannier. Other package contents unspecified. |
| [`tailfin-141677` (`tailfin-141677-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-stacking-straps/) AP Stacking Straps | Replacement stacking straps for AP Rack Top Bag. | Only historical AP host relationship established; compatibility with current CargoPack revisions unverified. |
| [`tailfin-137471` (`tailfin-137471-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/ap-front-cover/) AP Front Cover | Replacement AP Rack Top Bag Connector cover; metal insert explicitly not included. | Only historical AP connector host established; compatibility with current CargoPack revisions unverified. |

## Source placement or package scope missing

These two products do not have source-supported placement/package details sufficient for a credible mounted preview.

| Product ID (live variant) and official source | Supported product fact | Missing evidence |
| --- | --- | --- |
| [`tailfin-1032170` (`tailfin-1032170-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/journey-rack-fit-link-spares/) Journey Rack Fit Link Connectors | Official page identifies Journey Rack Fit Link spares. | Available source does not establish connection location or placement geometry; do not invent a seatpost-to-rack linkage. |
| [`tailfin-733417` (`tailfin-733417-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/carbon-arch-mini-bumper/) Carbon Arch Mini Bumper | Replacement mini bumpers for Carbon Arch. | Product page does not establish placement, included count, or measurable envelope; no fitting guide was identified in the audited source set. |

## Code to implement from supported source facts

These records have enough host/part relationships to proceed with illustrative geometry and replacement conflicts. This classification does not certify product fit, package quantity, or dimensions beyond the cited source.

| Product ID (live variant) and official source | Supported relationship and remaining implementation work |
| [`tailfin-916390` (`tailfin-916390-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-fixed-connector-parts/) Fixed SpeedPack Connector Parts | Connects SpeedPack bag to Carbon or Alloy Arch; excludes Rack and Fixed CargoPack configurations. Implement as fixed bag-to-bare-arch attachment; parts count, generation, mass, and dimensions are unknown. |
| [`tailfin-894177` (`tailfin-894177-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-fixed-system/) SpeedPack Top Bag + Fixed Connector Kit | Package includes SpeedPack 10 L top bag and fixed connector kit. **This is a code dependency, not missing source evidence:** implement the bare Carbon/Alloy Arch assembly explicitly, with material/arch dependencies and conflict against the complete rack/top stay. Do not silently strip a rack’s Top Stay or reuse the complete-system mass. The kit package’s mass is unknown and must not be borrowed from a complete system. |
| [`tailfin-988525` (`tailfin-988525-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/fixed-connector-front/) CargoPack Fixed Connector – Front | For CargoPack V2 and SpeedPack bags with four front mounting holes. Implement as the fixed front component on matching bags; keep separate from removable-front hardware. |
| [`tailfin-988521` (`tailfin-988521-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/removable-connector-front/) Removable Connector – Front | For removable SpeedPack and CargoPack V2 bags with four front mounting holes. Implement separately from fixed front hardware. |
| [`tailfin-733559` (`tailfin-733559-v1`)](https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-spacers-31-8mm/) Bar Bag Spacers 31.8 mm | Replacement spacers for Bar Bag Handlebar Mount; screws included. Add as replacement geometry there; exact quantity and shape are not specified. |
| [`tailfin-733554` (`tailfin-733554-v1`)](https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-strap-keeper/) Bar Bag Strap Keeper | Replacement for Bar Bags and Cargo Top Bag Strap; sold individually. Implement as a replacement on the corresponding strap host; exact position/dimensions unknown. |
| [`tailfin-733562` (`tailfin-733562-v1`)](https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-pocket-hook/) Bar Bag Pocket Hook | Replacement for Tailfin Bar Bags; screw included. Implement as bag-side replacement; exact position/dimensions unknown. |
| [`tailfin-733557` (`tailfin-733557-v1`)](https://www.tailfin.cc/ca/product/spares/bar-system-spares/bar-bag-x-clamp-inserts/) Bar Bag X-Clamp Inserts | Replacement inserts for Bar Bag X-Clamp. Implement as replacement with conflict against installed inserts; count/mass unknown. |
| [`tailfin-141836` (`tailfin-141836-v1`)](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/cargo-strap-keeper/) Cargo Strap Keeper – Pack of 4 | Four replacement keepers for Cargo Straps. Implement on a confirmed Cargo Strap host as the four-piece pack; do not substitute other keeper types. Exact installed locations are not specified. |

## Option normalization before implementation

The sources support these product families, but a selectable option must be resolved to a specific mount/host/fit before rendering.

| Product ID (live variant) and official source | Normalization needed |
| [`tailfin-729569` (`tailfin-729569-v1`)](https://www.tailfin.cc/ca/product/accessories/bar-bag-accessories/bar-bag-system-accessories/) Bar Bag System Accessories | Options: 22.2 mm Side Bar (left/right), Computer Mount Kit (Wahoo and Garmin mounts), GoPro Central (center only), GoPro Side (left/right). Explicitly not compatible with Bar Cage. Normalize selected option and included hardware; apply only to Bar Bag System. |
| [`tailfin-1047449` (`tailfin-1047449-v1`)](https://www.tailfin.cc/ca/product/spares/cargo-cage-system-spares/t-hook-straps/) T-Hook Straps | Option page lists DownTube Packs, Cage Packs, CargoPack/SpeedPack top bags, 5/10 L panniers, Bar Cage Bags, and 16 L panniers/straps. Resolve SKU option, host, length, and quantity; do not assume a universal installed strap. |
| [`tailfin-730412` (`tailfin-730412-v1`)](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/buckle-replacement-kits/) Buckle Replacement Kits | One buckle plus replacement tab per kit; compatibility list covers panniers, Mini Panniers, Cargo/SpeedPack top bags, DownTube/Cage/Fork Packs, and multiple Bar Bag types. Normalize selector options to exact buckle/host. The source repeats a 22 L pannier entry; do not infer another variant from that duplication. |
| [`tailfin-141887` (`tailfin-141887-v1`)](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/third-party-rack-inserts/) Third Party Rack Inserts | 8, 10, and 12 mm spacers for Tailfin Panniers, included as standard with panniers. Fits Tailfin panniers to a third-party rack. Normalize third-party rack host, spacer size, and replacement-vs-included state; this is the reverse direction from [`tailfin-20115`](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/third-party-pannier-adaptors/), which adapts third-party panniers to Tailfin rack mounts. |

## Recently moved out of pending

These four records now have an implementation in the live catalog. That status means preview code exists; it does **not** certify physical fit or eliminate the source limits listed here.

| Product ID (live variant) and official source | Source fact retained; fit remains unverified |
| [`tailfin-661861` (`tailfin-661861-v1`)](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/16l-pannier-lower-hook/) Pannier Lower Hook | Lower hook and screws for 16 L and 22 L Panniers; SL/UD 22 L replacement is a distinct legacy SKU. |
| [`tailfin-141888` (`tailfin-141888-v1`)](https://www.tailfin.cc/ca/product/spares/pannier-fork-bag-spares/standard-pannier-inserts/) Standard Pannier Inserts | Replacement 16 mm Pannier X-Clamp inserts for all Tailfin Panniers; package count and mass are not stated. |
| [`tailfin-917654` (`tailfin-917654-v1`)](https://www.tailfin.cc/ca/product/spares/rack-aeropack-spares/speedpack-removable-connector/) Removable SpeedPack Connector Kit | Replacement connector for the SpeedPack Rack Top Bag; not compatible with the fixed system. Current removable SpeedPack page lists 430 g for the bag, says new internal-frame/hole spacing requires unique connector parts, but does not say whether that mass includes normal connector hardware. The spare kit's mass and the modified-host mass delta are unknown. |
| [`tailfin-734886` (`tailfin-734886-v1`)](https://www.tailfin.cc/ca/product/spares/top-tube-bag-spares/top-tube-flip-buckle/) Top Tube Flip Buckle | Replacement buckle for Flip Top Tube Bags; includes buckle and elastic cord. |

## Work still needed

1. Implement supported bar, strap, pannier, and connector geometry with replacement conflicts and host dependencies. Keep source mass/dimensions null where the product page does not publish them.
2. Build `tailfin-894177` through a bare Carbon/Alloy Arch configuration with explicit arch dependencies and a conflict against complete rack/top-stay hardware. This is remaining code work, not a source-proof blocker.
3. Resolve the current CargoPack-to-Gen-2 relationship, represent the historical SL/UD 22 L host, obtain a usable Journey Fit Link placement, and establish Carbon Arch Mini Bumper package placement/count before enabling those records.
4. Normalize the Bar Bag accessory, T-Hook strap, buckle-kit, and third-party rack insert selections before presenting them as chosen mounted variants.
5. Do not infer mass by subtracting unknown replacement-part mass from a host system. Unknown package contents, installed geometry, and physical bike fit remain explicit.

`docs/tailfin-implementation-backlog.md` reflects the same 128 mountable / 23 pending counts. This note does not mark any remaining item complete.
