"use client";
import {useMemo,useEffect} from 'react';
import * as THREE from 'three';
import {softTrunkBaseOffset,type Point3} from '@/lib/equipmentGeometry';
import {REMOVABLE_RACK_TOP_CONNECTOR_HEIGHT} from '@/lib/serviceHardwareGeometry';
const polymer=new THREE.MeshStandardMaterial({color:'#152125',roughness:.57});
const metal=new THREE.MeshStandardMaterial({color:'#516167',roughness:.36,metalness:.73});
const elastic=new THREE.MeshStandardMaterial({color:'#252c2c',roughness:.94});
const box=new THREE.BoxGeometry(1,1,1);
/** Original low-profile removable connector, in the rack-top bag's local pose.
 * The floor rests on this stack, whose bottom touches the modeled rack rails.
 * No fixed-connector conversion or exact latch/bolt specification is implied.
 */
export function RemovableRackTopConnectorModel({dimensions:[l,h,d],deckDimensions}:{dimensions:Point3;deckDimensions?:Point3}) {
 const bottom=-softTrunkBaseOffset(h),stack=REMOVABLE_RACK_TOP_CONNECTOR_HEIGHT;
 const railZ=deckDimensions ? deckDimensions[2]*.33 : d*.23;
 return <group name="original-removable-rack-top-connector">
  <mesh dispose={null} geometry={box} material={polymer} position={[0,bottom-.001,0]} scale={[l*.57,.002,railZ*2+.026]} castShadow/>
  {[-1,1].map(side=><group key={side}>
   <mesh dispose={null} geometry={box} material={metal} position={[0,bottom-stack/2,side*railZ]} scale={[l*.47,stack,.016]} castShadow/>
   <mesh dispose={null} geometry={box} material={polymer} position={[l*.24,bottom-.002,side*railZ]} scale={[.023,.010,.025]} castShadow/>
  </group>)}
 </group>;
}
/** Original Flip-style buckle and elastic closure in the bag's local pose.
 * Included closure and selected spare use this same pose; bag fabric is separate.
 */
export function TopTubeFlipBuckleModel({dimensions:[l,h,d]}:{dimensions:Point3}) {
 const cord=useMemo(()=>{
  const points=[[-l*.16,h*.32,-d*.13],[l*.08,h*.49,-d*.13],[l*.30,h*.46,-d*.13],[l*.465,h*.23,-d*.10],[l*.465,h*.23,d*.10],[l*.30,h*.46,d*.13],[l*.08,h*.49,d*.13],[-l*.16,h*.32,d*.13]].map(p=>new THREE.Vector3(...p));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),36,.0016,6,false);
 },[l,h,d]);
 useEffect(()=>()=>cord.dispose(),[cord]);
 return <group name="original-top-tube-flip-buckle">
  <mesh dispose={null} geometry={cord} material={elastic} castShadow/>
  <mesh dispose={null} geometry={box} material={polymer} position={[l*.468,h*.21,0]} rotation={[0,0,-.23]} scale={[.011,.023,.027]} castShadow/>
  <mesh dispose={null} geometry={box} material={metal} position={[l*.474,h*.215,0]} scale={[.003,.012,.015]} castShadow/>
  {[-1,1].map(side=><mesh key={side} dispose={null} geometry={box} material={polymer} position={[-l*.16,h*.32,side*d*.13]} scale={[.018,.007,.014]} castShadow/>)}
 </group>;
}
