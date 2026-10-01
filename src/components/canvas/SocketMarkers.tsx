"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";
import { SocketAnchor } from "@/types";

export function SocketMarkers() {
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const mountedBags = useRigStore((s) => s.mountedBags);
  const setSelectedSocketId = useRigStore((s) => s.setSelectedSocketId);
  const setActiveSidebarTab = useRigStore((s) => s.setActiveSidebarTab);
  const selectedSocketId = useRigStore((s) => s.selectedSocketId);

  // Flatten all available sockets for current bike size
  const allSockets = useMemo(() => {
    const list: SocketAnchor[] = [];
    const s = currentSizeConfig.sockets;
    if (s.frameTriangle) list.push(s.frameTriangle);
    if (s.seatpost) list.push(s.seatpost);
    if (s.handlebar) list.push(s.handlebar);
    if (s.topTubeFront) list.push(s.topTubeFront);
    if (s.topTubeRear) list.push(s.topTubeRear);
    if (s.downtubeUnderside) list.push(s.downtubeUnderside);
    if (s.forkLeft) list.push(...s.forkLeft);
    if (s.forkRight) list.push(...s.forkRight);
    return list;
  }, [currentSizeConfig]);

  const markerRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#22c55e",
        transparent: true,
        opacity: 0.6,
        wireframe: true,
      }),
    []
  );

  const activeRingMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.9,
      }),
    []
  );

  return (
    <group name="socketSnapAnchors">
      {allSockets.map((socket) => {
        const isMounted = !!mountedBags[socket.id];
        const isSelected = selectedSocketId === socket.id;

        // If a bag is already mounted, don't show the snap badge
        if (isMounted) return null;

        return (
          <group
            key={socket.id}
            position={socket.position}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedSocketId(socket.id);
              setActiveSidebarTab("bags");
            }}
          >
            {/* Outer Pulsing Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]} material={isSelected ? activeRingMaterial : markerRingMaterial}>
              <ringGeometry args={[0.035, 0.045, 24]} />
            </mesh>
            {/* Center Snap Dot */}
            <mesh material={isSelected ? activeRingMaterial : markerRingMaterial}>
              <sphereGeometry args={[0.012, 12, 12]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
