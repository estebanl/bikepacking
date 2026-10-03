import test from 'node:test';
import type { BagItem } from '../src/types/index.ts';
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
test('Bar Cage accessories require a modeled cage interface and cannot survive its removal',()=>{
 const bike=BIKES.find(b=>b.brand==='Santa Cruz')!,size=Object.values(bike.sizes)[0];
 for(const id of ['1012933-v1','1012929-v1']) {
  const part=item(id),cage=item('825745-v1');
  assert.equal(validateMount(part,'barCageAccessory',size,{}).allowed,false);
  assert.equal(validateMount(part,'barCageAccessory',size,{barMount:cage}).allowed,true);
  assert.equal(validateMount(part,'barCageAccessory',size,{handlebar:item('825745-v2')}).allowed,true);
  assert.equal(sanitizeMountedBags({barCageAccessory:part},size).mountedBags.barCageAccessory,undefined);
  const host=getEquipmentPlacement(cage,findSocket(size,'barMount',{barMount:cage})!);
  const anchor=findSocket(size,'barCageAccessory',{barMount:cage,barCageAccessory:part})!;
  assert.equal(anchor.position[1],host.position[1]+getBarCageEnvelope({barMount:cage})[1]*.5+.018);
 }
});

test('all three bundles match separate bag envelopes, masses and accessory poses without duplicate cages',()=>{
 const size=Object.values(BIKES.find(b=>b.brand==='Santa Cruz')!.sizes)[0];
 const cage=item('825745-v1');
 for(let n=2;n<=4;n++) {
  const bundle=item(`825745-v${n}`),bag=item(`851925-v${n-1}`);
  assert.deepEqual(equipmentDimensions(bundle),equipmentDimensions(bag));
  assert.equal(bundle.dryWeightGrams,cage.dryWeightGrams!+bag.dryWeightGrams!);
  assert.equal(validateMount(cage,'barMount',size,{handlebar:bundle}).allowed,false);
  assert.equal(validateMount(bundle,'handlebar',size,{barMount:cage}).allowed,false);
  const separate={barMount:cage,handlebar:bag};
  for(const id of ['1012933-v1','1012929-v1']) {
   const part=item(id),mounted={handlebar:bundle,barCageAccessory:part};
   assert.equal(validateMount(part,'barCageAccessory',size,mounted).allowed,true);
   assert.deepEqual(findSocket(size,'barCageAccessory',mounted)?.position,findSocket(size,'barCageAccessory',separate)?.position);
   assert.equal(sanitizeMountedBags(mounted,size).mountedBags.barCageAccessory.id,part.id);
   assert.equal(sanitizeMountedBags({barCageAccessory:part},size).mountedBags.barCageAccessory,undefined);
  }
 }
});

test('191 catalog variants remain accounted for, including the internal storage reclassification',()=>{
 const counts: Record<string,number>={};
 for(const part of TAILFIN_CATALOG) counts[part.previewStatus!]=(counts[part.previewStatus!]??0)+1;
 assert.equal(TAILFIN_CATALOG.length,191);
 assert.deepEqual(counts,{'mountable':124,'implementation-pending':27,'unsupported-fit':13,'nonvisual-spare':18,'off-bike':9});
 const internal=item('732058-v1');
 assert.equal(internal.previewStatus,'nonvisual-spare');
 assert.equal(internal.compatibleSockets.length,0);
 assert.match(internal.previewStatusLabel!,/Internal storage/);
});

test('Bar Cage replacement parts use the existing host pose and disappear with the host',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) {
  for(const host of [{barMount:item('825745-v1')},{handlebar:item('825745-v3')}] as Record<string,BagItem>[]) {
   const socket='barMount' in host ? 'barMount' : 'handlebar';
   const pose=getEquipmentPlacement(host[socket]!,findSocket(size,socket,host)!);
   for(const [id,target] of [['855555-v1','barCageReplacement'],['855553-v1','barCageClampLeft'],['855553-v1','barCageClampRight']]) {
    const part=item(id);
    assert.equal(validateMount(part,target,size,{}).allowed,false);
    assert.equal(validateMount(part,target,size,host).allowed,true);
    assert.deepEqual(findSocket(size,target,host)?.position,pose.position);
    assert.equal(part.dryWeightGrams,null);
    assert.equal(sanitizeMountedBags({[target]:part},size).mountedBags[target],undefined);
   }
  }
 }
});
