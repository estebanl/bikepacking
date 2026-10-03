"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/lib/equipmentGeometry";

const metal = new THREE.MeshStandardMaterial({ color: "#4b585d", metalness: 0.75, roughness: 0.35 });
const polymer = new THREE.MeshStandardMaterial({ color: "#172023", roughness: 0.62 });
const rubber = new THREE.MeshStandardMaterial({ color: "#101516", roughness: 0.9 });
const silver = new THREE.MeshStandardMaterial({ color: "#9ca9ae", metalness: 0.86, roughness: 0.28 });
const box = new THREE.BoxGeometry(1, 1, 1);
const tube = new THREE.CylinderGeometry(1, 1, 1, 12);
const screw = new THREE.CylinderGeometry(0.0035, 0.0035, 0.0025, 6);

function Block({position,size,material=metal}:{position:Point3;size:Point3;material?:THREE.Material}) {
 return <mesh dispose={null} geometry={box} material={material} position={position} scale={size} castShadow receiveShadow/>;
}
function Rod({a,b,r=.004}:{a:Point3;b:Point3;r?:number}) {
 const pose=useMemo(()=>{
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  return {center:start.add(end).multiplyScalar(.5),height:delta.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};
 },[...a,...b]);
 return <mesh dispose={null} geometry={tube} material={metal} position={pose.center} quaternion={pose.rotation} scale={[r,pose.height,r]} castShadow/>;
}

/** Original estimated rear pannier carrier and bag-side clamps, not vendor CAD.
 * Local -Z faces the rack. The parent aligns [0,h*.30,-d*.5-.014] with
 * the arch's pannier receiver and rotates the whole right-hand assembly by PI.
 * This shared datum prevents separately mounted conversion kits from floating.
 * Upper and lower replacement parts can independently suppress included pieces.
 * Callers suppress any old built-in bag hooks; this model adds no mass itself.
 */
export function RearPannierHardwareModel({dimensions:[l,h,d],showUpper=true,showLower=true}:{dimensions:Point3;showUpper?:boolean;showLower?:boolean}) {
 const top=h*.30,back=-d*.46,railZ=-d*.5-.014,span=Math.min(l*.29,.085);
 const bridgeDepth=back-railZ;
 return <group name="original-rear-pannier-attachment-hardware">
  {showUpper && <group name="rear-pannier-upper-mount">
  {/* Carrier rail seats on the arch receiver at its centre. */}
  <Rod a={[-span-.012,top,railZ]} b={[span+.012,top,railZ]} r={.005}/>
  <Block position={[0,top,railZ]} size={[.029,.023,.018]} material={polymer}/>
  {[-1,1].map(side=><group key={side}>
   {/* Each bag clamp wraps over the carrier rail, with an inboard return. */}
   <Block position={[side*span,top-.009,back]} size={[.023,.047,.010]} material={polymer}/>
   <Block position={[side*span,top+.008,(back+railZ)/2]} size={[.023,.009,bridgeDepth+.016]} material={polymer}/>
   <Block position={[side*span,top-.001,railZ-.007]} size={[.023,.024,.007]} material={polymer}/>
   <mesh dispose={null} geometry={screw} material={silver} rotation={[Math.PI/2,0,0]}
    position={[side*span,top-.019,back-.006]} castShadow/>
   <Block position={[side*span,top-.015,back+.005]} size={[.032,.051,.006]} material={rubber}/>
  </group>)}
  {/* Backing rail and lower support make a continuous load path to the bag. */}
  <Block position={[0,top-.015,back+.002]} size={[span*2+.04,.026,.009]} material={polymer}/>
  </group>}
  {showLower && <group name="rear-pannier-lower-support">
  <Rod a={[0,top,railZ]} b={[0,-h*.25,back-.007]} r={.0045}/>
  <Block position={[0,-h*.25,back]} size={[Math.min(l*.30,.07),.028,.020]} material={rubber}/>
  <Block position={[0,-h*.267,back+.007]} size={[.034,.009,.025]} material={polymer}/>
  </group>}
 </group>;
}
