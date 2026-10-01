import type { BikeModel, BikeSizeConfig, BagItem, ClearanceWarning } from "../types/index.ts";

export interface ClearanceCheckParams {
  bike: BikeModel;
  sizeConfig: BikeSizeConfig;
  mountedBags: Record<string, BagItem>;
  dropperPostCompressed: boolean;
  waterBottlesMounted: boolean;
}

export function evaluateClearances({
  sizeConfig,
  mountedBags,
  dropperPostCompressed,
  waterBottlesMounted,
}: ClearanceCheckParams): ClearanceWarning[] {
  const warnings: ClearanceWarning[] = [];

  // 1. Seat pack vs. rear wheel clearance
  const seatBag = mountedBags["seatpost"];
  if (seatBag) {
    const seatSocket = sizeConfig.sockets.seatpost;
    const rearWheelRadiusM = sizeConfig.clearanceZones.rearTireMaxRadiusMm / 1000;
    const rearAxleY = 0.35; // standard 700c / 29er axle height from ground
    const rearTireTopY = rearAxleY + rearWheelRadiusM; // ~0.71m

    // Height of seat pack attachment point
    let bagAttachY = seatSocket.position[1];
    if (dropperPostCompressed) {
      bagAttachY -= 0.15; // 150mm dropper post drop
    }

    // Lower hanging edge of seat pack in meters
    const bagHangingDropM = (seatBag.dimensionsMm.height / 1000) * 0.7; // Tapers down
    const seatBagLowestY = bagAttachY - bagHangingDropM;

    const clearanceMm = Math.round((seatBagLowestY - rearTireTopY) * 1000);
    const recommendedMinMm = dropperPostCompressed ? 100 : 80;

    if (clearanceMm < recommendedMinMm) {
      warnings.push({
        id: "seat_tire_clearance",
        type: "seat_tire",
        severity: clearanceMm < 40 ? "error" : "warning",
        measuredMm: Math.max(0, clearanceMm),
        recommendedMinMm,
        affectedBagIds: [seatBag.id],
        message: dropperPostCompressed
          ? `Seat pack clearance to rear tire under dropper compression is only ${Math.max(0, clearanceMm)}mm (Recommended: ≥ ${recommendedMinMm}mm). Tire buzz hazard!`
          : `Seat pack clearance to rear tire is ${Math.max(0, clearanceMm)}mm (Recommended: ≥ ${recommendedMinMm}mm). Buzz risk on steep roll-ins.`,
      });
    }
  }

  // 2. Handlebar bag vs. front wheel clearance
  const barBag = mountedBags["handlebar"];
  if (barBag) {
    const barSocket = sizeConfig.sockets.handlebar;
    const frontWheelRadiusM = sizeConfig.clearanceZones.frontTireMaxRadiusMm / 1000;
    const frontAxleY = 0.35;
    const frontTireTopY = frontAxleY + frontWheelRadiusM; // ~0.71m

    const bagHangingDropM = barBag.dimensionsMm.height / 1000;
    const barBagLowestY = barSocket.position[1] - bagHangingDropM;

    const clearanceMm = Math.round((barBagLowestY - frontTireTopY) * 1000);
    const recommendedMinMm = 50;

    if (clearanceMm < recommendedMinMm) {
      warnings.push({
        id: "bar_tire_clearance",
        type: "bar_tire",
        severity: clearanceMm < 25 ? "error" : "warning",
        measuredMm: Math.max(0, clearanceMm),
        recommendedMinMm,
        affectedBagIds: [barBag.id],
        message: `Handlebar roll clearance to front tire tread is only ${Math.max(0, clearanceMm)}mm (Recommended: ≥ ${recommendedMinMm}mm). Risk of tire rubbing.`,
      });
    }
  }

  // 3. Frame bag vs. water bottles collision
  const frameBag = mountedBags["frameTriangle"];
  if (frameBag && waterBottlesMounted) {
    if (frameBag.category === "frame_full") {
      warnings.push({
        id: "frame_bottle_conflict",
        type: "frame_bottle",
        severity: "error",
        affectedBagIds: [frameBag.id],
        message: `Full frame pack (${frameBag.name}) completely obstructs standard bottle cages. Remove bottle cages or switch to a half frame pack.`,
      });
    } else if (frameBag.category === "frame_half" && frameBag.volumeLiters > 4.2) {
      warnings.push({
        id: "frame_bottle_tight",
        type: "frame_bottle",
        severity: "warning",
        affectedBagIds: [frameBag.id],
        message: `Large half frame pack limits bottle cage clearance. Side-loading bottle cages recommended to avoid pinching.`,
      });
    }
  }

  // 4. Volume capacity limit check on sockets
  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    let socketMaxVol: number | undefined;
    if (socketId === "frameTriangle") socketMaxVol = sizeConfig.sockets.frameTriangle.maxVolumeLiters;
    else if (socketId === "seatpost") socketMaxVol = sizeConfig.sockets.seatpost.maxVolumeLiters;
    else if (socketId === "handlebar") socketMaxVol = sizeConfig.sockets.handlebar.maxVolumeLiters;
    else if (socketId === "topTubeFront") socketMaxVol = sizeConfig.sockets.topTubeFront.maxVolumeLiters;

    if (socketMaxVol && bag.volumeLiters > socketMaxVol) {
      warnings.push({
        id: `oversize_${socketId}`,
        type: "socket_conflict",
        severity: "warning",
        affectedBagIds: [bag.id],
        message: `${bag.name} (${bag.volumeLiters}L) exceeds maximum recommended volume (${socketMaxVol}L) for ${socketId} on size ${Object.keys(sizeConfig.geometry).length ? "selected frame" : ""}.`,
      });
    }
  });

  return warnings;
}
