import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { FRAME_ATTACHMENT_SOCKETS, FRAME_ATTACHMENT_PARTS, FRAME_ATTACHMENT_HOST_PRODUCTS, getFrameAttachmentSpec, frameAttachmentConflictReasons, getModifiedFrameHostSockets } from '../src/lib/frameAttachments.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery } from '../src/lib/export.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => {
  const found = TAILFIN_CATALOG.find(p => p.id === `${id}-v1`);
  assert.ok(found, id); return found;
};
const bike = BIKES.find(b => b.id === 'santa-cruz-stigmata-2027')!, size = bike.sizes.M;

test('eleven sourced replacement records map to seventeen exact physical attachment roles', () => {
  assert.equal(Object.keys(FRAME_ATTACHMENT_PARTS).length, 11);
  assert.equal(FRAME_ATTACHMENT_SOCKETS.length, 17);
  assert.equal(new Set(FRAME_ATTACHMENT_SOCKETS.map(s => s.id)).size, 17);
  assert.equal(FRAME_ATTACHMENT_SOCKETS.some(s => s.hostSocket === 'topTubeRear' && (s.role === 'strap' || s.role === 'keepers')), false);
  for (const [id, mapping] of Object.entries(FRAME_ATTACHMENT_PARTS)) {
    const part = item(id);
    assert.equal(part.dryWeightGrams, null);
    for (const socket of mapping.socketIds) {
      const spec = getFrameAttachmentSpec(socket)!;
      for (const family of FRAME_ATTACHMENT_HOST_PRODUCTS[spec.hostSocket]) {
        const host = item(family), mounted = { [spec.hostSocket]: host };
        assert.deepEqual(frameAttachmentConflictReasons(part, socket, mounted), []);
        assert.equal(validateMount(part, socket, size, mounted).allowed, true);
        assert.equal(frameAttachmentConflictReasons(part, socket, {}).length, 1);
      }
    }
  }
});

test('same-family shared straps never borrow another host slot or permit swapped host families', () => {
  const strap = item('tailfin-652823'), frame = item('tailfin-1006881'), front = item('tailfin-1051880');
  const slot = 'frameTriangleStrapFore';
  assert.equal(frameAttachmentConflictReasons(strap, slot, { topTubeFront: front }).length, 1);
  assert.equal(frameAttachmentConflictReasons(strap, slot, { frameTriangle: front }).length, 1);
  assert.equal(frameAttachmentConflictReasons(item('tailfin-661863'), 'topTubeFrontStrapFore', { topTubeFront: front }).length, 1);
  assert.equal(frameAttachmentConflictReasons(item('tailfin-652830'), slot, { frameTriangle: frame }).length, 1);
  assert.equal(getModifiedFrameHostSockets({ frameTriangle: front, [slot]: strap }).size, 0);
  assert.deepEqual(frameAttachmentConflictReasons(front, 'topTubeFront', { [slot]: strap }), [], 'stale children cannot reject a newly selected host');
});

test('replacement copies exclude their physical host once, retaining capacity and payload moments', () => {
  // Source replacement mass and removed subcomponent mass are both unknown.
  // Multiple straps/mounts on one bag must not subtract its published mass repeatedly.
  for (const [id, mapping] of Object.entries(FRAME_ATTACHMENT_PARTS)) for (const socket of mapping.socketIds) {
    const spec = getFrameAttachmentSpec(socket)!, host = item(FRAME_ATTACHMENT_HOST_PRODUCTS[spec.hostSocket][0]), part = item(id);
    if (spec.role === 'seatpostStrap') continue;
    const baseline = calculateRigMetrics(bike, size, { [spec.hostSocket]: host }, 800);
    const mounted: Record<string, BagItem> = { [spec.hostSocket]: host, [socket]: part };
    const metrics = calculateRigMetrics(bike, size, mounted, 800);
    assert.equal(metrics.totalBagsDryWeightGrams, 0);
    assert.equal(metrics.totalCapacityLiters, baseline.totalCapacityLiters);
    assert.equal(metrics.payloadEstimateGrams, 800);
    assert.deepEqual(metrics.unknownWeightItemIds, [host.id, part.id]);
    assert.deepEqual(metrics, calculateRigMetrics(bike, size, { ...mounted, [spec.hostSocket]: { ...host, dryWeightGrams: null } }, 800));
    delete mounted[socket];
    assert.equal(calculateRigMetrics(bike, size, mounted, 800).totalBagsDryWeightGrams, host.dryWeightGrams);
  }
  const host = item('tailfin-1006881'), strap = item('tailfin-661863');
  const two = { frameTriangle: host, frameTriangleStrapFore: strap, frameTriangleStrapAft: strap };
  assert.equal(calculateRigMetrics(bike, size, two, 0).totalBagsDryWeightGrams, 0);
  assert.deepEqual(calculateRigMetrics(bike, size, two, 0).unknownWeightItemIds, [host.id, strap.id, strap.id]);
  assert.deepEqual(getModifiedFrameHostSockets(two), new Set(['frameTriangle']));
});

test('optional third rear seatpost strap preserves the two-strap host mass and remains unknown itself', () => {
  const strap = item('tailfin-750325');
  for (const variant of [1, 2]) {
    const host = TAILFIN_CATALOG.find(p => p.id === `tailfin-798331-v${variant}`)!;
    const mounted = { topTubeRear: host, topTubeRearSeatpostStrap: strap };
    const baseline = calculateRigMetrics(bike, size, { topTubeRear: host }, 300);
    const metrics = calculateRigMetrics(bike, size, mounted, 300);
    assert.equal(host.dryWeightGrams, variant === 1 ? 109 : 112);
    assert.equal(strap.dryWeightGrams, null, 'published total with third strap does not verify this exact replacement SKU mass');
    assert.equal(getModifiedFrameHostSockets(mounted).size, 0);
    assert.equal(metrics.totalBagsDryWeightGrams, host.dryWeightGrams);
    assert.equal(metrics.totalCapacityLiters, baseline.totalCapacityLiters);
    assert.equal(metrics.frontAxleWeightGrams, baseline.frontAxleWeightGrams);
    assert.deepEqual(metrics.unknownWeightItemIds, [strap.id]);
    const alsoReplaced = { ...mounted, topTubeRearVMountFore: item('tailfin-750317') };
    assert.deepEqual(getModifiedFrameHostSockets(alsoReplaced), new Set(['topTubeRear']));
    assert.equal(calculateRigMetrics(bike, size, alsoReplaced, 300).totalBagsDryWeightGrams, 0);
  }
});

test('host swap removes only stale attachment children; URL roundtrip preserves a supported assembly', () => {
  const host = item('tailfin-1006881'), strap = item('tailfin-661863');
  const mounted = { frameTriangle: host, frameTriangleStrapFore: strap, frameTriangleStrapAft: strap };
  assert.equal(sanitizeMountedBags(mounted, size).removed.length, 0);
  const query = serializeRigToUrlQuery({ bikeId: bike.id, sizeKey: 'M', mountedBags: mounted, payloadGrams: 800, dropper: false, bottles: false });
  const restored = deserializeRigFromUrlQuery(query, TAILFIN_CATALOG);
  assert.deepEqual(Object.keys(sanitizeMountedBags(restored.mountedBags, size).mountedBags).sort(), Object.keys(mounted).sort());
  const unrelatedFrameBag: BagItem = { ...host, id: 'other-frame-bag', provides: [] };
  const swapped = sanitizeMountedBags({ ...mounted, frameTriangle: unrelatedFrameBag }, size);
  assert.equal(swapped.mountedBags.frameTriangle.id, unrelatedFrameBag.id);
  assert.equal(swapped.mountedBags.frameTriangleStrapFore, undefined);
  assert.equal(swapped.mountedBags.frameTriangleStrapAft, undefined);
  assert.equal(Object.keys(sanitizeMountedBags({ frameTriangleStrapFore: strap }, size).mountedBags).length, 0);
});
