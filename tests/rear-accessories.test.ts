import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { validateMount, sanitizeMountedBags, findSocket } from '../src/lib/sockets.ts';
import { getEquipmentPlacement } from '../src/lib/equipmentGeometry.ts';
import { calculateRigMetrics } from '../src/lib/balance.ts';
import { evaluateClearances } from '../src/lib/clearance.ts';
const item=(id:string)=>{const b=TAILFIN_CATALOG.find(b=>b.id===`tailfin-${id}-v1`);assert.ok(b,id);return b;};
const bike=BIKES.find(b=>b.id==='santa-cruz-stigmata-2027')!,size=bike.sizes.M;
const hardware={rearAxleHardware:item('34167'),rearUdhHardware:item('664853')};
const journey=item('1008020'),carbon=item('895075'),fixed=item('913333'),speed=item('930095');
const mud=item('1029289'),garmin=item('1027471'),plate=item('24700'),lamp=item('789125');
test('rear accessories require the specific interface, not any rack',()=>{
 assert.equal(validateMount(mud,'journeyMudguard',size,{rearRack:journey}).allowed,true);
 assert.equal(validateMount(mud,'journeyMudguard',size,{rearRack:carbon}).allowed,false);
 assert.equal(validateMount(garmin,'rearLightMount',size,{rearRack:carbon}).allowed,false);
 assert.equal(validateMount(garmin,'rearLightMount',size,{rearRack:journey}).allowed,true);
 assert.equal(validateMount(plate,'rearLightMount',size,{rearRack:journey}).allowed,false);
 assert.equal(validateMount(plate,'rearLightMount',size,{rearRack:fixed}).allowed,true);
 assert.equal(validateMount(plate,'rearLightMount',size,{rearRack:carbon,rackTop:speed}).allowed,false);
 assert.equal(validateMount(lamp,'rearLightMount',size,{rearRack:journey}).allowed,false);
 assert.equal(validateMount(lamp,'rearLightMount',size,{rearRack:fixed}).allowed,true);
});
test('host removal and incompatible rack changes cannot leave orphan lights or mudguards',()=>{
 const fitted={...hardware,rearRack:journey,journeyMudguard:mud,rearLightMount:garmin};
 assert.equal(sanitizeMountedBags(fitted,size).removed.length,0);
 const switched=sanitizeMountedBags({...fitted,rearRack:carbon},size);
 assert.equal(switched.mountedBags.journeyMudguard,undefined);
 assert.equal(switched.mountedBags.rearLightMount,undefined);
 const cargo={...hardware,rearRack:carbon,rackTop:item('670'),rearLightMount:lamp};
 assert.equal(sanitizeMountedBags(cargo,size).removed.length,0);
 delete (cargo as Partial<typeof cargo>).rackTop;
 assert.equal(sanitizeMountedBags(cargo,size).mountedBags.rearLightMount,undefined);
});
test('hardware poses follow rendered host deck and body without fixed world coordinates',()=>{
 for(const b of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const s of Object.values(b.sizes)) {
  const mounted={rearRack:journey,journeyMudguard:mud,rearLightMount:garmin};
  const host=getEquipmentPlacement(journey,findSocket(s,'rearRack',mounted)!);
  const m=findSocket(s,'journeyMudguard',mounted)!,l=findSocket(s,'rearLightMount',mounted)!;
  assert.ok(Math.abs(m.position[1]-(host.position[1]+host.dimensions.height*.44-.006))<1e-9);
  assert.ok(Math.abs(l.position[0]-(host.position[0]-host.dimensions.length*.43-.006))<1e-9);
  assert.equal(l.rotation[1],Math.PI);
 }
});
test('hardware mass remains unknown, nonstorage capacity is inapplicable, full-suspension warning explicit',()=>{
 const mounted={...hardware,rearRack:journey,journeyMudguard:mud,rearLightMount:garmin};
 const metrics=calculateRigMetrics(bike,size,mounted,0);
 assert.ok(metrics.unknownWeightItemIds?.includes(mud.id));
 assert.equal(metrics.unknownCapacityItemIds?.includes(mud.id),false);
 for(const b of [mud,garmin,plate,lamp]) {assert.equal(b.dryWeightGrams,null);assert.notEqual(b.dimensionsStatus,'verified');assert.notEqual(b.fitStatus,'verified');}
 const blur=BIKES.find(b=>b.id==='santa-cruz-blur-2027')!;
 assert.ok(evaluateClearances({bike:blur,sizeConfig:blur.sizes.M,mountedBags:mounted,dropperPostCompressed:false,waterBottlesMounted:false}).some(w=>w.id==='full_suspension_rack_rearRack'));
});
