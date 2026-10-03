import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { calculateRigMetrics, getMassUncertainHostIds } from '../src/lib/balance.ts';
import type { BagItem } from '../src/types/index.ts';

const bike = BIKES.find(b => b.id === 'santa-cruz-stigmata-2027')!;
const size = bike.sizes.M;
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `tailfin-${id}`);
  assert.ok(found, id);
  return found;
};
const arches = ['642', '641', '591', '446', '43567', '43576'].map(id => item(`${id}-v1`));
const hosts = ['895075-v1', '913333-v1', '894178-v1'].map(item);
const verifiedReplacementMass: Record<string, number> = {
  'tailfin-642-v1': 370,
  'tailfin-591-v1': 471,
};
const unknownIds = (host: BagItem, arch: BagItem) =>
  arch.dryWeightGrams === null ? [host.id, arch.id] : [host.id];

test('rear arch replacements exclude complete host dry mass without erasing capacity or payload', () => {
  // Two replacement masses are verified; the removed host subcomponent mass is
  // not. Keep the new known spare mass, without inventing a known host remainder.
  for (const host of hosts) for (const arch of arches) {
    const spareMass = verifiedReplacementMass[arch.id] ?? 0;
    assert.equal(arch.dryWeightGrams, verifiedReplacementMass[arch.id] ?? null);
    const original = { rearRack: host };
    const baseline = calculateRigMetrics(bike, size, original, 2100);
    assert.equal(baseline.totalBagsDryWeightGrams, host.dryWeightGrams);
    const mounted = { ...original, rearArchReplacement: arch };
    const metrics = calculateRigMetrics(bike, size, mounted, 2100);
    assert.equal(metrics.totalBagsDryWeightGrams, spareMass);
    assert.equal(metrics.totalRigWeightGrams, bike.baseWeightGrams + spareMass + 2100);
    assert.equal(metrics.totalCapacityLiters, baseline.totalCapacityLiters);
    assert.equal(metrics.payloadEstimateGrams, 2100);
    assert.deepEqual(metrics.unknownWeightItemIds, unknownIds(host, arch));
    assert.deepEqual(getMassUncertainHostIds(mounted), new Set([host.id]));
    assert.deepEqual(metrics, calculateRigMetrics(bike, size, {
      ...mounted, rearRack: { ...host, dryWeightGrams: null },
    }, 2100), 'axle moments retain payload but omit the complete modified host mass');
    for (const value of Object.values(metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
  }
});

test('a separate rack-top bag retains known mass and removing the replacement restores the host', () => {
  const host = item('895075-v1'), bag = item('930095-v1');
  assert.ok(bag.dryWeightGrams! > 0);
  for (const arch of arches) {
    const mounted: Record<string, BagItem> = { rearRack: host, rackTop: bag, rearArchReplacement: arch };
    const metrics = calculateRigMetrics(bike, size, mounted, 1800);
    assert.equal(metrics.totalBagsDryWeightGrams, bag.dryWeightGrams! + (verifiedReplacementMass[arch.id] ?? 0));
    assert.equal(metrics.totalCapacityLiters, bag.volumeLiters);
    assert.deepEqual(metrics.unknownWeightItemIds, unknownIds(host, arch));
    delete mounted.rearArchReplacement;
    const restored = calculateRigMetrics(bike, size, mounted, 1800);
    assert.equal(restored.totalBagsDryWeightGrams, host.dryWeightGrams! + bag.dryWeightGrams!);
    assert.deepEqual(restored.unknownWeightItemIds, []);
    assert.equal(getMassUncertainHostIds(mounted).size, 0);
  }
});

test('simultaneous front and rear replacements exclude both hosts once and count physical copies', () => {
  const rear = item('913333-v1'), front = item('825745-v3'), clamp = item('855553-v1');
  const mounted = {
    rearRack: rear, rearArchReplacement: arches[0], handlebar: front,
    barCageClampLeft: clamp, barCageClampRight: clamp,
  };
  const metrics = calculateRigMetrics(bike, size, mounted, 2300);
  assert.deepEqual(getMassUncertainHostIds(mounted), new Set([front.id, rear.id]));
  assert.equal(metrics.totalBagsDryWeightGrams, 370);
  assert.equal(metrics.totalRigWeightGrams, bike.baseWeightGrams + 370 + 2300);
  assert.equal(metrics.totalCapacityLiters, rear.volumeLiters! + front.volumeLiters!);
  assert.deepEqual(metrics.unknownWeightItemIds, [rear.id, front.id, clamp.id, clamp.id]);
  assert.equal(metrics.frontAxleWeightGrams + metrics.rearAxleWeightGrams, metrics.totalRigWeightGrams);
});

test('only an installed rear arch replacement marks a rear host uncertain', () => {
  assert.equal(getMassUncertainHostIds({ rearArchReplacement: arches[0] }).size, 0);
  assert.equal(getMassUncertainHostIds({ rearRack: hosts[0], rackTop: arches[0] }).size, 0);
  assert.equal(getMassUncertainHostIds({ rearRack: hosts[0], rearArchReplacement: item('855555-v1') }).size, 0);
});
