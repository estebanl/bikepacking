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
  const axleY = 0.35;
  const bbPos = useMemo(() => new THREE.Vector3(0, 0.30, 0), []);
  const rearHubPos = useMemo(() => new THREE.Vector3(rearAxleX, axleY, 0), [rearAxleX, axleY]);
  const frontHubPos = useMemo(() => new THREE.Vector3(frontAxleX, axleY, 0), [frontAxleX, axleY]);

  // Scaled frame geometry points
  const seatClusterY = 0.72 + (currentSizeConfig.geometry.seatTubeLengthMm - 500) * 0.0008;
  const seatClusterX = -0.16;
  const seatCluster = useMemo(() => new THREE.Vector3(seatClusterX, seatClusterY, 0), [seatClusterX, seatClusterY]);

  const headTubeTopY = 0.78 + (currentSizeConfig.geometry.stackMm - 580) * 0.0008;
  const headTubeTopX = 0.34 + (currentSizeConfig.geometry.reachMm - 380) * 0.0008;
  const headTubeBottom = useMemo(() => new THREE.Vector3(headTubeTopX + 0.04, headTubeTopY - 0.16, 0), [headTubeTopX, headTubeTopY]);
  const headTubeTop = useMemo(() => new THREE.Vector3(headTubeTopX, headTubeTopY, 0), [headTubeTopX, headTubeTopY]);

  // Seatpost & Saddle
  const dropperOffset = dropperCompressed ? 0.14 : 0;
  const saddleBase = useMemo(
    () => new THREE.Vector3(seatCluster.x - 0.08, seatCluster.y + 0.14 - dropperOffset, 0),
    [seatCluster, dropperOffset]
  );

  // Materials
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: currentBike.colorHex,
        metalness: 0.3,
        roughness: 0.35,
      }),
    [currentBike.colorHex]
  );

  const rubberMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1c1917",
        roughness: 0.85,
        metalness: 0.1,
      }),
    []
  );

  const metalDark = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#27272a",
        metalness: 0.7,
        roughness: 0.3,
      }),
    []
  );

  const metalSilver = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cbd5e1",
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  // Helper function to create tube between two 3D points
  function createTube(p1: THREE.Vector3, p2: THREE.Vector3, radius: number) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length();
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const orientation = new THREE.Matrix4();
    orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0));
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);

    return {
      position: [mid.x, mid.y, mid.z] as [number, number, number],
      rotation: [rot.x, rot.y, rot.z] as [number, number, number],
      length: len,
      radius,
    };
  }

  const topTube = useMemo(() => createTube(seatCluster, headTubeTop, 0.024), [seatCluster, headTubeTop]);
  const downTube = useMemo(() => createTube(bbPos, headTubeBottom, 0.028), [bbPos, headTubeBottom]);
  const seatTube = useMemo(() => createTube(bbPos, seatCluster, 0.022), [bbPos, seatCluster]);
  const headTube = useMemo(() => createTube(headTubeBottom, headTubeTop, 0.027), [headTubeBottom, headTubeTop]);
  const seatStayL = useMemo(() => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.065), 0.012), [seatCluster, rearHubPos]);
  const seatStayR = useMemo(() => createTube(seatCluster, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.065), 0.012), [seatCluster, rearHubPos]);
  const chainStayL = useMemo(() => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, 0.065), 0.014), [bbPos, rearHubPos]);
  const chainStayR = useMemo(() => createTube(bbPos, new THREE.Vector3(rearHubPos.x, rearHubPos.y, -0.065), 0.014), [bbPos, rearHubPos]);
  const forkBladeL = useMemo(() => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, 0.055), 0.018), [headTubeBottom, frontHubPos]);
  const forkBladeR = useMemo(() => createTube(headTubeBottom, new THREE.Vector3(frontHubPos.x, frontHubPos.y, -0.055), 0.018), [headTubeBottom, frontHubPos]);

  return (
    <group name="bikeRigRoot">
      {/* --- Main Frame Tubes --- */}
      <group name="frameTriangle">
        {/* Top Tube */}
        <mesh position={topTube.position} rotation={topTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[topTube.radius, topTube.radius, topTube.length, 16]} />
        </mesh>
        {/* Down Tube */}
        <mesh position={downTube.position} rotation={downTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[downTube.radius, downTube.radius, downTube.length, 16]} />
        </mesh>
        {/* Seat Tube */}
        <mesh position={seatTube.position} rotation={seatTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatTube.radius, seatTube.radius, seatTube.length, 16]} />
        </mesh>
        {/* Head Tube */}
        <mesh position={headTube.position} rotation={headTube.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[headTube.radius, headTube.radius, headTube.length, 16]} />
        </mesh>

        {/* Seat Stays */}
        <mesh position={seatStayL.position} rotation={seatStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayL.radius, seatStayL.radius, seatStayL.length, 12]} />
        </mesh>
        <mesh position={seatStayR.position} rotation={seatStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[seatStayR.radius, seatStayR.radius, seatStayR.length, 12]} />
        </mesh>

        {/* Chain Stays */}
        <mesh position={chainStayL.position} rotation={chainStayL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayL.radius, chainStayL.radius, chainStayL.length, 12]} />
        </mesh>
        <mesh position={chainStayR.position} rotation={chainStayR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[chainStayR.radius, chainStayR.radius, chainStayR.length, 12]} />
        </mesh>

        {/* Fork */}
        <mesh position={forkBladeL.position} rotation={forkBladeL.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeL.radius, forkBladeL.radius * 0.7, forkBladeL.length, 14]} />
        </mesh>
        <mesh position={forkBladeR.position} rotation={forkBladeR.rotation} material={frameMaterial} castShadow>
          <cylinderGeometry args={[forkBladeR.radius, forkBladeR.radius * 0.7, forkBladeR.length, 14]} />
        </mesh>
      </group>

      {/* --- Bottom Bracket & Cranks --- */}
      <group position={[bbPos.x, bbPos.y, bbPos.z]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalDark}>
          <cylinderGeometry args={[0.024, 0.024, 0.09, 16]} />
        </mesh>
        {/* Chainring */}
        <mesh position={[0, 0, 0.048]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.095, 0.095, 0.004, 32]} />
        </mesh>
        {/* Left Crank */}
        <mesh position={[-0.07, -0.04, 0.055]} rotation={[0, 0, -0.7]} material={metalDark}>
          <boxGeometry args={[0.15, 0.028, 0.014]} />
        </mesh>
        {/* Right Crank */}
        <mesh position={[0.07, 0.04, -0.055]} rotation={[0, 0, -0.7]} material={metalDark}>
          <boxGeometry args={[0.15, 0.028, 0.014]} />
        </mesh>
      </group>

      {/* --- Seatpost & Saddle --- */}
      <group name="cockpitRear">
        {/* Seatpost tube */}
        <mesh
          position={[
            (seatCluster.x + saddleBase.x) / 2,
            (seatCluster.y + saddleBase.y) / 2,
            0,
          ]}
          rotation={[0, 0, 0.35]}
          material={metalDark}
          castShadow
        >
          <cylinderGeometry args={[0.015, 0.015, seatCluster.distanceTo(saddleBase) + 0.04, 16]} />
        </mesh>

        {/* Saddle */}
        <group position={[saddleBase.x, saddleBase.y + 0.02, 0]}>
          <mesh material={rubberMaterial} castShadow>
            <boxGeometry args={[0.26, 0.035, 0.14]} />
          </mesh>
          {/* Saddle nose taper */}
          <mesh position={[0.08, -0.005, 0]} rotation={[0, 0, -Math.PI / 2]} material={rubberMaterial}>
            <coneGeometry args={[0.055, 0.12, 16]} />
          </mesh>
        </group>
      </group>

      {/* --- Handlebars & Stem --- */}
      <group position={[headTubeTop.x, headTubeTop.y, 0]}>
        {/* Stem */}
        <mesh position={[0.045, 0.03, 0]} rotation={[0, 0, 0.4]} material={metalDark} castShadow>
          <boxGeometry args={[0.09, 0.032, 0.035]} />
        </mesh>

        {/* Handlebars: Drop bar or Flat bar */}
        {currentBike.handlebarType === "drop" ? (
          <group position={[0.08, 0.045, 0]}>
            {/* Center bar */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={metalDark}>
              <cylinderGeometry args={[0.015, 0.015, 0.44, 16]} />
            </mesh>
            {/* Left drop hood & curve */}
            <mesh position={[0.05, -0.04, 0.22]} material={rubberMaterial}>
              <boxGeometry args={[0.08, 0.04, 0.035]} />
            </mesh>
            <mesh position={[0.01, -0.09, 0.23]} rotation={[0.4, 0, 0]} material={metalDark}>
              <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
            </mesh>
            {/* Right drop hood & curve */}
            <mesh position={[0.05, -0.04, -0.22]} material={rubberMaterial}>
              <boxGeometry args={[0.08, 0.04, 0.035]} />
            </mesh>
            <mesh position={[0.01, -0.09, -0.23]} rotation={[-0.4, 0, 0]} material={metalDark}>
              <cylinderGeometry args={[0.012, 0.012, 0.13, 12]} />
            </mesh>
          </group>
        ) : (
          <group position={[0.08, 0.045, 0]}>
            {/* Wide MTB Flat Bar */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={metalDark} castShadow>
              <cylinderGeometry args={[0.016, 0.016, 0.74, 16]} />
            </mesh>
            {/* Grips */}
            <mesh position={[0, 0, 0.32]} rotation={[Math.PI / 2, 0, 0]} material={rubberMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.13, 16]} />
            </mesh>
            <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]} material={rubberMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.13, 16]} />
            </mesh>
          </group>
        )}
      </group>

      {/* --- Rear Wheel --- */}
      <group position={[rearHubPos.x, rearHubPos.y, 0]}>
        {/* Tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={rubberMaterial} castShadow>
          <torusGeometry args={[0.34, 0.028, 16, 48]} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalDark}>
          <torusGeometry args={[0.31, 0.016, 12, 48]} />
        </mesh>
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.03, 0.03, 0.14, 16]} />
        </mesh>
        {/* Disc Rotor */}
        <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.08, 0.08, 0.003, 24]} />
        </mesh>
      </group>

      {/* --- Front Wheel --- */}
      <group position={[frontHubPos.x, frontHubPos.y, 0]}>
        {/* Tire */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={rubberMaterial} castShadow>
          <torusGeometry args={[0.34, 0.028, 16, 48]} />
        </mesh>
        {/* Rim */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalDark}>
          <torusGeometry args={[0.31, 0.016, 12, 48]} />
        </mesh>
        {/* Hub */}
        <mesh rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.025, 0.025, 0.12, 16]} />
        </mesh>
        {/* Disc Rotor */}
        <mesh position={[0, 0, 0.035]} rotation={[Math.PI / 2, 0, 0]} material={metalSilver}>
          <cylinderGeometry args={[0.08, 0.08, 0.003, 24]} />
        </mesh>
      </group>

      {/* --- Water Bottle Cages & Bottles --- */}
      {waterBottlesMounted && (
        <group name="waterBottles">
          {/* Downtube Bottle */}
          <group position={[0.07, 0.44, 0]} rotation={[0, 0, -0.85]}>
            <mesh material={metalDark}>
              <boxGeometry args={[0.16, 0.01, 0.06]} />
            </mesh>
            <mesh position={[0, 0.035, 0]} material={metalSilver}>
              <cylinderGeometry args={[0.035, 0.035, 0.19, 16]} />
            </mesh>
          </group>
          {/* Seat Tube Bottle */}
          <group position={[-0.07, 0.48, 0]} rotation={[0, 0, 0.3]}>
            <mesh material={metalDark}>
              <boxGeometry args={[0.16, 0.01, 0.06]} />
            </mesh>
            <mesh position={[0, 0.035, 0]} material={metalSilver}>
              <cylinderGeometry args={[0.035, 0.035, 0.19, 16]} />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
}
