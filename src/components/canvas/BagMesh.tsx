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
    return clearanceWarnings.some(
      (w) => w.affectedBagIds.includes(bag.id) && w.severity === "error"
    );
  }, [clearanceWarnings, bag.id]);

  // Adjust seatpost socket height when dropper post is compressed
  const effectivePosition: [number, number, number] = useMemo(() => {
    if (socketId === "seatpost" && dropperCompressed) {
      return [anchor.position[0] + 0.04, anchor.position[1] - 0.14, anchor.position[2]];
    }
    return anchor.position;
  }, [anchor.position, socketId, dropperCompressed]);

  // Base bag colors
  const bagBaseColor = bag.colorHex || "#1e293b";

  // Materials
  const mainMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: hasError ? "#dc2626" : hasWarning ? "#ea580c" : bagBaseColor,
        roughness: 0.6,
        metalness: 0.12,
        emissive: hasError ? "#991b1b" : hasWarning ? "#7c2d12" : "#000000",
        emissiveIntensity: hasError ? 0.75 : hasWarning ? 0.45 : 0,
      }),
    [hasError, hasWarning, bagBaseColor]
  );

  const strapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0f172a",
        roughness: 0.8,
        metalness: 0.2,
      }),
    []
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: hasError ? "#f87171" : "#f59e0b", // Gold / hi-vis or alert red
        roughness: 0.4,
      }),
    [hasError]
  );

  const bungeeCordMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#38bdf8", // Sky blue reflective bungee cord
        roughness: 0.5,
      }),
    []
  );

  const buckleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#020617",
        roughness: 0.3,
        metalness: 0.5,
      }),
    []
  );

  return (
    <group position={effectivePosition} name={`bag_${bag.id}_${socketId}`}>
      {/* ================= 1. HIGH-DETAIL SEAT PACK ================= */}
      {bag.category === "seat_pack" && (
        <group position={[-0.04, 0.01, 0]}>
          {/* Main Tapered Body extending backwards (-X) and upwards */}
          <group position={[-0.19, 0.08, 0]} rotation={[0, 0, -Math.PI / 2 + 0.38]}>
            {/* Tapered Pack Shell */}
            <mesh castShadow material={mainMaterial}>
              <cylinderGeometry args={[0.042, 0.092, 0.38, 24]} />
            </mesh>
            {/* Rear Roll-Top Fold */}
            <mesh position={[0, -0.20, 0]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
              <cylinderGeometry args={[0.02, 0.02, 0.11, 16]} />
            </mesh>
            {/* Side-Release Buckles at Roll-Top */}
            <mesh position={[0.045, -0.19, 0.045]} material={buckleMaterial}>
              <boxGeometry args={[0.012, 0.022, 0.016]} />
            </mesh>
            <mesh position={[0.045, -0.19, -0.045]} material={buckleMaterial}>
              <boxGeometry args={[0.012, 0.022, 0.016]} />
            </mesh>
            {/* Compression Webbing Straps */}
            <mesh position={[0, -0.06, 0]} material={strapMaterial}>
              <cylinderGeometry args={[0.076, 0.076, 0.022, 20]} />
            </mesh>
            <mesh position={[0, 0.06, 0]} material={strapMaterial}>
              <cylinderGeometry args={[0.060, 0.060, 0.022, 20]} />
            </mesh>
            {/* Top Crisscross Bungee Cord for Jacket/Gear on top ridge of pack */}
            <mesh position={[0.070, -0.02, 0]} rotation={[Math.PI / 2, 0.45, 0]} material={bungeeCordMaterial}>
              <cylinderGeometry args={[0.002, 0.002, 0.08, 8]} />
            </mesh>
            <mesh position={[0.070, -0.02, 0]} rotation={[Math.PI / 2, -0.45, 0]} material={bungeeCordMaterial}>
              <cylinderGeometry args={[0.002, 0.002, 0.08, 8]} />
            </mesh>
          </group>

          {/* Heavy-Duty Hypalon Holster Wrap clamped to Seatpost */}
          <mesh position={[-0.03, 0.02, 0]} rotation={[0, 0, 0.35]} material={strapMaterial}>
            <boxGeometry args={[0.075, 0.085, 0.095]} />
          </mesh>
          {/* Saddle Rail Loop Webbing */}
          <mesh position={[-0.02, 0.06, 0]} material={strapMaterial}>
            <boxGeometry args={[0.04, 0.016, 0.06]} />
          </mesh>
        </group>
      )}

      {/* ================= 2. HIGH-DETAIL HANDLEBAR ROLL ================= */}
      {bag.category === "handlebar_roll" && (
        <group position={[0.06, -0.04, 0]}>
          {/* Cylindrical Double-Ended Dry Bag */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow material={mainMaterial}>
            <cylinderGeometry args={[0.08, 0.08, 0.40, 24]} />
          </mesh>
          {/* Left Roll-Top Fold & Buckle */}
          <mesh position={[0, 0, 0.205]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.082, 0.082, 0.016, 20]} />
          </mesh>
          <mesh position={[0.06, 0, 0.205]} material={buckleMaterial}>
            <boxGeometry args={[0.014, 0.022, 0.012]} />
          </mesh>
          {/* Right Roll-Top Fold & Buckle */}
          <mesh position={[0, 0, -0.205]} rotation={[Math.PI / 2, 0, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.082, 0.082, 0.016, 20]} />
          </mesh>
          <mesh position={[0.06, 0, -0.205]} material={buckleMaterial}>
            <boxGeometry args={[0.014, 0.022, 0.012]} />
          </mesh>
          {/* Front Daisy Chain Webbing Bar */}
          <mesh position={[0.082, 0, 0]} material={strapMaterial}>
            <boxGeometry args={[0.004, 0.024, 0.28]} />
          </mesh>
          {/* Front Bungee Cord Crisscross */}
          <mesh position={[0.086, 0, 0]} rotation={[0.4, 0, 0]} material={bungeeCordMaterial}>
            <cylinderGeometry args={[0.002, 0.002, 0.20, 8]} />
          </mesh>
          <mesh position={[0.086, 0, 0]} rotation={[-0.4, 0, 0]} material={bungeeCordMaterial}>
            <cylinderGeometry args={[0.002, 0.002, 0.20, 8]} />
          </mesh>
          {/* Handlebar Mounting Spacers */}
          <mesh position={[-0.05, 0.03, 0.08]} material={strapMaterial}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
          </mesh>
          <mesh position={[-0.05, 0.03, -0.08]} material={strapMaterial}>
            <boxGeometry args={[0.04, 0.04, 0.04]} />
          </mesh>
        </group>
      )}

      {/* ================= 3. HALF FRAME BAG ================= */}
      {bag.category === "frame_half" && (
        <group position={[0.03, 0.06, 0]} rotation={[0, 0, 0.22]}>
          {/* Main Pack Body */}
          <mesh castShadow material={mainMaterial}>
            <boxGeometry args={[0.38, 0.11, 0.055]} />
          </mesh>
          {/* Weatherproof Zipper Track */}
          <mesh position={[0, 0.01, 0.029]} material={accentMaterial}>
            <boxGeometry args={[0.32, 0.006, 0.002]} />
          </mesh>
          {/* Zipper Pull Tab */}
          <mesh position={[0.10, 0.01, 0.032]} material={bungeeCordMaterial}>
            <boxGeometry args={[0.015, 0.008, 0.004]} />
          </mesh>
          {/* Top Tube Velcro Straps */}
          <mesh position={[-0.12, 0.06, 0]} material={strapMaterial}>
            <boxGeometry args={[0.025, 0.012, 0.058]} />
          </mesh>
          <mesh position={[0.12, 0.06, 0]} material={strapMaterial}>
            <boxGeometry args={[0.025, 0.012, 0.058]} />
          </mesh>
        </group>
      )}

      {/* ================= 4. FULL FRAME BAG ================= */}
      {bag.category === "frame_full" && (
        <group position={[-0.01, 0.02, 0]}>
          {/* Upper Section */}
          <mesh position={[0.01, 0.05, 0]} rotation={[0, 0, 0.22]} castShadow material={mainMaterial}>
            <boxGeometry args={[0.38, 0.10, 0.055]} />
          </mesh>
          {/* Lower Wedge (following downtube down to BB) */}
          <mesh position={[-0.05, -0.06, 0]} rotation={[0, 0, -0.08]} castShadow material={mainMaterial}>
            <boxGeometry args={[0.22, 0.14, 0.055]} />
          </mesh>
          {/* Dual Zippers */}
          <mesh position={[0.01, 0.06, 0.029]} rotation={[0, 0, 0.22]} material={accentMaterial}>
            <boxGeometry args={[0.32, 0.005, 0.002]} />
          </mesh>
          <mesh position={[-0.05, -0.04, 0.029]} material={accentMaterial}>
            <boxGeometry args={[0.18, 0.005, 0.002]} />
          </mesh>
          {/* Hydration Hose Exit Port */}
          <mesh position={[0.16, 0.07, 0.028]} rotation={[Math.PI / 2, 0, 0]} material={strapMaterial}>
            <cylinderGeometry args={[0.008, 0.008, 0.004, 12]} />
          </mesh>
        </group>
      )}

      {/* ================= 5. TOP TUBE BAG ================= */}
      {bag.category === "top_tube" && (
        <group position={[0, 0.042, 0]} rotation={[0, 0, 0.22]}>
          <mesh castShadow material={mainMaterial}>
            <boxGeometry args={[0.20, 0.075, 0.042]} />
          </mesh>
          {/* Top Zipper */}
          <mesh position={[0, 0.039, 0]} material={accentMaterial}>
            <boxGeometry args={[0.16, 0.004, 0.008]} />
          </mesh>
          {/* Front Steerer Tube Wrap */}
          <mesh position={[0.10, 0, 0]} material={strapMaterial}>
            <boxGeometry args={[0.01, 0.04, 0.045]} />
          </mesh>
        </group>
      )}

      {/* ================= 6. FORK CAGE BAG ================= */}
      {bag.category === "fork_cage_bag" && (
        <group position={[0, 0, 0]} rotation={[0, 0, -0.32]}>
          {/* Cylindrical Drybag */}
          <mesh castShadow material={mainMaterial}>
            <cylinderGeometry args={[0.046, 0.046, 0.23, 18]} />
          </mesh>
          {/* Aluminum 3-Bolt Cargo Cage Backplate */}
          <mesh position={[-0.035, 0, 0]} material={strapMaterial}>
            <boxGeometry args={[0.008, 0.20, 0.05]} />
          </mesh>
          {/* Voile-Style Polyurethane Webbing Straps */}
          <mesh position={[0, 0.06, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.048, 0.048, 0.015, 18]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} material={accentMaterial}>
            <cylinderGeometry args={[0.048, 0.048, 0.015, 18]} />
          </mesh>
        </group>
      )}
    </group>
  );
}
