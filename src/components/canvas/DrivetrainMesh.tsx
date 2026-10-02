"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface DrivetrainMeshProps {
  bbPosition: THREE.Vector3;
  rearAxlePosition: THREE.Vector3;
}

export function DrivetrainMesh({
  bbPosition,
  rearAxlePosition,
}: DrivetrainMeshProps) {
  // Materials
  const blackAlloy = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.35,
        metalness: 0.8,
      }),
    [],
  );

  const silverMetal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        roughness: 0.25,
        metalness: 0.95,
      }),
    [],
  );

  const chainMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#94a3b8",
        roughness: 0.3,
        metalness: 0.9,
      }),
    [],
  );

  const chainringRadius = 0.077;

  const cassetteRadius = 0.072;
  const chainZ = 0.044; // Drive side is on +Z facing camera!

  // Derailleur Position (hanging below and slightly forward/behind rear axle)
  const derailleurPos = new THREE.Vector3(
    rearAxlePosition.x + 0.04,
    rearAxlePosition.y - 0.075,
    0.048,
  );

  // 5-Arm Crank Spider Arms
  const spiderArms = useMemo(() => {
    return [0, 1, 2, 3, 4].map((i) => {
      const angle = (i * 2 * Math.PI) / 5;
      return {
        angle,
        pos: [
          chainringRadius * 0.52 * Math.cos(angle),
          chainringRadius * 0.52 * Math.sin(angle),
          0.044,
        ] as [number, number, number],
      };
    });
  }, [chainringRadius]);

  return (
    <group name="drivetrainAssembly">
      {/* ================= 1. BOTTOM BRACKET & CRANKS ================= */}
      <group position={[bbPosition.x, bbPosition.y, bbPosition.z]}>
        {/* BB Shell (transverse along Z) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={blackAlloy}>
          <cylinderGeometry args={[0.024, 0.024, 0.088, 20]} />
        </mesh>
        {/* Spindle Axle */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={silverMetal}>
          <cylinderGeometry args={[0.015, 0.015, 0.12, 16]} />
        </mesh>

        {/* --- DRIVE SIDE (+Z Facing Viewer) --- */}
        {/* Center Spider Hub */}
        <mesh
          position={[0, 0, 0.044]}
          rotation={[Math.PI / 2, 0, 0]}
          material={blackAlloy}
        >
          <cylinderGeometry args={[0.038, 0.038, 0.008, 20]} />
        </mesh>

        {/* 5-Arm Crank Spider */}
        {spiderArms.map((arm, idx) => (
          <mesh
            key={idx}
            position={arm.pos}
            rotation={[0, 0, arm.angle]}
            material={blackAlloy}
          >
            <boxGeometry args={[0.052, 0.012, 0.006]} />
          </mesh>
        ))}

        {/* Outer Chainring (50T) - Vertical in XY plane */}
        <mesh position={[0, 0, 0.045]} material={blackAlloy}>
          <torusGeometry args={[chainringRadius, 0.007, 12, 48]} />
        </mesh>
        {/* Outer Teeth Ring (laser cut silver) */}
        <mesh position={[0, 0, 0.045]} material={silverMetal}>
          <torusGeometry args={[chainringRadius + 0.005, 0.0025, 8, 48]} />
        </mesh>

        {/* Right Crank Arm (Drive Side: +Z) */}
        <group position={[0.055, -0.035, 0.058]} rotation={[0, 0, -0.55]}>
          <mesh material={blackAlloy} castShadow>
            <boxGeometry args={[0.165, 0.028, 0.014]} />
          </mesh>
          {/* Pedal Spindle & Platform Body */}
          <group position={[0.07, 0, 0.028]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.007, 0.007, 0.038, 12]} />
            </mesh>
            <mesh position={[0, 0, 0.028]} material={blackAlloy} castShadow>
              <boxGeometry args={[0.085, 0.016, 0.065]} />
            </mesh>
          </group>
        </group>

        {/* --- NON-DRIVE SIDE (-Z Back Side) --- */}
        {/* Left Crank Arm (Rotated 180 deg) */}
        <group position={[-0.055, 0.035, -0.058]} rotation={[0, 0, -0.55]}>
          <mesh material={blackAlloy} castShadow>
            <boxGeometry args={[0.165, 0.028, 0.014]} />
          </mesh>
          {/* Pedal Spindle & Platform Body */}
          <group position={[-0.07, 0, -0.028]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.007, 0.007, 0.038, 12]} />
            </mesh>
            <mesh position={[0, 0, -0.028]} material={blackAlloy} castShadow>
              <boxGeometry args={[0.085, 0.016, 0.065]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ================= 2. REAR DERAILLEUR (Drive Side: +Z) ================= */}
      <group position={[derailleurPos.x, derailleurPos.y, derailleurPos.z]}>
        {/* B-Knuckle Hanger Mount */}
        <mesh material={blackAlloy}>
          <boxGeometry args={[0.025, 0.035, 0.02]} />
        </mesh>
        {/* Parallelogram Body */}
        <mesh
          position={[-0.015, -0.015, 0.005]}
          rotation={[0, 0, 0.3]}
          material={blackAlloy}
        >
          <boxGeometry args={[0.04, 0.025, 0.018]} />
        </mesh>
        {/* Outer Silver P-Cage Plate */}
        <mesh
          position={[-0.02, -0.04, 0.01]}
          rotation={[0, 0, -0.4]}
          material={silverMetal}
        >
          <boxGeometry args={[0.012, 0.07, 0.004]} />
        </mesh>
        {/* Inner Silver P-Cage Plate */}
        <mesh
          position={[-0.02, -0.04, -0.006]}
          rotation={[0, 0, -0.4]}
          material={silverMetal}
        >
          <boxGeometry args={[0.012, 0.07, 0.004]} />
        </mesh>
        {/* Upper Guide Pulley */}
        <mesh
          position={[-0.01, -0.025, 0.002]}
          rotation={[Math.PI / 2, 0, 0]}
          material={blackAlloy}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.005, 16]} />
        </mesh>
        {/* Lower Tension Pulley */}
        <mesh
          position={[-0.035, -0.065, 0.002]}
          rotation={[Math.PI / 2, 0, 0]}
          material={blackAlloy}
        >
          <cylinderGeometry args={[0.014, 0.014, 0.005, 16]} />
        </mesh>
      </group>

      {/* ================= 3. CONTINUOUS BICYCLE CHAIN ================= */}
      {/* Upper Chain Run: Top of chainring to top of rear cassette */}
      <mesh
        position={[
          (bbPosition.x + rearAxlePosition.x) / 2,
          (bbPosition.y +
            chainringRadius +
            rearAxlePosition.y +
            cassetteRadius) /
            2,
          chainZ,
        ]}
        rotation={[
          0,
          0,
          Math.atan2(
            rearAxlePosition.y +
              cassetteRadius -
              (bbPosition.y + chainringRadius),
            rearAxlePosition.x - bbPosition.x,
          ),
        ]}
        material={chainMaterial}
      >
        <boxGeometry
          args={[
            new THREE.Vector2(
              rearAxlePosition.x - bbPosition.x,
              rearAxlePosition.y +
                cassetteRadius -
                (bbPosition.y + chainringRadius),
            ).length(),
            0.007,
            0.005,
          ]}
        />
      </mesh>

      {/* Lower Chain Run: Bottom of chainring to derailleur tension pulley */}
      <mesh
        position={[
          (bbPosition.x + derailleurPos.x - 0.035) / 2,
          (bbPosition.y - chainringRadius + derailleurPos.y - 0.065) / 2,
          chainZ,
        ]}
        rotation={[
          0,
          0,
          Math.atan2(
            derailleurPos.y - 0.065 - (bbPosition.y - chainringRadius),
            derailleurPos.x - 0.035 - bbPosition.x,
          ),
        ]}
        material={chainMaterial}
      >
        <boxGeometry
          args={[
            new THREE.Vector2(
              derailleurPos.x - 0.035 - bbPosition.x,
              derailleurPos.y - 0.065 - (bbPosition.y - chainringRadius),
            ).length(),
            0.007,
            0.005,
          ]}
        />
      </mesh>

      {/* Derailleur Pulley S-Loop */}
      <mesh
        position={[derailleurPos.x - 0.022, derailleurPos.y - 0.045, chainZ]}
        rotation={[0, 0, -0.4]}
        material={chainMaterial}
      >
        <boxGeometry args={[0.048, 0.006, 0.005]} />
      </mesh>
    </group>
  );
}
