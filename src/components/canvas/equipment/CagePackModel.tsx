"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { BagItem } from "@/types";
import { equipmentDimensions } from "@/lib/equipmentGeometry";
const rubber=new THREE.MeshStandardMaterial({color:"#171d1e",roughness:.92});
const stitch=new THREE.LineBasicMaterial({color:"#555d5e",transparent:true,opacity:.55});
const alloy=new THREE.MeshStandardMaterial({color:"#6c777a",metalness:.65,roughness:.4});
const unitBox=new THREE.BoxGeometry(1,1,1);
function Detail({at,size,material=rubber}:{at:[number,number,number];size:[number,number,number];material?:THREE.Material}) {
 return <mesh dispose={null} geometry={unitBox} material={material} position={at} scale={size} castShadow/>;
}
/** Original soft drybag loft. Cargo straps are independent items, never part of this mesh. */
export function CagePackModel({bag,fabric}:{bag:BagItem;fabric:THREE.Material}) {
 const [l,h,d]=equipmentDimensions(bag);
 const {shell,seam}=useMemo(()=>{
   // Full cross-section through the cage-crossbar strap zone; taper only the lower7% and shoulder.
   const rows=[[-.47,.30,.27],[-.40,.49,.45],[.30,.49,.45],[.38,.46,.40],[.45,.42,.16],[.48,.40,.13]];
   const n=32,positions:number[]=[],indices:number[]=[];
   for(const [y,rx,rz] of rows)for(let j=0;j<n;j++){const t=j/n*Math.PI*2;positions.push(Math.cos(t)*l*rx,y*h,Math.sin(t)*d*rz);}
   for(let i=0;i<rows.length-1;i++)for(let j=0;j<n;j++){const a=i*n+j,b=(i+1)*n+j,an=i*n+(j+1)%n,bn=(i+1)*n+(j+1)%n;indices.push(a,b,an,an,b,bn);}
   const bottom=positions.length/3;positions.push(0,-h*.47,0);const top=positions.length/3;positions.push(0,h*.48,0);
   for(let j=0;j<n;j++){indices.push(bottom,j,(j+1)%n);indices.push(top,(rows.length-1)*n+(j+1)%n,(rows.length-1)*n+j);}
   const shell=new THREE.BufferGeometry();shell.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));shell.setIndex(indices);shell.computeVertexNormals();
   // UVs let the parent's original textile weave follow the side wall.
   const uv:number[]=[];for(let i=0;i<rows.length;i++)for(let j=0;j<n;j++)uv.push(j/n,i/(rows.length-1));uv.push(.5,0,.5,1);shell.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
   const seam=new THREE.BufferGeometry().setFromPoints(Array.from({length:n},(_,j)=>{const t=j/n*Math.PI*2;return new THREE.Vector3(Math.cos(t)*l*.356,-h*.449,Math.sin(t)*d*.324);}));
   return {shell,seam};
 },[l,h,d]);
 useEffect(()=>()=>{shell.dispose();seam.dispose();},[shell,seam]);
 return <group name="original-soft-cage-pack">
   <mesh dispose={null} geometry={shell} material={fabric} castShadow receiveShadow/>
   <lineLoop dispose={null} geometry={seam} material={stitch}/>
   {[0,1,2].map(i=><Detail key={i} at={[0,h*(.445+i*.012),0]} size={[l*(.81-i*.035),.0035,d*(.31-i*.035)]} material={i===1?rubber:fabric}/>)}
   <Detail at={[l*.31,h*.465,0]} size={[.016,.012,.012]}/>
   {/* 5 L integrated side-compression tapes/T-hooks, distinct from optional encircling cargo straps. */}
   {bag.volumeLiters===5 && [-1,1].map(s=><group key={s}>
     <Detail at={[0,h*.055,s*d*.452]} size={[.012,h*.46,.0025]}/>
     <Detail at={[0,h*.27,s*d*.46]} size={[.022,.005,.004]} material={alloy}/>
     <Detail at={[.008,h*.255,s*d*.46]} size={[.005,.020,.004]} material={alloy}/>
   </group>)}
   <Detail at={[l*.491,-h*.02,0]} size={[.001,.007,d*.22]} material={alloy}/>
 </group>;
}
