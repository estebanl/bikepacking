"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Rod } from "./BicycleParts";
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
  const tread = useMemo(() => {
    const p: number[] = [];
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2;
      for (const z of [-1, 1]) {
        const r = radius - 0.003;
        p.push(
          Math.cos(a) * r,
          Math.sin(a) * r,
          z * tireWidth * 0.22,
          Math.cos(a + 0.014) * r,
          Math.sin(a + 0.014) * r,
          z * tireWidth * 0.42,
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    return geo;
  }, [radius, tireWidth]);
  return (
    <group position={position} name={isRear ? "rearWheel" : "frontWheel"}>
      <mesh castShadow scale={[1, 1, 0.78]}>
        <torusGeometry args={[radius - tireWidth / 2, tireWidth / 2, 12, 80]} />
        <meshStandardMaterial color="#232827" roughness={0.95} />
      </mesh>
      <lineSegments geometry={tread}>
        <lineBasicMaterial color="#434843" />
      </lineSegments>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0, s * tireWidth * 0.24]}>
          <torusGeometry
            args={[0.311 + tireWidth * 0.19, tireWidth * 0.18, 8, 80]}
          />
          <meshStandardMaterial
            color={mtb ? "#333630" : "#8e7960"}
            roughness={0.92}
          />
        </mesh>
      ))}
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
          <mesh
            key={i}
            position={[0, 0, 0.031 + i * 0.003]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry
              args={[0.095 - i * 0.0065, 0.095 - i * 0.0065, 0.0018, 32]}
            />
            <meshStandardMaterial
              color={i < 4 ? "#434b4d" : "#899293"}
              metalness={0.7}
              roughness={0.38}
            />
          </mesh>
        ))}
    </group>
  );
}
