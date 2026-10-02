"use client";

import * as THREE from "three";
import type { BagItem } from "@/types";
import { equipmentDimensions, type Point3 } from "@/lib/equipmentGeometry";

const ids = new Set([
  "tailfin-1029289-v1", "tailfin-1027471-v1", "tailfin-1027465-v1",
  "tailfin-1027459-v1", "tailfin-1027462-v1", "tailfin-24700-v1", "tailfin-789125-v1",
]);
export const isRearAccessory = (bag: BagItem) => ids.has(bag.id);

// Original procedural representations. No vendor assets, logos or fit-certified surfaces.
const polymer = new THREE.MeshStandardMaterial({color:"#262d30",roughness:.66});
const metal = new THREE.MeshStandardMaterial({color:"#414b4f",roughness:.36,metalness:.75});
const rubber = new THREE.MeshStandardMaterial({color:"#131819",roughness:.94});
const lens = new THREE.MeshStandardMaterial({color:"#b62226",roughness:.20,metalness:.08});
const reflector = new THREE.MeshStandardMaterial({color:"#e24b48",roughness:.25});
const box = new THREE.BoxGeometry(1,1,1);
const ring = new THREE.TorusGeometry(1,.14,6,20);
const cylinder = new THREE.CylinderGeometry(1,1,1,16);
const capsule = new THREE.CapsuleGeometry(.013,.035,3,12);
const plateShape = new THREE.Shape();
plateShape.moveTo(-.029,-.0125); plateShape.lineTo(.029,-.0125);
plateShape.lineTo(.032,-.0095); plateShape.lineTo(.032,.0095);
plateShape.lineTo(.029,.0125); plateShape.lineTo(-.029,.0125);
plateShape.lineTo(-.032,.0095); plateShape.lineTo(-.032,-.0095); plateShape.closePath();
// Source: two M5 screw positions 50 mm apart; separate central wiring opening 8.7 mm.
// Circular 5 mm screw-hole rendering and all other plate surfaces remain illustrative.
for(const z of [-.025,.025]) { const hole=new THREE.Path();hole.absarc(z,0,.0025,0,Math.PI*2,true);plateShape.holes.push(hole); }
const wiringHole=new THREE.Path();wiringHole.absarc(0,0,.00435,0,Math.PI*2,true);plateShape.holes.push(wiringHole);
const fixedPlate = new THREE.ExtrudeGeometry(plateShape,{depth:.004,bevelEnabled:false,steps:1,curveSegments:12});

function Block({at=[0,0,0],size,material=polymer,rotation=[0,0,0]}:{at?:Point3;size:Point3;material?:THREE.Material;rotation?:Point3}) {
 return <mesh dispose={null} geometry={box} material={material} position={at} rotation={rotation} scale={size} castShadow receiveShadow/>;
}
function ReceiverRing({at,radius,material=polymer}:{at:Point3;radius:number;material?:THREE.Material}) {
 return <mesh dispose={null} geometry={ring} material={material} position={at} rotation={[0,Math.PI/2,0]} scale={radius} castShadow/>;
}

/** rearLightMount: origin on host rear surface, +X rearward, Y up, Z lateral.
 * rearMudguard: origin at deck underside, +X bicycle-forward. */
export interface RearDeckDimensions {length:number;depth:number}
export function RearAccessoryModel({bag,rearDeck}:{bag:BagItem;rearDeck?:RearDeckDimensions}) {
 const [l,h,d]=equipmentDimensions(bag);
 if(bag.id === "tailfin-1029289-v1") return <group name="illustrative-journey-mudguard">
   <Block at={[0,-.012,0]} size={[l*.85,.0025,d]} material={polymer}/>
   <Block at={[-l*.455,-.016,0]} size={[l*.09,.0025,d*.87]} rotation={[0,0,.15]}/>
   <Block at={[l*.455,-.013,0]} size={[l*.09,.0025,d*.87]} rotation={[0,0,-.08]}/>
   {/* Attach to the modeled crossbars, never an imaginary solid deck. */}
   {rearDeck && [-.08,.4].map(t=><group key={t}>
     <Block at={[t*rearDeck.length,-.0055,0]} size={[.018,.013,Math.min(d*.4,rearDeck.depth*.5)]} material={metal}/>
     <Block at={[t*rearDeck.length,-.001,0]} size={[.035,.002,Math.min(d*.58,rearDeck.depth*.6)]} material={rubber}/>
   </group>)}
 </group>;
 if(bag.id === "tailfin-24700-v1") return <group name="illustrative-fixed-light-plate">
   <mesh dispose={null} geometry={fixedPlate} material={metal} rotation={[0,Math.PI/2,0]} castShadow/>
   <Block at={[l*.40,-h*.33,0]} size={[l*.8,.006,d*.43]} material={polymer}/>
 </group>;
 if(bag.id === "tailfin-789125-v1") return <group name="illustrative-wearable-rear-light">
   <Block at={[.003,0,0]} size={[.006,h*.7,d*.60]} material={rubber}/>
   <mesh dispose={null} geometry={capsule} material={polymer} position={[l*.50,0,0]} scale={[.75,h/.061,d/.026]} castShadow/>
   <mesh dispose={null} geometry={capsule} material={lens} position={[l*.86,0,0]} scale={[.20,h/.061*.86,d/.026*.86]}/>
   {[-.26,-.09,.09,.26].map(y=><Block key={y} at={[l*.975,h*y,0]} size={[.0015,h*.09,d*.35]} material={reflector}/>)}
 </group>;
 const front=Math.max(.012,l*.68);
 return <group name="illustrative-empty-rear-light-interface">
   <Block at={[.002,0,0]} size={[.004,h*.60,d*.55]} material={rubber}/>
   <Block at={[front*.45,0,0]} size={[front*.85,h*.48,d*.48]} material={metal}/>
   {bag.id === "tailfin-1027471-v1" && <>
     <ReceiverRing at={[front,0,0]} radius={Math.min(h,d)*.37}/>
     {[-1,1].map(side=><Block key={side} at={[front+.002,side*h*.16,0]} size={[.006,h*.13,d*.37]}/>)}
   </>}
   {bag.id === "tailfin-1027465-v1" && <>
     <Block at={[front,0,0]} size={[.003,h*.73,d*.64]}/>
     {[-1,1].map(side=><Block key={side} at={[front+.004,0,side*d*.27]} size={[.010,h*.73,.006]}/>)}
     <Block at={[front+.005,-h*.34,0]} size={[.011,.006,d*.64]}/>
   </>}
   {bag.id === "tailfin-1027459-v1" && <>
     <mesh dispose={null} geometry={cylinder} material={polymer} position={[front,0,0]} scale={[Math.min(l*.32,d*.36),h*.90,d*.36]} castShadow/>
     {[-1,1].map(side=><Block key={side} at={[front+l*.25,side*h*.24,0]} size={[.002,.003,d*.5]} material={rubber}/>)}
   </>}
   {bag.id === "tailfin-1027462-v1" && <>
     <ReceiverRing at={[front,0,0]} radius={Math.min(h,d)*.33}/>
     <ReceiverRing at={[front+.005,0,0]} radius={Math.min(h,d)*.33}/>
     <Block at={[front,-h*.26,0]} size={[.01,.009,d*.42]}/>
   </>}
 </group>;
}
