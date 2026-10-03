import type {
  BikeModel,
  BikeSizeConfig,
  BagItem,
  RigMetrics,
} from "../types/index.ts";
import { findSocket, getWheelbaseMm } from "./sockets.ts";
import { getModifiedFrameHostSockets } from "./frameAttachments.ts";
import { getModifiedAxleHostSockets } from "./axleSpareAssembly.ts";
import { getModifiedRearArchHardwareHostSockets } from "./rearArchHardware.ts";

/** Included hardware has no separately verified mass to subtract from its host. */
export function getMassUncertainHostSockets(mounted: Record<string, BagItem>): Set<string> {
  const hasReplacement =
    mounted.barCageReplacement?.id === "tailfin-855555-v1" ||
    mounted.barCageClampLeft?.id === "tailfin-855553-v1" ||
    mounted.barCageClampRight?.id === "tailfin-855553-v1";
  const hosts = getModifiedFrameHostSockets(mounted);
  getModifiedAxleHostSockets(mounted).forEach(socket => hosts.add(socket));
  getModifiedRearArchHardwareHostSockets(mounted).forEach(socket => hosts.add(socket));
  if (hasReplacement) {
    if (mounted.barMount?.id === "tailfin-825745-v1") hosts.add("barMount");
    if (/^tailfin-825745-v[234]$/.test(mounted.handlebar?.id ?? "")) hosts.add("handlebar");
  }
  if (mounted.rearRack && /^tailfin-(642|641|591|446|43567|43576)-v1$/.test(mounted.rearArchReplacement?.id ?? "")) {
    hosts.add("rearRack");
  }
  if (mounted.rearRack && (mounted.rearSeatConnector?.id === "tailfin-1032164-v1" ||
    /^tailfin-(1032167|48964)-v1$/.test(mounted.rearSeatStrap?.id ?? "") ||
    mounted.rearTopStay?.id === "tailfin-56062-v1")) hosts.add("rearRack");
  for (const side of ["Left", "Right"]) {
    const hostSocket = `fork${side}_0`;
    const hardware = mounted[`forkPackHardware${side}`]?.id ?? "";
    const hook = mounted[`forkPackHook${side}`]?.id;
    if (/^tailfin-(655674|972100)-v[12]$/.test(mounted[hostSocket]?.id ?? "") &&
      (/^tailfin-(661740|661731|675876)-v1$/.test(hardware) || hook === "tailfin-676061-v1")) hosts.add(hostSocket);
    const rearHostSocket = `pannier${side}`;
    const rearHost = mounted[rearHostSocket];
    if (rearHost && (/^tailfin-655674-v[12]$/.test(rearHost.id) ||
      mounted[`rearPannierUpper${side}`]?.id === "tailfin-48947-v1" ||
      mounted[`rearPannierLower${side}`]?.id === "tailfin-652020-v1")) hosts.add(rearHostSocket);
  }
  return hosts;
}

export function getMassUncertainHostIds(mounted: Record<string, BagItem>): Set<string> {
  return new Set(Array.from(getMassUncertainHostSockets(mounted), socket => mounted[socket].id));
}

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
  const uncertainHosts = getMassUncertainHostSockets(Object.fromEntries(entries));
  const known = (value: number | null) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0
      ? value
      : 0;
  const knownDryMass = (socketId: string, bag: BagItem) =>
    uncertainHosts.has(socketId) ? 0 : known(bag.dryWeightGrams);
  const dry = entries.reduce(
    (sum, [id, bag]) => sum + knownDryMass(id, bag),
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
      (knownDryMass(id, bag) +
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
      .filter(([id, b]) => b.dryWeightGrams === null || uncertainHosts.has(id))
      .map(([, b]) => b.id),
    unknownCapacityItemIds: entries
      .filter(([, b]) => b.volumeLiters === null && !["mount", "cargo_cage", "accessory"].includes(b.category) && b.visualKind !== "rack")
      .map(([, b]) => b.id),
  };
}
