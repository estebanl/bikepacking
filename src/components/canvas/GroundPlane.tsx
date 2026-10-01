"use client";

import React from "react";
import { ContactShadows } from "@react-three/drei";

export function GroundPlane() {
  return (
    <group position={[0, 0, 0]}>
      {/* Contact Shadows under the bike */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.65}
        scale={4}
        blur={1.8}
        far={2}
        resolution={512}
        color="#000000"
      />

      {/* Studio Floor Grid */}
      <gridHelper
        args={[8, 16, "#475569", "#334155"]}
        position={[0, -0.001, 0]}
      />
    </group>
  );
}
