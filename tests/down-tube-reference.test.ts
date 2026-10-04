import test from 'node:test';
import assert from 'node:assert/strict';
import { CatmullRomCurve3, Vector3 } from 'three';
import { BIKES } from '../src/data/bikes.ts';
import { getBikeGeometry } from '../src/lib/bikeGeometry.ts';
import { getDownTubePackReference } from '../src/lib/downTubeReference.ts';

test('lightweight down-tube reference preserves Three.js curve position and tangent for every Santa Cruz size',()=>{
 let checked=0;
 for(const bike of BIKES.filter(b=>b.id.startsWith('santa-cruz-'))) {
  for(const [label,size] of Object.entries(bike.sizes)) {
   const g=getBikeGeometry(bike,size);
   const curve=new CatmullRomCurve3([
    new Vector3(...g.bb),new Vector3(g.bb[0]+.11,g.bb[1]+.09,0),
    new Vector3(g.headTubeBottom[0],g.headTubeBottom[1]+.025,0),
   ]);
   const actual=getDownTubePackReference(bike,size),expected=curve.getPoint(.4).toArray();
   const tangent=curve.getTangent(.4),angle=Math.atan2(tangent.y,tangent.x)-Math.PI/2;
   expected.forEach((value,i)=>assert.ok(Math.abs(actual.position[i]-value)<1e-9,`${bike.id}/${label} position ${i}`));
   assert.ok(Math.abs(actual.rotation[2]-angle)<1e-9,`${bike.id}/${label} angle`);
   assert.deepEqual(actual.rotation.slice(0,2),[0,0]);
   assert.equal(actual.radius,.037);
   checked++;
  }
 }
 assert.equal(checked,10);
});
