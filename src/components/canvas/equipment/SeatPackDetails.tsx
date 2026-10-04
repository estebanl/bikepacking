"use client";
import {useEffect,useMemo} from "react";
import * as THREE from "three";
import {softPanelDepthAt} from "./SoftPanelShell";
import type {Point3} from "@/lib/equipmentGeometry";
const strap=new THREE.MeshStandardMaterial({color:"#161b1a",roughness:.98,side:THREE.DoubleSide});
const buckle=new THREE.MeshStandardMaterial({color:"#252c2a",roughness:.65});
const box=new THREE.BoxGeometry(1,1,1);
const tube=new THREE.CylinderGeometry(1,1,1,12);
function limits(outline:number[][],x:number){
 const ys:number[]=[];for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];if(x>=Math.min(a[0],b[0])&&x<=Math.max(a[0],b[0])&&a[0]!==b[0])ys.push(a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]));}
 return [Math.min(...ys),Math.max(...ys)];
}
function bandPoint(outline:number[][],depth:number,x:number,t:number){
 const[bottom,top]=limits(outline,x);let y:number,z:number;
 if(t<.4){y=bottom+(top-bottom)*t/.4;z=softPanelDepthAt(outline,depth,x,y)+.0013;}
 else if(t<.5){y=top+.001;z=(.29*depth+.0013)*(1-(t-.4)/.1*2);}
 else if(t<.9){y=top-(top-bottom)*(t-.5)/.4;z=-softPanelDepthAt(outline,depth,x,y)-.0013;}
 else{y=bottom-.001;z=(.29*depth+.0013)*(-1+(t-.9)/.1*2);}
 return[x,y,z];
}
function AttachmentStrap({a,b}:{a:Point3;b:Point3}){
 const pose=useMemo(()=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);return{position:start.add(end).multiplyScalar(.5),length:delta.length(),quaternion:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};},[...a,...b]);
 return <mesh dispose={null} geometry={box} material={strap} position={pose.position} quaternion={pose.quaternion} scale={[.017,pose.length,.003]} castShadow/>;
}
export function SeatPackDetails({outline,dimensions,attachment}:{outline:number[][];dimensions:Point3;attachment?:{rail:Point3;post:Point3}}){
 const[l,h,d]=dimensions;
 const bands=useMemo(()=>[-.28,.26].map(station=>{const vertices:number[]=[],indices:number[]=[];for(let i=0;i<=80;i++)for(const edge of[-1,1])vertices.push(...bandPoint(outline,d*.9,l*station+edge*.008,i/80));for(let i=0;i<80;i++){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;}),[outline,l,d]);
 useEffect(()=>()=>bands.forEach(g=>g.dispose()),[bands]);
 return <group dispose={null} name="illustrative-tapered-seat-pack-straps">
 {bands.map((geometry,i)=><mesh key={i} geometry={geometry} material={strap} castShadow/>)}
 {[-.28,.26].map(x=>{const[bottom,top]=limits(outline,x*l),y=bottom+(top-bottom)*.67;return[-1,1].map(side=><mesh key={`${x}-${side}`} geometry={box} material={buckle} position={[l*x,y,side*(softPanelDepthAt(outline,d*.9,l*x,y)+.003)]} scale={[.024,.026,.006]} castShadow/>);})}
 {[0,1,2].map(i=><mesh key={i} geometry={tube} material={strap} position={[-l*.48+i*.004,h*.16+i*.006,0]} rotation={[Math.PI/2,0,0]} scale={[.005,d*(.68-i*.035),.005]} castShadow/>)}
 {attachment&&[-1,1].map(side=><group key={side}>
 <AttachmentStrap a={[l*.30,h*.03,side*d*.39]} b={[attachment.rail[0],attachment.rail[1],side*.027]}/>
 <AttachmentStrap a={[l*.46,-h*.08,side*d*.23]} b={[attachment.post[0],attachment.post[1],side*.018]}/>
 <mesh geometry={box} material={strap} position={[attachment.post[0]+.012,attachment.post[1],0]} scale={[.004,.02,.04]} castShadow/>
 </group>)}
 </group>;
}
