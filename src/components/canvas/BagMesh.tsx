"use client";

import * as THREE from "three";
import { BagItem, SocketAnchor } from "@/types";
import { useRigStore } from "@/store/useRigStore";
import { getEquipmentPlacement, equipmentKind, rotateEquipmentPoint, type Point3 } from "@/lib/equipmentGeometry";
import { EquipmentModel, RackSeatpostConnector, type BarSupportEndpoints } from "./equipment/EquipmentModel";

import { getBottleMountPose } from "@/lib/bottleMounts";
import { getBikeGeometry } from "@/lib/bikeGeometry";

interface BagMeshProps {
  socketId: string;
  bag: BagItem;
  anchor: SocketAnchor;
}

export function BagMesh({ socketId, bag, anchor }: BagMeshProps) {
  const bike = useRigStore(s => s.currentBike);
  const mounted = useRigStore(s => s.mountedBags);
  const size = useRigStore(s => s.currentSizeConfig);
  const warnings = useRigStore((s) => s.clearanceWarnings);
  const compressed = useRigStore((s) => s.dropperPostCompressed);
  const affected = warnings.filter((w) => w.affectedBagIds.includes(bag.id));
  const severe = affected.some((w) => w.severity === "error");
  const placement = getEquipmentPlacement(bag, anchor, compressed);
  const { length: l, height: h, depth: d } = placement.dimensions;
  const kind=equipmentKind(bag);
  const isRack=kind === "rack" || kind === "aeropack";
  const tubeRadius=(socketId === "bottleMountDown" || socketId === "bottleMountSeat") ? getBottleMountPose(bike,size,socketId).radius : undefined;
  const g=getBikeGeometry(bike,size);
  const seatAngle=size.geometry.seatTubeAngleDeg*Math.PI/180;
  // Clamp the original fixed outer post. A dropper's moving stanchion is not a rack attachment.
  const clamp: Point3=[g.seatCluster[0]-.045*Math.cos(seatAngle),g.seatCluster[1]+.045*Math.sin(seatAngle),0];
  const connectorLocal: Point3=kind === "aeropack" ? [l*.96*.44,h*(-.15+.65*.44),0] : [l*.44,h*.44,0];
  const connectorOffset=rotateEquipmentPoint(connectorLocal,placement.rotation);
  const connectorStart=connectorOffset.map((v,i)=>v+placement.position[i]) as Point3;
  let barSupport: BarSupportEndpoints | undefined;
  if (bag.id === "tailfin-710832-v1") {
    const inverse=new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation)).invert();
    const toLocal=(p: Point3): Point3 => new THREE.Vector3(...p).sub(new THREE.Vector3(...placement.position)).applyQuaternion(inverse).toArray() as Point3;
    const barBag=mounted.handlebar;
    let support: Point3=[size.sockets.handlebar.position[0]+.03,size.sockets.handlebar.position[1]-.075,0];
    if (barBag) {
      const mountedPlacement=getEquipmentPlacement(barBag,size.sockets.handlebar,compressed);
      const rearOffset=rotateEquipmentPoint([-mountedPlacement.dimensions.length/2+.005,0,0],mountedPlacement.rotation);
      support=rearOffset.map((v,i)=>v+mountedPlacement.position[i]) as Point3;
    }
    barSupport={
      clamps:[toLocal([g.stemClamp[0],g.stemClamp[1]+.001,-.045]),toLocal([g.stemClamp[0],g.stemClamp[1]+.001,.045])],
      ends:[toLocal([support[0],support[1],support[2]-.055]),toLocal([support[0],support[1],support[2]+.055])],
      orientation:inverse.toArray() as [number,number,number,number],
    };
  }
  return <>
    {isRack && <RackSeatpostConnector a={connectorStart} b={clamp} seatAngle={seatAngle}/>}
    <group
      position={placement.position}
      rotation={placement.rotation}
      name={`bag_${bag.id}_${socketId}`}
    >
      <group>
        <EquipmentModel bag={bag} barSupport={barSupport} tubeRadius={tubeRadius} />
        {/* Warnings stay legible without changing opaque textile into glowing plastic. */}
        {affected.length > 0 && (
          <mesh position={[-l * 0.27, h * 0.21, d * 0.52]}>
            <boxGeometry args={[0.016, 0.018, 0.002]} />
            <meshStandardMaterial
              color={severe ? "#b94333" : "#c18b35"}
              roughness={0.75}
            />
          </mesh>
        )}
      </group>
    </group>
  </>;
}
