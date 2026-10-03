"use client";

import { PCFSoftShadowMap } from "three";
import React, { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useRigStore } from "@/store/useRigStore";
import { CameraController } from "./CameraController";
import { BikeMesh } from "./BikeMesh";
import { BagMesh } from "./BagMesh";
import { SocketMarkers } from "./SocketMarkers";
import { GroundPlane } from "./GroundPlane";
import { getSocketAnchors } from "@/lib/sockets";

export function ConfiguratorCanvas() {
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const mountedBags = useRigStore((s) => s.mountedBags);

  const socketMap = useMemo(
    () =>
      new Map(
        getSocketAnchors(currentSizeConfig, mountedBags).map((anchor) => [
          anchor.id,
          anchor,
        ]),
      ),
    [currentSizeConfig, mountedBags],
  );

  return (
    <div className="w-full h-full relative bg-[#e8ede9] select-none">
      <Canvas
        shadows={{type: PCFSoftShadowMap}}
        dpr={[1, 1.5]}
        camera={{ position: [1.5, 1.25, 1.7], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#e8ede9"]} />
        <fog attach="fog" args={["#e8ede9", 5, 12]} />
        <CameraController />

        {/* --- PBR Studio Lighting Setup --- */}
        <hemisphereLight args={["#ffffff", "#c4c7c0", 1.65]} />
        <ambientLight intensity={0.45} />
        {/* Broad neutral studio key with a restrained contact shadow */}
        <directionalLight
          position={[2, 6, 3]}
          intensity={2.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
          shadow-normalBias={0.002}
          shadow-camera-left={-2}
          shadow-camera-right={2}
          shadow-camera-top={2}
          shadow-camera-bottom={-2}
          shadow-radius={3}
        />
        {/* Rim Back Highlight Light (defines tubing and alloy rims) */}
        <directionalLight
          position={[-4, 4, -4]}
          intensity={0.75}
          color="#f3f1ed"
        />
        {/* Front Soft Fill Light */}
        <directionalLight
          position={[-2, 1, 3]}
          intensity={0.5}
          color="#f3f4f3"
        />

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
      </Canvas>
    </div>
  );
}
