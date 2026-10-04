"use client";
import { useEffect,useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/lib/equipmentGeometry";
const webbing=new THREE.MeshStandardMaterial({color:"#1c2223",roughness:.86});
const nylon=new THREE.MeshStandardMaterial({color:"#111718",roughness:.56});
const box=new THREE.BoxGeometry(1,1,1);
/** Original installed ellipse. Envelope is visual packing geometry, never the flat strap length. */
export function CargoStrapModel({envelope,rearExtension=0}:{envelope:Point3;rearExtension?:number}) {
 const [l,width,d]=envelope;
 const band=useMemo(()=>{
   const n=40,rx=l/2,rz=d/2,t=.0025,positions:number[]=[],indices:number[]=[];
   // Four rings: inner lower/upper, outer lower/upper.
   for(const [radial,y] of [[0,-width/2],[0,width/2],[t,-width/2],[t,width/2]])for(let j=0;j<n;j++){const a=j/n*Math.PI*2;positions.push((rx+radial+(Math.cos(a)<0?rearExtension:0))*Math.cos(a),y,(rz+radial)*Math.sin(a));}
   for(let j=0;j<n;j++){
     const next=(j+1)%n;
     for(const [a,b] of [[0,1],[1,3],[3,2],[2,0]]){indices.push(a*n+j,a*n+next,b*n+j,a*n+next,b*n+next,b*n+j);}
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
 },[l,width,d,rearExtension]);
 useEffect(()=>()=>band.dispose(),[band]);
 return <group name="independent-cargo-strap">
   <mesh dispose={null} geometry={band} material={webbing} castShadow/>
   <mesh dispose={null} geometry={box} material={nylon} position={[l/2+.006,0,0]} scale={[.011,width*1.25,.027]} castShadow/>
   <mesh dispose={null} geometry={box} material={webbing} position={[l/2+.011,-width*.5,.014]} scale={[.003,width*2.0,.015]} castShadow/>
 </group>;
}
