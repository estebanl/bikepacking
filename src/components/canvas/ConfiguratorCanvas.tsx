"use client";

import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRigStore } from "@/store/useRigStore";
import { CameraController } from "./CameraController";
import { BikeMesh } from "./BikeMesh";
import { BagMesh } from "./BagMesh";
import { SocketMarkers } from "./SocketMarkers";
import { GroundPlane } from "./GroundPlane";
import { SocketAnchor } from "@/types";

export function ConfiguratorCanvas() {
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const mountedBags = useRigStore((s) => s.mountedBags);

  // Map socket IDs to anchors for easy lookup
  const socketMap = useMemo(() => {
    const map = new Map<string, SocketAnchor>();
    const s = currentSizeConfig.sockets;
    if (s.frameTriangle) map.set(s.frameTriangle.id, s.frameTriangle);
    if (s.seatpost) map.set(s.seatpost.id, s.seatpost);
    if (s.handlebar) map.set(s.handlebar.id, s.handlebar);
    if (s.topTubeFront) map.set(s.topTubeFront.id, s.topTubeFront);
    if (s.topTubeRear) map.set(s.topTubeRear.id, s.topTubeRear);
    if (s.downtubeUnderside) map.set(s.downtubeUnderside.id, s.downtubeUnderside);
    if (s.forkLeft) s.forkLeft.forEach((sa) => map.set(sa.id, sa));
    if (s.forkRight) s.forkRight.forEach((sa) => map.set(sa.id, sa));
    return map;
  }, [currentSizeConfig]);

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-slate-900 via-slate-950 to-black select-none">
      <Canvas
        shadows
        camera={{ position: [1.5, 1.25, 1.7], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <CameraController />

        {/* --- PBR Studio Lighting Setup --- */}
        <hemisphereLight args={["#f8fafc", "#0f172a", 0.75]} />
        <ambientLight intensity={0.4} />
        {/* Main Sun Key Light with crisp contact shadow */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        {/* Rim Back Highlight Light (defines tubing and alloy rims) */}
        <directionalLight position={[-4, 4, -4]} intensity={1.1} color="#93c5fd" />
        {/* Front Soft Fill Light */}
        <directionalLight position={[-2, 1, 3]} intensity={0.5} color="#e2e8f0" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>
            {/* 3D Bike Mesh */}
            <BikeMesh />

            {/* Mounted Bikepacking Bags */}
            {Object.entries(mountedBags).map(([socketId, bag]) => {
              const anchor = socketMap.get(socketId);
              if (!anchor) return null;
              return (
                <BagMesh
                  key={`${socketId}_${bag.id}`}
                  socketId={socketId}
                  bag={bag}
                  anchor={anchor}
                />
              );
            })}

            {/* Interactive Snap Socket Markers */}
            <SocketMarkers />

            {/* Studio Shadow & Floor */}
            <GroundPlane />
          </group>
        </Suspense>

        {/* Orbit Controls */}
        <OrbitControls
          makeDefault
          minDistance={0.8}
          maxDistance={5.0}
          maxPolarAngle={Math.PI / 2 - 0.02} // Do not dip below ground
          target={[0, 0.6, 0]}
          dampingFactor={0.06}
          enableDamping
        />
      </Canvas>
    </div>
  );
}
