"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";

export function BikeMesh() {
  const currentBike = useRigStore((s) => s.currentBike);
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const dropperCompressed = useRigStore((s) => s.dropperPostCompressed);
  const waterBottlesMounted = useRigStore((s) => s.waterBottlesMounted);

  const wheelbaseM = currentBike.wheelbaseMm / 1000;
  const rearAxleX = -wheelbaseM / 2;
  const frontAxleX = wheelbaseM / 2;
  const axleY = 0.35; // 700c / 29er wheel radius is ~350mm

  // Geometry landmarks
  const bbPos = useMemo(() => new THREE.Vector3(0, 0.29, 0), []);
  const rearHubPos = useMemo(() => new THREE.Vector3(rearAxleX, axleY, 0), [rearAxleX, axleY]);
  const frontHubPos = useMemo(() => new THREE.Vector3(frontAxleX, axleY, 0), [frontAxleX, axleY]);

  // Scaled frame geometry points
  const sizeReachOffset = (currentSizeConfig.geometry.reachMm - 380) * 0.001;
  const sizeStackOffset = (currentSizeConfig.geometry.stackMm - 580) * 0.001;
  const seatTubeLength = (currentSizeConfig.geometry.seatTubeLengthMm - 500) * 0.001;

  // Seat Cluster (where top tube, seat tube, and seat stays meet)
  const seatCluster = useMemo(
    () => new THREE.Vector3(-0.14 - seatTubeLength * 0.3, 0.72 + seatTubeLength * 0.9, 0),
    [seatTubeLength]
  );

  // Head Tube Points
  const headTubeTop = useMemo(
    () => new THREE.Vector3(0.36 + sizeReachOffset, 0.84 + sizeStackOffset, 0),
    [sizeReachOffset, sizeStackOffset]
  );
  const headTubeBottom = useMemo(
    () => new THREE.Vector3(headTubeTop.x + 0.045, headTubeTop.y - 0.14, 0),
    [headTubeTop]
  );

  // Seatpost & Saddle
  const dropperDrop = dropperCompressed ? 0.14 : 0;
  const saddleBase = useMemo(
    () =>
      new THREE.Vector3(
        seatCluster.x - 0.07 + (dropperCompressed ? 0.04 : 0),
        seatCluster.y + 0.16 - dropperDrop,
        0
      ),
    [seatCluster, dropperDrop, dropperCompressed]
  );

  // Cockpit Clamp & Handlebars
  const stemClamp = useMemo(
    () => new THREE.Vector3(headTubeTop.x + 0.08, headTubeTop.y + 0.03, 0),
    [headTubeTop]
  );

  // Materials
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: currentBike.colorHex,
        metalness: 0.45,
        roughness: 0.3,
      }),
    [currentBike.colorHex]
  );

  const tireRubber = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#18181b",
        roughness: 0.9,
        metalness: 0.05,
      }),
    []
  );

  const rimAlloy = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#27272a",
        roughness: 0.35,
        metalness: 0.8,
      }),
    []
  );

  const metalSilver = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e2e8f0",
        roughness: 0.25,
        metalness: 0.9,
      }),
    []
  );

  const metalBlack = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.4,
        metalness: 0.7,
      }),
    []
  );

  const spokeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#94a3b8",
        wireframe: true,
      }),
    []
  );

  // Precision Tube Generator: exactly connects p1 to p2 using CylinderGeometry (Y-up)
  function createTube(p1: THREE.Vector3, p2: THREE.Vector3, radius: number) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const normalized = dir.clone().normalize();

    // Default Cylinder points along +Y (0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      normalized
    );
    const rot = new THREE.Euler().setFromQuaternion(quaternion);

    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [rot.x, rot.y, rot.z] as [number, number, number],
      length: len,
      radius,
    };
  }

  // Tubes
  const topTube = useMemo(() => createTube(seatCluster, headTubeTop, 0.022), [seatCluster, headTubeTop]);
  const downTube = useMemo(() => createTube(bbPos, headTubeBottom, 0.026), [bbPos, headTubeBottom]);
  const seatTube = useMemo(() => createTube(bbPos, seatCluster, 0.021), [bbPos, seatCluster]);
  const headTube = useMemo(() => createTube(headTubeBottom, headTubeTop, 0.025), [headTubeBottom, headTubeTop]);
  const stem = useMemo(() => createTube(headTubeTop, stemClamp, 0.016), [headTubeTop, stemClamp]);
  const seatpostTube = useMemo(() => createTube(seatCluster, saddleBase, 0.014), [seatCluster, saddleBase]);

  // Rear Stays
  const seatStayL = useMemo(
    () => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.065), 0.011),
    [seatCluster, rearHubPos]
  );
  const seatStayR = useMemo(
    () => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.065), 0.011),
    [seatCluster, rearHubPos]
  );
  const chainStayL = useMemo(
    () => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.065), 0.013),
    [bbPos, rearHubPos]
  );
  const chainStayR = useMemo(
    () => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.065), 0.013),
    [bbPos, rearHubPos]
  );

  // Fork Blades
  const forkBladeL = useMemo(
    () => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, 0.055), 0.017),
    [headTubeBottom, frontHubPos]
  );
  const forkBladeR = useMemo(
    () => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, -0.055), 0.017),
    [headTubeBottom, frontHubPos]
  );

  return (
    <group name="bikeRigRoot">
      {/* ================= 1. FRAME TUBES ================= */}
      <group name="mainFrame">
        {/* Top Tube */}
        <mesh position={topTube.position} rotation={topTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[topTube.radius, topTube.radius, topTube.length, 20]} />
        </mesh>
        {/* Down Tube */}
        <mesh position={downTube.position} rotation={downTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[downTube.radius * 1.1, downTube.radius, downTube.length, 20]} />
        </mesh>
        {/* Seat Tube */}
        <mesh position={seatTube.position} rotation={seatTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatTube.radius, seatTube.radius, seatTube.length, 20]} />
        </mesh>
        {/* Head Tube */}
        <mesh position={headTube.position} rotation={headTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[headTube.radius, headTube.radius, headTube.length, 20]} />
        </mesh>

        {/* Seat Stays */}
        <mesh position={seatStayL.position} rotation={seatStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayL.radius, seatStayL.radius, seatStayL.length, 14]} />
        </mesh>
        <mesh position={seatStayR.position} rotation={seatStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayR.radius, seatStayR.radius, seatStayR.length, 14]} />
        </mesh>

        {/* Chain Stays */}
        <mesh position={chainStayL.position} rotation={chainStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayL.radius, chainStayL.radius, chainStayL.length, 14]} />
        </mesh>
        <mesh position={chainStayR.position} rotation={chainStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayR.radius, chainStayR.radius, chainStayR.length, 14]} />
        </mesh>

        {/* Fork Blades */}
        <mesh position={forkBladeL.position} rotation={forkBladeL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeL.radius, forkBladeL.radius * 0.65, forkBladeL.length, 16]} />
        </mesh>
        <mesh position={forkBladeR.position} rotation={forkBladeR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeR.radius, forkBladeR.radius * 0.65, forkBladeR.length, 16]} />
        </mesh>
      </group>

      {/* ================= 2. WHEELS (IN VERTICAL XY PLANE) ================= */}
      {/* --- Rear Wheel --- */}
      <group position={[rearHubPos.x, rearHubPos.y, 0]}>
        {/* Tire (Torus is in XY plane by default: rotation = [0, 0, 0]) */}
        <mesh material={tireRubber} castShadow>
          <torusGeometry args={[0.325, 0.026, 20, 64]} />
        </mesh>
        {/* Alloy Rim */}
        <mesh material={rimAlloy}>
          <torusGeometry args={[0.305, 0.015, 16, 64]} />
        </mesh>
        {/* Hub (cylinder along Z axis) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.024, 0.024, 0.13, 16]} />
        </mesh>
        {/* Disc Brake Rotor */}
        <mesh position={[0, 0, 0.038]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.08, 0.08, 0.003, 32]} />
        </mesh>
        {/* Cassette Cogs */}
        <mesh position={[0, 0, -0.04]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.075, 0.04, 0.03, 24]} />
        </mesh>
        {/* Spokes Discs (subtle wireframe effect) */}
        <mesh material={spokeMaterial}>
          <circleGeometry args={[0.295, 24]} />
        </mesh>
      </group>

      {/* --- Front Wheel --- */}
      <group position={[frontHubPos.x, frontHubPos.y, 0]}>
        {/* Tire */}
        <mesh material={tireRubber} castShadow>
          <torusGeometry args={[0.325, 0.026, 20, 64]} />
        </mesh>
        {/* Alloy Rim */}
        <mesh material={rimAlloy}>
          <torusGeometry args={[0.305, 0.015, 16, 64]} />
        </mesh>
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.022, 0.022, 0.11, 16]} />
        </mesh>
        {/* Disc Brake Rotor */}
        <mesh position={[0, 0, 0.036]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.08, 0.08, 0.003, 32]} />
        </mesh>
        {/* Spokes */}
        <mesh material={spokeMaterial}>
          <circleGeometry args={[0.295, 24]} />
        </mesh>
      </group>

      {/* ================= 3. BOTTOM BRACKET & DRIVETRAIN ================= */}
      <group position={[bbPos.x, bbPos.y, bbPos.z]}>
        {/* BB Shell */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalBlack}>
          <cylinderGeometry args={[0.024, 0.024, 0.085, 16]} />
        </mesh>
        {/* Chainring */}
        <mesh position={[0, 0, 0.046]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.09, 0.09, 0.004, 32]} />
        </mesh>
        {/* Left Crank Arm */}
        <mesh position={[-0.065, -0.04, 0.055]} rotation={[0, 0, -0.6]} material={metalBlack}>
          <boxGeometry args={[0.16, 0.025, 0.012]} />
        </mesh>
        {/* Right Crank Arm */}
        <mesh position={[0.065, 0.04, -0.055]} rotation={[0, 0, -0.6]} material={metalBlack}>
          <boxGeometry args={[0.16, 0.025, 0.012]} />
        </mesh>
        {/* Pedals */}
        <mesh position={[-0.13, -0.08, 0.075]} material={metalBlack}>
          <boxGeometry args={[0.06, 0.015, 0.07]} />
        </mesh>
        <mesh position={[0.13, 0.08, -0.075]} material={metalBlack}>
          <boxGeometry args={[0.06, 0.015, 0.07]} />
        </mesh>
      </group>

      {/* ================= 4. SEATPOST & SADDLE ================= */}
      <group name="seatpostAndSaddle">
        {/* Seatpost tube precisely connecting seat cluster to saddle */}
        <mesh position={seatpostTube.position} rotation={seatpostTube.rotation} material={metalBlack} castShadow>
          <cylinderGeometry args={[seatpostTube.radius, seatpostTube.radius, seatpostTube.length, 16]} />
        </mesh>

        {/* Saddle Assembly */}
        <group position={[saddleBase.x, saddleBase.y, 0]}>
          {/* Rails */}
          <mesh position={[0, -0.015, 0]} material={metalSilver}>
            <boxGeometry args={[0.16, 0.008, 0.045]} />
          </mesh>
          {/* Saddle Main Body */}
          <mesh position={[-0.02, 0.01, 0]} material={tireRubber} castShadow>
            <boxGeometry args={[0.24, 0.028, 0.13]} />
          </mesh>
          {/* Saddle Nose */}
          <mesh position={[0.10, 0.008, 0]} material={tireRubber}>
            <boxGeometry args={[0.08, 0.024, 0.05]} />
          </mesh>
        </group>
      </group>

      {/* ================= 5. STEM & HANDLEBARS ================= */}
      <group name="cockpitAssembly">
        {/* Stem connecting head tube top to handlebar clamp */}
        <mesh position={stem.position} rotation={stem.rotation} material={metalBlack} castShadow>
          <cylinderGeometry args={[stem.radius, stem.radius, stem.length, 16]} />
        </mesh>

        {/* Handlebars */}
        {currentBike.handlebarType === "drop" ? (
          <group position={[stemClamp.x, stemClamp.y, 0]}>
            {/* Tops (cylinder across Z axis) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={metalBlack} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.44, 16]} />
            </mesh>
            {/* Left Hood & Drop */}
            <mesh position={[0.05, -0.03, 0.22]} material={tireRubber}>
              <boxGeometry args={[0.07, 0.04, 0.035]} />
            </mesh>
            <mesh position={[0.01, -0.09, 0.22]} rotation={[0.4, 0, 0]} material={metalBlack}>
              <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
            </mesh>
            {/* Right Hood & Drop */}
            <mesh position={[0.05, -0.03, -0.22]} material={tireRubber}>
              <boxGeometry args={[0.07, 0.04, 0.035]} />
            </mesh>
            <mesh position={[0.01, -0.09, -0.22]} rotation={[-0.4, 0, 0]} material={metalBlack}>
              <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
            </mesh>
          </group>
        ) : (
          <group position={[stemClamp.x, stemClamp.y, 0]}>
            {/* Flat Bar (across Z axis) */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={metalBlack} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.74, 16]} />
            </mesh>
            {/* Grips */}
            <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]} material={tireRubber}>
              <cylinderGeometry args={[0.019, 0.019, 0.12, 16]} />
            </mesh>
            <mesh position={[0, 0, -0.31]} rotation={[Math.PI / 2, 0, 0]} material={tireRubber}>
              <cylinderGeometry args={[0.019, 0.019, 0.12, 16]} />
            </mesh>
          </group>
        )}
      </group>

      {/* ================= 6. WATER BOTTLE CAGES & BOTTLES ================= */}
      {waterBottlesMounted && (
        <group name="waterBottles">
          {/* Downtube Bottle */}
          <group position={[0.18, 0.49, 0]} rotation={[0, 0, -0.92]}>
            {/* Cage */}
            <mesh material={metalBlack}>
              <boxGeometry args={[0.17, 0.008, 0.05]} />
            </mesh>
            {/* Water Bottle */}
            <mesh position={[0, 0.038, 0]} material={metalSilver}>
              <cylinderGeometry args={[0.035, 0.035, 0.20, 16]} />
            </mesh>
          </group>
          {/* Seat Tube Bottle */}
          <group position={[-0.07, 0.49, 0]} rotation={[0, 0, 0.32]}>
            {/* Cage */}
            <mesh material={metalBlack}>
              <boxGeometry args={[0.17, 0.008, 0.05]} />
            </mesh>
            {/* Water Bottle */}
            <mesh position={[0, 0.038, 0]} material={metalSilver}>
              <cylinderGeometry args={[0.035, 0.035, 0.20, 16]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
