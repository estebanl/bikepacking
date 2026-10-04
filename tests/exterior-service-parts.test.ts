import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { serializeRigToUrlQuery, deserializeRigFromUrlQuery } from '../src/lib/export.ts';
import { getModifiedExteriorServiceHostSockets } from '../src/lib/exteriorServiceParts.ts';
import type { BagItem } from '../src/types/index.ts';
const item = (id: string) => {const p=TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`);assert.ok(p,id);return p;};
const bike=BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!,size=bike.sizes.M;
const base={rearAxleHardware:item('34167-v1'),rearUdhHardware:item('664853-v1'),rearRack:item('895075-v1')};
const lower=item('661861-v1'),inserts=item('141888-v1'),connector=item('917654-v1'),buckle=item('734886-v1');
test('current large lower hook rejects Mini or legacy hosts and host swaps retain the newly selected bag',()=>{
 for(const side of ['Left','Right']) {
  const other=side==='Left'?'Right':'Left',large=item('968191-v1'),mini=item('972100-v1');
  assert.equal(validateMount(lower,`rearPannierLower${side}`,size,{...base,[`pannier${other}`]:large}).allowed,false);
  assert.equal(validateMount(lower,`rearPannierLower${side}`,size,{...base,[`pannier${side}`]:large}).allowed,true);
  assert.equal(validateMount(lower,`rearPannierLower${side}`,size,{...base,[`pannier${side}`]:mini}).allowed,false);
  assert.equal(validateMount(mini,`pannier${side}`,size,{...base,[`rearPannierLower${side}`]:lower}).allowed,false);
  for(const [host,oldLower] of [[mini,lower],[large,item('652020-v1')]]) {
   const swapped=sanitizeMountedBags({...base,[`pannier${side}`]:host,[`rearPannierLower${side}`]:oldLower},size);
   assert.equal(swapped.mountedBags[`pannier${side}`].id,host.id);
   assert.equal(swapped.mountedBags[`rearPannierLower${side}`],undefined);
  }
 }
});
test('inserts require an actual same-side rear bag and converted Fork Packs need sourced upper hardware',()=>{
 for(const side of ['Left','Right']) {
  const socket=`rearPannierInserts${side}`,pack=item('655674-v1');
  assert.equal(validateMount(inserts,socket,size,base).allowed,false);
  assert.equal(validateMount(inserts,socket,size,{...base,[`fork${side}_0`]:item('972100-v1')}).allowed,false);
  assert.equal(validateMount(inserts,socket,size,{...base,[`pannier${side}`]:item('968191-v2')}).allowed,true);
  assert.equal(validateMount(inserts,socket,size,{...base,[`pannier${side}`]:pack}).allowed,false);
  const converted={...base,[`pannier${side}`]:pack,[`rearPannierUpper${side}`]:item('48947-v1'),[`rearPannierLower${side}`]:item('652020-v1')};
  assert.equal(sanitizeMountedBags({...converted,[socket]:inserts},size).removed.length,0);
 }
});
test('connector requires removable bag plus complete rack and buckle only fits Flip variants',()=>{
 assert.equal(validateMount(connector,'rackTopConnector',size,{...base,rackTop:item('930095-v1')}).allowed,true);
 for(const mounted of [{rackTop:item('930095-v1')},{...base,rackTop:item('894177-v1')},{...base,rackTop:item('670-v1')}]) assert.equal(validateMount(connector,'rackTopConnector',size,mounted).allowed,false);
 for(let n=1;n<=5;n++) {
  const host=item(`1051880-v${n}`);
  assert.equal(validateMount(buckle,'topTubeFlipBuckle',size,{topTubeFront:host}).allowed,[3,5].includes(n));
 }
 assert.equal(validateMount(buckle,'topTubeFlipBuckle',size,{topTubeRear:item('1051880-v3')}).allowed,false);
});
test('exterior replacements preserve capacity/payload, exclude only physical host once and roundtrip',()=>{
 const assemblies:Record<string,BagItem>[]=[
  {...base,pannierLeft:item('968191-v1'),pannierRight:item('968191-v1'),rearPannierLowerLeft:lower,rearPannierInsertsLeft:inserts},
  {...base,rackTop:item('930095-v1'),rackTopConnector:connector},
  {topTubeFront:item('1051880-v3'),topTubeFlipBuckle:buckle},
 ];
 for(const mounted of assemblies) {
  const hostSocket=mounted.rackTop?'rackTop':mounted.topTubeFront?'topTubeFront':'pannierLeft',host=mounted[hostSocket];
  const modified=getModifiedExteriorServiceHostSockets(mounted);
  assert.deepEqual(modified,new Set([hostSocket]));
  const metrics=calculateRigMetrics(bike,size,mounted,750);
  assert.deepEqual(metrics,calculateRigMetrics(bike,size,{...mounted,[hostSocket]:{...host,dryWeightGrams:null}},750));
  assert.equal(metrics.totalCapacityLiters,Object.values(mounted).reduce((s,p)=>s+(p.volumeLiters??0),0));
  assert.equal(sanitizeMountedBags(mounted,size).removed.length,0);
  const query=serializeRigToUrlQuery({bikeId:bike.id,sizeKey:'M',mountedBags:mounted,payloadGrams:750,dropper:false,bottles:false});
  assert.equal(sanitizeMountedBags(deserializeRigFromUrlQuery(query,TAILFIN_CATALOG).mountedBags,size).removed.length,0);
  const removed={...mounted};delete removed[hostSocket];
  const clean=sanitizeMountedBags(removed,size).mountedBags;
  assert.equal(getModifiedExteriorServiceHostSockets(clean).size,0);
 }
 for(const part of [lower,inserts,connector,buckle]) assert.equal(part.dryWeightGrams,null);
});
