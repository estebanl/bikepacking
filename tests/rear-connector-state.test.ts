import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { calculateRigMetrics, getMassUncertainHostSockets } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `tailfin-${id}-v1`);
  assert.ok(found, id); return found;
};
const bike = BIKES.find(b => b.id === 'santa-cruz-stigmata-2027')!, size = bike.sizes.M;
const cases: [string, string, string][] = [
  ['rearSeatConnector', '1032164', '1008020'],
  ['rearSeatStrap', '1032167', '1008020'],
  ['rearSeatStrap', '48964', '895075'],
  ['rearTopStay', '56062', '895075'],
];
test('rear connector replacements require their host and cannot survive its removal', () => {
  for (const [socket, id, host] of cases) {
    const part = item(id);
    assert.equal(validateMount(part, socket, size, {}).allowed, false);
    assert.equal(validateMount(part, socket, size, { rearRack: item(host) }).allowed, true);
    assert.equal(sanitizeMountedBags({ [socket]: part }, size).mountedBags[socket], undefined);
  }
  assert.equal(validateMount(item('1032167'), 'rearSeatStrap', size, { rearRack: item('895075') }).allowed, false);
  assert.equal(validateMount(item('56062'), 'rearTopStay', size, { rearRack: item('1008020') }).allowed, false);
});
test('rear connector changes exclude host mass once while keeping a separate bag and restoring mass on removal', () => {
  for (const [socket, id, hostId] of cases) {
    const host = item(hostId), bag = item('930095'), part = item(id);
    const mounted: Record<string, BagItem> = { rearRack: host, rackTop: bag, [socket]: part };
    const metrics = calculateRigMetrics(bike, size, mounted, 1200);
    assert.equal(metrics.totalBagsDryWeightGrams, bag.dryWeightGrams);
    assert.deepEqual(metrics.unknownWeightItemIds, [host.id, part.id]);
    assert.equal(metrics.totalCapacityLiters, bag.volumeLiters);
    assert.deepEqual(metrics, calculateRigMetrics(bike, size, { ...mounted, rearRack: { ...host, dryWeightGrams: null } }, 1200));
    delete mounted[socket];
    assert.equal(calculateRigMetrics(bike, size, mounted, 1200).totalBagsDryWeightGrams, host.dryWeightGrams! + bag.dryWeightGrams!);
  }
  const mounted = { rearRack: item('895075'), rearSeatConnector: item('1032164'), rearSeatStrap: item('48964'), rearTopStay: item('56062') };
  assert.deepEqual(getMassUncertainHostSockets(mounted), new Set(['rearRack']));
  assert.equal(calculateRigMetrics(bike, size, mounted, 0).totalBagsDryWeightGrams, 0);
  assert.equal(calculateRigMetrics(bike, size, mounted, 0).unknownWeightItemIds?.length, 4);
});
