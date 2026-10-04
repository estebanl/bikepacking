import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { findSocket, validateMount } from '../src/lib/sockets.ts';
import { getRearArchPose } from '../src/lib/rearArchReplacement.ts';
import { equipmentDimensions, rotateEquipmentPoint } from '../src/lib/equipmentGeometry.ts';
const item=(id:string)=>TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`)!;
test('both rear bag hardware datums meet the rack receivers across all Santa Cruz sizes',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) {
  for(const rack of [item('895075-v1'),item('913333-v2'),item('1008020-v1')]) {
   const mounted={rearRack:rack,pannierLeft:item('972100-v1'),pannierRight:item('655674-v2')};
   const arch=getRearArchPose(rack,findSocket(size,'rearRack',mounted)!);
   for(const side of ['Left','Right']) {
    const bag=mounted[side==='Left'?'pannierLeft':'pannierRight'];
    const anchor=findSocket(size,`pannier${side}`,mounted)!;
    const [,h,d]=equipmentDimensions(bag);
    const offset=rotateEquipmentPoint([0,h*.30,-d*.5-.014],anchor.rotation);
    const receiver=rotateEquipmentPoint([-arch.dimensions[0]*.065,arch.dimensions[1]*.36,(side==='Left'?1:-1)*arch.dimensions[2]*.44],arch.rotation);
    for(let i=0;i<3;i++) assert.ok(Math.abs(anchor.position[i]+offset[i]-arch.position[i]-receiver[i])<1e-9);
    assert.ok(Math.abs(anchor.position[2])>Math.abs(arch.position[2]+receiver[2]),'bag must sit outboard of receiver');
    for(const part of ['Upper','Lower']) assert.deepEqual(findSocket(size,`rearPannier${part}${side}`,mounted)?.position,anchor.position);
   }
  }
 }
});
test('front bags do not consume the rear third-party pannier interface',()=>{
 const bike=BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!,size=bike.sizes.M;
 const base={rearRack:item('895075-v1'),forkMountLeft:item('42733-v1'),forkLeft_0:item('655674-v1')};
 assert.equal(validateMount(item('20115-v1'),'thirdPartyPannierAdapters',size,base).allowed,true);
 assert.equal(validateMount(item('655674-v1'),'forkLeft_0',size,{...base,thirdPartyPannierAdapters:item('20115-v1')}).allowed,true);
 assert.equal(validateMount(item('20115-v1'),'thirdPartyPannierAdapters',size,{...base,pannierLeft:item('972100-v1')}).allowed,false);
});
