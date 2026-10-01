import type { BikeModel, BagItem, RigMetrics } from "../types/index.ts";

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
    ["Type", "Category", "Brand", "Model", "Volume (L)", "Dry Weight (g)", "Waterproof Rating", "Direct Store Link"],
    [
      "Bicycle Frame",
      bike.category.toUpperCase(),
      bike.brand,
      `${bike.name} (${sizeKey})`,
      "-",
      bike.baseWeightGrams.toString(),
      "-",
      "https://bikepacking.com",
    ],
  ];

  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    rows.push([
      `Bag (${socketId})`,
      bag.category,
      bag.brand,
      bag.name,
      bag.volumeLiters.toString(),
      bag.dryWeightGrams.toString(),
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

  // Summary Row
  rows.push([]);
  rows.push(["TOTAL RIG SUMMARY", "", "", "", metrics.totalCapacityLiters.toString(), metrics.totalRigWeightGrams.toString()]);
  rows.push(["FRONT / REAR AXLE RATIO", "", "", "", `${metrics.frontRatioPercent}% / ${metrics.rearRatioPercent}% (${metrics.balanceStatus})`]);

  return rows.map((r) => r.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
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

  md += `### 📦 Itemized Gear Breakdown\n\n`;
  md += `| Position | Brand | Product | Volume | Dry Weight | Price | Store Link |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;
  md += `| **Bike Frame** | ${bike.brand} | ${bike.name} (${sizeKey}) | - | ${(bike.baseWeightGrams / 1000).toFixed(2)} kg | - | [Bike Info](https://bikepacking.com) |\n`;

  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    md += `| ${socketId} | ${bag.brand} | ${bag.name} | ${bag.volumeLiters} L | ${bag.dryWeightGrams} g | \$${bag.priceUsd} | [View Product](${bag.productUrl}) |\n`;
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
    .map(([socket, bag]) => `${socket}:${bag.id}`)
    .join(",");

  const searchParams = new URLSearchParams();
  searchParams.set("b", params.bikeId);
  searchParams.set("s", params.sizeKey);
  if (bagsParam) searchParams.set("bags", bagsParam);
  if (params.payloadGrams > 0) searchParams.set("p", params.payloadGrams.toString());
  if (params.dropper) searchParams.set("drop", "1");
  if (!params.bottles) searchParams.set("bot", "0");

  return searchParams.toString();
}

export function deserializeRigFromUrlQuery(
  queryString: string,
  allBags: BagItem[]
): {
  bikeId?: string;
  sizeKey?: string;
  mountedBags: Record<string, BagItem>;
  payloadGrams?: number;
  dropper?: boolean;
  bottles?: boolean;
} {
  const params = new URLSearchParams(queryString.startsWith("?") ? queryString.slice(1) : queryString);
  const bikeId = params.get("b") || undefined;
  const sizeKey = params.get("s") || undefined;
  const payloadGrams = params.has("p") ? parseInt(params.get("p")!, 10) : undefined;
  const dropper = params.get("drop") === "1";
  const bottles = params.get("bot") !== "0";

  const mountedBags: Record<string, BagItem> = {};
  const bagsParam = params.get("bags");
  if (bagsParam) {
    const pairs = bagsParam.split(",");
    pairs.forEach((pair) => {
      const [socket, bagId] = pair.split(":");
      if (socket && bagId) {
        const bag = allBags.find((b) => b.id === bagId);
        if (bag) {
          mountedBags[socket] = bag;
        }
      }
    });
  }

  return { bikeId, sizeKey, mountedBags, payloadGrams, dropper, bottles };
}
