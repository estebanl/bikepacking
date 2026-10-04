import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import type { BagItem } from '../src/types/index.ts';
import { getBottleMountPose } from '../src/lib/bottleMounts.ts';
import { getCatalogBottleSockets, resolveCatalogBottleAnchor, isCatalogBottle, shouldShowReferenceBottle } from '../src/lib/catalogBottles.ts';
const item=(id:string):BagItem=>({id,name:id,brand:'Tailfin',category:'accessory',volumeLiters:null,dryWeightGrams:null,dimensionsMm:{length:null,height:null,depth:null},compatibleSockets:['bottleDown','bottleSeat'],productUrl:'https://www.tailfin.cc/',priceUsd:null});
const dropper=item('tailfin-675800-v1');
test('all three catalog bottles replace only the down-tube reference bottle, never unrelated accessories',()=>{
  for(const id of ['643500','643499','643496']){
    const bottle=item(`tailfin-${id}-v1`);
    assert.equal(isCatalogBottle(bottle),true);
    assert.equal(shouldShowReferenceBottle({bottleDown:bottle}),false);
    assert.equal(shouldShowReferenceBottle({bottleSeat:bottle}),true);
  }
  assert.equal(shouldShowReferenceBottle({}),true);
  assert.equal(isCatalogBottle(dropper),false);
});
test('every bike size moves catalog bottles 45mm toward BB and 5mm outward on either tube, without drift',()=>{
  for(const bike of BIKES)for(const source of Object.values(bike.sizes)){
    const sockets=getCatalogBottleSockets(bike,source);
    const size={...source,sockets:{...source.sockets,additional:sockets}};
    for(const anchor of sockets){
      const mount=anchor.id==='bottleDown'?'bottleMountDown':'bottleMountSeat';
      const pose=getBottleMountPose(bike,size,mount);
      const mounted={[mount]:dropper};
      const moved=resolveCatalogBottleAnchor(anchor,size,mounted);
      const delta=moved.position.map((v,i)=>v-anchor.position[i]);
      assert.ok(Math.abs(delta[0]*Math.cos(pose.angle)+delta[1]*Math.sin(pose.angle)+.045)<1e-10);
      assert.ok(Math.abs(delta.reduce((s,v,i)=>s+v*pose.normal[i],0)-.005)<1e-10);
      assert.deepEqual(resolveCatalogBottleAnchor(moved,size,mounted),moved);
      assert.deepEqual(resolveCatalogBottleAnchor(moved,size,{}),anchor);
      assert.deepEqual(resolveCatalogBottleAnchor(anchor,size,{[mount==='bottleMountDown'?'bottleMountSeat':'bottleMountDown']:dropper}),anchor);
      assert.deepEqual(resolveCatalogBottleAnchor(anchor,size,{[mount]:item('tailfin-959100-v1')}),anchor);
      assert.ok(moved.position.every(Number.isFinite));
    }
  }
});
test('unknown bottle mass stays explicit and null water capacity never attracts luggage payload',async()=>{
  const {calculateRigMetrics}=await import('../src/lib/balance.ts');
  const bike=BIKES[0], source=Object.values(bike.sizes)[0];
  const size={...source,sockets:{...source.sockets,additional:getCatalogBottleSockets(bike,source)}};
  const bottle=item('tailfin-643500-v1');
  const luggage={...item('test-frame-bag'),category:'frame_half' as const,volumeLiters:4,dryWeightGrams:300,compatibleSockets:['frameTriangle']};
  const plain=calculateRigMetrics(bike,size,{frameTriangle:luggage},2000);
  const bottled=calculateRigMetrics(bike,size,{frameTriangle:luggage,bottleDown:bottle},2000);
  assert.equal(bottled.totalCapacityLiters,4);
  assert.equal(bottled.totalRigWeightGrams,plain.totalRigWeightGrams);
  assert.equal(bottled.frontAxleWeightGrams,plain.frontAxleWeightGrams);
  assert.deepEqual(bottled.unknownWeightItemIds,[bottle.id]);
  assert.deepEqual(bottled.unknownCapacityItemIds,[]);
});
