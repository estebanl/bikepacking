"use client";

import { useMemo } from 'react';
import * as THREE from 'three';
import { rotateEquipmentPoint, type Point3 } from '@/lib/equipmentGeometry';
import type { RearConnectorGeometry } from '@/lib/rearConnectorGeometry';

const alloy = new THREE.MeshStandardMaterial({color:'#4c585d',metalness:.77,roughness:.34});
const carbonFinish = new THREE.MeshStandardMaterial({color:'#20282b',metalness:.12,roughness:.62});
const polymer = new THREE.MeshStandardMaterial({color:'#172023',roughness:.61});
const rubber = new THREE.MeshStandardMaterial({color:'#0e1517',roughness:.89});
const silver = new THREE.MeshStandardMaterial({color:'#9aa8ad',metalness:.88,roughness:.26});
const box = new THREE.BoxGeometry(1,1,1);
const tube = new THREE.CylinderGeometry(1,1,1,12);
const band = new THREE.CylinderGeometry(.020,.020,.016,32,1,true);
const pin = new THREE.CylinderGeometry(.0035,.0035,.039,12);
function Block({position,size,material=polymer}:{position:Point3;size:Point3;material?:THREE.Material}) {
 return <mesh dispose={null} geometry={box} material={material} position={position} scale={size} castShadow/>;
}
function Stay({a,b,carbon}:{a:Point3;b:Point3;carbon:boolean}) {
 const pose=useMemo(()=>{
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  return {center:start.add(end).multiplyScalar(.5),length:delta.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};
 },[...a,...b]);
 return <mesh dispose={null} geometry={tube} material={carbon?carbonFinish:alloy} position={pose.center}
  quaternion={pose.rotation} scale={[carbon?.007:.006,pose.length,carbon?.007:.006]} castShadow/>;
}
/** Original illustrative connector in world coordinates. Included and replacement
 * pieces share these endpoints; callers suppress whichever included part is replaced.
 * The fixed-post band never follows dropper travel. Length, finish and spare strap
 * tail depiction are estimates, not manufacturer CAD, fit or a mass assertion.
 */
export function RearConnectorModel({a,b,seatAngle,showStay=true,showConnector=true,showStrap=true,carbon=false,longStrap=false}:RearConnectorGeometry & {
 showStay?:boolean;showConnector?:boolean;showStrap?:boolean;carbon?:boolean;longStrap?:boolean;
}) {
 const rotation:Point3=[0,0,Math.PI/2-seatAngle];
 const offset=rotateEquipmentPoint([-.025,0,0],rotation);
 const end=offset.map((value,i)=>value+b[i]) as Point3;
 return <group name="original-rear-fixed-post-connector">
  {showStay && <group name="rear-connector-top-stay">
   <Stay a={a} b={end} carbon={carbon}/>
   <Block position={a} size={[.022,.018,.029]}/>
  </group>}
  <group position={b} rotation={rotation}>
   {showConnector && <group name="rear-seatpost-connector-body">
    <Block position={[-.017,0,0]} size={[.013,.025,.029]} material={rubber}/>
    <Block position={[-.025,0,0]} size={[.015,.021,.027]} material={alloy}/>
    <mesh dispose={null} geometry={pin} material={silver} position={[-.025,0,0]} rotation={[Math.PI/2,0,0]} castShadow/>
   </group>}
   {showStrap && <group name="rear-seatpost-strap">
    <mesh dispose={null} geometry={band} material={rubber} castShadow/>
    <Block position={[.019,0,.006]} size={[.010,.021,.018]}/>
    <Block position={[.023,0,longStrap?.025:.016]} size={[.003,.013,longStrap?.045:.026]} material={rubber}/>
    <Block position={[.025,0,.011]} size={[.005,.018,.014]} material={alloy}/>
   </group>}
  </group>
 </group>;
}
