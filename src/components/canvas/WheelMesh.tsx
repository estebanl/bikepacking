"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface WheelMeshProps {
  position: [number, number, number];
  isRear?: boolean;
}

export function WheelMesh({ position, isRear = false }: WheelMeshProps) {
  // Materials
  const tireTreadMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#18181b", // Deep black tread
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

  const tanGumwallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#b48a58", // Classic gravel tanwall / gumwall
        roughness: 0.75,
        metalness: 0.1,
      }),
    []
  );

  const rimMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1e293b", // Deep matte slate anodized alloy
        roughness: 0.35,
        metalness: 0.85,
      }),
    []
  );

  const steelSilverMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.2,
        metalness: 0.95,
      }),
    []
  );

  const spokeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.25,
        metalness: 0.9,
      }),
    []
  );

  // Generate 32 cross-laced spokes (16 drive side, 16 non-drive side)
  const spokes = useMemo(() => {
    const list: {
      position: [number, number, number];
      rotation: [number, number, number];
      length: number;
      nipplePos: [number, number, number];
      nippleRot: [number, number, number];
    }[] = [];
    const spokeCount = 32;
    const rimRadius = 0.295;
    const hubRadius = 0.028;
    const hubWidth = 0.028;

    for (let i = 0; i < spokeCount; i++) {
      const angle = (i * 2 * Math.PI) / spokeCount;
      const isDriveSide = i % 2 === 0;
      const hubZ = isDriveSide ? hubWidth : -hubWidth;

      // Crossing offset angle
      const crossOffset = (i % 4 < 2 ? 1 : -1) * 0.28;
      const rimAngle = angle + crossOffset;

      const pHub = new THREE.Vector3(
        hubRadius * Math.cos(angle),
        hubRadius * Math.sin(angle),
        hubZ
      );
      const pRim = new THREE.Vector3(
        rimRadius * Math.cos(rimAngle),
        rimRadius * Math.sin(rimAngle),
        isDriveSide ? 0.005 : -0.005
      );

      const dir = new THREE.Vector3().subVectors(pRim, pHub);
      const len = dir.length();
      const mid = new THREE.Vector3().addVectors(pHub, pRim).multiplyScalar(0.5);

      const quaternion = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize()
      );
      const rot = new THREE.Euler().setFromQuaternion(quaternion);

      list.push({
        position: [mid.x, mid.y, mid.z],
        rotation: [rot.x, rot.y, rot.z],
        length: len,
        nipplePos: [pRim.x, pRim.y, pRim.z],
        nippleRot: [0, 0, rimAngle + Math.PI / 2],
      });
    }
    return list;
  }, []);

  return (
    <group position={position} name={isRear ? "rearWheel" : "frontWheel"}>
      {/* --- 1. TIRE --- */}
      {/* Black Outer Tread */}
      <mesh material={tireTreadMaterial} castShadow>
        <torusGeometry args={[0.330, 0.024, 24, 64]} />
      </mesh>
      {/* Tan Gumwall Sidewalls (Drive and Non-Drive Sides) */}
      <mesh position={[0, 0, 0.010]} material={tanGumwallMaterial}>
        <torusGeometry args={[0.316, 0.016, 20, 64]} />
      </mesh>
      <mesh position={[0, 0, -0.010]} material={tanGumwallMaterial}>
        <torusGeometry args={[0.316, 0.016, 20, 64]} />
      </mesh>

      {/* --- 2. DEEP-V ALLOY RIM --- */}
      <mesh material={rimMaterial}>
        <torusGeometry args={[0.298, 0.014, 20, 64]} />
      </mesh>
      <mesh material={rimMaterial}>
        <torusGeometry args={[0.288, 0.009, 16, 64]} />
      </mesh>

      {/* Presta Valve Stem */}
      <mesh position={[0, 0.280, 0]} material={steelSilverMaterial}>
        <cylinderGeometry args={[0.003, 0.003, 0.035, 10]} />
      </mesh>

      {/* --- 3. SPOKES & BRASS NIPPLES --- */}
      {spokes.map((s, idx) => (
        <group key={idx}>
          <mesh position={s.position} rotation={s.rotation} material={steelSilverMaterial}>
            <cylinderGeometry args={[0.0018, 0.0018, s.length, 6]} />
          </mesh>
          <mesh position={s.nipplePos} rotation={s.nippleRot} material={steelSilverMaterial}>
            <cylinderGeometry args={[0.003, 0.003, 0.010, 8]} />
          </mesh>
        </group>
      ))}

      {/* --- 4. HUB & FLANGES --- */}
      {/* Center Hub Shell */}
      <mesh rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
        <cylinderGeometry args={[0.018, 0.018, 0.09, 20]} />
      </mesh>
      {/* Drive Side Flange (+Z) */}
      <mesh position={[0, 0, 0.032]} rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
        <cylinderGeometry args={[0.032, 0.032, 0.006, 24]} />
      </mesh>
      {/* Non-Drive Side Flange (-Z) */}
      <mesh position={[0, 0, -0.032]} rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
        <cylinderGeometry args={[0.032, 0.032, 0.006, 24]} />
      </mesh>
      {/* Thru-Axle End Caps */}
      <mesh position={[0, 0, 0.056]} rotation={[Math.PI / 2, 0, 0]} material={steelSilverMaterial}>
        <cylinderGeometry args={[0.012, 0.012, 0.016, 16]} />
      </mesh>
      <mesh position={[0, 0, -0.056]} rotation={[Math.PI / 2, 0, 0]} material={steelSilverMaterial}>
        <cylinderGeometry args={[0.012, 0.012, 0.016, 16]} />
      </mesh>
      {/* Quick Release Skewer Lever (Non-Drive Side) */}
      <group position={[0, 0, -0.066]} rotation={[0, 0, 0.4]}>
        <mesh position={[0, 0.035, 0]} material={steelSilverMaterial}>
          <boxGeometry args={[0.010, 0.07, 0.004]} />
        </mesh>
      </group>

      {/* --- 5. DISC BRAKE ROTOR & CALIPER (Non-Drive Side: -Z) --- */}
      <group position={[0, 0, -0.038]}>
        {/* Main Outer Braking Track (in XY plane, rotation [0,0,0]) */}
        <mesh material={steelSilverMaterial}>
          <torusGeometry args={[0.075, 0.008, 12, 36]} />
        </mesh>
        {/* Inner Carrier Spider Disc */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
          <cylinderGeometry args={[0.048, 0.048, 0.003, 16]} />
        </mesh>
        {/* 6-Bolt Mount Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={steelSilverMaterial}>
          <cylinderGeometry args={[0.024, 0.024, 0.005, 12]} />
        </mesh>
        {/* Disc Brake Caliper */}
        <mesh position={[-0.055, 0.055, 0]} rotation={[0, 0, 0.78]} material={rimMaterial}>
          <boxGeometry args={[0.045, 0.032, 0.026]} />
        </mesh>
      </group>

      {/* --- 6. CASSETTE (Drive Side: +Z, Rear Wheel Only) --- */}
      {isRear && (
        <group position={[0, 0, 0.036]}>
          {/* Stepped 7-speed Cog Cluster extending outward along +Z */}
          {[0.082, 0.074, 0.066, 0.058, 0.050, 0.042, 0.034].map((radius, idx) => (
            <mesh
              key={idx}
              position={[0, 0, idx * 0.0045]}
              rotation={[Math.PI / 2, 0, 0]}
              material={steelSilverMaterial}
            >
              <cylinderGeometry args={[radius, radius, 0.002, 24]} />
            </mesh>
          ))}
          {/* Lockring */}
          <mesh position={[0, 0, 0.034]} rotation={[Math.PI / 2, 0, 0]} material={rimMaterial}>
            <cylinderGeometry args={[0.02, 0.02, 0.004, 16]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
