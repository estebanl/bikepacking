"use client";

import React, { useMemo } from "react";
import * as THREE from "three";

interface CockpitMeshProps {
  headTubeTop: THREE.Vector3;
  stemClamp: THREE.Vector3;
  handlebarType: "drop" | "flat";
}

export function CockpitMesh({ headTubeTop, stemClamp, handlebarType }: CockpitMeshProps) {
  // Materials
  const blackAlloy = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.35,
        metalness: 0.8,
      }),
    []
  );

  const silverBolts = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        roughness: 0.2,
        metalness: 0.95,
      }),
    []
  );

  const barTapeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#18181b",
        roughness: 0.75,
        metalness: 0.1,
      }),
    []
  );

  const hoodRubberMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#27272a",
        roughness: 0.85,
        metalness: 0.05,
      }),
    []
  );

  const brakeLeverSilver = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        roughness: 0.2,
        metalness: 0.9,
      }),
    []
  );

  // Precision Tube Generator for stem
  const stemDir = useMemo(
    () => new THREE.Vector3().subVectors(stemClamp, headTubeTop),
    [stemClamp, headTubeTop]
  );
  const stemLen = stemDir.length();
  const stemMid = useMemo(
    () => new THREE.Vector3().addVectors(headTubeTop, stemClamp).multiplyScalar(0.5),
    [headTubeTop, stemClamp]
  );
  const stemQuat = useMemo(() => {
    return new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      stemDir.clone().normalize()
    );
  }, [stemDir]);
  const stemRot = useMemo(() => new THREE.Euler().setFromQuaternion(stemQuat), [stemQuat]);

  return (
    <group name="cockpitHighDetail">
      {/* ================= 1. HEADSET & SPACER STACK ================= */}
      <group position={[headTubeTop.x, headTubeTop.y, headTubeTop.z]}>
        {/* Headset Upper Bearing Cup */}
        <mesh position={[0, 0.006, 0]} material={blackAlloy}>
          <cylinderGeometry args={[0.026, 0.026, 0.012, 20]} />
        </mesh>
        {/* 2x 10mm Carbon Headset Spacers */}
        <mesh position={[0, 0.022, 0]} material={blackAlloy}>
          <cylinderGeometry args={[0.023, 0.023, 0.020, 20]} />
        </mesh>
        {/* Steerer Tube Top Cap */}
        <mesh position={[0, 0.046, 0]} material={blackAlloy}>
          <cylinderGeometry args={[0.021, 0.021, 0.006, 20]} />
        </mesh>
        {/* Compression Center Hex Bolt */}
        <mesh position={[0, 0.049, 0]} material={silverBolts}>
          <cylinderGeometry args={[0.005, 0.005, 0.004, 12]} />
        </mesh>
      </group>

      {/* ================= 2. STEM & FACEPLATE ================= */}
      {/* Stem Body */}
      <mesh
        position={[stemMid.x, stemMid.y, stemMid.z]}
        rotation={[stemRot.x, stemRot.y, stemRot.z]}
        material={blackAlloy}
        castShadow
      >
        <cylinderGeometry args={[0.017, 0.019, stemLen, 16]} />
      </mesh>

      {/* Stem Faceplate Clamping Bar */}
      <group position={[stemClamp.x, stemClamp.y, stemClamp.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={blackAlloy}>
          <cylinderGeometry args={[0.022, 0.022, 0.045, 20]} />
        </mesh>
        {/* 4 Faceplate Bolts */}
        <mesh position={[0.018, 0.012, 0.016]} rotation={[0, 0, Math.PI / 2]} material={silverBolts}>
          <cylinderGeometry args={[0.003, 0.003, 0.006, 8]} />
        </mesh>
        <mesh position={[0.018, -0.012, 0.016]} rotation={[0, 0, Math.PI / 2]} material={silverBolts}>
          <cylinderGeometry args={[0.003, 0.003, 0.006, 8]} />
        </mesh>
        <mesh position={[0.018, 0.012, -0.016]} rotation={[0, 0, Math.PI / 2]} material={silverBolts}>
          <cylinderGeometry args={[0.003, 0.003, 0.006, 8]} />
        </mesh>
        <mesh position={[0.018, -0.012, -0.016]} rotation={[0, 0, Math.PI / 2]} material={silverBolts}>
          <cylinderGeometry args={[0.003, 0.003, 0.006, 8]} />
        </mesh>
      </group>

      {/* ================= 3. HANDLEBARS & SHIFTER HOODS ================= */}
      {handlebarType === "drop" ? (
        <group position={[stemClamp.x, stemClamp.y, stemClamp.z]}>
          {/* Tops Section (cross bar along Z from -0.22 to +0.22) */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={blackAlloy} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.44, 20]} />
          </mesh>

          {/* Left Drop Curve & Ramps (Positive Z) */}
          <group position={[0, 0, 0.22]}>
            {/* Forward Ramp */}
            <mesh position={[0.04, -0.01, 0]} rotation={[0, 0, 0.3]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.014, 0.014, 0.09, 14]} />
            </mesh>
            {/* Curved Drop Lower Section */}
            <mesh position={[0.05, -0.09, 0]} rotation={[0, 0, -0.6]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.013, 0.013, 0.13, 14]} />
            </mesh>
            {/* Drop Extension (pointing back -X) */}
            <mesh position={[-0.01, -0.14, 0]} rotation={[0, 0, Math.PI / 2]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 14]} />
            </mesh>
            {/* Bar End Plug */}
            <mesh position={[-0.07, -0.14, 0]} rotation={[0, 0, Math.PI / 2]} material={blackAlloy}>
              <cylinderGeometry args={[0.013, 0.013, 0.006, 12]} />
            </mesh>

            {/* Ergonomic Hood Body */}
            <mesh position={[0.08, 0.01, 0]} rotation={[0, 0, 0.2]} material={hoodRubberMaterial}>
              <boxGeometry args={[0.085, 0.048, 0.038]} />
            </mesh>
            {/* Brake Lever Blade */}
            <mesh position={[0.09, -0.07, 0]} rotation={[0, 0, -0.45]} material={brakeLeverSilver}>
              <boxGeometry args={[0.008, 0.12, 0.014]} />
            </mesh>
          </group>

          {/* Right Drop Curve & Ramps (Negative Z) */}
          <group position={[0, 0, -0.22]}>
            {/* Forward Ramp */}
            <mesh position={[0.04, -0.01, 0]} rotation={[0, 0, 0.3]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.014, 0.014, 0.09, 14]} />
            </mesh>
            {/* Curved Drop Lower Section */}
            <mesh position={[0.05, -0.09, 0]} rotation={[0, 0, -0.6]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.013, 0.013, 0.13, 14]} />
            </mesh>
            {/* Drop Extension */}
            <mesh position={[-0.01, -0.14, 0]} rotation={[0, 0, Math.PI / 2]} material={barTapeMaterial}>
              <cylinderGeometry args={[0.012, 0.012, 0.12, 14]} />
            </mesh>
            {/* Bar End Plug */}
            <mesh position={[-0.07, -0.14, 0]} rotation={[0, 0, Math.PI / 2]} material={blackAlloy}>
              <cylinderGeometry args={[0.013, 0.013, 0.006, 12]} />
            </mesh>

            {/* Ergonomic Hood Body */}
            <mesh position={[0.08, 0.01, 0]} rotation={[0, 0, 0.2]} material={hoodRubberMaterial}>
              <boxGeometry args={[0.085, 0.048, 0.038]} />
            </mesh>
            {/* Brake Lever Blade */}
            <mesh position={[0.09, -0.07, 0]} rotation={[0, 0, -0.45]} material={brakeLeverSilver}>
              <boxGeometry args={[0.008, 0.12, 0.014]} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Wide Flat Bar (MTB / Expedition) */
        <group position={[stemClamp.x, stemClamp.y, stemClamp.z]}>
          {/* Main Bar with sweep */}
          <mesh rotation={[Math.PI / 2, 0, 0]} material={blackAlloy} castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.74, 20]} />
          </mesh>
          {/* Left Grips with Lockrings */}
          <group position={[0, 0, 0.30]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={hoodRubberMaterial}>
              <cylinderGeometry args={[0.021, 0.021, 0.13, 16]} />
            </mesh>
            <mesh position={[0, 0, -0.07]} rotation={[Math.PI / 2, 0, 0]} material={blackAlloy}>
              <cylinderGeometry args={[0.022, 0.022, 0.008, 16]} />
            </mesh>
            {/* Brake Lever */}
            <mesh position={[0.04, -0.02, -0.08]} rotation={[0, 0, -0.3]} material={brakeLeverSilver}>
              <boxGeometry args={[0.07, 0.012, 0.014]} />
            </mesh>
          </group>
          {/* Right Grips with Lockrings */}
          <group position={[0, 0, -0.30]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={hoodRubberMaterial}>
              <cylinderGeometry args={[0.021, 0.021, 0.13, 16]} />
            </mesh>
            <mesh position={[0, 0, 0.07]} rotation={[Math.PI / 2, 0, 0]} material={blackAlloy}>
              <cylinderGeometry args={[0.022, 0.022, 0.008, 16]} />
            </mesh>
            {/* Brake Lever */}
            <mesh position={[0.04, -0.02, 0.08]} rotation={[0, 0, -0.3]} material={brakeLeverSilver}>
              <boxGeometry args={[0.07, 0.012, 0.014]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
