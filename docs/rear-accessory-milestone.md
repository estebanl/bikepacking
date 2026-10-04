# Rear accessory milestone — 2026-10-02

78 indexed variants now have illustrative mounting previews; 74 visible components remain unfinished. No all-components completion or engineering fit claim.

## Implemented interfaces

- Journey Rack Mudguard (1029289) requires the Journey Pannier Rack, never a generic Carbon rack. Its original folded shield and attachment tabs follow the actual rendered deck underside.
- Garmin Varia/Wahoo (1027471), Cateye Nano (1027465), Seatpost Mimic (1027459), and Exposure Boost (1027462) light mounts expose separate original approximate receiving interfaces. Lamps are not included or drawn automatically. Recorded hosts are Journey rack, CargoPack, and Fixed SpeedPack; the unverified removable SpeedPack top-bag interface is not enabled.
- Fixed Light Mount (24700) requires CargoPack or Fixed SpeedPack bag interface. Source facts are50mm M5 screw spacing and8.7mm central wiring opening. Other dimensions remain unknown; rendered plate outline is illustrative.
- Cateye Wearable X (789125) shows a separate lamp and clip on the supported CargoPack/AeroPack bag interface. This does not imply a universally compatible frame-light mount.

A single rear-light socket prevents stacking conflicting mounts/lamps on one attachment. The anchor follows the compatible host's rendered rear surface. Changing to an incompatible rack or removing the supporting bag removes orphan accessories. Journey mudguard remains independent of the rear light socket.

## Sources and limits

The exact source JSON remains unchanged. Product URLs, source notes and null mass/dimensions are retained in the catalog. Official pages were checked during the prior research; this batch reuses that evidence rather than repeating broad research:

- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/journey-rack-mudguard/
- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/garmin-varia-wahoo-trackr-light-mount/
- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/cateye-nano-light-mount/
- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/seatpost-mimic-light-mount/
- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/exposure-boost-light-mount/
- https://www.tailfin.cc/ca/product/accessories/rack-aeropack-accessories/trunk-bag-fixed-light-mount/
- https://www.tailfin.cc/ca/product/accessories/cateye-light/

Garmin RCT715 requires a separate Garmin Lever-lock adapter; that adapter is not included or modeled. No light visibility, regulatory compliance, actual tire clearance or manufacturer fit certification is claimed. Unknown assembly mass remains visible; nonstorage hardware does not create an unknown-capacity warning.

Journey and removable Carbon racks now produce an explicit full-suspension warning on Blur, in addition to their source notes. This preserves exploratory previewing without implying the setup is recommended.

## Validation

60 tests pass, including specific host gates, removal cascades, all-size rear attachment equations and the exhaustive catalog/state invariants. TypeScript passes. Independent rendered review passed for all seven changed assemblies, representative mobile interaction, host-removal cascades and incompatible Carbon-rack imports. A transient development hot-reload error cleared in a fresh stable browser session; final stable captures had no JavaScript errors. Production export is checked before publication. Existing bicycle geometry and previous screenshots are retained.
