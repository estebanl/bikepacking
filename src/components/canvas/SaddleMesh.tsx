"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface SaddleMeshProps {
  seatCluster: THREE.Vector3;
  saddleBase: THREE.Vector3;
}

export function SaddleMesh({ seatCluster, saddleBase }: SaddleMeshProps) {
  const blackAlloy = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.35,
        metalness: 0.8,
      }),
    []
  );

  const silverMetal = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.25,
        metalness: 0.9,
      }),
    []
  );

  const saddleLeather = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#18181b",
        roughness: 0.8,
        metalness: 0.1,
      }),
    []
  );

  // Seatpost tube
  const postDir = useMemo(
    () => new THREE.Vector3().subVectors(saddleBase, seatCluster),
    [saddleBase, seatCluster]
  );
  const postLen = postDir.length();
  const postMid = useMemo(
    () => new THREE.Vector3().addVectors(seatCluster, saddleBase).multiplyScalar(0.5),
    [seatCluster, saddleBase]
  );
  const postQuat = useMemo(() => {
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      postDir.clone().normalize()
    );
  }, [postDir]);
  const postRot = useMemo(() => new THREE.Euler().setFromQuaternion(postQuat), [postQuat]);

  return (
    <group name="saddleAssembly">
      {/* ================= 1. SEAT COLLAR CLAMP ================= */}
      <group position={[seatCluster.x, seatCluster.y, seatCluster.z]}>
        <mesh rotation={[0, 0, 0.35]} material={blackAlloy}>
          <cylinderGeometry args={[0.023, 0.023, 0.022, 20]} />
        </mesh>
        {/* Clamp Bolt */}
        <mesh position={[-0.025, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={silverMetal}>
          <cylinderGeometry args={[0.004, 0.004, 0.016, 12]} />
        </mesh>
      </group>

      {/* ================= 2. SEATPOST TUBE ================= */}
      <mesh
        position={[postMid.x, postMid.y, postMid.z]}
        rotation={[postRot.x, postRot.y, postRot.z]}
        material={blackAlloy}
        castShadow
      >
        <cylinderGeometry args={[0.014, 0.014, postLen + 0.02, 16]} />
      </mesh>

      {/* ================= 3. SADDLE RAIL CLAMP & SADDLE ================= */}
      <group position={[saddleBase.x, saddleBase.y, saddleBase.z]}>
        {/* Saddle Rail Clamp Assembly */}
        <mesh position={[0, -0.01, 0]} material={blackAlloy}>
          <boxGeometry args={[0.045, 0.018, 0.045]} />
        </mesh>
        <mesh position={[0, -0.01, 0.016]} material={silverMetal}>
          <cylinderGeometry args={[0.003, 0.003, 0.012, 10]} />
        </mesh>
        <mesh position={[0, -0.01, -0.016]} material={silverMetal}>
          <cylinderGeometry args={[0.003, 0.003, 0.012, 10]} />
        </mesh>

        {/* Chrome Saddle Rails (Left & Right) */}
        <mesh position={[0, -0.006, 0.022]} rotation={[0, 0, Math.PI / 2]} material={silverMetal}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.17, 12]} />
        </mesh>
        <mesh position={[0, -0.006, -0.022]} rotation={[0, 0, Math.PI / 2]} material={silverMetal}>
          <cylinderGeometry args={[0.0035, 0.0035, 0.17, 12]} />
        </mesh>

        {/* --- Ergonomic Saddle Body --- */}
        {/* Rear Flared Wings */}
        <mesh position={[-0.05, 0.012, 0]} material={saddleLeather} castShadow>
          <boxGeometry args={[0.14, 0.022, 0.14]} />
        </mesh>
        {/* Mid Transition */}
        <mesh position={[0.02, 0.012, 0]} material={saddleLeather}>
          <boxGeometry args={[0.10, 0.022, 0.08]} />
        </mesh>
        {/* Tapered Nose (extending forward along +X) */}
        <mesh position={[0.09, 0.008, 0]} material={saddleLeather}>
          <boxGeometry args={[0.08, 0.020, 0.042]} />
        </mesh>
        {/* Center Pressure Relief Cutout Channel */}
        <mesh position={[-0.01, 0.022, 0]} material={blackAlloy}>
          <boxGeometry args={[0.12, 0.004, 0.016]} />
        </mesh>
      </group>
    </group>
  );
}
