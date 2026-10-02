"use client";

import { BagItem, SocketAnchor } from "@/types";
import { useRigStore } from "@/store/useRigStore";
import { getEquipmentPlacement } from "@/lib/equipmentGeometry";
import { EquipmentModel } from "./equipment/EquipmentModel";

interface BagMeshProps {
  socketId: string;
  bag: BagItem;
  anchor: SocketAnchor;
}

export function BagMesh({ socketId, bag, anchor }: BagMeshProps) {
  const warnings = useRigStore((s) => s.clearanceWarnings);
  const compressed = useRigStore((s) => s.dropperPostCompressed);
  const affected = warnings.filter((w) => w.affectedBagIds.includes(bag.id));
  const severe = affected.some((w) => w.severity === "error");
  const placement = getEquipmentPlacement(bag, anchor, compressed);
  const { length: l, height: h, depth: d } = placement.dimensions;
  return (
    <group
      position={placement.position}
      rotation={placement.rotation}
      name={`bag_${bag.id}_${socketId}`}
    >
      <group>
        <EquipmentModel bag={bag} />
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
  );
}
