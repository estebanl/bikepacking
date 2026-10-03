import test from 'node:test';
import assert from 'node:assert/strict';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { BIKES } from '../src/data/bikes.ts';
import { findSocket, validateMount, sanitizeMountedBags, hasMountCapability } from '../src/lib/sockets.ts';
import { getRearArchPose } from '../src/lib/rearArchReplacement.ts';
import { serializeRigToUrlQuery,deserializeRigFromUrlQuery } from '../src/lib/export.ts';
const item=(id:string)=>{const p=TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`);assert.ok(p,id);return p;};
const bike=BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!,size=bike.sizes.M;
const base={rearAxleHardware:item('34167-v1'),rearUdhHardware:item('664853-v1')};
const carbon=item('913333-v2'),alloy=item('913333-v6'),adapter=item('20115-v1');
test('six snapshot arch records share two material families with explicit host gating',()=>{
 for(const [id,isCarbon] of [['642-v1',false],['591-v1',false],['43567-v1',false],['641-v1',true],['446-v1',true],['43576-v1',true]] as const) {
  const arch=item(id);
  assert.equal(validateMount(arch,'rearArchReplacement',size,base).allowed,false);
  for(const host of [carbon,alloy,item('1008020-v1')]) {
   assert.equal(validateMount(arch,'rearArchReplacement',size,{...base,rearRack:host}).allowed,host=== (isCarbon?carbon:alloy));
  }
  assert.equal(arch.dimensionsStatus,'unknown');
 }
 assert.equal(item('642-v1').dryWeightGrams,370);assert.equal(item('591-v1').dryWeightGrams,471);assert.equal(adapter.dryWeightGrams,82.5);
});
test('replacement mount options govern pannier capability and cascade incompatible adapters',()=>{
 const starting={...base,rearRack:item('913333-v1'),rearArchReplacement:item('446-v1'),thirdPartyPannierAdapters:adapter};
 assert.equal(hasMountCapability(starting,'thirdPartyPannierAdapters','pannier-mounts'),true,'with-mount arch upgrades the illustrated interface');
 assert.equal(sanitizeMountedBags(starting,size).removed.length,0);
 for(const id of ['641-v1','43576-v1']) {
  const changed={...starting,rearArchReplacement:item(id)};
  assert.equal(hasMountCapability(changed,'thirdPartyPannierAdapters','pannier-mounts'),false);
  assert.equal(sanitizeMountedBags(changed,size).mountedBags.thirdPartyPannierAdapters,undefined);
 }
 const clean=sanitizeMountedBags({rearArchReplacement:item('446-v1'),thirdPartyPannierAdapters:adapter},size);
 assert.equal(Object.keys(clean.mountedBags).length,0);
});
test('paired third-party adapters cannot occupy the same interface as Tailfin panniers',()=>{
 const pannier=TAILFIN_CATALOG.find(p=>p.category==='pannier'&&p.compatibleSockets.includes('pannierLeft'))!;
 assert.ok(pannier);
 const mounted={...base,rearRack:carbon};
 assert.equal(validateMount(adapter,'thirdPartyPannierAdapters',size,mounted).allowed,true);
 assert.equal(validateMount(adapter,'thirdPartyPannierAdapters',size,{...mounted,pannierLeft:pannier}).allowed,false);
 assert.equal(validateMount(pannier,'pannierLeft',size,{...mounted,thirdPartyPannierAdapters:adapter}).allowed,false);
});
test('arch and adapter poses follow the same rack geometry across all Santa Cruz sizes and survive URL import',()=>{
 for(const b of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const [key,s] of Object.entries(b.sizes)) {
  for(const host of [carbon,item('895075-v1')]) {
   const mounted={...base,rearRack:host,rearArchReplacement:item('446-v1'),thirdPartyPannierAdapters:adapter};
   const pose=getRearArchPose(host,findSocket(s,'rearRack',mounted)!);
   for(const socket of ['rearArchReplacement','thirdPartyPannierAdapters']) {
    assert.deepEqual(findSocket(s,socket,mounted)?.position,pose.position);
    assert.deepEqual(findSocket(s,socket,mounted)?.rotation,pose.rotation);
   }
   const query=serializeRigToUrlQuery({bikeId:b.id,sizeKey:key,mountedBags:mounted,payloadGrams:1500,dropper:false,bottles:false});
   const restored=deserializeRigFromUrlQuery(query,TAILFIN_CATALOG);
   assert.equal(sanitizeMountedBags(restored.mountedBags,s).removed.length,0);
  }
 }
});
