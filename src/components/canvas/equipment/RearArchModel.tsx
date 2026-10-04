"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RearArchHardwareModel, type RearArchHardwareProps } from "./RearArchHardwareModel";

const alloyFinish = new THREE.MeshStandardMaterial({
  color: "#586369", metalness: 0.82, roughness: 0.31,
});
const carbonFinish = new THREE.MeshStandardMaterial({
  color: "#20282b", metalness: 0.12, roughness: 0.62,
});
const receiverFinish = new THREE.MeshStandardMaterial({ color: "#111718", roughness: 0.53 });
const box = new THREE.BoxGeometry(1, 1, 1);

/** Original estimated rear arch, shared by complete racks and replacement parts.
 * Includes both legs, their continuous top bridge, axle feet/pins and optional
 * pannier receivers. Deck, seatpost connector and assembly mass belong to callers.
 * Shape and finish are illustrative, not manufacturer CAD or a fit assertion.
 */
export function RearArchModel({ dimensions: [l, h, d], carbon = false, pannierMounts = true,
  fastRelease = false, showDropouts = [true,true], showBushings = true, showBumpers = true,
}: RearArchHardwareProps & { pannierMounts?: boolean }) {
  const depth = carbon ? 0.014 : 0.010;
  const legGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outline = [
      [l * 0.06, -h * 0.46], [l * 0.13, -h * 0.46],
      [0, h * 0.40], [-l * 0.07, h * 0.45],
      [-l * 0.13, h * 0.45], [-l * 0.06, h * 0.36],
    ];
    outline.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: depth - 0.001, steps: 1, bevelEnabled: true,
      bevelSegments: 2, bevelSize: 0.0005, bevelThickness: 0.0005,
      curveSegments: 1,
    });
    geometry.translate(0, 0, -depth / 2 + 0.0005);
    return geometry;
  }, [l, h, depth]);
  useEffect(() => () => legGeometry.dispose(), [legGeometry]);
  const material = carbon ? carbonFinish : alloyFinish;
  return <group name={`original-rear-arch-${carbon ? "carbon" : "alloy"}`}>
    {/* Continuous bridge joins the two shoulder panels across the wheel. */}
    <mesh dispose={null} geometry={box} material={material}
      position={[-l * 0.087, h * 0.427, 0]}
      scale={[l * 0.06, h * 0.046, d * 0.8 + depth]} castShadow receiveShadow />
    <RearArchHardwareModel dimensions={[l,h,d]} carbon={carbon} fastRelease={fastRelease}
      showDropouts={showDropouts} showBushings={showBushings} showBumpers={pannierMounts && showBumpers}/>
    {[-1, 1].map(side => <group key={side}>
      <mesh dispose={null} geometry={legGeometry} material={material}
        position={[0, 0, side * d * 0.4]} castShadow receiveShadow />
      {pannierMounts && <mesh dispose={null} geometry={box} material={receiverFinish}
        position={[-l * 0.065, h * 0.36, side * d * 0.44]}
        scale={[0.04, 0.019, 0.017]} castShadow />}
    </group>)}
  </group>;
}
