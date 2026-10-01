"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";
import { WheelMesh } from "./WheelMesh";
import { DrivetrainMesh } from "./DrivetrainMesh";
import { CockpitMesh } from "./CockpitMesh";
import { SaddleMesh } from "./SaddleMesh";

export function BikeMesh() {
  const currentBike = useRigStore((s) => s.currentBike);
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const dropperCompressed = useRigStore((s) => s.dropperPostCompressed);
  const waterBottlesMounted = useRigStore((s) => s.waterBottlesMounted);

  const wheelbaseM = currentBike.wheelbaseMm / 1000;
  const rearAxleX = -wheelbaseM / 2;
  const frontAxleX = wheelbaseM / 2;
  const axleY = 0.35; // Standard 700c / 29er wheel radius

  // Geometry Landmarks
  const bbPos = useMemo(() => new THREE.Vector3(0, 0.29, 0), []);
  const rearHubPos = useMemo(() => new THREE.Vector3(rearAxleX, axleY, 0), [rearAxleX, axleY]);
  const frontHubPos = useMemo(() => new THREE.Vector3(frontAxleX, axleY, 0), [frontAxleX, axleY]);

  // Scaled Frame Geometry Points
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

  // Saddle & Cockpit Coordinates
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

  const stemClamp = useMemo(
    () => new THREE.Vector3(headTubeTop.x + 0.08, headTubeTop.y + 0.03, 0),
    [headTubeTop]
  );

  // Premium High-Gloss Frame Material with Clearcoat
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: currentBike.colorHex,
        metalness: 0.5,
        roughness: 0.25,
      }),
    [currentBike.colorHex]
  );

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

  // Precision Tube Generator: Exactly connects p1 to p2 using CylinderGeometry (Y-up)
  function createTube(p1: THREE.Vector3, p2: THREE.Vector3, radius: number) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const normalized = dir.clone().normalize();

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

  // Frame Tubes
  const topTube = useMemo(() => createTube(seatCluster, headTubeTop, 0.022), [seatCluster, headTubeTop]);
  const downTube = useMemo(() => createTube(bbPos, headTubeBottom, 0.028), [bbPos, headTubeBottom]);
  const seatTube = useMemo(() => createTube(bbPos, seatCluster, 0.021), [bbPos, seatCluster]);
  const headTube = useMemo(() => createTube(headTubeBottom, headTubeTop, 0.025), [headTubeBottom, headTubeTop]);

  // Rear Stays
  const seatStayL = useMemo(
    () => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.062), 0.011),
    [seatCluster, rearHubPos]
  );
  const seatStayR = useMemo(
    () => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.062), 0.011),
    [seatCluster, rearHubPos]
  );
  const chainStayL = useMemo(
    () => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.062), 0.013),
    [bbPos, rearHubPos]
  );
  const chainStayR = useMemo(
    () => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.062), 0.013),
    [bbPos, rearHubPos]
  );

  // Fork Blades
  const forkBladeL = useMemo(
    () => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, 0.052), 0.017),
    [headTubeBottom, frontHubPos]
  );
  const forkBladeR = useMemo(
    () => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, -0.052), 0.017),
    [headTubeBottom, frontHubPos]
  );

  return (
    <group name="bikeRigRoot">
      {/* ================= 1. REALISTIC MAIN FRAME ================= */}
      <group name="mainFrameTubes">
        {/* Top Tube */}
        <mesh position={topTube.position} rotation={topTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[topTube.radius, topTube.radius, topTube.length, 24]} />
        </mesh>
        {/* Down Tube with tapered hydroformed profile */}
        <mesh position={downTube.position} rotation={downTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[downTube.radius * 1.15, downTube.radius * 0.95, downTube.length, 24]} />
        </mesh>
        {/* Seat Tube */}
        <mesh position={seatTube.position} rotation={seatTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatTube.radius, seatTube.radius, seatTube.length, 24]} />
        </mesh>
        {/* Head Tube */}
        <mesh position={headTube.position} rotation={headTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[headTube.radius, headTube.radius, headTube.length, 24]} />
        </mesh>

        {/* Seat Stays */}
        <mesh position={seatStayL.position} rotation={seatStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayL.radius, seatStayL.radius, seatStayL.length, 16]} />
        </mesh>
        <mesh position={seatStayR.position} rotation={seatStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayR.radius, seatStayR.radius, seatStayR.length, 16]} />
        </mesh>

        {/* Chain Stays */}
        <mesh position={chainStayL.position} rotation={chainStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayL.radius, chainStayL.radius, chainStayL.length, 16]} />
        </mesh>
        <mesh position={chainStayR.position} rotation={chainStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayR.radius, chainStayR.radius, chainStayR.length, 16]} />
        </mesh>

        {/* Fork Blades */}
        <mesh position={forkBladeL.position} rotation={forkBladeL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeL.radius, forkBladeL.radius * 0.65, forkBladeL.length, 20]} />
        </mesh>
        <mesh position={forkBladeR.position} rotation={forkBladeR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeR.radius, forkBladeR.radius * 0.65, forkBladeR.length, 20]} />
        </mesh>

        {/* Seatstay Bridge */}
        <mesh
          position={[(seatCluster.x + rearHubPos.x) * 0.5, (seatCluster.y + rearHubPos.y) * 0.5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={frameMaterial}
        >
          <cylinderGeometry args={[0.008, 0.008, 0.075, 12]} />
        </mesh>

        {/* Chainstay Bridge */}
        <mesh
          position={[bbPos.x - 0.08, bbPos.y + 0.015, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={frameMaterial}
        >
          <cylinderGeometry args={[0.009, 0.009, 0.065, 12]} />
        </mesh>

        {/* Fork Crown */}
        <mesh
          position={[headTubeBottom.x - 0.005, headTubeBottom.y - 0.012, 0]}
          material={frameMaterial}
          castShadow
        >
          <boxGeometry args={[0.042, 0.030, 0.098]} />
        </mesh>

        {/* Rear Dropouts Plate (Non-Drive: -Z, Drive: +Z) */}
        <mesh position={[rearHubPos.x, rearHubPos.y, -0.058]} material={blackAlloy}>
          <boxGeometry args={[0.04, 0.035, 0.008]} />
        </mesh>
        <mesh position={[rearHubPos.x, rearHubPos.y, 0.058]} material={blackAlloy}>
          <boxGeometry args={[0.04, 0.035, 0.008]} />
        </mesh>
        {/* Replaceable Derailleur Hanger (+Z) */}
        <mesh position={[rearHubPos.x + 0.012, rearHubPos.y - 0.022, 0.054]} material={silverMetal}>
          <boxGeometry args={[0.018, 0.036, 0.006]} />
        </mesh>

        {/* Front Fork Dropouts Plate */}
        <mesh position={[frontHubPos.x, frontHubPos.y, 0.048]} material={blackAlloy}>
          <boxGeometry args={[0.035, 0.035, 0.008]} />
        </mesh>
        <mesh position={[frontHubPos.x, frontHubPos.y, -0.048]} material={blackAlloy}>
          <boxGeometry args={[0.035, 0.035, 0.008]} />
        </mesh>
      </group>

      {/* ================= 2. HIGH-DETAIL WHEELS ================= */}
      {/* Rear Wheel with Cassette */}
      <WheelMesh position={[rearHubPos.x, rearHubPos.y, 0]} isRear={true} />
      {/* Front Wheel */}
      <WheelMesh position={[frontHubPos.x, frontHubPos.y, 0]} isRear={false} />

      {/* ================= 3. DRIVETRAIN ASSEMBLY ================= */}
      <DrivetrainMesh bbPosition={bbPos} rearAxlePosition={rearHubPos} />

      {/* ================= 4. COCKPIT & CONTROLS ================= */}
      <CockpitMesh
        headTubeTop={headTubeTop}
        stemClamp={stemClamp}
        handlebarType={currentBike.handlebarType}
      />

      {/* ================= 5. SEATPOST & SADDLE ================= */}
      <SaddleMesh seatCluster={seatCluster} saddleBase={saddleBase} />

      {/* ================= 6. WATER BOTTLE CAGES & BOTTLES ================= */}
      {waterBottlesMounted && (
        <group name="waterBottles">
          {/* Downtube Bottle */}
          <group position={[0.18, 0.49, 0]} rotation={[0, 0, -0.92]}>
            {/* Cage */}
            <mesh material={blackAlloy}>
              <boxGeometry args={[0.16, 0.008, 0.055]} />
            </mesh>
            {/* Bottle Body */}
            <mesh position={[0, 0.038, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.034, 0.034, 0.19, 20]} />
            </mesh>
            {/* Bottle Neck Groove */}
            <mesh position={[0, 0.11, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.030, 0.030, 0.02, 16]} />
            </mesh>
            {/* Cap & Pull Valve */}
            <mesh position={[0, 0.13, 0]} material={blackAlloy}>
              <cylinderGeometry args={[0.024, 0.024, 0.02, 16]} />
            </mesh>
            <mesh position={[0, 0.145, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.010, 0.010, 0.015, 12]} />
            </mesh>
          </group>

          {/* Seat Tube Bottle */}
          <group position={[-0.07, 0.49, 0]} rotation={[0, 0, 0.32]}>
            {/* Cage */}
            <mesh material={blackAlloy}>
              <boxGeometry args={[0.16, 0.008, 0.055]} />
            </mesh>
            {/* Bottle Body */}
            <mesh position={[0, 0.038, 0]} material={silverMetal}>
              <cylinderGeometry args={[0.034, 0.034, 0.19, 20]} />
            </mesh>
            {/* Cap & Pull Valve */}
            <mesh position={[0, 0.13, 0]} material={blackAlloy}>
              <cylinderGeometry args={[0.024, 0.024, 0.02, 16]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
