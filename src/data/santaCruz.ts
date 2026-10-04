import type {
  BikeModel,
  BikeSizeConfig,
  SocketAnchor,
  BagCategory,
} from "../types/index.ts";
import { addHardwareSockets } from "../lib/hardwareSockets.ts";
import {
  getBikeGeometry,
  interpolate,
  type Point3,
} from "../lib/bikeGeometry.ts";
/** Manufacturer geometry transcribed from current collection tables, Oct 2 2026.
 * Visual surfaces, saddle height, mount centres and tire shape are original estimates, not CAD or fit certification.
 * Sources: https://www.santacruzbicycles.com/collections/blur
 * https://www.santacruzbicycles.com/collections/stigmata
 * Build weights are manufacturer complete-bike reference weights, not all sizes/builds.
 * Effective top-tube and standover dimensions follow the manufacturer table.
 * No physical fit certification is implied by the visual reconstruction.
 * Stigmata table labels chainstay 430 and separately rear center 423; reconstruction
 * uses chainstay 430 as BB-to-axle length. Tire radii are nominal inflated estimates.
 * All mesh vertices are original code-generated geometry. No vendor images are bundled.
 */
function sockets(
  bike: BikeModel,
  size: BikeSizeConfig,
): BikeSizeConfig["sockets"] {
  const g = getBikeGeometry(bike, size),
    full = !!bike.suspension?.rearTravelMm;
  const anchor = (
    id: string,
    name: string,
    position: Point3,
    categories: BagCategory[],
    notes?: string,
  ): SocketAnchor => ({
    id,
    name,
    position,
    rotation: [0, 0, 0],
    allowedBagCategories: categories,
    verification: "unverified",
    notes:
      notes ??
      "Visual location only. Check manufacturer fit guide, dimensions and clearance.",
  });
  const topFront = interpolate(g.seatCluster, g.headTubeTop, 0.73);
  topFront[1] += 0.055;
  const topRear = interpolate(g.seatCluster, g.headTubeTop, 0.15);
  topRear[1] += 0.055;
  const under = interpolate(g.bb, g.headTubeBottom, 0.4);
  under[1] -= 0.06;
  const bar: Point3 = [g.stemClamp[0] + 0.095, g.stemClamp[1] - 0.075, 0];
  return {
    frameTriangle: anchor(
      "frameTriangle",
      "Frame triangle",
      interpolate(
        interpolate(g.seatCluster, g.headTubeTop, 0.48),
        g.bb,
        full ? 0.23 : 0.3,
      ),
      full ? ["frame_half"] : ["frame_full", "frame_half"],
      full
        ? "Rear shock and suspension movement restrict frame-bag space. Full bags unavailable; partial bags still need measured fit."
        : undefined,
    ),
    topTubeFront: anchor("topTubeFront", "Top tube • front", topFront, [
      "top_tube",
    ]),
    topTubeRear: anchor("topTubeRear", "Top tube • rear", topRear, [
      "top_tube",
    ]),
    seatpost: {
      ...anchor(
        "seatpost",
        "Saddle rails",
        // Estimated saddle-pack nose sits behind the post and below the rails.
        [g.saddleBase[0] - 0.015, g.saddleBase[1] - 0.11, 0],
        ["seat_pack"],
        bike.seatpostType === "rigid" ? "Rigid seatpost reference build; rear tire clearance remains unverified." : "Dropper preview moves 120 mm, not the full manufacturer stroke. Check actual full travel and rear tire clearance.",
      ),
      dropperOffset: bike.seatpostType === "rigid" ? [0, 0, 0] : [
        Math.cos((size.geometry.seatTubeAngleDeg * Math.PI) / 180) * 0.12,
        -Math.sin((size.geometry.seatTubeAngleDeg * Math.PI) / 180) * 0.12,
        0,
      ],
    },
    handlebar: anchor("handlebar", "Handlebar", bar, ["handlebar_roll"]),
    forkLeft: [
      anchor(
        "forkLeft_0",
        "Left fork • adapter required",
        [
          interpolate(g.headTubeBottom, g.frontAxle, 0.68)[0],
          g.frontAxle[1] + 0.18,
          0.1,
        ],
        ["fork_cage_bag", "cargo_cage", "mount"],
        "No assumed fork cargo bosses. Verify an approved adapter and fork load limits before mounting.",
      ),
    ],
    forkRight: [
      anchor(
        "forkRight_0",
        "Right fork • adapter required",
        [
          interpolate(g.headTubeBottom, g.frontAxle, 0.68)[0],
          g.frontAxle[1] + 0.18,
          -0.1,
        ],
        ["fork_cage_bag", "cargo_cage", "mount"],
        "No assumed fork cargo bosses. Verify an approved adapter and fork load limits before mounting.",
      ),
    ],
    downtubeUnderside: anchor("downtubeUnderside", "Under downtube", under, [
      "fork_cage_bag",
      "cargo_cage",
      "mount",
    ]),
    additional: [
      anchor(
        "rearRack",
        "Axle-mounted rack",
        g.rearAxle,
        ["rack"],
        "Axle and UDH adapter selection required; generation-specific fit not certified.",
      ),
      anchor(
        "pannierLeft",
        "Left pannier",
        [g.rearAxle[0] - 0.02, g.rearAxle[1] + 0.17, 0.2],
        ["pannier"],
      ),
      anchor(
        "pannierRight",
        "Right pannier",
        [g.rearAxle[0] - 0.02, g.rearAxle[1] + 0.17, -0.2],
        ["pannier"],
      ),
      anchor(
        "rackTop",
        "Rack top",
        [g.rearAxle[0], g.rearAxle[1] + g.wheelRadius + 0.15, 0],
        ["seat_pack", "accessory"],
      ),
      anchor(
        "stemLeft",
        "Left cockpit",
        [g.stemClamp[0] - 0.045, g.stemClamp[1] - 0.055, 0.075],
        ["stem_bag"],
      ),
      anchor(
        "stemRight",
        "Right cockpit",
        [g.stemClamp[0] - 0.045, g.stemClamp[1] - 0.055, -0.075],
        ["stem_bag"],
      ),
    ],
  };
}
const blur: BikeModel = {
  id: "santa-cruz-blur-2027",
  brand: "Santa Cruz",
  name: "Blur 90",
  generation: "Blur 5 · MY2027",
  category: "mtb",
  baseWeightGrams: 12500,
  weightStatus: "verified",
  wheelbaseMm: 1178,
  wheelRadiusMm: 372.5,
  tireWidthMm: 61,
  handlebarType: "flat",
  colorHex: "#344246",
  suspension: { frontTravelMm: 120, rearTravelMm: 120 },
  seatpostType: "dropper",
  sourceUrl: "https://www.santacruzbicycles.com/collections/blur",
  geometrySourceUrl: "https://www.santacruzbicycles.com/collections/blur",
  referenceNotes:
    "Current fifth-generation Blur, 120/120 mm. Geometry and reference-build weight from manufacturer. Illustrative dark finish, not an exact paint/build specification. Original visual reconstruction; mount fit and shock clearance are unverified.",
  sizes: {},
};
const blurRows = [
  ["S", 425, 588, 1151, 433, 405, 75.7],
  ["M", 450, 588, 1178, 435, 405, 76],
  ["L", 475, 597, 1209, 437, 440, 76.1],
  ["XL", 500, 611, 1242, 439, 490, 76.2],
] as const;
blurRows.forEach(([label, reach, stack, wb, cs, st, sa], index) => {
  const size = {
    geometry: {
      reachMm: reach,
      stackMm: stack,
      wheelbaseMm: wb,
      chainstayMm: cs,
      bbDropMm: 38.5,
      seatTubeLengthMm: st,
      headTubeAngleDeg: 66,
      seatTubeAngleDeg: sa,
      topTubeLengthMm: [575, 596, 622, 650][index],
      standoverMm: [735, 743, 745, 744][index],
      forkLengthMm: 530,
      forkOffsetMm: 44,
    },
    sockets: {} as BikeSizeConfig["sockets"],
    clearanceZones: {
      rearTireMaxRadiusMm: 373,
      frontTireMaxRadiusMm: 373,
      seatStayClearanceMm: 65,
    },
  };
  size.sockets = sockets(blur, size);
  blur.sizes[label] = size;
});
const stigmata: BikeModel = {
  id: "santa-cruz-stigmata-2027",
  brand: "Santa Cruz",
  name: "Stigmata Apex",
  generation: "Stigmata 4 · MY2027",
  category: "gravel",
  baseWeightGrams: 9460,
  weightStatus: "verified",
  wheelbaseMm: 1063,
  wheelRadiusMm: 356,
  tireWidthMm: 45,
  handlebarType: "drop",
  colorHex: "#82788e",
  seatpostType: "rigid",
  sourceUrl:
    "https://www.santacruzbicycles.com/collections/stigmata/products/stigmata-apex-2027",
  geometrySourceUrl: "https://www.santacruzbicycles.com/collections/stigmata",
  referenceNotes:
    "Rigid-fork Apex build. Manufacturer geometry and 9.46 kg reference-build weight. No rack eyelets; axle-mounted rack requires verified axle/UDH adapters. Fork cargo bosses not confirmed. Tire radius, saddle setting and surface shapes are illustrative.",
  sizes: {},
};
const stigmataRows = [
  ["XS", 375, 550, 1023, 78, 450],
  ["S", 390, 564, 1043, 78, 455],
  ["M", 405, 576, 1063, 76, 485],
  ["L", 420, 600, 1087, 76, 515],
  ["XL", 435, 612, 1108, 74, 545],
  ["XXL", 450, 631, 1130, 74, 575],
] as const;
stigmataRows.forEach(([label, reach, stack, wb, drop, st], index) => {
  const size = {
    geometry: {
      reachMm: reach,
      stackMm: stack,
      wheelbaseMm: wb,
      chainstayMm: 430,
      bbDropMm: drop,
      seatTubeLengthMm: st,
      headTubeAngleDeg: 69.5,
      seatTubeAngleDeg: 74,
      topTubeLengthMm: [533, 552, 570, 592, 610, 631][index],
      standoverMm: [723, 728, 753, 778, 804, 830][index],
      forkLengthMm: 430,
      forkOffsetMm: 45,
    },
    sockets: {} as BikeSizeConfig["sockets"],
    clearanceZones: {
      rearTireMaxRadiusMm: 356,
      frontTireMaxRadiusMm: 356,
      seatStayClearanceMm: 50,
    },
  };
  size.sockets = sockets(stigmata, size);
  stigmata.sizes[label] = size;
});
export const SANTA_CRUZ_BIKES: BikeModel[] = [blur, stigmata].map(
  addHardwareSockets,
);
