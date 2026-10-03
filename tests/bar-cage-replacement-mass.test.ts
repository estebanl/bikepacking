import test from 'node:test';
import { generateCsvManifest, generateMarkdownManifest } from '../src/lib/export.ts';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { calculateRigMetrics, getMassUncertainHostIds } from '../src/lib/balance.ts';
import type { BagItem } from '../src/types/index.ts';

const bike = BIKES.find(b => b.id === 'santa-cruz-blur-2027')!;
const size = bike.sizes.M;
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `tailfin-${id}`);
  assert.ok(found, id);
  return found;
};
const cage = item('825745-v1');
const spare = item('855555-v1');
const clamp = item('855553-v1');
const replacements: Record<string, BagItem>[] = [
  { barCageReplacement: spare },
  { barCageClampLeft: clamp },
  { barCageClampRight: clamp },
  { barCageClampLeft: clamp, barCageClampRight: clamp },
  { barCageReplacement: spare, barCageClampLeft: clamp, barCageClampRight: clamp },
];

test('Bar Cage hosts retain their published complete mass without replacements', () => {
  for (let variant = 1; variant <= 4; variant++) {
    const host = item(`825745-v${variant}`);
    const mounted = { [variant === 1 ? 'barMount' : 'handlebar']: host };
    const metrics = calculateRigMetrics(bike, size, mounted, 1200);
    assert.equal(metrics.totalBagsDryWeightGrams, host.dryWeightGrams);
    assert.deepEqual(metrics.unknownWeightItemIds, []);
    assert.equal(getMassUncertainHostIds(mounted).size, 0);
  }
});

test('each replacement excludes its complete host once and retains capacity and payload moments', () => {
  // Sources give only complete-host masses, not the removed cage/clamp masses.
  // Subtracting a guessed component mass would falsely make the remainder known.
  for (let variant = 1; variant <= 4; variant++) {
    const host = item(`825745-v${variant}`);
    const hostSocket = variant === 1 ? 'barMount' : 'handlebar';
    const original = { [hostSocket]: host };
    const baseline = calculateRigMetrics(bike, size, original, 1200);
    for (const replacement of replacements) {
      const mounted = { ...original, ...replacement };
      const metrics = calculateRigMetrics(bike, size, mounted, 1200);
      const payloadOnly = calculateRigMetrics(bike, size, {
        ...mounted, [hostSocket]: { ...host, dryWeightGrams: null },
      }, 1200);
      assert.equal(metrics.totalBagsDryWeightGrams, 0);
      assert.equal(metrics.totalRigWeightGrams, bike.baseWeightGrams + 1200);
      assert.equal(metrics.totalCapacityLiters, baseline.totalCapacityLiters);
      assert.equal(metrics.payloadEstimateGrams, 1200);
      assert.deepEqual(metrics, payloadOnly, 'no obsolete host mass remains in axle moments');
      assert.deepEqual(new Set(metrics.unknownWeightItemIds),
        new Set([host.id, ...Object.values(replacement).map(p => p.id)]));
      assert.equal(metrics.unknownWeightItemIds!.length, 1 + Object.keys(replacement).length,
        'each physical replacement counts separately, even two copies of the same clamp');
      assert.equal(getMassUncertainHostIds(mounted).size, 1);
      for (const value of Object.values(metrics)) if (typeof value === 'number') assert.ok(Number.isFinite(value));
    }
  }
});

test('separate bags retain known mass and payload when their cage hardware is replaced', () => {
  for (let variant = 1; variant <= 3; variant++) {
    const bag = item(`851925-v${variant}`);
    const original = { barMount: cage, handlebar: bag };
    const baseline = calculateRigMetrics(bike, size, original, 1600);
    for (const replacement of replacements) {
      const metrics = calculateRigMetrics(bike, size, { ...original, ...replacement }, 1600);
      assert.equal(metrics.totalBagsDryWeightGrams, bag.dryWeightGrams);
      assert.equal(metrics.totalCapacityLiters, baseline.totalCapacityLiters);
      assert.equal(metrics.totalRigWeightGrams, bike.baseWeightGrams + bag.dryWeightGrams! + 1600);
      assert.ok(metrics.unknownWeightItemIds!.includes(cage.id));
      assert.ok(!metrics.unknownWeightItemIds!.includes(bag.id));
    }
  }
});

test('removing the last replacement restores mass while one remaining replacement keeps it uncertain', () => {
  const host = item('825745-v3');
  const mounted: Record<string, BagItem> = {
    handlebar: host, barCageClampLeft: clamp, barCageClampRight: clamp,
  };
  delete mounted.barCageClampLeft;
  assert.equal(calculateRigMetrics(bike, size, mounted, 0).totalBagsDryWeightGrams, 0);
  delete mounted.barCageClampRight;
  const restored = calculateRigMetrics(bike, size, mounted, 0);
  assert.equal(restored.totalBagsDryWeightGrams, host.dryWeightGrams);
  assert.deepEqual(restored.unknownWeightItemIds, []);
  assert.deepEqual(getMassUncertainHostIds({ barCageReplacement: spare }), new Set());
  assert.deepEqual(getMassUncertainHostIds({ handlebar: host, barCageAccessory: clamp }), new Set(),
    'only the dedicated replacement sockets invalidate host mass');
});

test('exported manifests mark modified host weight unknown and explain the exclusion',()=>{
 const mountedBags={handlebar:item('825745-v3'),barCageClampLeft:item('855553-v1')};
 const data={bike,sizeKey:'M',mountedBags,metrics:calculateRigMetrics(bike,size,mountedBags,0)};
 for(const manifest of [generateCsvManifest(data),generateMarkdownManifest(data)]) {
  assert.match(manifest,/Modified Bar Cage host mass is excluded/);
  const hostRow=manifest.split('\n').find(line=>line.includes(mountedBags.handlebar.name)&&!line.includes('Specification'))!;
  assert.match(hostRow,/Unknown/);
  assert.doesNotMatch(hostRow,/532/);
 }
});
