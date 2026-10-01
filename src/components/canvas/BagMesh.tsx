"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { BagItem, SocketAnchor } from "@/types";
import { useRigStore } from "@/store/useRigStore";

interface BagMeshProps {
  socketId: string;
  bag: BagItem;
  anchor: SocketAnchor;
}

export function BagMesh({ socketId, bag, anchor }: BagMeshProps) {
  const clearanceWarnings = useRigStore((s) => s.clearanceWarnings);
  const dropperCompressed = useRigStore((s) => s.dropperPostCompressed);

  const hasWarning = useMemo(() => {
    return clearanceWarnings.some((w) => w.affectedBagIds.includes(bag.id));
  }, [clearanceWarnings, bag.id]);

  const hasError = useMemo(() => {
    return clearanceWarnings.some((w) => w.affectedBagIds.includes(bag.id) && w.severity === "error");
  }, [clearanceWarnings, bag.id]);

  // Adjust seatpost socket height if dropper is compressed
  const effectivePosition: [number, number, number] = useMemo(() => {
    if (socketId === "seatpost" && dropperCompressed) {
      return [anchor.position[0], anchor.position[1] - 0.14, anchor.position[2]];
    }
    return anchor.position;
  }, [anchor.position, socketId, dropperCompressed]);

  // Base materials
  const bagBaseColor = bag.colorHex || "#1f2937";
  const mainMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: hasError ? "#dc2626" : hasWarning ? "#ea580c" : bagBaseColor,
        roughness: 0.6,
        metalness: 0.1,
        emissive: hasError ? "#7f1d1d" : hasWarning ? "#431407" : "#000000",
        emissiveIntensity: hasError ? 0.7 : hasWarning ? 0.4 : 0,
      }),
    [hasError, hasWarning, bagBaseColor]
  );

  const strapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#18181b",
        roughness: 0.8,
      }),
    []
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: hasError ? "#ef4444" : "#eab308", // warning red or hi-vis yellow
        roughness: 0.4,
      }),
    [hasError]
  );

  return (
    <group
      position={effectivePosition}
      rotation={anchor.rotation}
      name={`bag_${bag.id}_${socketId}`}
    >
      {/* --- SEAT PACK --- */}
      {bag.category === "seat_pack" && (
        <group position={[-0.18, 0.05, 0]} rotation={[0, 0, 0.38]}>
          {/* Main conical pack extending backwards */}
          <mesh castShadow material={mainMaterial} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.085, 0.42, 16]} />
          </mesh>
          {/* Roll top closure fold */}
          <mesh position={[-0.22, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.02, 0.02, 0.09, 12]} />
          </mesh>
          {/* Holster attachment cradle & webbing strap */}
          <mesh position={[0.08, 0, 0]} material={strapMaterial}>
            <boxGeometry args={[0.09, 0.11, 0.11]} />
          </mesh>
          {/* Seatpost buckle strap */}
          <mesh position={[0.13, -0.02, 0]} rotation={[0, 0, 0.5]} material={strapMaterial}>
            <cylinderGeometry args={[0.025, 0.025, 0.06, 12]} />
          </mesh>
        </group>
      )}

      {/* --- HANDLEBAR ROLL --- */}
      {bag.category === "handlebar_roll" && (
        <group position={[0.04, -0.06, 0]}>
          {/* Main cylindrical dry bag roll */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={mainMaterial}>
            <cylinderGeometry args={[0.08, 0.08, 0.42, 24]} />
          </mesh>
          {/* Left roll-top fold */}
          <mesh position={[0, 0, 0.22]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.082, 0.082, 0.02, 20]} />
          </mesh>
          {/* Right roll-top fold */}
          <mesh position={[0, 0, -0.22]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.082, 0.082, 0.02, 20]} />
          </mesh>
          {/* Handlebar mounting harness */}
          <mesh position={[-0.03, 0.02, 0]} material={strapMaterial}>
            <boxGeometry args={[0.05, 0.06, 0.24]} />
          </mesh>
        </group>
      )}

      {/* --- HALF FRAME BAG --- */}
      {bag.category === "frame_half" && (
        <group position={[0, -0.02, 0]}>
          <mesh castShadow material={mainMaterial}>
            <boxGeometry args={[0.38, 0.11, 0.055]} />
          </mesh>
          {/* Zipper strip */}
          <mesh position={[0, 0.01, 0.029]} material={accentMaterial}>
            <boxGeometry args={[0.32, 0.006, 0.002]} />
          </mesh>
          {/* Top tube velcro straps */}
          <mesh position={[-0.12, 0.06, 0]} material={strapMaterial}>
            <boxGeometry args={[0.025, 0.015, 0.06]} />
          </mesh>
          <mesh position={[0.12, 0.06, 0]} material={strapMaterial}>
            <boxGeometry args={[0.025, 0.015, 0.06]} />
          </mesh>
        </group>
      )}

      {/* --- FULL FRAME BAG --- */}
      {bag.category === "frame_full" && (
        <group position={[0, -0.06, 0]}>
          {/* Upper wedge */}
          <mesh castShadow material={mainMaterial}>
            <boxGeometry args={[0.42, 0.13, 0.06]} />
          </mesh>
          {/* Lower triangle wedge */}
          <mesh position={[-0.03, -0.11, 0]} castShadow material={mainMaterial}>
            <boxGeometry args={[0.26, 0.12, 0.06]} />
          </mesh>
          {/* Dual Zipper strips */}
          <mesh position={[0, 0.01, 0.032]} material={accentMaterial}>
            <boxGeometry args={[0.36, 0.006, 0.002]} />
          </mesh>
          <mesh position={[-0.03, -0.09, 0.032]} material={accentMaterial}>
            <boxGeometry args={[0.22, 0.006, 0.002]} />
          </mesh>
        </group>
      )}

      {/* --- TOP TUBE BAG --- */}
      {bag.category === "top_tube" && (
        <group position={[0, 0.045, 0]}>
          <mesh castShadow material={mainMaterial}>
            <boxGeometry args={[0.21, 0.08, 0.042]} />
          </mesh>
          {/* Tapered nose */}
          <mesh position={[0.11, 0.01, 0]} rotation={[0, 0, -Math.PI / 2]} material={mainMaterial}>
            <coneGeometry args={[0.026, 0.05, 12]} />
          </mesh>
          {/* Easy-pull zipper */}
          <mesh position={[0, 0.042, 0]} material={accentMaterial}>
            <boxGeometry args={[0.16, 0.004, 0.008]} />
          </mesh>
        </group>
      )}

      {/* --- FORK CAGE BAG --- */}
      {bag.category === "fork_cage_bag" && (
        <group position={[0.02, 0, 0]}>
          <mesh castShadow material={mainMaterial}>
            <cylinderGeometry args={[0.048, 0.048, 0.24, 16]} />
          </mesh>
          {/* Cargo Cage Backing Plate */}
          <mesh position={[-0.035, 0, 0]} material={strapMaterial}>
            <boxGeometry args={[0.01, 0.21, 0.06]} />
          </mesh>
          {/* Voile webbing straps */}
          <mesh position={[0, 0.06, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.05, 0.05, 0.015, 16]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.05, 0.05, 0.015, 16]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
