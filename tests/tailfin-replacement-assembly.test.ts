import test from 'node:test';
import assert from 'node:assert/strict';
import { TAILFIN_CATALOG, TAILFIN_PREVIEW_COUNTS } from '../src/data/tailfin.ts';
import { BIKES } from '../src/data/bikes.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';

const item = (id: string) => {
 const found = TAILFIN_CATALOG.find(p => p.id === `${id}-v1`);
 assert.ok(found, id);
 return found;
};
const blur = BIKES.find(b=>b.id==='santa-cruz-blur-2027')!;
const stigmata = BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!;
const mount = item('tailfin-710832');
const flat = item('tailfin-710818');
const drop = item('tailfin-710830');

test('replacement bar roll needs matching handlebar and a separate bike-side kit',()=>{
 assert.equal(validateMount(flat,'handlebar',blur.sizes.M,{}).allowed,false);
 assert.equal(validateMount(mount,'barMount',blur.sizes.M,{}).allowed,true);
 assert.equal(validateMount(flat,'handlebar',blur.sizes.M,{barMount:mount}).allowed,true);
 assert.equal(validateMount(drop,'handlebar',blur.sizes.M,{barMount:mount}).allowed,false);
 assert.equal(validateMount(drop,'handlebar',stigmata.sizes.M,{barMount:mount}).allowed,true);
 assert.equal(validateMount(flat,'handlebar',stigmata.sizes.M,{barMount:mount}).allowed,false);
 assert.equal(sanitizeMountedBags({handlebar:flat},blur.sizes.M).mountedBags.handlebar,undefined);
});

test('complete systems reject extra replacement mount in either mounting order',()=>{
 for(const system of TAILFIN_CATALOG.filter(p=>p.sourceProductId==='tailfin-723748' || (p.sourceProductId==='tailfin-825745' && p.sourceVariantLabel!=='Cage only'))){
  const bike=system.handlebarType==='drop'?stigmata:blur;
  assert.equal(validateMount(system,'handlebar',bike.sizes.M,{barMount:mount}).allowed,false);
  assert.equal(validateMount(mount,'barMount',bike.sizes.M,{handlebar:system}).allowed,false);
 }
});

test('replacement unknown mass/capacity/dimensions never inherit sibling system specifications',()=>{
 for(const id of ['tailfin-710818','tailfin-710817','tailfin-710830','tailfin-710820','tailfin-710832']) {
  const p=item(id);
  assert.equal(p.previewStatus,'mountable');
  assert.equal(p.dryWeightGrams,null);
  assert.equal(p.volumeLiters,null);
  assert.deepEqual(p.dimensionsMm,{length:null,height:null,depth:null});
  assert.equal(p.weightStatus,'unknown');
  assert.equal(p.dimensionsStatus,'unknown');
  assert.equal(p.fitStatus,'unverified');
 }
 assert.ok(flat.visualDimensionsMm!.depth>drop.visualDimensionsMm!.depth);
 assert.ok(flat.visualDimensionsMm!.height>item('tailfin-710817').visualDimensionsMm!.height);
 assert.equal(TAILFIN_CATALOG.length,191);
 assert.ok(TAILFIN_PREVIEW_COUNTS.mountable>=68);
});

test('replacement assembly exposes unknown mass instead of silently using integrated kit weight',()=>{
 const metrics=calculateRigMetrics(blur,blur.sizes.M,{barMount:mount,handlebar:flat},0);
 assert.equal(metrics.totalBagsDryWeightGrams,0);
 assert.deepEqual(new Set(metrics.unknownWeightItemIds),new Set([mount.id,flat.id]));
 assert.ok(metrics.unknownCapacityItemIds?.includes(flat.id));
});


test('fixed SpeedPack kit remains pending until a bare-arch conversion is modeled',()=>{
 const kit=item('tailfin-894177');
 const rack=item('tailfin-1008020');
 const integrated=item('tailfin-894178');
 assert.equal(kit.visualKind,'trunk');
 assert.equal(kit.dryWeightGrams,null);
 assert.equal(kit.volumeLiters,null);
 assert.equal(kit.provides?.includes('rear-rack')??false,false);
 assert.equal(validateMount(kit,'rackTop',blur.sizes.M,{}).allowed,false);
 assert.equal(kit.previewStatus,'implementation-pending');
 assert.deepEqual(kit.compatibleSockets,[]);
 assert.match(kit.previewStatusReason!,/bare Carbon or Alloy arch/);
 assert.equal(validateMount(kit,'rackTop',blur.sizes.M,{rearRack:rack}).allowed,false);
 assert.equal(validateMount(kit,'rackTop',blur.sizes.M,{rearRack:integrated}).allowed,false);
});
