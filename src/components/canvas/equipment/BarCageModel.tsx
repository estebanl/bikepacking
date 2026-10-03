"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/lib/equipmentGeometry";
import type { BarSupportEndpoints } from "./EquipmentModel";
const metal=new THREE.MeshStandardMaterial({color:"#343e42",metalness:.7,roughness:.4});
const rubber=new THREE.MeshStandardMaterial({color:"#171d1f",roughness:.78});
const tube=new THREE.CylinderGeometry(1,1,1,8);
const ring=new THREE.TorusGeometry(.018,.0035,6,16);
const box=new THREE.BoxGeometry(1,1,1);
function Rod({a,b,r=.004}:{a:Point3;b:Point3;r?:number}) {
 const t=useMemo(()=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);return {center:start.add(end).multiplyScalar(.5),height:delta.length(),q:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};},[...a,...b]);
 return <mesh dispose={null} geometry={tube} material={metal} position={t.center} quaternion={t.q} scale={[r,t.height,r]} castShadow/>;
}
/** Original U-cradle and bar clamps. Shared pose follows the separately mounted bag.
 * Hardware is illustrative; no manufacturer CAD, fit certification or added component mass. */
export function BarCageModel({envelope,support,hideCradle=false,hideClamps=[]}:{envelope:Point3;support?:BarSupportEndpoints;hideCradle?:boolean;hideClamps?:number[]}) {
 const [l,h]=envelope,back=-l*.5-.008,bottom=-h*.47-.007,top=h*.5+.018;
 return <group name="original-bar-cage-cradle">
   {!hideCradle && <>
   {[-1,1].map(side=><group key={side}>
     <Rod a={[back,bottom,side*.09]} b={[back,top,side*.09]} r={.005}/>
     <Rod a={[back,bottom,side*.09]} b={[l*.51+.006,bottom,side*.09]}/>
     <Rod a={[l*.51+.006,bottom,side*.09]} b={[l*.51+.006,bottom+.022,side*.09]}/>
     <mesh dispose={null} geometry={box} material={rubber} position={[0,bottom+.002,side*.09]} scale={[l*.72,.004,.018]} castShadow/>
   </group>)}
   <Rod a={[back,top,-.105]} b={[back,top,.105]} r={.005}/>
   <Rod a={[back,-h*.44,-.09]} b={[back,-h*.44,.09]}/>
   </>}
   {support && support.clamps.map((a,i)=>hideClamps.includes(i) ? null : <group key={i}>
     <mesh dispose={null} geometry={ring} material={rubber} position={a} quaternion={support.orientation} castShadow/>
     <Rod a={a} b={support.ends[i]} r={.006}/>
     <mesh dispose={null} geometry={box} material={metal} position={support.ends[i]} scale={[.008,.021,.026]} castShadow/>
   </group>)}
 </group>;
}
