import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { REAR_ARCH_HARDWARE_PARTS, rearArchHardwareConflictReasons, getModifiedRearArchHardwareHostSockets } from '../src/lib/rearArchHardware.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery } from '../src/lib/export.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => { const found = TAILFIN_CATALOG.find(p => p.id === `tailfin-${id}`); assert.ok(found, id); return found; };
const bike = BIKES.find(b => b.id === 'santa-cruz-stigmata-2027')!, size = bike.sizes.M;
const carbon = item('913333-v2'), alloy = item('913333-v6'), journey = item('1008020-v1');
const carbonPair = item('129215-v1'), alloyPair = item('129212-v1'), dropout = item('827-v1'), bushings = item('33026-v1');
const base = { rearAxleHardware: item('34167-v1'), rearUdhHardware: item('664853-v1') };

test('bumpers require their material and effective pannier mounts, excluding Journey and borrowed capabilities', () => {
  for (const [part, host, opposite, withArch, noArch] of [
    [carbonPair, carbon, alloy, item('446-v1'), item('641-v1')],
    [alloyPair, alloy, carbon, item('591-v1'), item('642-v1')],
  ]) {
    assert.equal(validateMount(part, 'rearArchBumpers', size, { rearRack: host }).allowed, true);
    assert.equal(validateMount(part, 'rearArchBumpers', size, { rearRack: opposite }).allowed, false);
    assert.equal(validateMount(part, 'rearArchBumpers', size, { rearRack: journey }).allowed, false);
    assert.equal(validateMount(part, 'rearArchBumpers', size, { unrelated: host }).allowed, false);
    assert.equal(validateMount(part, 'rearArchBumpers', size, { rearRack: host, rearArchReplacement: withArch }).allowed, true);
    assert.equal(validateMount(part, 'rearArchBumpers', size, { rearRack: host, rearArchReplacement: noArch }).allowed, false);
    const wrongArch = part === carbonPair ? item('591-v1') : item('446-v1');
    assert.equal(rearArchHardwareConflictReasons(part, 'rearArchBumpers', { rearRack: host, rearArchReplacement: wrongArch }).length, 1);
  }
});

test('dropouts and bushing kit require a real fast-release host, with independent physical dropouts', () => {
  for (const part of [dropout, bushings]) for (const socket of REAR_ARCH_HARDWARE_PARTS[part.id.replace(/-v\d+$/, '')].socketIds) {
    for (const host of [item('895075-v1'), carbon, alloy]) assert.equal(validateMount(part, socket, size, { rearRack: host }).allowed, true);
    for (const host of [journey, item('913333-v3'), item('913333-v7')]) assert.equal(validateMount(part, socket, size, { rearRack: host }).allowed, false);
    assert.equal(validateMount(part, socket, size, { wrongSocket: carbon }).allowed, false);
  }
  const mounted = { ...base, rearRack: carbon, rearDropoutLeft: dropout, rearDropoutRight: dropout, rearDropoutBushings: bushings };
  assert.equal(sanitizeMountedBags(mounted, size).removed.length, 0);
});

test('multiple arch hardware replacements exclude host once and retain known bumper pair mass', () => {
  assert.equal(carbonPair.dryWeightGrams, 18);
  for (const part of [alloyPair, dropout, bushings]) assert.equal(part.dryWeightGrams, null);
  const mounted: Record<string, BagItem> = { rearRack: carbon, rearArchBumpers: carbonPair, rearDropoutLeft: dropout, rearDropoutRight: dropout, rearDropoutBushings: bushings };
  const metrics = calculateRigMetrics(bike, size, mounted, 1200);
  assert.deepEqual(getModifiedRearArchHardwareHostSockets(mounted), new Set(['rearRack']));
  assert.equal(metrics.totalBagsDryWeightGrams, 18);
  assert.equal(metrics.totalCapacityLiters, carbon.volumeLiters);
  assert.deepEqual(metrics.unknownWeightItemIds, [carbon.id, dropout.id, dropout.id, bushings.id]);
  assert.deepEqual(metrics, calculateRigMetrics(bike, size, { ...mounted, rearRack: { ...carbon, dryWeightGrams: null } }, 1200));
  const combined = { ...mounted, rearArchReplacement: item('446-v1') };
  assert.equal(calculateRigMetrics(bike, size, combined, 1200).totalBagsDryWeightGrams, 18);
  for (const socket of ['rearArchBumpers', 'rearDropoutLeft', 'rearDropoutRight', 'rearDropoutBushings']) delete mounted[socket];
  assert.equal(calculateRigMetrics(bike, size, mounted, 1200).totalBagsDryWeightGrams, carbon.dryWeightGrams);
});

test('host removal and incompatible replacement arch cascade parts; complete assemblies roundtrip', () => {
  const mounted = { ...base, rearRack: carbon, rearArchBumpers: carbonPair, rearDropoutLeft: dropout, rearDropoutBushings: bushings };
  const query = serializeRigToUrlQuery({ bikeId: bike.id, sizeKey: 'M', mountedBags: mounted, payloadGrams: 0, dropper: false, bottles: false });
  const restored = deserializeRigFromUrlQuery(query, TAILFIN_CATALOG);
  assert.deepEqual(Object.keys(sanitizeMountedBags(restored.mountedBags, size).mountedBags).sort(), Object.keys(mounted).sort());
  assert.equal(sanitizeMountedBags({ ...mounted, rearArchReplacement: item('641-v1') }, size).mountedBags.rearArchBumpers, undefined);
  const removed = sanitizeMountedBags({ rearArchBumpers: carbonPair, rearDropoutLeft: dropout, rearDropoutBushings: bushings }, size);
  assert.equal(Object.keys(removed.mountedBags).length, 0);
});
