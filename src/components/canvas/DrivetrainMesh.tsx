"use client";
import {useMemo,useEffect} from "react";
import * as THREE from "three";
import {Rod,CarbonSpar} from "./BicycleParts";
import {SprocketMesh} from "./SprocketMesh";
import type {Point3} from "@/lib/bikeGeometry";

/** Original illustrative single-ring drivetrain; positions follow frame landmarks. */
export function DrivetrainMesh({bbPosition:bb,rearAxlePosition:rear}:{bbPosition:THREE.Vector3;rearAxlePosition:THREE.Vector3}) {
 const ringRadius=.077,cogRadius=.069,chainZ=.044;
 const guide:Point3=[rear.x+.015,rear.y-.083,chainZ];
 const tension:Point3=[rear.x-.035,rear.y-.162,chainZ];
 const chain=useMemo(()=>{
  const points:THREE.Vector3[]=[];
  // Upper run, wrap around cassette, both derailleur pulleys, lower run, front wrap.
  points.push(new THREE.Vector3(bb.x,bb.y+ringRadius,chainZ));
  for(let i=0;i<=12;i++){const a=Math.PI/2+i/12*Math.PI;points.push(new THREE.Vector3(rear.x+Math.cos(a)*cogRadius,rear.y+Math.sin(a)*cogRadius,chainZ));}
  points.push(new THREE.Vector3(guide[0]-.015,guide[1],chainZ));
  for(let i=0;i<=8;i++){const a=Math.PI-i/8*Math.PI;points.push(new THREE.Vector3(tension[0]+Math.cos(a)*.017,tension[1]-Math.sin(a)*.017,chainZ));}
  for(let i=0;i<=14;i++){const a=-Math.PI/2+i/14*Math.PI;points.push(new THREE.Vector3(bb.x+Math.cos(a)*ringRadius,bb.y+Math.sin(a)*ringRadius,chainZ));}
  const curve=new THREE.CurvePath<THREE.Vector3>();for(let i=0;i<points.length-1;i++)curve.add(new THREE.LineCurve3(points[i],points[i+1]));
  return new THREE.TubeGeometry(curve,180,.0025,5,false);
 // Scalar landmarks avoid rebuilding when camera moves.
 },[bb.x,bb.y,rear.x,rear.y]);
 useEffect(()=>()=>chain.dispose(),[chain]);
 return <group name="drivetrainAssembly">
  <group position={bb}>
   <Rod a={[0,0,-.055]} b={[0,0,.055]} r={.023}/>
   <group position={[0,0,.045]}><SprocketMesh radius={ringRadius} teeth={38} color="#343d3f" depth={.003}/></group>
   {[-1,1].map(s=>{const end:Point3=[s*.142,-s*.094,s*.058];return <group key={s}>
    <CarbonSpar points={[[0,0,s*.058],[end[0]*.6,end[1]*.6,s*.058],end]} radii={[.018,.013,.009]} color="#202a2d" depth={.55}/>
    <Rod a={end} b={[end[0],end[1],s*.094]} r={.006} color="#9ba4a4"/>
    <mesh position={[end[0],end[1],s*.116]}><boxGeometry args={[.072,.012,.057]}/><meshStandardMaterial color="#263135" roughness={.5} metalness={.5}/></mesh>
   </group>})}
  </group>
  <Rod a={[rear.x,rear.y,.072]} b={[guide[0]+.016,guide[1]+.026,.072]} r={.013}/>
  <CarbonSpar points={[[rear.x+.024,rear.y-.04,.077],[guide[0]+.022,guide[1]+.004,.077],[guide[0],guide[1],.067]]} radii={[.018,.02,.012]} color="#2d393c"/>
  {[-1,1].map(s=><Rod key={s} a={[guide[0],guide[1],chainZ+s*.008]} b={[tension[0],tension[1],chainZ+s*.008]} r={.005} color="#566164"/>)}
  {[guide,tension].map((p,i)=><group key={i} position={[p[0],p[1],chainZ-.003]}><SprocketMesh radius={i?.017:.015} teeth={i?14:12} depth={.006} color="#252e30"/><Rod a={[0,0,-.006]} b={[0,0,.012]} r={.003} color="#9ba5a6"/></group>)}
  <mesh geometry={chain}><meshStandardMaterial color="#919b9b" roughness={.4} metalness={.8}/></mesh>
 </group>
}
