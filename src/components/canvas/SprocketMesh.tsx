"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
/** Original illustrative cut-metal profile. Not a manufacturer tooth/shift-ramp model. */
export function SprocketMesh({radius,teeth=32,depth=.0018,color="#899293"}:{radius:number;teeth?:number;depth?:number;color?:string}) {
 const geometry=useMemo(()=>{
  const shape=new THREE.Shape();
  for(let i=0;i<teeth*4;i++) {const a=i/(teeth*4)*Math.PI*2,r=radius-(i%4===0||i%4===3?.0025:0);const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
  const bore=new THREE.Path();bore.absarc(0,0,.010,0,Math.PI*2,true);shape.holes.push(bore);
  if(radius>.038)for(let n=0;n<6;n++) {const start=n*Math.PI/3+.14,end=(n+1)*Math.PI/3-.14,inner=.021,outer=radius*.73;const hole=new THREE.Path();hole.moveTo(Math.cos(start)*inner,Math.sin(start)*inner);hole.absarc(0,0,inner,start,end,false);hole.lineTo(Math.cos(end)*outer,Math.sin(end)*outer);hole.absarc(0,0,outer,end,start,true);hole.closePath();shape.holes.push(hole);}
  return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:5,steps:1});
 },[radius,teeth,depth]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 return <mesh geometry={geometry}><meshStandardMaterial color={color} metalness={.72} roughness={.4}/></mesh>;
}
