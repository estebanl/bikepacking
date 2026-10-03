"use client";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { Point3 } from '@/lib/equipmentGeometry';
import type { FrameAttachmentStation } from '@/lib/frameAttachmentGeometry';
const webbing=new THREE.MeshStandardMaterial({color:'#172023',roughness:.95,side:THREE.DoubleSide});
const rubber=new THREE.MeshStandardMaterial({color:'#252f32',roughness:.84});
const polymer=new THREE.MeshStandardMaterial({color:'#101719',roughness:.57});
const box=new THREE.BoxGeometry(1,1,1);
function Segment({a,b,width=.017,thickness=.0025,material=webbing}:{a:Point3;b:Point3;width?:number;thickness?:number;material?:THREE.Material}) {
 const pose=useMemo(()=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);return {center:start.add(end).multiplyScalar(.5),height:delta.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};},[...a,...b]);
 return <mesh dispose={null} geometry={box} material={material} position={pose.center} quaternion={pose.rotation} scale={[width,pose.height,thickness]} castShadow/>;
}
/** One original tube attachment station, positioned in world space by the shared helper.
 * Tube loop follows the modeled elliptical profile; tabs reach the bag shell.
 * Mount, strap and buckle may be independently replaced without doubling parts.
 * This is an illustrative routing, not certified fit or manufacturer CAD.
 */
export function FrameAttachmentModel({station,showMount=true,showStrap=true,showBuckle=true,showKeepers=false}:{station:FrameAttachmentStation;showMount?:boolean;showStrap?:boolean;showBuckle?:boolean;showKeepers?:boolean}) {
 const {radius,lateralRadius,direction,tabs,contact}=station;
 const loop=useMemo(()=>{
  const positions:number[]=[],indices:number[]=[];
  for(let i=0;i<=48;i++) {const angle=i/48*Math.PI*2;for(const x of [-.0085,.0085]) positions.push(x,Math.cos(angle)*(radius+.0018),Math.sin(angle)*(lateralRadius+.0018));}
  for(let i=0;i<48;i++){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
 },[radius,lateralRadius]);
 useEffect(()=>()=>loop.dispose(),[loop]);
 return <group position={station.position} rotation={station.rotation} name={`original-frame-attachment-${station.id}`}>
  {showStrap && <group name="tube-attachment-strap">
   <mesh dispose={null} geometry={loop} material={webbing} castShadow/>
   {tabs.map((tab,index)=><Segment key={index} a={[0,direction*(radius+.0018)*.35,(index===0?-1:1)*(lateralRadius+.0018)*Math.sqrt(1-.35**2)]} b={tab}/>)}
  </group>}
  {showMount && <group name="tube-attachment-v-saddle">
   {/* Two rubber arms meet the fabric underside while staying outside the tube. */}
   {[-1,1].map(side=><Segment key={side}
    a={[0,direction*(radius+.003)*.72,side*(lateralRadius+.003)*Math.sqrt(1-.72**2)]}
    b={[contact[0],direction*Math.max(Math.abs(contact[1]),radius+.007),side*Math.min(.018,lateralRadius*.8)]}
    width={.026} thickness={.006} material={rubber}/>)}
   <mesh dispose={null} geometry={box} material={rubber}
    position={[contact[0],direction*Math.max(Math.abs(contact[1]),radius+.007),0]}
    scale={[.028,.004,Math.min(.045,lateralRadius*1.7)]} castShadow/>
  </group>}
  {showKeepers && <group name="tube-attachment-strap-keepers">
   {tabs.map((tab,index)=><group key={index} position={tab}>
    <mesh dispose={null} geometry={box} material={rubber} position={[0,-.013,(index===0?-1:1)*.004]} scale={[.023,.005,.006]} castShadow/>
   </group>)}
  </group>}
  {showBuckle && <group name="tube-attachment-buckle" position={tabs[1]}>
   <mesh dispose={null} geometry={box} material={polymer} scale={[.024,.018,.006]} castShadow/>
   <mesh dispose={null} geometry={box} material={webbing} position={[0,0,.0035]} scale={[.014,.005,.002]} castShadow/>
  </group>}
 </group>;
}
