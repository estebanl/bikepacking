import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { AXLE_SPARE_PARTS, axleSpareConflictReasons, getModifiedAxleHostSockets } from '../src/lib/axleSpareAssembly.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery } from '../src/lib/export.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `${id}-v1`);
  assert.ok(found, id); return found;
};
const bike = BIKES.find(b => b.id === 'santa-cruz-stigmata-2027')!, size = bike.sizes.M;
const universal = item('tailfin-34167'), thru = item('tailfin-564'), udh = item('tailfin-664853');
const nds = item('tailfin-1027496'), ds = item('tailfin-129619'), spacers = item('tailfin-994176'), hanger = item('tailfin-836241');

test('axle spare mapping requires the exact complete host at its correct physical socket', () => {
  for (const [id, mapping] of Object.entries(AXLE_SPARE_PARTS)) {
    const part = item(id);
    assert.equal(part.dryWeightGrams, null);
    assert.equal(validateMount(part, mapping.socketId, size, {}).allowed, false);
    for (const hostId of mapping.hostProductIds) {
      const mounted = { [mapping.hostSocket]: item(hostId) };
      assert.deepEqual(axleSpareConflictReasons(part, mapping.socketId, mounted), []);
      assert.equal(validateMount(part, mapping.socketId, size, mounted).allowed, true);
      assert.equal(axleSpareConflictReasons(part, mapping.socketId, { wrongSocket: item(hostId) }).length, 1);
    }
  }
  assert.equal(validateMount(nds, 'rearAxleNds', size, { rearAxleHardware: thru }).allowed, false);
  assert.equal(validateMount(ds, 'rearAxleDs', size, { rearAxleHardware: thru }).allowed, false);
  assert.equal(validateMount(spacers, 'rearAxleSpacers', size, { rearAxleHardware: thru }).allowed, true);
  assert.equal(validateMount(hanger, 'rearUdhHanger', size, { rearAxleHardware: universal }).allowed, false);
});

test('NDS kit and separate spacers conflict in either order but DS replacement remains independent', () => {
  const host = { rearAxleHardware: universal };
  assert.equal(validateMount(nds, 'rearAxleNds', size, { ...host, rearAxleSpacers: spacers }).allowed, false);
  assert.equal(validateMount(spacers, 'rearAxleSpacers', size, { ...host, rearAxleNds: nds }).allowed, false);
  assert.equal(validateMount(ds, 'rearAxleDs', size, { ...host, rearAxleNds: nds }).allowed, true);
  assert.equal(validateMount(ds, 'rearAxleDs', size, { ...host, rearAxleSpacers: spacers }).allowed, true);
});

test('replacing multiple included axle and UDH parts excludes each modified host once', () => {
  // Fixture-only known masses demonstrate exclusion without inventing source specs.
  const axle: BagItem = { ...universal, dryWeightGrams: 123 }, kit: BagItem = { ...udh, dryWeightGrams: 45 };
  const bag = item('tailfin-1006881');
  const mounted: Record<string, BagItem> = { rearAxleHardware: axle, rearUdhHardware: kit, frameTriangle: bag, rearAxleNds: nds, rearAxleDs: ds, rearUdhHanger: hanger };
  const metrics = calculateRigMetrics(bike, size, mounted, 900);
  assert.deepEqual(getModifiedAxleHostSockets(mounted), new Set(['rearAxleHardware', 'rearUdhHardware']));
  assert.equal(metrics.totalBagsDryWeightGrams, bag.dryWeightGrams);
  assert.equal(metrics.totalCapacityLiters, bag.volumeLiters);
  assert.equal(metrics.payloadEstimateGrams, 900);
  assert.deepEqual(metrics.unknownWeightItemIds, [axle.id, kit.id, nds.id, ds.id, hanger.id]);
  assert.deepEqual(metrics, calculateRigMetrics(bike, size, { ...mounted, rearAxleHardware: { ...axle, dryWeightGrams: null }, rearUdhHardware: { ...kit, dryWeightGrams: null } }, 900));
  delete mounted.rearAxleNds;
  assert.equal(calculateRigMetrics(bike, size, mounted, 900).totalBagsDryWeightGrams, bag.dryWeightGrams);
  delete mounted.rearAxleDs;
  assert.equal(calculateRigMetrics(bike, size, mounted, 900).totalBagsDryWeightGrams, bag.dryWeightGrams! + 123);
  delete mounted.rearUdhHanger;
  assert.equal(calculateRigMetrics(bike, size, mounted, 900).totalBagsDryWeightGrams, bag.dryWeightGrams! + 168);
  assert.equal(getModifiedAxleHostSockets({ rearAxleNds: nds, rearUdhHanger: hanger }).size, 0);
});

test('host swaps remove incompatible spare children and valid assemblies survive URL roundtrip', () => {
  const mounted = { rearAxleHardware: universal, rearUdhHardware: udh, rearAxleNds: nds, rearAxleDs: ds, rearUdhHanger: hanger };
  assert.equal(sanitizeMountedBags(mounted, size).removed.length, 0);
  const swapped = sanitizeMountedBags({ ...mounted, rearAxleHardware: thru }, size);
  assert.equal(swapped.mountedBags.rearAxleHardware.id, thru.id);
  assert.equal(swapped.mountedBags.rearAxleNds, undefined);
  assert.equal(swapped.mountedBags.rearAxleDs, undefined);
  assert.equal(swapped.mountedBags.rearUdhHanger.id, hanger.id);
  assert.equal(sanitizeMountedBags({ rearUdhHanger: hanger }, size).mountedBags.rearUdhHanger, undefined);
  const query = serializeRigToUrlQuery({ bikeId: bike.id, sizeKey: 'M', mountedBags: mounted, payloadGrams: 0, dropper: false, bottles: false });
  const restored = deserializeRigFromUrlQuery(query, TAILFIN_CATALOG);
  assert.deepEqual(Object.keys(sanitizeMountedBags(restored.mountedBags, size).mountedBags).sort(), Object.keys(mounted).sort());
});
