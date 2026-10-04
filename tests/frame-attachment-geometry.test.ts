import test from 'node:test';
import assert from 'node:assert/strict';
import { BIKES } from '../src/data/bikes.ts';
import { TAILFIN_CATALOG } from '../src/data/tailfin.ts';
import { findSocket } from '../src/lib/sockets.ts';
import { equipmentDimensions, rotateEquipmentPoint } from '../src/lib/equipmentGeometry.ts';
import { getFrameAttachmentStations, getRearSeatStrapStation } from '../src/lib/frameAttachmentGeometry.ts';
const item=(id:string)=>TAILFIN_CATALOG.find(p=>p.id===`tailfin-${id}`)!;
const hosts={frameTriangle:item('1006881-v1'),topTubeFront:item('1051880-v1'),topTubeRear:item('798331-v1'),downtubeUnderside:item('129268-v1')};
test('DownTube pack follows its tube and keeps its inboard face outside the tube radius',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) {
  for(const pack of [item('129268-v1'),item('129268-v2')]) {
   const mounted={downtubeUnderside:pack},anchor=findSocket(size,'downtubeUnderside',mounted)!,ref=anchor.tubeAttachment!;
   assert.deepEqual(anchor.rotation,ref.rotation);
   assert.notEqual(anchor.rotation[2],0,'pack must no longer stand vertically');
   const [l]=equipmentDimensions(pack),inner=rotateEquipmentPoint([-l*.46,0,0],anchor.rotation);
   const gap=Math.hypot(...anchor.position.map((v,i)=>v+inner[i]-ref.position[i]));
   assert.ok(Math.abs(gap-ref.radius-.010)<1e-9);
  }
 }
});
test('shared tube stations stay finite and spare anchors follow each physical host on all Santa Cruz sizes',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) {
  for(const [id,bag] of Object.entries(hosts)) {
   const anchor=findSocket(size,id,hosts)!;
   const stations=getFrameAttachmentStations(bike,size,bag,anchor);
   assert.equal(stations.length,2);
   for(const station of stations) {
    assert.ok([...station.position,...station.rotation,...station.contact,...station.tabs.flat()].every(Number.isFinite));
    assert.ok(station.radius>.014 && station.radius<.05);
    assert.equal(station.lateralRadius,station.radius*.75);
   }
   const part=findSocket(size,`${id}VMountFore`,hosts)!;
   assert.deepEqual(part.rotation,anchor.rotation);
  }
  const strap=getRearSeatStrapStation(bike,size,hosts.topTubeRear,findSocket(size,'topTubeRear',hosts)!);
  assert.equal(strap.radius,.014,'fixed post follows the rendered post profile');
 }
});
