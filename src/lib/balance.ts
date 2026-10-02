import type {
  BikeModel,
  BikeSizeConfig,
  BagItem,
  RigMetrics,
} from "../types/index.ts";
import { findSocket, getWheelbaseMm } from "./sockets.ts";
export function calculateRigMetrics(
  bike: BikeModel,
  size: BikeSizeConfig,
  mounted: Record<string, BagItem>,
  payload: number,
): RigMetrics {
  const wheelbase = getWheelbaseMm(bike, size) / 1000,
    rear = -wheelbase / 2;
  const entries = Object.entries(mounted).filter(([id]) =>
    findSocket(size, id, mounted),
  );
  const known = (value: number | null) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : 0;
  const dry = entries.reduce(
    (sum, [, bag]) => sum + known(bag.dryWeightGrams),
    0,
  );
  const capacity = entries.reduce(
    (sum, [, bag]) => sum + known(bag.volumeLiters),
    0,
  );
  payload = Number.isFinite(payload) ? Math.max(0, payload) : 0;
  let moment = bike.baseWeightGrams * wheelbase * 0.45;
  for (const [id, bag] of entries)
    moment +=
      (known(bag.dryWeightGrams) +
        (capacity ? (payload * known(bag.volumeLiters)) / capacity : 0)) *
      (findSocket(size, id, mounted)!.position[0] - rear);
  if (!capacity) moment += payload * wheelbase * 0.45;
  const total = bike.baseWeightGrams + dry + payload;
  const front = Math.round(moment / wheelbase),
    ratio = total ? Math.round((moment / wheelbase / total) * 100) : 45;
  return {
    bikeBaseWeightGrams: bike.baseWeightGrams,
    totalBagsDryWeightGrams: dry,
    payloadEstimateGrams: payload,
    totalRigWeightGrams: total,
    totalCapacityLiters: Math.round(capacity * 10) / 10,
    frontAxleWeightGrams: front,
    rearAxleWeightGrams: total - front,
    frontRatioPercent: ratio,
    rearRatioPercent: 100 - ratio,
    balanceStatus:
      ratio < 38 ? "rear_heavy" : ratio > 48 ? "front_heavy" : "balanced",
    unknownWeightItemIds: entries
      .filter(([, b]) => b.dryWeightGrams === null)
      .map(([, b]) => b.id),
    unknownCapacityItemIds: entries
      .filter(([, b]) => b.volumeLiters === null && !["mount", "cargo_cage"].includes(b.category) && b.visualKind !== "rack")
      .map(([, b]) => b.id),
  };
}
