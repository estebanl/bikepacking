import type { BagItem } from "../types/index";

/** Shared original soft-trunk reinforced floor; dimensions are rendering estimates. */
export const SOFT_TRUNK_BASE_CENTER_RATIO = .444;
export const SOFT_TRUNK_BASE_THICKNESS = .004;
export function softTrunkBaseOffset(height: number): number {
  return height * SOFT_TRUNK_BASE_CENTER_RATIO + SOFT_TRUNK_BASE_THICKNESS / 2;
}

export type EquipmentVisualKind = NonNullable<BagItem["visualKind"]>;
export type Point3 = [number, number, number];

/** Visual envelopes only. These fallback values are never compatibility evidence. */
const FALLBACK_MM: Record<EquipmentVisualKind, Point3> = {
  frame: [430, 260, 70],
  half_frame: [430, 125, 65],
  top_tube: [230, 100, 70],
  seat_pack: [400, 180, 180],
  bar_roll: [180, 180, 400],
  bar_bag: [170, 230, 300],
  fork_pack: [135, 300, 130],
  pannier: [260, 370, 160],
  trunk: [400, 230, 240],
  rack: [400, 390, 180],
  aeropack: [450, 620, 240],
  cage: [85, 205, 95],
  mount: [65, 50, 45],
  strap: [25, 120, 90],
  fender: [440, 45, 65],
  accessory: [90, 80, 50],
  spare: [45, 35, 25],
};
export function equipmentKind(bag: BagItem): EquipmentVisualKind {
  if (bag.visualKind) return bag.visualKind;
  const categoryKinds: Partial<
    Record<BagItem["category"], EquipmentVisualKind>
  > = {
    frame_full: "frame",
    frame_half: "half_frame",
    handlebar_roll: "bar_roll",
    fork_cage_bag: "fork_pack",
    cargo_cage: "cage",
    stem_bag: "bar_bag",
  };
  return categoryKinds[bag.category] || (bag.category as EquipmentVisualKind);
}
export function equipmentDimensions(bag: BagItem): Point3 {
  const fallback = FALLBACK_MM[equipmentKind(bag)] || FALLBACK_MM.accessory;
  // Original catalog bar-roll length was lateral; the new visualKind schema is already axis-normalized.
  const axes =
    !bag.visualKind && bag.category === "handlebar_roll"
      ? (["depth", "height", "length"] as const)
      : (["length", "height", "depth"] as const);
  return axes.map((axis, i) => {
    const documented = bag.dimensionsMm[axis];
    const visual = bag.visualDimensionsMm?.[axis];
    return (
      (typeof documented === "number" &&
      Number.isFinite(documented) &&
      documented > 0
        ? documented
        : typeof visual === "number" && Number.isFinite(visual) && visual > 0
          ? visual
          : fallback[i]) / 1000
    );
  }) as Point3;
}
/** Local AABB centre relative to the mounting anchor. Rotate by anchor.rotation for world OBB. */
export function equipmentLocalCenter(bag: BagItem): Point3 {
  const [l, h] = equipmentDimensions(bag);
  switch (equipmentKind(bag)) {
    case "frame":
    case "half_frame":
      return [0, -h / 2 - 0.02, 0];
    case "rack":
      return [-l * 0.095, h * 0.455, 0];
    case "aeropack":
      return [-l * 0.0912, h * 0.44575, 0];
    case "seat_pack":
      return [-l / 2, h * 0.18, 0];
    case "top_tube":
      return [0, h * 0.46, 0]; // Shell underside is at -0.46h; anchor touches tube surface.
    case "bar_roll":
    case "bar_bag":
      return [l / 2 + 0.025, -h / 2, 0];
    default:
      return [0, 0, 0];
  }
}

export type EquipmentDimensions = {
  length: number;
  height: number;
  depth: number;
};
/** Physical checks only accept verified full dimensions when estimates are disabled. */
export function getEquipmentDimensions(
  bag: BagItem,
  options: { allowEstimate?: boolean } = {},
): EquipmentDimensions | null {
  if (
    options.allowEstimate === false &&
    (bag.dimensionsStatus !== "verified" ||
      Object.values(bag.dimensionsMm).some(
        (v) => typeof v !== "number" || !Number.isFinite(v) || v <= 0,
      ))
  )
    return null;
  const [length, height, depth] = equipmentDimensions(bag);
  return { length, height, depth };
}

/** XYZ Euler, matching Three.js default. Kept pure for Node collision tests. */
export function rotateEquipmentPoint(
  [x, y, z]: Point3,
  [rx, ry, rz]: Point3,
): Point3 {
  const a = Math.cos(rx),
    b = Math.sin(rx),
    c = Math.cos(ry),
    d = Math.sin(ry),
    e = Math.cos(rz),
    f = Math.sin(rz);
  return [
    c * e * x - c * f * y + d * z,
    (a * f + b * e * d) * x + (a * e - b * f * d) * y - b * c * z,
    (b * f - a * e * d) * x + (b * e + a * f * d) * y + a * c * z,
  ];
}
export function getEquipmentPlacement(
  bag: BagItem,
  anchor: import("../types/index").SocketAnchor,
  dropperCompressed = false,
) {
  const offset = rotateEquipmentPoint(
    equipmentLocalCenter(bag),
    anchor.rotation,
  );
  const dropped = anchor.id === "seatpost" && dropperCompressed;
  const drop = dropped
    ? (anchor.dropperOffset ?? [0.029, -0.116, 0])
    : [0, 0, 0];
  return {
    position: [
      anchor.position[0] + offset[0] + drop[0],
      anchor.position[1] + offset[1] + drop[1],
      anchor.position[2] + offset[2] + drop[2],
    ] as Point3,
    rotation: anchor.rotation,
    dimensions: getEquipmentDimensions(bag)!,
    isEstimated: getEquipmentDimensions(bag, { allowEstimate: false }) === null,
  };
}
export function getEquipmentBounds(
  bag: BagItem,
  anchor: import("../types/index").SocketAnchor,
  dropperCompressed = false,
  options: { allowEstimate?: boolean } = {},
) {
  const dimensions = getEquipmentDimensions(bag, options);
  if (!dimensions) return null;
  const placement = getEquipmentPlacement(bag, anchor, dropperCompressed);
  const corners: Point3[] = [];
  for (const x of [-1, 1])
    for (const y of [-1, 1])
      for (const z of [-1, 1]) {
        const rotated = rotateEquipmentPoint(
          [
            (x * dimensions.length) / 2,
            (y * dimensions.height) / 2,
            (z * dimensions.depth) / 2,
          ],
          placement.rotation,
        );
        corners.push(
          rotated.map((v, i) => v + placement.position[i]) as Point3,
        );
      }
  return {
    ...placement,
    corners,
    min: [0, 1, 2].map((i) => Math.min(...corners.map((p) => p[i]))) as Point3,
    max: [0, 1, 2].map((i) => Math.max(...corners.map((p) => p[i]))) as Point3,
  };
}
