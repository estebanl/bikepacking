"use client";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";
import { getBikeGeometry, interpolate, type Point3 } from "@/lib/bikeGeometry";
import { WheelMesh } from "./WheelMesh";
import { DrivetrainMesh } from "./DrivetrainMesh";
import { CockpitMesh } from "./CockpitMesh";
import { SaddleMesh } from "./SaddleMesh";
import { CarbonSpar, Rod, Cable, FrameDecal } from "./BicycleParts";
export function BikeMesh() {
  const bike = useRigStore((s) => s.currentBike),
    size = useRigStore((s) => s.currentSizeConfig),
    compressed = useRigStore((s) => s.dropperPostCompressed),
    bottles = useRigStore((s) => s.waterBottlesMounted);
  const g = getBikeGeometry(bike, size, compressed),
    {
      bb,
      rearAxle: rear,
      frontAxle: front,
      seatCluster: seat,
      headTubeTop: ht,
      headTubeBottom: hb,
      saddleBase,
      stemClamp,
    } = g;
  const full = !!bike.suspension?.rearTravelMm,
    color = bike.colorHex;
  const lateral = (p: Point3, z: number): Point3 => [p[0], p[1], z];
  const topEnd: Point3 = [ht[0], ht[1] - 0.018, 0],
    lowerHead: Point3 = [hb[0], hb[1] + 0.025, 0];
  const bottleCenter = interpolate(bb, lowerHead, 0.43);
  const downAngle = Math.atan2(lowerHead[1] - bb[1], lowerHead[0] - bb[0]);
  bottleCenter[0] -= Math.sin(downAngle) * 0.069;
  bottleCenter[1] += Math.cos(downAngle) * 0.069;
  const pivot: Point3 = [bb[0] - 0.035, bb[1] + 0.08, 0],
    link: Point3 = [seat[0] - 0.018, seat[1] - 0.045, 0];
  return (
    <group name="bikeRigRoot">
      <CarbonSpar
        points={[seat, interpolate(seat, topEnd, 0.5), topEnd]}
        radii={[0.022, 0.018, 0.032]}
        color={color}
        depth={0.75}
      />
      <CarbonSpar
        points={[bb, [bb[0] + 0.11, bb[1] + 0.09, 0], lowerHead]}
        radii={[0.037, 0.037, 0.045]}
        color={color}
        depth={0.75}
      />
      <FrameDecal label={bike.brand} a={bb} b={lowerHead} />
      <CarbonSpar
        points={[bb, interpolate(bb, seat, 0.48), seat]}
        radii={[0.029, 0.023, 0.02]}
        color={color}
      />
      <CarbonSpar
        points={[hb, ht]}
        radii={[0.033, 0.028]}
        color={color}
        depth={0.95}
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <CarbonSpar
            points={[
              lateral(full ? pivot : bb, side * 0.028),
              [bb[0] - 0.16, bb[1] + 0.017, side * 0.065],
              lateral(rear, side * 0.074),
            ]}
            radii={[0.02, 0.014, 0.011]}
            color={color}
          />
          <CarbonSpar
            points={[
              lateral(full ? link : interpolate(seat, bb, 0.12), side * 0.026),
              [rear[0] + 0.16, rear[1] + 0.16, side * 0.063],
              lateral(rear, side * 0.074),
            ]}
            radii={[0.012, 0.009, 0.011]}
            color={color}
          />
          {full ? (
            <>
              <Rod
                a={lateral(hb, side * 0.045)}
                b={lateral(interpolate(hb, front, 0.5), side * 0.055)}
                r={0.016}
                color="#aa9770"
              />
              <CarbonSpar
                points={[
                  lateral(interpolate(hb, front, 0.37), side * 0.055),
                  lateral(interpolate(hb, front, 0.72), side * 0.055),
                  lateral(front, side * 0.055),
                ]}
                radii={[0.023, 0.023, 0.016]}
                color="#252c2e"
                depth={0.9}
              />
            </>
          ) : (
            <CarbonSpar
              points={[
                lateral(hb, side * 0.021),
                lateral(interpolate(hb, front, 0.52), side * 0.052),
                lateral(front, side * 0.055),
              ]}
              radii={[0.027, 0.018, 0.01]}
              color={color}
              depth={0.6}
            />
          )}
        </group>
      ))}
      {full && (
        <group name="rearSuspension">
          <Rod
            a={lateral(link, -0.035)}
            b={lateral(link, 0.035)}
            r={0.018}
            color="#525c60"
          />
          <Rod
            a={lateral(pivot, -0.04)}
            b={lateral(pivot, 0.04)}
            r={0.014}
            color="#697275"
          />
          <Rod
            a={link}
            b={interpolate(topEnd, seat, 0.32)}
            r={0.018}
            color="#202426"
          />
          <Rod
            a={link}
            b={interpolate(link, interpolate(topEnd, seat, 0.32), 0.42)}
            r={0.011}
            color="#b7bfc1"
          />
          <Rod a={lateral(hb, -0.055)} b={lateral(hb, 0.055)} r={0.022} />
          <Cable
            points={[
              lateral(interpolate(hb, front, 0.48), -0.055),
              [front[0] - 0.11, front[1] + 0.27, 0],
              lateral(interpolate(hb, front, 0.48), 0.055),
            ]}
            r={0.014}
          />
        </group>
      )}
      <WheelMesh
        position={rear}
        isRear
        radius={g.wheelRadius}
        tireWidth={g.tireWidth}
        mtb={full}
      />
      <WheelMesh
        position={front}
        radius={g.wheelRadius}
        tireWidth={g.tireWidth}
        mtb={full}
      />
      <DrivetrainMesh
        bbPosition={new THREE.Vector3(...bb)}
        rearAxlePosition={new THREE.Vector3(...rear)}
      />
      <CockpitMesh
        headTubeTop={new THREE.Vector3(...ht)}
        stemClamp={new THREE.Vector3(...stemClamp)}
        handlebarType={bike.handlebarType}
      />
      <SaddleMesh
        seatCluster={new THREE.Vector3(...seat)}
        saddleBase={new THREE.Vector3(...saddleBase)}
      />
      <Cable
        points={[
          [stemClamp[0] + 0.06, stemClamp[1] - 0.015, 0.2],
          [ht[0] + 0.1, ht[1] - 0.13, 0.075],
          [hb[0], hb[1], 0.032],
          lateral(interpolate(hb, bb, 0.6), 0.026),
        ]}
      />
      {bottles && (
        <group
          position={bottleCenter}
          rotation={[0, 0, downAngle - Math.PI / 2]}
        >
          <mesh position={[0, 0.035, 0]}>
            <cylinderGeometry args={[0.032, 0.034, 0.17, 20]} />
            <meshStandardMaterial color="#e4e5db" roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.135, 0]}>
            <cylinderGeometry args={[0.022, 0.026, 0.03, 16]} />
            <meshStandardMaterial color="#22282c" />
          </mesh>
          <Cable
            points={[
              [-0.04, -0.025, -0.027],
              [0.035, -0.025, -0.037],
              [0.042, 0.07, -0.025],
              [0.04, 0.075, 0.025],
              [0.035, -0.025, 0.037],
              [-0.04, -0.025, 0.027],
            ]}
            r={0.003}
          />
        </group>
      )}
    </group>
  );
}
