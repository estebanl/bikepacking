import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { requiredProductCapabilities, forkPackConflictReasons } from '../src/lib/forkPackAssembly.ts';
import { calculateRigMetrics, getMassUncertainHostSockets } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags, findSocket } from '../src/lib/sockets.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery, generateCsvManifest } from '../src/lib/export.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `tailfin-${id}`);
  assert.ok(found, id); return found;
};
const bike = BIKES.find(b => b.id === 'santa-cruz-blur-2027')!, size = bike.sizes.M;
const hook = item('676061-v1'), mount = item('661731-v1');
const kit = item('661740-v1'), conversion = item('675876-v1');
const forkMount = TAILFIN_CATALOG.find(p => p.provides?.includes('fork-mount'))!;

test('Mini Pannier requirements change only at the fork, retaining rear pannier requirements', () => {
  for (const id of ['972100-v1', '972100-v2']) {
    const bag = item(id);
    for (const side of ['Left', 'Right']) {
      assert.deepEqual(requiredProductCapabilities(bag, `fork${side}_0`), ['fork-mount', 'mini-pannier-conversion']);
      assert.deepEqual(requiredProductCapabilities(bag, `pannier${side}`), bag.requires);
    }
  }
  assert.deepEqual(requiredProductCapabilities(item('655674-v1'), 'forkLeft_0'), ['fork-mount']);
});

test('whole kits conflict with a separate same-side hook in either insertion order', () => {
  for (const side of ['Left', 'Right']) {
    const other = side === 'Left' ? 'Right' : 'Left';
    for (const whole of [kit, conversion]) {
      assert.equal(forkPackConflictReasons(whole, `forkPackHardware${side}`, { [`forkPackHook${side}`]: hook }).length, 1);
      assert.equal(forkPackConflictReasons(hook, `forkPackHook${side}`, { [`forkPackHardware${side}`]: whole }).length, 1);
      assert.deepEqual(forkPackConflictReasons(whole, `forkPackHardware${side}`, { [`forkPackHook${other}`]: hook }), []);
      assert.deepEqual(forkPackConflictReasons(hook, `forkPackHook${side}`, { [`forkPackHardware${other}`]: whole }), []);
    }
    assert.deepEqual(forkPackConflictReasons(mount, `forkPackHardware${side}`, { [`forkPackHook${side}`]: hook }), []);
    assert.deepEqual(forkPackConflictReasons(hook, `forkPackHook${side}`, { [`forkPackHardware${side}`]: mount }), []);
  }
});

test('fork conversion is same-side only; large panniers remain unavailable on forks', () => {
  for (const side of ['Left', 'Right']) {
    const other = side === 'Left' ? 'Right' : 'Left';
    const hardware = { [`forkMount${side}`]: forkMount, [`forkMount${other}`]: forkMount };
    const bag = item('972100-v1'), socket = `fork${side}_0`;
    assert.equal(validateMount(bag, socket, size, hardware).allowed, false);
    assert.equal(validateMount(bag, socket, size, { ...hardware, [`forkPackHardware${other}`]: conversion }).allowed, false);
    assert.equal(validateMount(bag, socket, size, { ...hardware, [`forkPackHardware${side}`]: conversion }).allowed, true);
    assert.equal(validateMount(item('968191-v1'), socket, size, { ...hardware, [`forkPackHardware${side}`]: conversion }).allowed, false);
    assert.equal(validateMount(kit, `forkPackHardware${side}`, size, { ...hardware, [`fork${other}_0`]: item('655674-v1') }).allowed, false);
  }
});

test('replacement mass excludes only the modified physical copy, preserving its duplicate on the other fork', () => {
  for (const hostId of ['655674-v1', '655674-v2', '972100-v1', '972100-v2']) for (const side of ['Left', 'Right']) {
    const other = side === 'Left' ? 'Right' : 'Left', host = item(hostId);
    for (const replacement of [kit, mount, conversion, hook]) {
      const replacementSocket = `forkPack${replacement === hook ? 'Hook' : 'Hardware'}${side}`;
      const mounted: Record<string, BagItem> = { [`fork${side}_0`]: host, [`fork${other}_0`]: host, [replacementSocket]: replacement };
      const metrics = calculateRigMetrics(bike, size, mounted, 1000);
      assert.equal(metrics.totalBagsDryWeightGrams, host.dryWeightGrams);
      assert.equal(metrics.totalCapacityLiters, host.volumeLiters! * 2);
      assert.equal(metrics.totalRigWeightGrams, bike.baseWeightGrams + host.dryWeightGrams! + 1000);
      assert.deepEqual(metrics.unknownWeightItemIds, [host.id, replacement.id]);
      assert.deepEqual(getMassUncertainHostSockets(mounted), new Set([`fork${side}_0`]));
      assert.deepEqual(metrics, calculateRigMetrics(bike, size, { ...mounted, [`fork${side}_0`]: { ...host, dryWeightGrams: null } }, 1000));
      delete mounted[replacementSocket];
      assert.equal(calculateRigMetrics(bike, size, mounted, 1000).totalBagsDryWeightGrams, host.dryWeightGrams! * 2);
    }
  }
  assert.equal(getMassUncertainHostSockets({ forkPackHardwareLeft: conversion }).size, 0);
});

test('conversion survives URL roundtrip and removing its bike-side mount cascades the fork Mini Pannier', () => {
  const mounted = { forkMountLeft: forkMount, forkPackHardwareLeft: conversion, forkLeft_0: item('972100-v1') };
  assert.equal(sanitizeMountedBags(mounted, size).removed.length, 0);
  const query = serializeRigToUrlQuery({ bikeId: bike.id, sizeKey: 'M', mountedBags: mounted, payloadGrams: 1000, dropper: false, bottles: false });
  const restored = deserializeRigFromUrlQuery(query, TAILFIN_CATALOG);
  assert.deepEqual(Object.keys(sanitizeMountedBags(restored.mountedBags, size).mountedBags).sort(), Object.keys(mounted).sort());
  const detached = sanitizeMountedBags({ forkPackHardwareLeft: conversion, forkLeft_0: mounted.forkLeft_0 }, size);
  assert.equal(Object.keys(detached.mountedBags).length, 0);
});

test('individual mount and hook combine without double exclusion; an empty conversion kit invents no host', () => {
  for (const side of ['Left', 'Right']) {
    const host = item('655674-v1');
    const mounted: Record<string, BagItem> = {
      [`forkMount${side}`]: forkMount, [`fork${side}_0`]: host,
      [`forkPackHardware${side}`]: mount, [`forkPackHook${side}`]: hook,
    };
    assert.equal(sanitizeMountedBags(mounted, size).removed.length, 0);
    const metrics = calculateRigMetrics(bike, size, mounted, 500);
    assert.equal(metrics.totalBagsDryWeightGrams, forkMount.dryWeightGrams ?? 0);
    assert.equal(metrics.unknownWeightItemIds?.filter(id => id === host.id).length, 1);
    assert.ok(metrics.unknownWeightItemIds?.includes(mount.id));
    assert.ok(metrics.unknownWeightItemIds?.includes(hook.id));
  }
  const empty = { forkMountLeft: forkMount, forkPackHardwareLeft: conversion };
  assert.equal(sanitizeMountedBags(empty, size).removed.length, 0);
  assert.equal(getMassUncertainHostSockets(empty).size, 0);
  assert.ok(calculateRigMetrics(bike, size, empty, 0).unknownWeightItemIds?.includes(conversion.id));
});

test('conversion and replacement preview hardware anchors mirror outside the fork on both sides',()=>{
 for(const side of ['Left','Right']) {
  const mounted={ [`forkMount${side}`]:item('42733-v1'), [`forkPackHardware${side}`]:item('675876-v1'), [`fork${side}_0`]:item('972100-v1') };
  const bagAnchor=findSocket(size,`fork${side}_0`,mounted)!;
  const kitAnchor=findSocket(size,`forkPackHardware${side}`,mounted)!;
  assert.deepEqual(kitAnchor.position,bagAnchor.position);
  assert.deepEqual(kitAnchor.rotation,bagAnchor.rotation);
  assert.ok(Math.abs(kitAnchor.position[2])>.10);
 }
});

test('export excludes only the modified physical copy when both forks share a product ID',()=>{
 const bag=item('655674-v1');
 const mountedBags={forkMountLeft:forkMount,forkMountRight:forkMount,forkLeft_0:bag,forkRight_0:bag,forkPackHardwareLeft:mount};
 const csv=generateCsvManifest({bike,sizeKey:'M',mountedBags,metrics:calculateRigMetrics(bike,size,mountedBags,0)});
 const left=csv.split('\n').find(row=>row.startsWith('"Bag (forkLeft_0)"'))!;
 const right=csv.split('\n').find(row=>row.startsWith('"Bag (forkRight_0)"'))!;
 assert.match(left,/Unknown/);
 assert.ok(right.includes(`"${bag.dryWeightGrams}"`));
});
