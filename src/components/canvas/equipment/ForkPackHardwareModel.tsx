"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Point3 } from "@/lib/equipmentGeometry";

const metal = new THREE.MeshStandardMaterial({ color: "#485358", metalness: 0.74, roughness: 0.36 });
const dark = new THREE.MeshStandardMaterial({ color: "#192123", metalness: 0.25, roughness: 0.55 });
const rubber = new THREE.MeshStandardMaterial({ color: "#101516", roughness: 0.91 });
const silver = new THREE.MeshStandardMaterial({ color: "#9da9ac", metalness: 0.86, roughness: 0.27 });
const box = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
const boltHead = new THREE.CylinderGeometry(0.0042, 0.0042, 0.0025, 6);
const washer = new THREE.TorusGeometry(0.0047, 0.001, 6, 16);

function Block({ position, size, material = metal }: {
  position: Point3; size: Point3; material?: THREE.Material;
}) {
  return <mesh dispose={null} geometry={box} material={material} position={position} scale={size} castShadow receiveShadow />;
}
function Bar({ a, b, radius = 0.004 }: { a: Point3; b: Point3; radius?: number }) {
  const pose = useMemo(() => {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const delta = end.clone().sub(start);
    return { center: start.add(end).multiplyScalar(0.5), length: delta.length(),
      rotation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()) };
  }, [...a, ...b]);
  return <mesh dispose={null} geometry={cylinder} material={metal} position={pose.center}
    quaternion={pose.rotation} scale={[radius, pose.length, radius]} castShadow />;
}

/** Original estimated Fork Pack attachment hardware in the bag's local pose.
 * +X faces out from the fork; callers mirror/rotate the entire assembly together.
 * Depicts a mounting plate, upper receiver and lower hook/bumper, without claiming
 * exact manufacturer dimensions, bolt routing, fork approval or measured clearance.
 * Spare parts replace these same pieces; they do not add another complete mount.
 */
export function ForkPackHardwareModel({ dimensions: [l, h, d], showMount = true, showHook = true }: {
  dimensions: Point3; showMount?: boolean; showHook?: boolean;
}) {
  const x = -l * 0.5 - 0.010;
  const plateHeight = Math.min(0.22, h * 0.7);
  const width = Math.min(0.075, d * 0.7);
  const top = plateHeight * 0.42;
  const hookY = -h * 0.40;
  const plateBottom = -plateHeight * 0.5;
  return <group name="original-fork-pack-attachment-hardware">
    {showMount && <group name="fork-pack-mount-plate">
      {/* Shallow structure stays immediately behind the fabric envelope. */}
      <Block position={[x, 0, 0]} size={[0.006, plateHeight, width]} material={dark} />
      {[-1, 1].map(side => <Block key={side} position={[x - 0.0035, 0, side * width * 0.43]}
        size={[0.004, plateHeight * 0.90, 0.005]} />)}
      {[-0.33, 0, 0.33].map(level => <group key={level} position={[x - 0.0045, plateHeight * level, 0]}>
        <mesh dispose={null} geometry={washer} material={silver} rotation={[0, Math.PI / 2, 0]} castShadow />
        <mesh dispose={null} geometry={boltHead} material={dark} rotation={[0, 0, Math.PI / 2]} castShadow />
      </group>)}
      {/* Crossed upper receiver grips the pack's upper attachment interface. */}
      <Bar a={[x - 0.006, top - 0.018, -width * 0.48]} b={[x - 0.006, top + 0.018, width * 0.48]} />
      <Bar a={[x - 0.006, top - 0.018, width * 0.48]} b={[x - 0.006, top + 0.018, -width * 0.48]} />
      <Block position={[x + 0.005, top, 0]} size={[0.012, 0.019, width * 0.60]} material={rubber} />
      <Block position={[x + 0.006, plateBottom + 0.014, 0]} size={[0.013, 0.025, width * 0.75]} material={rubber} />
    </group>}
    {showHook && <group name="fork-pack-lower-hook">
      {/* Stem reaches the common plate datum so separate hook and mount agree. */}
      <Block position={[x, (plateBottom + hookY) / 2, 0]}
        size={[0.007, Math.abs(plateBottom - hookY) + 0.016, width * 0.27]} />
      <Block position={[x + 0.008, hookY, 0]} size={[0.022, 0.008, width * 0.48]} />
      <Block position={[x + 0.018, hookY + 0.009, 0]} size={[0.006, 0.025, width * 0.48]} material={dark} />
      <Block position={[x + 0.009, hookY + 0.005, 0]} size={[0.012, 0.004, width * 0.44]} material={rubber} />
    </group>}
  </group>;
}
