"use client";
import * as THREE from 'three';
import type { Point3 } from '@/lib/equipmentGeometry';
const body=new THREE.MeshStandardMaterial({color:'#202b2f',metalness:.38,roughness:.49});
const alloy=new THREE.MeshStandardMaterial({color:'#8b989c',metalness:.83,roughness:.30});
const rubber=new THREE.MeshStandardMaterial({color:'#121b1d',roughness:.91});
const bush=new THREE.MeshStandardMaterial({color:'#555e59',roughness:.65,metalness:.23});
const box=new THREE.BoxGeometry(1,1,1);
const pin=new THREE.CylinderGeometry(1,1,1,12);
const ring=new THREE.TorusGeometry(1,.23,6,20);

export interface RearArchHardwareProps {
 dimensions:Point3;
 carbon?:boolean;
 fastRelease?:boolean;
 /** [left (+Z), right (-Z)] physical copies, independently replaceable. */
 showDropouts?:[boolean,boolean];
 showBushings?:boolean;
 showBumpers?:boolean;
}
/** Shared original estimated arch hardware, at the same local arch pose as its legs.
 * Fast-release bodies, four bushings and paired bumpers are separate replacement
 * groups. PDF bumper offsets are referenced to the modeled dropout's top edge;
 * the dropout envelope, bumper envelope and leg shape remain original estimates.
 * Journey keeps the older simple foot visual without assuming this parts interface.
 */
export function RearArchHardwareModel({dimensions:[l,h,d],carbon=false,fastRelease=false,showDropouts=[true,true],showBushings=true,showBumpers=true}:RearArchHardwareProps) {
 const axleX=l*.095,axleY=-h*.455;
 const legDepth=carbon?.014:.010;
 const bumperY=axleY+.011+(carbon?.098:.012);
 // Centreline of the actual polygon's long straight section, not a free-space socket.
 const proportion=Math.max(0,Math.min(1,(bumperY+h*.46)/(h*.84)));
 const bumperX=l*(.095+(-.030-.095)*proportion);
 return <group name="original-rear-arch-hardware">
  {([1,-1] as const).map((side,index)=><group key={side} name={`arch-hardware-${side===1?'left':'right'}`}>
   {showDropouts[index] && <group name={fastRelease?'arch-fast-dropout-body':'arch-simple-foot'}>
    <mesh dispose={null} geometry={box} material={body} position={[axleX,axleY,side*d*.4]} scale={[.026,.022,.022]} castShadow/>
    <mesh dispose={null} geometry={pin} material={alloy} rotation={[Math.PI/2,0,0]}
     position={[axleX,axleY,side*d*.43]} scale={[.005,d*.08,.005]} castShadow/>
    {fastRelease && <>
     <mesh dispose={null} geometry={box} material={body} position={[axleX-.004,axleY+.008,side*(d*.4+.012)]}
      rotation={[0,0,-.28]} scale={[.010,.028,.006]} castShadow/>
     <mesh dispose={null} geometry={box} material={rubber} position={[axleX-.008,axleY+.021,side*(d*.4+.012)]}
      scale={[.016,.008,.008]} castShadow/>
    </>}
   </group>}
   {fastRelease && showBushings && <group name="arch-bushings-small-and-large">
    <mesh dispose={null} geometry={ring} material={bush} position={[axleX,axleY,side*(d*.4+.012)]} scale={.0068} castShadow/>
    <mesh dispose={null} geometry={ring} material={bush} position={[axleX-.003,axleY+.007,side*(d*.4+.013)]} scale={.0040} castShadow/>
   </group>}
   {fastRelease && showBumpers && <group name="arch-pannier-bumper">
    <mesh dispose={null} geometry={box} material={rubber}
     position={[bumperX,bumperY,side*(d*.4+legDepth/2+.004)]}
     rotation={[0,0,Math.atan2(l*.125,h*.84)]}
     scale={[.030,carbon?.026:.018,.012]} castShadow receiveShadow/>
   </group>}
  </group>)}
 </group>;
}
