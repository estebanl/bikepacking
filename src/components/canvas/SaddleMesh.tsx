"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Rod, Cable } from "./BicycleParts";
export function SaddleMesh({
  seatCluster,
  saddleBase,
}: {
  seatCluster: THREE.Vector3;
  saddleBase: THREE.Vector3;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.12, -0.015);
    shape.bezierCurveTo(-0.145, -0.07, -0.08, -0.086, -0.045, -0.059);
    shape.bezierCurveTo(0.005, -0.025, 0.08, -0.02, 0.125, -0.018);
    shape.quadraticCurveTo(0.145, 0, 0.125, 0.018);
    shape.bezierCurveTo(0.08, 0.02, 0.005, 0.025, -0.045, 0.059);
    shape.bezierCurveTo(-0.08, 0.086, -0.145, 0.07, -0.12, 0.015);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.013,
      bevelEnabled: true,
      bevelSize: 0.007,
      bevelThickness: 0.005,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 12,
    });
    const p = geometry.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      p.setZ(
        i,
        p.getZ(i) -
          0.011 * Math.exp(-Math.pow((x + 0.105) / 0.045, 2)) -
          0.006 * Math.exp(-Math.pow((x - 0.125) / 0.04, 2)),
      );
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  return (
    <group>
      <Rod
        a={seatCluster.toArray()}
        b={saddleBase.toArray()}
        r={0.014}
        color="#303839"
      />
      <group position={saddleBase}>
        {[-1, 1].map((s) => (
          <Cable
            key={s}
            points={[
              [-0.08, -0.005, s * 0.027],
              [-0.03, -0.021, s * 0.02],
              [0.055, -0.015, s * 0.017],
              [0.08, 0.004, s * 0.02],
            ]}
            r={0.003}
            color="#7e8585"
          />
        ))}
        <mesh
          geometry={geometry}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0.022, 0]}
          castShadow
        >
          <meshStandardMaterial color="#262d2d" roughness={0.85} />
        </mesh>
        <mesh position={[-0.02, 0.03, 0]} scale={[0.06, 0.001, 0.006]}>
          <sphereGeometry args={[1, 20, 8]} />
          <meshStandardMaterial color="#101819" />
        </mesh>
      </group>
    </group>
  );
}
