"use client";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Rod } from "./BicycleParts";
import { SprocketMesh } from "./SprocketMesh";
export function WheelMesh({
  position,
  isRear = false,
  radius = 0.354,
  tireWidth = 0.045,
  mtb = false,
}: {
  position: [number, number, number];
  isRear?: boolean;
  radius?: number;
  tireWidth?: number;
  mtb?: boolean;
}) {
  const spokes = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2,
        b = a + (i % 4 < 2 ? 0.42 : -0.42);
      p.push(
        Math.cos(a) * 0.024,
        Math.sin(a) * 0.024,
        i % 2 ? 0.028 : -0.028,
        Math.cos(b) * 0.295,
        Math.sin(b) * 0.295,
        0,
      );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return geo;
  }, []);
  const treadRef = useRef<THREE.InstancedMesh>(null);
  const treadRows = mtb ? 72 : 112;
  const treadHeight = mtb ? .004 : .0018;
  const rubberRadius = tireWidth / 2 - treadHeight / 2;
  const majorRadius = radius - tireWidth / 2 - treadHeight / 2;
  const widthScale = tireWidth / (2 * rubberRadius);
  const sidewall = useMemo(() => {
    const vertices:number[]=[], indices:number[]=[];
    for(let ring=0;ring<=80;ring++) for(let band=0;band<=8;band++) {
      const angle=ring/80*Math.PI*2, beta=.72+band/8*1.70;
      const r=majorRadius+Math.cos(beta)*rubberRadius;
      vertices.push(Math.cos(angle)*r,Math.sin(angle)*r,Math.sin(beta)*rubberRadius*widthScale+.00025);
      if(ring<80 && band<8){const n=ring*9+band;indices.push(n,n+9,n+1,n+1,n+9,n+10);}
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();return geo;
  },[majorRadius,rubberRadius,widthScale]);
  useLayoutEffect(()=>{
    const mesh=treadRef.current;if(!mesh)return;
    const dummy=new THREE.Object3D();let instance=0;
    for(let i=0;i<treadRows;i++)for(const row of [-1,0,1]){
      const angle=(i+(row===0?0:.5))/treadRows*Math.PI*2;
      const z=row*tireWidth*.28;
      const r=majorRadius+Math.sqrt(rubberRadius**2-(z/widthScale)**2)+treadHeight*.46;
      dummy.position.set(Math.cos(angle)*r,Math.sin(angle)*r,z);
      dummy.rotation.set(0,0,angle-Math.PI/2);
      dummy.scale.set(mtb?.013:.006,treadHeight,mtb?.011:.007);
      dummy.updateMatrix();mesh.setMatrixAt(instance++,dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();
  },[treadRows,treadHeight,majorRadius,rubberRadius,widthScale,tireWidth,mtb]);
  useEffect(()=>()=>spokes.dispose(),[spokes]);
  useEffect(()=>()=>sidewall.dispose(),[sidewall]);
  return (
    <group position={position} name={isRear ? "rearWheel" : "frontWheel"}>
      <mesh castShadow scale={[1,1,widthScale]}>
        <torusGeometry args={[majorRadius,rubberRadius,16,96]} />
        <meshStandardMaterial color="#202422" roughness={.96} />
      </mesh>
      {/* Shared low-profile solid blocks: three rows, one draw call per wheel. */}
      <instancedMesh ref={treadRef} args={[undefined,undefined,treadRows*3]} castShadow>
        <boxGeometry args={[1,1,1]}/>
        <meshStandardMaterial color="#252925" roughness={.98}/>
      </instancedMesh>
      {!mtb && [-1,1].map(side=><mesh key={side} geometry={sidewall} scale={[1,1,side]}>
        <meshStandardMaterial color="#88755b" roughness={.96} side={THREE.DoubleSide}/>
      </mesh>)}
      <mesh>
        <torusGeometry args={[0.3, 0.011, 8, 80]} />
        <meshStandardMaterial color="#20282a" roughness={0.4} metalness={0.6} />
      </mesh>
      <lineSegments geometry={spokes}>
        <lineBasicMaterial color="#748082" />
      </lineSegments>
      <Rod a={[0, 0, -0.052]} b={[0, 0, 0.052]} r={0.019} />
      <Rod a={[0, 0.277, 0]} b={[0, 0.297, 0]} r={0.0025} color="#9ca4a6" />
      <group position={[0, 0, -0.045]}>
        <mesh>
          <ringGeometry args={[0.071, 0.08, 48]} />
          <meshStandardMaterial
            color="#a6aead"
            side={THREE.DoubleSide}
            metalness={0.85}
            roughness={0.36}
          />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i * Math.PI) / 3;
          return (
            <Rod
              key={i}
              a={[Math.cos(a) * 0.022, Math.sin(a) * 0.022, 0]}
              b={[Math.cos(a + 0.2) * 0.074, Math.sin(a + 0.2) * 0.074, 0]}
              r={0.003}
              color="#8b9294"
            />
          );
        })}
        <mesh position={[-0.055, 0.05, 0]} rotation={[0, 0, 0.7]}>
          <boxGeometry args={[0.044, 0.027, 0.023]} />
          <meshStandardMaterial color="#252c2e" />
        </mesh>
      </group>
      {isRear &&
        Array.from({ length: 12 }, (_, i) => (
          <group key={i} position={[0,0,.031+i*.003]}>
            <SprocketMesh radius={.095-i*.0065} teeth={Math.max(10,48-i*3)} color={i<4?"#596264":"#a5acad"}/>
          </group>
        ))}
    </group>
  );
}
