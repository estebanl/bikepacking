"use client";
import { useMemo } from 'react';
import * as THREE from 'three';
import type { Point3 } from '@/lib/equipmentGeometry';

const alloy=new THREE.MeshStandardMaterial({color:'#89979d',metalness:.86,roughness:.29});
const black=new THREE.MeshStandardMaterial({color:'#202b30',metalness:.62,roughness:.42});
const rubber=new THREE.MeshStandardMaterial({color:'#11191c',roughness:.85});
const shaft=new THREE.CylinderGeometry(1,1,1,20);
const hex=new THREE.CylinderGeometry(1,1,1,6);
const torus=new THREE.TorusGeometry(1,.16,6,24);
const box=new THREE.BoxGeometry(1,1,1);
function Cylinder({z,radius,length,material=alloy,hexagonal=false}:{z:number;radius:number;length:number;material?:THREE.Material;hexagonal?:boolean}) {
 return <mesh dispose={null} geometry={hexagonal?hex:shaft} material={material} position={[0,0,z]} rotation={[Math.PI/2,0,0]} scale={[radius,length,radius]} castShadow/>;
}
function Ring({z,radius,material=alloy}:{z:number;radius:number;material?:THREE.Material}) {
 return <mesh dispose={null} geometry={torus} material={material} position={[0,0,z]} scale={radius} castShadow/>;
}
function Arm({a,b}:{a:Point3;b:Point3}) {
 const pose=useMemo(()=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);return {center:start.add(end).multiplyScalar(.5),length:delta.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};},[...a,...b]);
 return <mesh dispose={null} geometry={box} material={black} position={pose.center} quaternion={pose.rotation} scale={[.016,pose.length,.007]} castShadow/>;
}
/** One original illustrative axle, along local/world Z at the rear hub.
 * DS is +Z to match the drivetrain; NDS is -Z. Rings indicate interfaces only:
 * no modeled thread pitch, selected axle length or manufacturer fit is implied.
 * Replacement pieces use this same origin and suppress their included counterpart.
 */
export function AxleHardwareModel({showShaft=true,showNds=true,showDs=true,showSpacers=true}:{showShaft?:boolean;showNds?:boolean;showDs?:boolean;showSpacers?:boolean}) {
 return <group name="original-through-axle-hardware">
  {showShaft && <group name="axle-shaft"><Cylinder z={0} radius={.006} length={.174}/></group>}
  {showNds && <group name="axle-non-drive-end">
   <Cylinder z={-.091} radius={.0115} length={.009} material={black} hexagonal/>
   <Cylinder z={-.099} radius={.0075} length={.010} material={black}/>
   <Ring z={-.106} radius={.008}/>
   <Cylinder z={-.107} radius={.003} length={.002} material={rubber} hexagonal/>
  </group>}
  {showDs && <group name="axle-drive-end">
   <Cylinder z={.088} radius={.0065} length={.019}/>
   <Cylinder z={.101} radius={.010} length={.010} material={black} hexagonal/>
   <Ring z={.107} radius={.008}/>
   <Cylinder z={.109} radius={.003} length={.002} material={rubber} hexagonal/>
  </group>}
  {showSpacers && <group name="axle-spacer-stack">
   <Ring z={-.084} radius={.0085}/>
   <Ring z={-.0795} radius={.0085} material={black}/>
  </group>}
 </group>;
}
/** Original replacement hanger and UDH adapter at the drive-side axle datum.
 * The hanger's arm reaches toward the modeled derailleur; suppress the included
 * hanger when the separately selected replacement uses this same geometry.
 */
export function UdhHardwareModel({showHanger=true,showAdapter=true}:{showHanger?:boolean;showAdapter?:boolean}) {
 return <group name="original-udh-attachment-hardware">
  {showHanger && <group name="udh-hanger">
   <Ring z={-.003} radius={.013} material={black}/>
   <Arm a={[.004,-.011,-.003]} b={[.025,-.043,-.008]}/>
   <group position={[.025,-.043,-.008]}>
    <Ring z={0} radius={.0075}/>
    <Cylinder z={0} radius={.0037} length={.012} material={black}/>
   </group>
  </group>}
  {showAdapter && <group name="udh-adapter">
   <Ring z={.008} radius={.014}/>
   <Cylinder z={.012} radius={.011} length={.009} material={black} hexagonal/>
   <mesh dispose={null} geometry={box} material={black} position={[-.014,.008,.007]} scale={[.016,.012,.009]} castShadow/>
  </group>}
 </group>;
}
