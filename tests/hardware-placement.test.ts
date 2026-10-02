import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { findSocket, validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { equipmentDimensions, getEquipmentBounds, getEquipmentPlacement } from '../src/lib/equipmentGeometry.ts';
const item=(id:string)=>{const x=TAILFIN_CATALOG.find(b=>b.id===id);assert.ok(x,id);return x;};
const size=BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!.sizes.M;
const cage=item('tailfin-32010-v1'),large=item('tailfin-32010-v2'),chip=item('tailfin-48952-v1'),fork=item('tailfin-42733-v1');
test('optional cargo foot requires the matching side Small/Large cage, never Mini cage',()=>{
 const base={forkMountLeft:fork,cageLeft:cage};
 assert.equal(validateMount(chip,'cargoFootLeft',size,base).allowed,true);
 assert.equal(validateMount(chip,'cargoFootRight',size,base).allowed,false);
 assert.equal(validateMount(chip,'cargoFootLeft',size,{forkMountLeft:fork,cageLeft:item('tailfin-46283-v1')}).allowed,false);
 assert.equal(sanitizeMountedBags({forkMountLeft:fork,cargoFootLeft:chip},size).mountedBags.cargoFootLeft,undefined);
 assert.equal(chip.dryWeightGrams,null);
});
test('mirrored fork bags stay outboard and foot follows selected cage height',()=>{
 const bag=item('tailfin-56316-v2');
 const mounted={cageLeft:cage,cageRight:cage,forkLeft_0:bag,forkRight_0:bag,cargoFootLeft:chip};
 const left=getEquipmentBounds(bag,findSocket(size,'forkLeft_0',mounted)!)!;
 const right=getEquipmentBounds(bag,findSocket(size,'forkRight_0',mounted)!)!;
 assert.ok(left.min[2]>=.1059);assert.ok(right.max[2]<=-.1059);
 assert.ok(Math.abs(left.min[2]+right.max[2])<1e-9);
 const smallFoot=findSocket(size,'cargoFootLeft',mounted)!;
 const largeFoot=findSocket(size,'cargoFootLeft',{...mounted,cageLeft:large})!;
 assert.ok(Math.abs((smallFoot.position[1]-largeFoot.position[1])-(equipmentDimensions(large)[1]-equipmentDimensions(cage)[1])*.47)<1e-9);
});
test('replacement top bag connector touches its installed rack deck',()=>{
 const rack=TAILFIN_CATALOG.find(b=>b.name.startsWith('Journey')&&b.visualKind==='rack')!;
 assert.ok(rack);const bag=item('tailfin-894177-v1');const mounted={rearRack:rack,rackTop:bag};
 const rackPose=getEquipmentPlacement(rack,findSocket(size,'rearRack',mounted)!);
 const bagPose=getEquipmentPlacement(bag,findSocket(size,'rackTop',mounted)!);
 assert.ok(Math.abs(bagPose.position[1]-equipmentDimensions(bag)[1]*.499-(rackPose.position[1]+rackPose.dimensions.height*.44+.006))<1e-9);
});
