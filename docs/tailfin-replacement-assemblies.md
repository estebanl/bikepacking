# Tailfin replacement assemblies

Six previously pending visible components now have exploratory mounting actions:

- Four replacement Bar Bag Rolls (MTB/drop bar, small/large) use the handlebar socket and require the separate bike-side Bar Bag Mounting Kit.
- Bar Bag Mounting Kit uses the existing handlebar hardware socket and provides `bar-bag-mount`.
- SpeedPack Top Bag + Fixed Connector Kit uses `rackTop` and requires an existing rack providing `rack-top`. It does not add a second arch or reuse an integrated-system mass; spare-kit mass and normalized capacity stay unknown.

Manufacturer source descriptions in `docs/reference/tailfin-catalog.json` say the replacement rolls include bag hardware, and that the mounting kit fits a second bike. This supports separate bike-side and bag-side components. Explicit handlebar type is enforced. The exact spare mass, capacity and dimensions remain null, even when a similar complete-system variant has published specifications. Rendered envelopes are illustration estimates only.

Complete Bar Bag Systems and combined Bar Cage kits exclude the extra mounting kit in either mounting order. This prevents adding a second clamp mass to an integrated system. Removing the mounting kit removes the dependent replacement roll during configuration sanitization.

Coverage advances from 62 to 68 mountable variants, and from 90 to 84 implementation-pending variants. There remain 191 indexed variants, including 13 unsupported interfaces, 17 internal/service spares and 9 off-bike items. These figures describe implementation coverage, not guaranteed physical fit.

Spare arches and cage plates remain pending. A spare arch does not include a top stay, seatpost connector or dropouts; a spare cage plate does not include all handlebar clamps. Rendering either as an existing complete system would misrepresent both its shape and assembly dependencies. Component geometry and distinct assembly attachment points are needed before enabling them.

Validation: `node --experimental-strip-types --test tests/tailfin-replacement-assembly.test.ts` covers handlebar compatibility, required mounting kit, removal cascade, bidirectional integrated-kit conflicts and unknown-specification preservation.
