import type {
  BikeModel,
  BikeSizeConfig,
  BagItem,
  ClearanceWarning,
} from "../types/index.ts";
import { findSocket, hasMountCapability } from "./sockets.ts";
import { getEquipmentBounds } from "./equipmentGeometry.ts";
export interface ClearanceCheckParams {
  bike: BikeModel;
  sizeConfig: BikeSizeConfig;
  mountedBags: Record<string, BagItem>;
  dropperPostCompressed: boolean;
  waterBottlesMounted: boolean;
  payloadEstimateGrams?: number;
}
export function evaluateClearances({
  bike,
  sizeConfig,
  mountedBags,
  dropperPostCompressed,
  waterBottlesMounted,
  payloadEstimateGrams = 0,
}: ClearanceCheckParams): ClearanceWarning[] {
  const warnings: ClearanceWarning[] = [];
  const capacity = Object.values(mountedBags).reduce(
    (n, b) => n + Math.max(0, b.volumeLiters ?? 0),
    0,
  );
  const safePayload = Number.isFinite(payloadEstimateGrams)
    ? Math.max(0, payloadEstimateGrams)
    : 0;
  for (const [id, bag] of Object.entries(mountedBags)) {
    const socket = findSocket(sizeConfig, id);
    if (!socket) continue;
    const add = (warning: Omit<ClearanceWarning, "affectedBagIds">) =>
      warnings.push({ ...warning, affectedBagIds: [bag.id] });
    const missing = [
      ...(bag.requires ?? []),
      ...(socket.requires ?? []),
    ].filter((r) => !hasMountCapability(mountedBags, id, r));
    if (missing.length)
      add({
        id: `dependency_${id}`,
        type: "dependency",
        severity: "error",
        message: `${bag.name} requires ${missing.join(", ")}.`,
      });
    if (
      socket.maxVolumeLiters !== undefined &&
      bag.volumeLiters !== null &&
      bag.volumeLiters > socket.maxVolumeLiters
    )
      add({
        id: `oversize_${id}`,
        type: "socket_conflict",
        severity: "warning",
        message: `${bag.name} exceeds the ${socket.maxVolumeLiters}L illustrative capacity for ${socket.name}. Check its actual shape and mounting.`,
      });
    const allocatedLoad =
      (bag.dryWeightGrams ?? 0) +
      (capacity
        ? (safePayload * Math.max(0, bag.volumeLiters ?? 0)) / capacity
        : 0);
    if (
      socket.maxLoadGrams !== undefined &&
      allocatedLoad > socket.maxLoadGrams
    )
      add({
        id: `overload_${id}`,
        type: "socket_conflict",
        severity: "error",
        message: `Estimated equipment and allocated payload exceed the ${socket.maxLoadGrams}g limit at ${socket.name}.`,
      });
    const bounds = getEquipmentBounds(bag, socket, dropperPostCompressed, {
      allowEstimate: false,
    });
    if (
      !bounds ||
      socket.verification !== "verified" ||
      bag.fitStatus !== "verified"
    )
      add({
        id: `unverified_${id}`,
        type: "fit_unverified",
        severity: "warning",
        message: `${bag.name}: ${!bounds ? "complete verified dimensions unavailable; preview size is estimated." : "placement is illustrative."} Verify loaded fit, hardware and all moving parts on the actual bicycle.`,
      });
    if (bounds && (id === "handlebar" || id === "seatpost")) {
      const front = id === "handlebar";
      const radius =
        (bike.wheelRadiusMm ??
          (front
            ? sizeConfig.clearanceZones.frontTireMaxRadiusMm
            : sizeConfig.clearanceZones.rearTireMaxRadiusMm)) / 1000;
      const gap = Math.round((bounds.min[1] - 2 * radius) * 1000);
      const minimum = front
        ? 20 + (bike.suspension?.frontTravelMm ?? 0)
        : 80 + (bike.suspension?.rearTravelMm ?? 0);
      if (gap < minimum)
        add({
          id: front ? "bar_tire_clearance" : "seat_tire_clearance",
          type: front ? "bar_tire" : "seat_tire",
          severity: gap < 0 ? "error" : "warning",
          ...(socket.verification === "verified" ? { measuredMm: gap } : {}),
          recommendedMinMm: minimum,
          message: `${bag.name} enters the conservative tire/motion envelope. ${socket.verification === "verified" ? `Calculated static gap ${gap}mm. ` : ""}Allow at least ${minimum}mm here and verify full travel with the packed bag; this preview cannot certify clearance.`,
        });
    }
  }
  const frame = mountedBags.frameTriangle;
  if (
    frame &&
    waterBottlesMounted &&
    (frame.category === "frame_full" || (frame.volumeLiters ?? 0) > 4.2)
  )
    warnings.push({
      id: "frame_bottle_conflict",
      type: "frame_bottle",
      severity: frame.category === "frame_full" ? "error" : "warning",
      affectedBagIds: [frame.id],
      message:
        "Frame luggage may obstruct bottles and the storage hatch. Check cage access and remove bottles when necessary.",
    });
  const equipment = Object.entries(mountedBags)
    .filter(
      ([, bag]) =>
        !["rack", "mount", "cargo_cage", "accessory", "spare"].includes(
          bag.category,
        ),
    )
    .map(([id, bag]) => ({
      id,
      bag,
      bounds: findSocket(sizeConfig, id)
        ? getEquipmentBounds(
            bag,
            findSocket(sizeConfig, id)!,
            dropperPostCompressed,
            { allowEstimate: false },
          )
        : null,
    }));
  for (let a = 0; a < equipment.length; a++)
    for (let b = a + 1; b < equipment.length; b++) {
      const first = equipment[a],
        second = equipment[b];
      if (!first.bounds || !second.bounds) continue;
      if (
        [0, 1, 2].every(
          (i) =>
            Math.min(first.bounds!.max[i], second.bounds!.max[i]) -
              Math.max(first.bounds!.min[i], second.bounds!.min[i]) >
            0.015,
        )
      )
        warnings.push({
          id: `collision_${first.id}_${second.id}`,
          type: "bag_collision",
          severity: "warning",
          affectedBagIds: [first.bag.id, second.bag.id],
          message: `${first.bag.name} and ${second.bag.name} have overlapping preview envelopes. Check actual shapes and strap access.`,
        });
    }
  return warnings;
}
