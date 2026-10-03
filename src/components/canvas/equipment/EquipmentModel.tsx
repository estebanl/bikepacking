"use client";
import { RearArchModel } from "./RearArchModel";
import { ThirdPartyAdapterModel } from "./ThirdPartyAdapterModel";
import { CatalogBottleModel } from "./CatalogBottleModel";
import { isCatalogBottle } from "@/lib/catalogBottles";
import { isRearArchReplacement } from "@/lib/rearArchReplacement";
import { isBarCageBundle } from "@/lib/cargoStraps";

import { useEffect, useMemo, type ReactElement } from "react";
import * as THREE from "three";
import { isRearAccessory, RearAccessoryModel, type RearDeckDimensions } from "./RearAccessories";
import { BarCageModel } from "./BarCageModel";
import { CagePackModel } from "./CagePackModel";
import { CargoStrapModel } from "./CargoStrapModel";
import type { BagItem } from "@/types";
import {
  equipmentDimensions,
  equipmentKind,
  type Point3,
} from "@/lib/equipmentGeometry";

const webbing = new THREE.MeshStandardMaterial({
  color: "#151819",
  roughness: 0.97,
});
const seam = new THREE.MeshStandardMaterial({
  color: "#555e60",
  roughness: 0.95,
});
const metal = new THREE.MeshStandardMaterial({
  color: "#313b3e",
  metalness: 0.76,
  roughness: 0.34,
});
const buckle = new THREE.MeshStandardMaterial({
  color: "#111718",
  roughness: 0.53,
});
const silver = new THREE.MeshStandardMaterial({
  color: "#9ba5a7",
  metalness: 0.9,
  roughness: 0.25,
});
// Tiny original procedural weave: no image download or vendor artwork required.
const weavePixels = new Uint8Array(32 * 32 * 4);
for (let y = 0; y < 32; y++)
  for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4,
      v = 112 + (x % 4 < 2 !== y % 4 < 2 ? 22 : 0);
    weavePixels[i] = weavePixels[i + 1] = weavePixels[i + 2] = v;
    weavePixels[i + 3] = 255;
  }
const weave = new THREE.DataTexture(weavePixels, 32, 32, THREE.RGBAFormat);
weave.wrapS = weave.wrapT = THREE.RepeatWrapping;
weave.repeat.set(38, 18);
weave.needsUpdate = true;
const stitchMaterial = new THREE.LineBasicMaterial({
  color: "#4b5354",
  transparent: true,
  opacity: 0.7,
});
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const strapRing = new THREE.CylinderGeometry(1,1,1,24,1,true);
const clampRing = new THREE.TorusGeometry(.018,.004,6,16);
const unitTube = new THREE.CylinderGeometry(1, 1, 1, 8);

function Box({
  position = [0, 0, 0],
  size,
  material = webbing,
}: {
  position?: Point3;
  size: Point3;
  material?: THREE.Material;
}) {
  return (
    <mesh
      dispose={null}
      position={position}
      scale={size}
      geometry={unitBox}
      material={material}
      castShadow
      receiveShadow
    />
  );
}
function Rod({
  a,
  b,
  radius = 0.003,
  material = seam,
}: {
  a: Point3;
  b: Point3;
  radius?: number;
  material?: THREE.Material;
}) {
  const { midpoint, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      delta = end.clone().sub(start);
    return {
      midpoint: start.add(end).multiplyScalar(0.5),
      length: delta.length(),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.normalize(),
      ),
    };
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh
      dispose={null}
      position={midpoint}
      quaternion={quaternion}
      scale={[radius, length, radius]}
      geometry={unitTube}
      material={material}
      castShadow
    />
  );
}

/** Original sewn-panel shell. Polygon is extruded sideways with a small rolled edge, never a cylinder. */
function PanelShell({
  outline,
  depth,
  material,
}: {
  outline: number[][];
  depth: number;
  material: THREE.Material;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    outline.forEach(([x, y], i) =>
      i ? shape.lineTo(x, y) : shape.moveTo(x, y),
    );
    shape.closePath();
    const bevel = Math.min(
      0.006,
      depth * 0.07,
      ...outline
        .flat()
        .filter((v) => v !== 0)
        .map((v) => Math.abs(v) * 0.04),
    );
    const result = new THREE.ExtrudeGeometry(shape, {
      depth: Math.max(0.001, depth - bevel * 2),
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: bevel,
      bevelThickness: bevel,
      curveSegments: 1,
    });
    result.translate(0, 0, -depth / 2 + bevel);
    return result;
  }, [outline, depth]);
  const seamGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        outline.map(([x, y]) => new THREE.Vector3(x * 0.97, y * 0.97, 0)),
      ),
    [outline],
  );
  useEffect(
    () => () => {
      geometry.dispose();
    },
    [geometry],
  );
  useEffect(
    () => () => {
      seamGeometry.dispose();
    },
    [seamGeometry],
  );
  return (
    <>
      <mesh
        dispose={null}
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
      />
      {[-1, 1].map((side) => (
        <lineLoop
          dispose={null}
          key={side}
          position={[0, 0, side * depth * 0.501]}
          geometry={seamGeometry}
          material={stitchMaterial}
        />
      ))}
    </>
  );
}

export interface BarSupportEndpoints { clamps: [Point3,Point3]; ends: [Point3,Point3]; orientation: [number,number,number,number] }

export function EquipmentModel({ bag, barSupport, tubeRadius, rearDeck, strapEnvelope, strapRearExtension, barCageEnvelope, barCageParts, rearArchDimensions, rackParts, bottleCageBackSign }: { bag: BagItem; barSupport?: BarSupportEndpoints; tubeRadius?: number; rearDeck?: RearDeckDimensions; strapEnvelope?: Point3; strapRearExtension?: number; barCageEnvelope?: Point3; barCageParts?: {hideCradle?:boolean;hideClamps?:number[]}; rearArchDimensions?:Point3; bottleCageBackSign?:1|-1; rackParts?:{hideArch?:boolean;carbon?:boolean;pannierMounts?:boolean} }): ReactElement {
  const [l, h, d] = equipmentDimensions(bag),
    kind = equipmentKind(bag);
  const fabric = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: bag.colorHex || "#293031",
        roughness: 0.91,
        metalness: 0.01,
        bumpMap: weave,
        bumpScale: 0.00035,
      }),
    [bag.colorHex],
  );
  useEffect(() => () => fabric.dispose(), [fabric]);
  const outline = useMemo(() => {
    // All outlines occupy their physical fore/aft x vertical envelope; fabric bulge is in z.
    if (kind === "frame")
      return [
        [-l * 0.49, h * 0.47],
        [l * 0.49, h * 0.47],
        [l * 0.34, -h * 0.12],
        [-l * 0.3, -h * 0.47],
        [-l * 0.49, -h * 0.26],
      ];
    if (kind === "half_frame")
      return [
        [-l * 0.49, h * 0.45],
        [l * 0.49, h * 0.45],
        [l * 0.38, -h * 0.46],
        [-l * 0.42, -h * 0.46],
      ];
    if (kind === "seat_pack")
      return [
        [-l * 0.49, h * 0.3],
        [-l * 0.38, h * 0.47],
        [l * 0.49, h * 0.12],
        [l * 0.46, -h * 0.25],
        [-l * 0.4, -h * 0.47],
        [-l * 0.49, -h * 0.26],
      ];
    if (kind === "top_tube")
      return [
        [-l * 0.49, -h * 0.46],
        [l * 0.49, -h * 0.46],
        [l * 0.46, h * 0.38],
        [l * 0.26, h * 0.47],
        [-l * 0.34, h * 0.22],
        [-l * 0.49, -h * 0.05],
      ];
    return [
      [-l * 0.49, -h * 0.3],
      [-l * 0.36, -h * 0.47],
      [l * 0.36, -h * 0.47],
      [l * 0.49, -h * 0.3],
      [l * 0.47, h * 0.34],
      [l * 0.34, h * 0.47],
      [-l * 0.34, h * 0.47],
      [-l * 0.47, h * 0.34],
    ];
  }, [kind, l, h]);
  const hardware = [
    "rack",
    "cage",
    "mount",
    "strap",
    "fender",
    "accessory",
    "spare",
  ].includes(kind);
  if (isCatalogBottle(bag)) return <CatalogBottleModel item={bag} cageBackSign={bottleCageBackSign}/>;
  if (isRearArchReplacement(bag) && rearArchDimensions) return <RearArchModel dimensions={rearArchDimensions} carbon={rackParts?.carbon} pannierMounts={rackParts?.pannierMounts}/>;
  if (bag.id === "tailfin-20115-v1" && rearArchDimensions) return <ThirdPartyAdapterModel dimensions={rearArchDimensions}/>;
  if (bag.id === "tailfin-1012933-v1" || bag.id === "tailfin-1012929-v1") return <group name="illustrative-empty-bar-cage-accessory">
    <Box position={[0,.004,0]} size={[.022,.008,.027]} material={metal}/>
    <Rod a={[0,.004,0]} b={[.015,.028,0]} radius={.005} material={metal}/>
    {bag.id === "tailfin-1012933-v1" ? <>
      <Box position={[.015,.032,0]} size={[.035,.005,.035]} material={buckle}/>
      <mesh dispose={null} geometry={clampRing} material={buckle} position={[.015,.037,0]} rotation={[Math.PI/2,0,0]} scale={.8}/>
      {[-1,1].map(s=><Box key={s} position={[.015+s*.010,.038,0]} size={[.005,.004,.013]} material={metal}/>)}
    </> : <mesh dispose={null} geometry={unitTube} material={buckle} position={[.015,.037,0]} rotation={[Math.PI/2,0,0]} scale={[.011,.032,.011]} castShadow/>}
  </group>;
  if (bag.id === "tailfin-855555-v1" && barCageEnvelope) return <BarCageModel envelope={barCageEnvelope}/>;
  if (bag.id === "tailfin-855553-v1" && barCageEnvelope) return <BarCageModel envelope={barCageEnvelope} support={barSupport} hideCradle hideClamps={barCageParts?.hideClamps}/>;
  if (bag.id === "tailfin-825745-v1" && barCageEnvelope) return <BarCageModel envelope={barCageEnvelope} support={barSupport} {...barCageParts}/>;
  if (bag.id.startsWith("tailfin-56316-")) return <CagePackModel bag={bag} fabric={fabric}/>;
  if (bag.id.startsWith("tailfin-126220-") && strapEnvelope) return <CargoStrapModel envelope={strapEnvelope} rearExtension={strapRearExtension}/>;
  if (isRearAccessory(bag)) return <RearAccessoryModel bag={bag} rearDeck={rearDeck}/>;
  if (kind === "aeropack")
    return (
      <group>
        <group position={[0, -h * 0.15, 0]}>
          <RackModel dimensions={[l * 0.96, h * 0.65, d * 0.68]} {...rackParts}/>
        </group>
        <group position={[0, h * 0.32, 0]}>
          <EquipmentModel
            bag={{
              ...bag,
              visualKind: "trunk",
              dimensionsMm: {
                length: l * 1000,
                height: h * 0.36 * 1000,
                depth: d * 1000,
              },
            }}
          />
        </group>
      </group>
    );
  if (kind === "rack") return <RackModel dimensions={[l, h, d]} {...rackParts}/>;
  if (bag.id.startsWith("tailfin-42733-")) return <group name="illustrative-fork-collars">
    {/* Shared socket places local X outboard from the fork leg to cage backplate. */}
    {[-1,1].map(side=><group key={side}>
      <mesh dispose={null} geometry={strapRing} material={bag.id.endsWith("v2") ? metal : buckle} position={[0,side*.032,0]} scale={[.024,.012,.024]} castShadow/>
      <Rod a={[.022,side*.032,0]} b={[.033,side*.032,0]} radius={.005} material={metal}/>
      <Rod a={[.033,side*.032,0]} b={[.039,side*.032,0]} radius={.0035} material={silver}/>
    </group>)}
    <Box position={[.033,0,0]} size={[.005,.090,.025]} material={metal}/>
  </group>;
  if (bag.id.startsWith("tailfin-959100-") && tubeRadius) return <group name="illustrative-hydromount">
    <Box position={[.002,0,0]} size={[.006,h,d*.72]} material={buckle}/>
    {[-1,1].map(side=><group key={side}>
      <mesh dispose={null} geometry={strapRing} material={webbing} position={[-tubeRadius,side*h*.31,0]} scale={[tubeRadius+.002,.012,tubeRadius+.002]} castShadow/>
      <Box position={[.006,side*h*.31,0]} size={[.011,.019,d*.86]} material={buckle}/>
      <Rod a={[.010,side*.032,0]} b={[.015,side*.032,0]} radius={.0038} material={silver}/>
    </group>)}
  </group>;
  if (bag.id.startsWith("tailfin-675800-")) return <group name="illustrative-bottle-dropper">
    {/* Separate slotted low-profile rail and rubber backing; no cage is included. */}
    <Box position={[0,0,0]} size={[.001,h,d]} material={webbing}/>
    {[-1,1].map(side=><group key={side}>
      <Box position={[.0025,0,side*d*.36]} size={[.004,h,d*.20]} material={metal}/>
      <Box position={[.0025,side*h*.43,0]} size={[.004,h*.12,d*.82]} material={metal}/>
      <Rod a={[.003,side*.032,0]} b={[.007,side*.032,0]} radius={.0038} material={silver}/>
    </group>)}
    <Box position={[.0025,0,0]} size={[.004,h*.10,d*.82]} material={metal}/>
  </group>;
  if (bag.id === "tailfin-48952-v1") return <group name="cargo-load-chip">
    {/* Optional original L-shaped foot, separate from the cage and its mass. */}
    <Box position={[-l*.4,0,0]} size={[l*.12,h,d*.68]} material={metal}/>
    <Box position={[0,-h*.40,0]} size={[l,.004,d]} material={metal}/>
    <Rod a={[-l*.49,h*.16,0]} b={[-l*.23,h*.16,0]} radius={.0035} material={silver}/>
    <Box position={[l*.44,-h*.27,0]} size={[.003,h*.25,d*.76]} material={metal}/>
  </group>;
  if (kind === "cage")
    return (
      <group>
        {/* Plate lies along vertical/lateral axes; published cage depth is fore/aft. */}
        <Box
          position={[-l * 0.32, 0, 0]}
          size={[Math.min(0.004, l * 0.2), h, d * 0.25]}
          material={metal}
        />
        {[-0.32, 0.32].map((y) => (
          <group key={y}>
            <Box
              position={[-l * 0.3, h * y, 0]}
              size={[Math.min(0.004, l * 0.2), h * 0.055, d * 0.9]}
              material={metal}
            />
            {[-1, 1].map((s) => (
              <Rod
                key={s}
                a={[-l * 0.3, h * y, s * d * 0.42]}
                b={[l * 0.35, h * y, s * d * 0.42]}
                material={metal}
                radius={Math.min(0.003, l * 0.15)}
              />
            ))}
            <Box
              position={[-l * 0.1, h * y, 0]}
              size={[0.003, 0.006, 0.006]}
              material={silver}
            />
          </group>
        ))}
      </group>
    );
  if (bag.id === "tailfin-710832-v1" && barSupport) return <group name="illustrative-bar-support">
    {barSupport.clamps.map((clamp,i)=><group key={i}>
      <mesh dispose={null} geometry={clampRing} material={buckle} position={clamp} quaternion={barSupport.orientation} castShadow/>
      <Rod a={clamp} b={barSupport.ends[i]} radius={.005} material={metal}/>
      <Box position={barSupport.ends[i]} size={[.014,.026,.030]} material={buckle}/>
    </group>)}
    <Rod a={barSupport.ends[0]} b={barSupport.ends[1]} radius={.006} material={metal}/>
  </group>;
  if (hardware)
    return (
      <group>
        {kind === "strap" ? (
          <>
            <Box position={[0, 0, -d * 0.44]} size={[l, h, 0.003]} />
            <Box position={[0, 0, d * 0.44]} size={[l, h, 0.003]} />
            <Box position={[0, h * 0.5, 0]} size={[l, 0.003, d]} />
            <Box position={[0, -h * 0.5, 0]} size={[l, 0.003, d]} />
            <Box
              position={[0, h * 0.3, d * 0.46]}
              size={[l * 1.2, 0.022, 0.007]}
              material={buckle}
            />
          </>
        ) : kind === "fender" ? (
          <PanelShell
            outline={[
              [-l * 0.5, -h * 0.5],
              [-l * 0.25, h * 0.32],
              [0, h * 0.5],
              [l * 0.25, h * 0.32],
              [l * 0.5, -h * 0.5],
              [l * 0.25, h * 0.18],
              [0, h * 0.35],
              [-l * 0.25, h * 0.18],
            ]}
            depth={d}
            material={metal}
          />
        ) : (
          <>
            <Box size={[l, h * 0.65, d * 0.35]} material={metal} />
            {[-1, 1].map((s) => (
              <group key={s}>
                <Box
                  position={[s * l * 0.35, 0, d * 0.32]}
                  size={[l * 0.2, h, d * 0.44]}
                  material={buckle}
                />
                <Rod
                  a={[s * l * 0.35, 0, -d * 0.35]}
                  b={[s * l * 0.35, 0, d * 0.4]}
                  radius={Math.min(0.005, h * 0.12)}
                  material={silver}
                />
              </group>
            ))}
          </>
        )}
      </group>
    );

  const frame = kind === "frame" || kind === "half_frame";
  const roll = [
    "fork_pack",
    "pannier",
    "trunk",
    "aeropack",
    "seat_pack",
    "bar_bag",
  ].includes(kind);
  return (
    <group>
      <PanelShell outline={outline} depth={d * 0.9} material={fabric} />
      {kind === "trunk" && /fixed connector/i.test(bag.name) && <group name="illustrative-fixed-bag-connector">
        <Box position={[0,-h*.475,0]} size={[l*.55,.011,d*.58]} material={metal}/>
        {[-1,1].map(side=><Box key={side} position={[0,-h*.49,side*d*.23]} size={[l*.36,.018,.014]} material={buckle}/>)}
      </group>}
      {/* Reinforced underside and small separate reflective ID patch. */}
      <Box position={[0, -h * 0.44, 0]} size={[l * 0.69, 0.006, d * 0.88]} />
      {[-1, 1].map((s) => (
        <Box
          key={s}
          position={[-l * 0.23, -h * 0.15, s * d * 0.456]}
          size={[Math.min(0.034, l * 0.16), 0.006, 0.0015]}
          material={seam}
        />
      ))}
      {(frame || kind === "top_tube") && (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Box
                position={[0, h * 0.18, s * d * 0.46]}
                size={[l * 0.78, 0.006, 0.0025]}
              />
              <Box
                position={[l * 0.26, h * 0.145, s * d * 0.47]}
                size={[0.016, 0.018, 0.003]}
                material={buckle}
              />
              <Box
                position={[l * 0.24, h * 0.13, s * d * 0.49]}
                size={[0.024, 0.004, 0.003]}
                material={seam}
              />
            </group>
          ))}
          {frame && [-0.31, 0.22].map((x) => (
            <group key={x}>
              <Box
                position={[l * x, h * 0.49, 0]}
                size={[0.019, 0.007, d + 0.016]}
              />
              <Box
                position={[l * x, h * 0.39, d * 0.46]}
                size={[0.019, h * 0.19, 0.004]}
              />
            </group>
          ))}
        </>
      )}
      {kind === "top_tube" && [-.3,.22].map(x => <group key={x}>
        {[-1,1].map(side => <WebbingSegment key={side}
          a={[l*x,-h*.28,side*d*.46]}
          b={[l*x,-h*.46-.040,side*.021]}/>) }
        <Box position={[l*x,-h*.46-.040,0]} size={[.017,.003,.045]}/>
        <Box position={[l*x,-h*.35,d*.465]} size={[.023,.019,.006]} material={buckle}/>
      </group>)}
      {isBarCageBundle(bag) && barCageEnvelope && <BarCageModel envelope={barCageEnvelope} support={barSupport} {...barCageParts}/>}
      {kind === "bar_roll" && (
        <>
          {[-1, 1].map((s) => (
            <group key={s}>
              <Box
                position={[0, 0, s * d * 0.46]}
                size={[l * 0.72, h * 0.65, 0.014]}
                material={fabric}
              />
              <Box
                position={[l * 0.28, h * 0.1, s * d * 0.47]}
                size={[0.024, 0.024, 0.012]}
                material={buckle}
              />
              <Box
                position={[0, h * 0.46, s * d * 0.28]}
                size={[l * 0.78, 0.005, 0.024]}
              />
              <Box
                position={[l * 0.475, 0, s * d * 0.28]}
                size={[0.003, h * 0.68, 0.024]}
              />
              <Box
                position={[-l * 0.475, 0, s * d * 0.28]}
                size={[0.003, h * 0.68, 0.024]}
              />
              <Box
                position={[l * 0.475, h * 0.18, s * d * 0.28]}
                size={[0.008, 0.032, 0.031]}
                material={buckle}
              />
            </group>
          ))}
        </>
      )}
      {roll && (
        <>
          {/* Folded waterproof closure, flat woven compression straps, acetal buckles. */}
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              position={[0, h * (0.43 + i * 0.018), 0]}
              size={[l * 0.71, 0.005, d * (0.86 - i * 0.1)]}
              material={i === 1 ? webbing : fabric}
            />
          ))}
          {[-0.3, 0.3].map((x) => (
            <group key={x}>
              <Box
                position={[l * x, h * 0.485, 0]}
                size={[0.018, 0.003, d * 0.88]}
              />
              {[-1, 1].map((s) => (
                <group key={s}>
                  <Box
                    position={[l * x, 0, s * d * 0.462]}
                    size={[0.018, h * 0.81, 0.003]}
                  />
                  <Box
                    position={[l * x, h * 0.22, s * d * 0.47]}
                    size={[0.025, 0.028, 0.006]}
                    material={buckle}
                  />
                  <Box
                    position={[l * x, h * 0.22, s * d * 0.49]}
                    size={[0.012, 0.013, 0.002]}
                    material={seam}
                  />
                </group>
              ))}
            </group>
          ))}
          {kind === "pannier" && (
            <>
              <Box
                position={[0, h * 0.24, -d * 0.46]}
                size={[l * 0.7, 0.024, 0.012]}
                material={metal}
              />
              {[-0.27, 0.27].map((x) => (
                <Box
                  key={x}
                  position={[l * x, h * 0.3, -d * 0.44]}
                  size={[0.027, 0.05, 0.025]}
                  material={buckle}
                />
              ))}
            </>
          )}
          {kind === "seat_pack" && (
            <Box position={[l * 0.4, 0, 0]} size={[0.055, h * 0.5, d * 0.4]} />
          )}
        </>
      )}
    </group>
  );
}

function RackModel({ dimensions, hideArch = false, carbon = false, pannierMounts = true }: {
  dimensions: Point3;
  hideArch?: boolean;
  carbon?: boolean;
  pannierMounts?: boolean;
}) {
  const [l, h, d] = dimensions;
  return (
    <group>
      {!hideArch && <RearArchModel dimensions={dimensions} carbon={carbon} pannierMounts={pannierMounts} />}
      {/* Deck rails and crossbars stay with the host when its arch is replaced. */}
      {[-1, 1].map((s) => (
        <Rod key={s}
          a={[-l * 0.43, h * 0.44, s * d * 0.33]}
          b={[l * 0.44, h * 0.44, s * d * 0.33]}
          radius={0.006} material={metal}
        />
      ))}
      {[-0.4, -0.08, 0.4].map((x) => (
        <Rod key={x}
          a={[l * x, h * 0.44, -d * 0.36]}
          b={[l * x, h * 0.44, d * 0.36]}
          radius={0.005} material={metal}
        />
      ))}
      <Box position={[l * 0.44, h * 0.45, 0]}
        size={[0.025, 0.024, 0.048]} material={buckle}
      />
    </group>
  );
}

/** Original illustrative straps/supports, outside the measured fabric envelope. */
function WebbingSegment({a,b}: {a: Point3; b: Point3}) {
  const transform=useMemo(()=>{
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    return {center:start.add(end).multiplyScalar(.5),length:delta.length(),rotation:new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize())};
  },[...a,...b]);
  return <mesh dispose={null} geometry={unitBox} material={webbing} position={transform.center} quaternion={transform.rotation} scale={[.017,transform.length,.003]} castShadow/>;
}

/** Connects the modeled rack deck to the fixed outer seatpost, independent of dropper travel.
 * These original visual parts do not certify connector length, clamp or suspension compatibility.
 */
export function RackSeatpostConnector({a,b,seatAngle}: {a: Point3; b: Point3; seatAngle: number}) {
  return <group name="illustrative-rack-seatpost-connector">
    <Rod a={a} b={b} radius={.006} material={metal}/>
    <Box position={a} size={[.022,.018,.029]} material={buckle}/>
    <group position={b} rotation={[0,0,Math.PI/2-seatAngle]}>
      <mesh dispose={null} rotation={[Math.PI/2,0,0]} geometry={clampRing} material={buckle} castShadow/>
      <Box position={[-.016,0,0]} size={[.018,.023,.026]} material={metal}/>
      <Rod a={[-.018,0,-.018]} b={[-.018,0,.018]} radius={.003} material={silver}/>
    </group>
  </group>;
}
