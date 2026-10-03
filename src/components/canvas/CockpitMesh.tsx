"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Cable, Rod, CarbonSpar } from "./BicycleParts";
/** Original generic control silhouettes, not branded or measured component CAD. */
function DropControl({side}:{side:number}) {
  const geometries=useMemo(()=>{
    const hood=new THREE.Shape();hood.moveTo(.047,-.015);hood.quadraticCurveTo(.051,.009,.079,.022);hood.quadraticCurveTo(.088,.048,.106,.040);hood.quadraticCurveTo(.118,.032,.112,.012);hood.lineTo(.091,-.019);hood.quadraticCurveTo(.065,-.029,.047,-.015);
    const blade=new THREE.Shape();blade.moveTo(.108,.011);blade.quadraticCurveTo(.139,-.028,.12,-.077);blade.quadraticCurveTo(.116,-.091,.108,-.086);blade.quadraticCurveTo(.125,-.036,.103,-.005);blade.closePath();
    return [new THREE.ExtrudeGeometry(hood,{depth:.031,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:2,steps:1,curveSegments:8}),new THREE.ExtrudeGeometry(blade,{depth:.005,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:1,steps:1,curveSegments:8})];
  },[]);
  useEffect(()=>()=>geometries.forEach(g=>g.dispose()),[geometries]);
  return <group>
    <mesh geometry={geometries[0]} position={[0,0,side*.217-.0155]} castShadow><meshStandardMaterial color="#242a29" roughness={.88}/></mesh>
    <mesh geometry={geometries[1]} position={[0,0,side*.223-.0025]} castShadow><meshStandardMaterial color="#454e4e" roughness={.37} metalness={.65}/></mesh>
    <mesh position={[.108,.002,side*.239]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.003,.003,.004,10]}/><meshStandardMaterial color="#78807d" metalness={.75} roughness={.35}/></mesh>
  </group>;
}
export function CockpitMesh({
  headTubeTop,
  stemClamp,
  handlebarType,
}: {
  headTubeTop: THREE.Vector3;
  stemClamp: THREE.Vector3;
  handlebarType: "drop" | "flat";
}) {
  return (
    <group>
      <Rod
        a={headTubeTop.toArray()}
        b={[headTubeTop.x - 0.009, headTubeTop.y + 0.035, 0]}
        r={0.021}
      />
      <Rod
        a={[headTubeTop.x - 0.009, headTubeTop.y + 0.035, 0]}
        b={stemClamp.toArray()}
        r={0.015}
      />
      <group position={stemClamp}>
        {handlebarType === "flat" ? (
          <>
            <Cable
              points={[
                [-0.045, 0.012, -0.37],
                [-0.006, 0.006, -0.2],
                [0, 0, 0],
                [-0.006, 0.006, 0.2],
                [-0.045, 0.012, 0.37],
              ]}
              r={0.014}
            />
            {[-1, 1].map((s) => (
              <group key={s}>
                {/* Separate clamp/reservoir, pivot and broad tapered blade. */}
                <mesh position={[-.018,.003,s*.245]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.0155,.003,8,16]}/><meshStandardMaterial color="#464f50" metalness={.6} roughness={.4}/></mesh>
                <mesh position={[.01,-.004,s*.246]} scale={[.024,.012,.018]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#2b3334" metalness={.35} roughness={.5}/></mesh>
                <CarbonSpar points={[[.025,-.012,s*.25],[.052,-.025,s*.276],[.055,-.03,s*.315]]} radii={[.006,.008,.004]} depth={.5} color="#4b5555"/>
                <mesh position={[.027,-.009,s*.253]}><sphereGeometry args={[.005,8,6]}/><meshStandardMaterial color="#8b9290" metalness={.8} roughness={.3}/></mesh>
                <Rod a={[-.025,.01,s*.26]} b={[-.027,.011,s*.267]} r={.018} color="#59615e"/>
                <Rod a={[-.043,.012,s*.363]} b={[-.045,.012,s*.37]} r={.018} color="#303936"/>
                <mesh position={[-.004,-.025,s*.23]} rotation={[.1,0,s*.25]}><boxGeometry args={[.025,.009,.024]}/><meshStandardMaterial color="#252e2b" roughness={.7}/></mesh>
              </group>
            ))}
          </>
        ) : (
          <>
            <Cable
              points={[
                [0.04, 0, -0.205],
                [0, 0.003, -0.15],
                [0, 0, 0],
                [0, 0.003, 0.15],
                [0.04, 0, 0.205],
              ]}
              r={0.013}
            />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Cable
                  points={[
                    [0, 0, s * 0.18],
                    [0.065, -0.012, s * 0.215],
                    [0.105, -0.055, s * 0.23],
                    [0.075, -0.112, s * 0.245],
                    [-0.035, -0.116, s * 0.25],
                  ]}
                  r={0.015}
                />
                <DropControl side={s}/>
                {/* Small tape seams follow the straight lower grip section. */}
                {[0,1,2,3,4,5,6].map(i=><mesh key={i} position={[-.025+i*.012,-.116,s*(.249-i*.00055)]} rotation={[0,Math.PI/2,0]}><torusGeometry args={[.0152,.00055,5,12]}/><meshStandardMaterial color="#3b413d" roughness={.95}/></mesh>)}
                <mesh position={[-.035,-.116,s*.25]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.014,.014,.004,16]}/><meshStandardMaterial color="#535b57" roughness={.55} metalness={.3}/></mesh>
              </group>
            ))}
          </>
        )}
      </group>
    </group>
  );
}
