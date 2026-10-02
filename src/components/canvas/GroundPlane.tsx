"use client";

export function GroundPlane() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <shadowMaterial transparent opacity={0.12} />
      </mesh>
      <gridHelper args={[8, 32, "#bdc9c0", "#d3dcd5"]} position={[0, -0.02, 0]} />
    </group>
  );
}
