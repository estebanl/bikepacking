"use client";
import { useMemo, useEffect } from "react";
import * as THREE from "three";
import type { Point3 } from "@/lib/bikeGeometry";
/** Elliptical, variable-section swept carbon mould. Original geometry; no licensed assets. */
export function CarbonSpar({
  points,
  radii,
  color,
  depth = 0.75,
}: {
  points: Point3[];
  radii: number[];
  color: string;
  depth?: number;
}) {
  const geometry = useMemo(() => {
    const path = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const steps = 20,
      sides = 10,
      pos: number[] = [],
      indices: number[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps,
        p = path.getPoint(t),
        tangent = path.getTangent(t);
      const normal = new THREE.Vector3(-tangent.y, tangent.x, 0).normalize();
      const at = t * (radii.length - 1),
        k = Math.min(Math.floor(at), radii.length - 2),
        r = THREE.MathUtils.lerp(radii[k], radii[k + 1], at - k);
      for (let j = 0; j < sides; j++) {
        const a = (j / sides) * Math.PI * 2;
        pos.push(
          p.x + normal.x * Math.cos(a) * r,
          p.y + normal.y * Math.cos(a) * r,
          p.z + Math.sin(a) * r * depth,
        );
      }
    }
    for (let i = 0; i < steps; i++)
      for (let j = 0; j < sides; j++) {
        const a = i * sides + j,
          b = i * sides + ((j + 1) % sides),
          c = a + sides,
          d = b + sides;
        indices.push(a, b, c, b, d, c);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [points, radii, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow>
      <meshPhysicalMaterial
        color={color}
        roughness={0.33}
        metalness={0.08}
        clearcoat={0.55}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}
export function Rod({
  a,
  b,
  r = 0.008,
  color = "#20292c",
}: {
  a: Point3;
  b: Point3;
  r?: number;
  color?: string;
}) {
  const av = new THREE.Vector3(...a),
    bv = new THREE.Vector3(...b),
    mid = av.clone().add(bv).multiplyScalar(0.5),
    q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      bv.clone().sub(av).normalize(),
    );
  return (
    <mesh position={mid} quaternion={q} castShadow>
      <cylinderGeometry args={[r, r, av.distanceTo(bv), 12]} />
      <meshStandardMaterial color={color} roughness={0.35} metalness={0.6} />
    </mesh>
  );
}
export function Cable({
  points,
  r = 0.002,
  color = "#252829",
}: {
  points: Point3[];
  r?: number;
  color?: string;
}) {
  const path = useMemo(
    () =>
      new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    [points],
  );
  return (
    <mesh>
      <tubeGeometry args={[path, 24, r, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}
/** Plain text identification, drawn locally; not a copied manufacturer logo asset. */
export function FrameDecal({
  label,
  a,
  b,
}: {
  label: string;
  a: Point3;
  b: Point3;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.font = "italic 800 88px Arial";
    ctx.fillStyle = "#eee9dc";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.toUpperCase(), 512, 64, 990);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [label]);
  useEffect(() => () => texture.dispose(), [texture]);
  const mid = new THREE.Vector3(...a).lerp(new THREE.Vector3(...b), 0.56),
    angle = Math.atan2(b[1] - a[1], b[0] - a[0]);
  return (
    <>
      {[-1, 1].map((s) => (
        <mesh
          key={s}
          position={[mid.x, mid.y, s * 0.034]}
          rotation={[0, s < 0 ? Math.PI : 0, s < 0 ? -angle : angle]}
        >
          <planeGeometry args={[0.29, 0.038]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}
    </>
  );
}
