# Axle, arch hardware and rendered realism milestone

Nine additional snapshot records now have illustrative placements: 12mm Thru Axle, Universal Axle non-drive and drive ends, Thru Axle Spacers V2, SRAM UDH hanger, Carbon/Alloy Arch Bumpers, Fast Release Dropouts and their bushing kit. One previously enabled record was corrected to pending: fixed SpeedPack top bag kit 894177 requires a bare arch conversion, not a normal rack with its top stay.

Current accounting: **124 mountable, 27 implementation-pending, 13 unsupported-fit, 18 internal/service, 9 off-bike = 191 snapshot records**. This is not exhaustive manufacturer SKU coverage or completion of the all-components request. See `remaining-exterior-source-audit.md` and the generated implementation backlog for remaining work.

## Concrete compatibility correction

At prior published commit `24f81cec5a6709d4d7a083508c6eb5d1b8e6805c`, `src/data/tailfin.ts:3050` (`tailfin-894177`) allowed the fixed SpeedPack top-bag kit on `rackTop` using `rack-top`. The official fixed connector is for a Carbon/Alloy arch, not a complete rack/top-stay assembly. The new catalog rejects ordinary rack placement and explains the missing bare-arch conversion dependency. Regression tests reject this placement and preserve the pending classification. A floor-contact test now uses the actually supported removable SpeedPack instead of forcing the invalid fixed kit into a rack.

## Hardware fidelity and accounting

Axle ends and UDH hanger use shared attachment datums; the hanger is on the drivetrain side. Dedicated models replace generic blocks. NDS replacement includes spacers and cannot stack with the separate spacer set. Dropout left/right are independent physical copies; the bushing kit has four rings. Bumpers require matching arch material and effective pannier mounts; Journey is excluded. Carbon bumper pair mass is the documented 18g; other new spare masses remain unknown. Replacement-modified complete host mass is excluded once, because removed component mass is unknown. Removal restores the complete host accounting. Package quantities are not inferred where unreported.

Carbon/alloy bumper placement references:
- https://media.tailfin.cc/app/uploads/2022/06/27104053/TAILFIN_CARBON_FITTING-NEW-PRE-APPLIED-ADHESIVE-PANNIER-BUMPERS.pdf
- https://media.tailfin.cc/app/uploads/2022/06/27104054/TAILFIN_ALLOY_FITTING-NEW-PRE-APPLIED-ADHESIVE-PANNIER-BUMPERS.pdf

Original estimated geometry does not establish actual axle pitch/length, component generation, frame fit or purchased option. The complete bicycle reference-build mass is not an independently weighed replacement-parts model.

## Visual changes

Rounded, softly gathered luggage replaces rigid bar-roll and trunk shells. Closures, seams and straps follow those surfaces. Shared reinforced-floor geometry seats integral and removable trunks on their rack decks. Solid low-profile tire blocks replace hair-like lines; hoods, brake blades and MTB controls have recognizable housings. Neutral lighting and a quiet floor reduce visual clutter. Default/side camera framing now uses bike and gear bounds on requested view changes and viewport resize, preserving manual orbit ownership.

Independent rendered findings and remaining limitations are recorded in `realism-final-audit.md`. These are original approximate models, not exact manufacturer CAD or photorealistic product renders. Unverified bag/shock, bottle and steering clearances remain explicit.

## Checks

118 automated tests pass, including 143,250 empty-state catalog combinations, 1,760 provisioned configurations × 10 destinations and 460 opposite-side attempts. Separate floor-contact regression tests and TypeScript also pass. Final browser evidence and production build results accompany the publication record.
