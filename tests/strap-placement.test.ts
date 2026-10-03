import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { findSocket, validateMount, sanitizeMountedBags } from '../src/lib/sockets.ts';
import { equipmentDimensions, getEquipmentPlacement } from '../src/lib/equipmentGeometry.ts';
import { getCargoStrapEnvelope, getBarCageEnvelope } from '../src/lib/cargoStraps.ts';
const item=(id:string)=>{const p=TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`);assert.ok(p);return p;};
test('separate straps follow the elliptical pack and upper/lower band positions on every size',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) for(const side of ['Left','Right']) {
  const bag=item('56316-v3');const mounted={[`cage${side}`]:item('32010-v2'),[`fork${side}_0`]:bag,[`cargoStrapUpper${side}`]:item('126220-v2'),[`cargoStrapLower${side}`]:item('126220-v3')};
  const pose=getEquipmentPlacement(bag,findSocket(size,`fork${side}_0`,mounted)!);
  const up=findSocket(size,`cargoStrapUpper${side}`,mounted)!,lo=findSocket(size,`cargoStrapLower${side}`,mounted)!;
  assert.ok(Math.abs(up.position[1]-lo.position[1]-equipmentDimensions(mounted[`cage${side}`])[1]*.64)<1e-9);
  assert.equal(up.position[2],pose.position[2]);assert.deepEqual(up.rotation,pose.rotation);
  const [l,,d]=equipmentDimensions(bag),envelope=getCargoStrapEnvelope(mounted,up.id);
  assert.ok(envelope[0]>l*.98&&envelope[2]>d*.90);
  assert.deepEqual(getCargoStrapEnvelope(mounted,lo.id),envelope,'strap length changes tail/mass, not the host shell');
 }
});
test('Bar Cage accessories require the modeled standalone cage interface and cannot survive its removal',()=>{
 const bike=BIKES.find(b=>b.brand==='Santa Cruz')!,size=Object.values(bike.sizes)[0];
 for(const id of ['1012933-v1','1012929-v1']) {
  const part=item(id),cage=item('825745-v1');
  assert.equal(validateMount(part,'barCageAccessory',size,{}).allowed,false);
  assert.equal(validateMount(part,'barCageAccessory',size,{barMount:cage}).allowed,true);
  assert.equal(validateMount(part,'barCageAccessory',size,{handlebar:item('825745-v2')}).allowed,false);
  assert.equal(sanitizeMountedBags({barCageAccessory:part},size).mountedBags.barCageAccessory,undefined);
  const host=getEquipmentPlacement(cage,findSocket(size,'barMount',{barMount:cage})!);
  const anchor=findSocket(size,'barCageAccessory',{barMount:cage,barCageAccessory:part})!;
  assert.equal(anchor.position[1],host.position[1]+getBarCageEnvelope({barMount:cage})[1]*.5+.018);
 }
});
