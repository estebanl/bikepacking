"use client";
import * as THREE from 'three';
import type { Point3 } from '@/lib/equipmentGeometry';
const rod=new THREE.CylinderGeometry(.005,.005,1,12);
const metal=new THREE.MeshStandardMaterial({color:'#818b91',metalness:.72,roughness:.35});
const black=new THREE.MeshStandardMaterial({color:'#20282b',roughness:.72});
/** Published 10mm rod diameter, original estimated rail length and brackets. Pair only; no panniers. */
export function ThirdPartyAdapterModel({dimensions:[l,h,d]}:{dimensions:Point3}) {
 return <group name="third-party-adapter-pair">
  {[-1,1].map(side=><group key={side} position={[-l*.065,h*.36,side*(d*.44+.02)]}>
   <mesh geometry={rod} material={metal} rotation={[0,0,Math.PI/2]} scale={[1,.18,1]} castShadow/>
   {[-1,1].map(end=><mesh key={end} geometry={rod} material={black} rotation={[0,0,Math.PI/2]} position={[end*.092,0,0]} scale={[1.25,.008,1.25]}/>)}
   <mesh material={metal} position={[0,0,-side*.01]} castShadow><boxGeometry args={[.028,.014,.028]}/></mesh>
  </group>)}
 </group>;
}
