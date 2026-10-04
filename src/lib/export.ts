import { getMassUncertainHostIds, getMassUncertainHostSockets } from "./balance.ts";
import type { BikeModel, BagItem, RigMetrics } from "../types/index.ts";

export const MAX_PAYLOAD_GRAMS = 50_000;
export function clampPayloadGrams(value: number): number {
  return Number.isFinite(value)
    ? Math.min(MAX_PAYLOAD_GRAMS, Math.max(0, Math.round(value)))
    : 0;
}
const known = (value: number | null, suffix = "") =>
  value === null ? "Unknown" : `${value}${suffix}`;
const safeSocket = (key: string) =>
  /^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(key) &&
  !["__proto__", "prototype", "constructor"].includes(key);
function unknownNote(mounted: Record<string, BagItem>): string {
  const missing = Object.entries(mounted).filter(
    ([, b]) => b.dryWeightGrams === null || b.volumeLiters === null,
  );
  const replaced = getMassUncertainHostIds(mounted).size ? " Modified host assembly mass is excluded because removed hardware mass is unknown." : "";
  return missing.length
    ? `Known subtotals only. Unknown weight or capacity: ${missing.map(([socket, b]) => `${b.name} (${socket})`).join(", ")}. Unknown mass is omitted from axle estimates.${replaced}`
    : "";
}

export interface RigManifestData {
  bike: BikeModel;
  sizeKey: string;
  mountedBags: Record<string, BagItem>;
  metrics: RigMetrics;
  notes?: string;
}

export function generateCsvManifest({
  bike,
  sizeKey,
  mountedBags,
  metrics,
}: RigManifestData): string {
  const rows: string[][] = [
    [
      "Type",
      "Category",
      "Brand",
      "Model",
      "Volume (L)",
      "Dry Weight (g)",
      "Waterproof Rating",
      "Direct Store Link",
    ],
    [
      "Complete Bicycle",
      bike.category.toUpperCase(),
      bike.brand,
      `${bike.name} (${sizeKey})`,
      "-",
      bike.baseWeightGrams.toString(),
      "-",
      bike.sourceUrl ?? "",
    ],
  ];

  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    rows.push([
      `Bag (${socketId})`,
      bag.category,
      bag.brand,
      bag.name,
      known(bag.volumeLiters),
      known(getMassUncertainHostSockets(mountedBags).has(socketId) ? null : bag.dryWeightGrams),
      bag.waterproofRating || "N/A",
      bag.productUrl,
    ]);
  });

  if (metrics.payloadEstimateGrams > 0) {
    rows.push([
      "Gear Payload",
      "Payload",
      "Custom Gear",
      "Sleep / Cook / Water Payload",
      "-",
      metrics.payloadEstimateGrams.toString(),
      "-",
      "-",
    ]);
  }

  const uncertainty = unknownNote(mountedBags);
  if (uncertainty) rows.push(["SPECIFICATION NOTICE", uncertainty]);

  // Summary Row
  rows.push([]);
  rows.push([
    "TOTAL RIG SUMMARY",
    "",
    "",
    "",
    metrics.totalCapacityLiters.toString(),
    metrics.totalRigWeightGrams.toString(),
  ]);
  rows.push([
    "FRONT / REAR AXLE RATIO",
    "",
    "",
    "",
    `${metrics.frontRatioPercent}% / ${metrics.rearRatioPercent}% (${metrics.balanceStatus})`,
  ]);

  return rows
    .map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function generateMarkdownManifest({
  bike,
  sizeKey,
  mountedBags,
  metrics,
}: RigManifestData): string {
  let md = `# 🚲 Bikepacking Rig Manifest: ${bike.brand} ${bike.name} (${sizeKey})\n\n`;
  md += `**Total Rig Weight:** ${(metrics.totalRigWeightGrams / 1000).toFixed(2)} kg (${metrics.totalRigWeightGrams} g)\n`;
  md += `**Total Bag Capacity:** ${metrics.totalCapacityLiters} Liters\n`;
  md += `**Axle Weight Balance:** ${metrics.frontRatioPercent}% Front / ${metrics.rearRatioPercent}% Rear (${metrics.balanceStatus.replace("_", " ")})\n\n`;

  const uncertainty = unknownNote(mountedBags);
  if (uncertainty) md += `**Specification notice:** ${uncertainty}\n\n`;
  md += `### 📦 Itemized Gear Breakdown\n\n`;
  md += `| Position | Brand | Product | Volume | Dry Weight | Price | Store Link |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  md += `| **Complete Bicycle** | ${bike.brand} | ${bike.name} (${sizeKey}) | - | ${(bike.baseWeightGrams / 1000).toFixed(2)} kg | - | ${bike.sourceUrl ? `[Bike Info](${bike.sourceUrl})` : "—"} |\n`;

  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    md += `| ${socketId} | ${bag.brand} | ${bag.name} | ${known(bag.volumeLiters, " L")} | ${known(getMassUncertainHostSockets(mountedBags).has(socketId) ? null : bag.dryWeightGrams, " g")} | ${bag.price ? `${bag.price.currency} ${bag.price.amount}` : known(bag.priceUsd, " USD")} | [View Product](${bag.productUrl}) |\n`;
  });

  if (metrics.payloadEstimateGrams > 0) {
    md += `| Payload | Custom | Estimated Gear & Water | - | ${(metrics.payloadEstimateGrams / 1000).toFixed(2)} kg | - | - |\n`;
  }

  md += `\n*Generated with 3D Bikepacking Rig Configurator*\n`;
  return md;
}

export function serializeRigToUrlQuery(params: {
  bikeId: string;
  sizeKey: string;
  mountedBags: Record<string, BagItem>;
  payloadGrams: number;
  dropper: boolean;
  bottles: boolean;
}): string {
  const bagsParam = Object.entries(params.mountedBags)
    .filter(([socket]) => safeSocket(socket))
    .map(([socket, bag]) => `${socket}:${bag.id}`)
    .join(",");

  const searchParams = new URLSearchParams();
  searchParams.set("b", params.bikeId);
  searchParams.set("s", params.sizeKey);
  if (bagsParam) searchParams.set("bags", bagsParam);
  if (clampPayloadGrams(params.payloadGrams) > 0)
    searchParams.set("p", clampPayloadGrams(params.payloadGrams).toString());
  if (params.dropper) searchParams.set("drop", "1");
  if (!params.bottles) searchParams.set("bot", "0");

  return searchParams.toString();
}

export function deserializeRigFromUrlQuery(
  queryString: string,
  allBags: BagItem[],
): {
  bikeId?: string;
  sizeKey?: string;
  mountedBags: Record<string, BagItem>;
  payloadGrams?: number;
  dropper?: boolean;
  bottles?: boolean;
} {
  const params = new URLSearchParams(
    queryString.startsWith("?") ? queryString.slice(1) : queryString,
  );
  const bikeId = params.get("b") || undefined;
  const sizeKey = params.get("s") || undefined;
  const payloadGrams = params.has("p")
    ? clampPayloadGrams(Number(params.get("p")))
    : undefined;
  const dropper = params.get("drop") === "1";
  const bottles = params.get("bot") !== "0";

  const mountedBags: Record<string, BagItem> = {};
  const bagsParam = params.get("bags");
  if (bagsParam) {
    const pairs = bagsParam.split(",").slice(0, 100);
    pairs.forEach((pair) => {
      const [socket, bagId] = pair.split(":");
      if (socket && safeSocket(socket) && bagId) {
        const bag = allBags.find((b) => b.id === bagId);
        if (bag) {
          mountedBags[socket] = bag;
        }
      }
    });
  }

  return { bikeId, sizeKey, mountedBags, payloadGrams, dropper, bottles };
}
