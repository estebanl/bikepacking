import test from 'node:test';
import assert from 'node:assert/strict';
import {BIKES} from '../src/data/bikes.ts';
import {BAGS} from '../src/data/bags.ts';
import {getBikeGeometry} from '../src/lib/bikeGeometry.ts';
import {equipmentDimensions,getEquipmentPlacement,rotateEquipmentPoint} from '../src/lib/equipmentGeometry.ts';

test('Santa Cruz saddle-pack nose stays close to the post below the saddle in both dropper states',()=>{
 for(const bike of BIKES.filter(b=>b.brand==='Santa Cruz')) for(const size of Object.values(bike.sizes)) {
  for(const bag of BAGS.filter(b=>b.category==='seat_pack' && !b.visualKind)) for(const compressed of [false,true]) {
   const geometry=getBikeGeometry(bike,size,compressed),placement=getEquipmentPlacement(bag,size.sockets.seatpost,compressed);
   const[l,h]=equipmentDimensions(bag),nose=rotateEquipmentPoint([l*.49,h*.12,0],placement.rotation).map((v,i)=>v+placement.position[i]);
   assert.ok(nose[0]<geometry.saddleBase[0] && geometry.saddleBase[0]-nose[0]<.04,`${bag.id}: nose must meet rear of post, not hang150mm behind it`);
   assert.ok(nose[1]<geometry.saddleBase[1]-.015 && nose[1]>geometry.saddleBase[1]-.12,`${bag.id}: nose must sit below rails`);
  }
  const bag=BAGS.find(b=>b.id==='ortlieb-seat-pack-16-5l')!;
  const raised=getEquipmentPlacement(bag,size.sockets.seatpost),lowered=getEquipmentPlacement(bag,size.sockets.seatpost,true);
  const travel=Math.hypot(...lowered.position.map((v,i)=>v-raised.position[i]));
  assert.ok(Math.abs(travel-(bike.seatpostType==='rigid'?0:.12))<1e-9,'preview follows120mm seatpost axis travel; rigid stays fixed');
 }
});
