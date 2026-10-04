"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { SOFT_TRUNK_BASE_CENTER_RATIO, SOFT_TRUNK_BASE_THICKNESS } from "@/lib/equipmentGeometry";

type Dimensions = [number, number, number];
type Kind = "bar_roll" | "trunk";
const clothPixels = new Uint8Array(32 * 32 * 4);
for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
  const i = (y * 32 + x) * 4;
  const v = 124 + ((x % 4 < 2) !== (y % 4 < 2) ? 14 : -8);
  clothPixels[i] = clothPixels[i + 1] = clothPixels[i + 2] = v;
  clothPixels[i + 3] = 255;
}
const cloth = new THREE.DataTexture(clothPixels, 32, 32, THREE.RGBAFormat);
cloth.wrapS = cloth.wrapT = THREE.RepeatWrapping;
cloth.repeat.set(28, 16);
cloth.needsUpdate = true;
const webbing = new THREE.MeshStandardMaterial({ color: "#1d2525", roughness: .98 });
const strapMaterial = new THREE.MeshStandardMaterial({ color: "#19211f", roughness: .98, side: THREE.DoubleSide });
const stitch = new THREE.MeshStandardMaterial({ color: "#535b56", roughness: .96 });
const buckle = new THREE.MeshStandardMaterial({ color: "#11191a", roughness: .58 });
const reflective = new THREE.MeshStandardMaterial({ color: "#a3aaa0", roughness: .65 });
const box = new THREE.BoxGeometry(1, 1, 1);
const cylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
const power = (n: number, p: number) => Math.sign(n) * Math.pow(Math.abs(n), p);

/** Estimated packed envelopes, not manufacturer CAD. Sweep is lateral for a bar roll. */
function surface(kind: Kind, dimensions: Dimensions, t: number, angle: number, offset = 0): THREE.Vector3 {
  const [l, h, d] = dimensions;
  if (kind === "bar_roll") {
    // Full centre, gently gathered shoulders and compressed end closures.
    const shoulder = 1 - .35 * Math.pow(Math.abs(t), 6);
    const ripple = 1 + .007 * Math.sin(angle * 5 + t * 8) * Math.sin(Math.PI * t);
    return new THREE.Vector3(
      (.474 * l * shoulder + offset) * power(Math.cos(angle), .88) * ripple,
      (.462 * h * shoulder + offset) * power(Math.sin(angle), .88) * ripple,
      t * d * .454,
    );
  }
  const shoulder = 1 - .26 * Math.pow(Math.abs(t), 8);
  const y = power(Math.sin(angle), .51);
  // Taper the top toward the folded opening, retaining a supported flat underside.
  const topTaper = y > 0 ? 1 - .15 * y * y : 1;
  return new THREE.Vector3(
    t * l * .476,
    (.433 * h * shoulder + offset) * y - h * .008,
    (.462 * d * shoulder * topTaper + offset) * power(Math.cos(angle), .51),
  );
}

function shellGeometry(kind: Kind, dims: Dimensions) {
  const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
  const rings = 20, segments = 40;
  for (let i = 0; i <= rings; i++) for (let j = 0; j <= segments; j++) {
    const p = surface(kind, dims, i / rings * 2 - 1, j / segments * Math.PI * 2);
    positions.push(p.x, p.y, p.z); uvs.push(j / segments, i / rings);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < segments; j++) {
    const a = i * (segments + 1) + j, b = a + segments + 1;
    // The lateral sweep and fore-aft sweep have opposite winding.
    if (kind === "bar_roll") indices.push(a, a + 1, b, a + 1, b + 1, b);
    else indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  for (const end of [0, rings]) {
    const p = kind === "bar_roll" ? [0, 0, (end ? 1 : -1) * dims[2] * .454] : [(end ? 1 : -1) * dims[0] * .476, -dims[1] * .008, 0];
    const center = positions.length / 3; positions.push(...p); uvs.push(.5, .5);
    for (let j = 0; j < segments; j++) {
      const a = end * (segments + 1) + j;
      if ((end === 0) === (kind === "bar_roll")) indices.push(center, a + 1, a);
      else indices.push(center, a, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function ribbonGeometry(kind: Kind, dimensions: Dimensions, center: number, width: number) {
  const positions: number[] = [], indices: number[] = [];
  for (let j = 0; j <= 40; j++) for (const edge of [-1, 1]) {
    const angle = j / 40 * Math.PI * 2;
    const p = surface(kind, dimensions, center + edge * width, angle, .0013);
    // Compression straps pass over the folded mouth rather than through it.
    if (kind === "trunk") p.y += dimensions[1] * .063 * Math.pow(Math.max(0, Math.sin(angle)), 16);
    positions.push(p.x, p.y, p.z);
  }
  for (let j = 0; j < 40; j++) {
    const a = j * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Self-contained cloth body/details; external rack/cage/connector hardware stays with its host. */
export function SoftLuggageModel({ kind, dimensions, color = "#343b37" }: {
  kind: Kind; dimensions: Dimensions; color?: string;
}) {
  const [l, h, d] = dimensions;
  const resources = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({ color, roughness: .93, bumpMap: cloth, bumpScale: .00024 });
    const panelMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(.86), roughness: .97 });
    const shell = shellGeometry(kind, [l, h, d]);
    const ribbons = [-.56, .56].map(t => ribbonGeometry(kind, [l, h, d], t, .012 / (kind === "bar_roll" ? d : l)));
    const seams = [-.82, .82].map(t => {
      const points = Array.from({ length: 49 }, (_, i) => surface(kind, [l, h, d], t, i / 48 * Math.PI * 2, .0008));
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, .00065, 4, false);
    });
    return { material, panelMaterial, shell, ribbons, seams };
  }, [kind, l, h, d, color]);
  useEffect(() => () => {
    resources.material.dispose(); resources.panelMaterial.dispose(); resources.shell.dispose();
    resources.ribbons.forEach(g => g.dispose()); resources.seams.forEach(g => g.dispose());
  }, [resources]);
  return <group name={`illustrative-soft-${kind}`} dispose={null}>
    <mesh geometry={resources.shell} material={resources.material} castShadow receiveShadow />
    {resources.ribbons.map((geometry, i) => <mesh key={`strap-${i}`} geometry={geometry} material={strapMaterial} castShadow />)}
    {resources.seams.map((geometry, i) => <mesh key={`seam-${i}`} geometry={geometry} material={stitch} />)}
    {kind === "bar_roll" ? <>
      {[-1, 1].map(side => <group key={side}>
        {/* Flattened twice-rolled ends, with a small exposed dark fold. */}
        {[0, 1].map(fold => <mesh key={fold} geometry={cylinder} material={fold ? resources.material : resources.panelMaterial}
          position={[0, h * (.06 + fold * .08), side * d * (.454 + fold * .012)]}
          rotation={[0, 0, Math.PI / 2]} scale={[h * .055, l * .62, d * .023]} castShadow />)}
        <mesh geometry={box} material={webbing} position={[l * .19, h * .13, side * d * .478]} scale={[l * .23, .018, .004]} castShadow />
        <mesh geometry={box} material={buckle} position={[l * .3, h * .13, side * d * .48]} scale={[.02, .026, .007]} castShadow />
        <mesh geometry={box} material={buckle} position={[l * .46, h * .07, side * d * .254]} scale={[.008, .032, .031]} castShadow />
      </group>)}
      <mesh geometry={box} material={reflective} position={[l * .478, 0, 0]} scale={[.0015, .006, .036]} />
    </> : <>
      {/* Curled lengthwise opening is separate from the full soft side panels. */}
      {[0, 1, 2].map(fold => <mesh key={fold} geometry={cylinder} material={fold === 1 ? resources.panelMaterial : resources.material}
        position={[0, h * (.414 + fold * .022), d * (.035 - fold * .035)]}
        rotation={[0, 0, Math.PI / 2]} scale={[h * .03, l * (.83 - fold * .025), d * .045]} castShadow />)}
      {[-1, 1].map(side => <group key={side}>
        {[-.56, .56].map(t => <mesh key={t} geometry={box} material={buckle}
          position={[t * l * .476, h * .12, side * d * .456]} scale={[.026, .032, .009]} castShadow />)}
        <mesh geometry={box} material={reflective} position={[-l * .16, -h * .14, side * d * .459]} scale={[.035, .007, .002]} />
      </group>)}
      <mesh geometry={box} material={webbing} position={[0, -h * SOFT_TRUNK_BASE_CENTER_RATIO, 0]} scale={[l * .67, SOFT_TRUNK_BASE_THICKNESS, d * .64]} receiveShadow />
    </>}
  </group>;
}
