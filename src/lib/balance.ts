import type { BikeModel, BikeSizeConfig, BagItem, RigMetrics } from "../types/index.ts";

export function calculateRigMetrics(
  bike: BikeModel,
  sizeConfig: BikeSizeConfig,
  mountedBags: Record<string, BagItem>,
  payloadEstimateGrams: number
): RigMetrics {
  const wheelbaseM = bike.wheelbaseMm / 1000;
  const rearAxleX = -wheelbaseM / 2;
  const frontAxleX = wheelbaseM / 2;

  // Unloaded bike default weight distribution: ~45% front, 55% rear
  const bikeBaseWeight = bike.baseWeightGrams;
  const bikeCgX = rearAxleX + wheelbaseM * 0.45; // 45% of distance towards front axle

  let totalBagsWeight = 0;
  let totalCapacity = 0;

  // Moments about rear axle (in grams * meters)
  let sumMomentsFromRear = bikeBaseWeight * (bikeCgX - rearAxleX);

  // Add each mounted bag's contribution
  Object.entries(mountedBags).forEach(([socketId, bag]) => {
    totalBagsWeight += bag.dryWeightGrams;
    totalCapacity += bag.volumeLiters;

    // Find socket position
    let socketPos: [number, number, number] | undefined;
    if (socketId === "frameTriangle") socketPos = sizeConfig.sockets.frameTriangle.position;
    else if (socketId === "seatpost") socketPos = sizeConfig.sockets.seatpost.position;
    else if (socketId === "handlebar") socketPos = sizeConfig.sockets.handlebar.position;
    else if (socketId === "topTubeFront") socketPos = sizeConfig.sockets.topTubeFront.position;
    else if (socketId === "topTubeRear" && sizeConfig.sockets.topTubeRear)
      socketPos = sizeConfig.sockets.topTubeRear.position;
    else if (socketId === "downtubeUnderside" && sizeConfig.sockets.downtubeUnderside)
      socketPos = sizeConfig.sockets.downtubeUnderside.position;
    else if (socketId.startsWith("forkLeft")) {
      const match = sizeConfig.sockets.forkLeft.find((s) => s.id === socketId);
      if (match) socketPos = match.position;
    } else if (socketId.startsWith("forkRight")) {
      const match = sizeConfig.sockets.forkRight.find((s) => s.id === socketId);
      if (match) socketPos = match.position;
    }

    const bagX = socketPos ? socketPos[0] : 0;
    const distFromRear = Math.max(0, Math.min(wheelbaseM, bagX - rearAxleX));

    // Each bag has dry weight + distributed portion of payload proportional to volume
    sumMomentsFromRear += bag.dryWeightGrams * distFromRear;
  });

  // Distribute payload estimate across mounted bags if any exist, or bike CG
  if (payloadEstimateGrams > 0) {
    if (totalCapacity > 0) {
      Object.entries(mountedBags).forEach(([socketId, bag]) => {
        let socketPos: [number, number, number] | undefined;
        if (socketId === "frameTriangle") socketPos = sizeConfig.sockets.frameTriangle.position;
        else if (socketId === "seatpost") socketPos = sizeConfig.sockets.seatpost.position;
        else if (socketId === "handlebar") socketPos = sizeConfig.sockets.handlebar.position;
        else if (socketId === "topTubeFront") socketPos = sizeConfig.sockets.topTubeFront.position;
        else if (socketId.startsWith("forkLeft")) {
          socketPos = sizeConfig.sockets.forkLeft.find((s) => s.id === socketId)?.position;
        } else if (socketId.startsWith("forkRight")) {
          socketPos = sizeConfig.sockets.forkRight.find((s) => s.id === socketId)?.position;
        }

        const bagX = socketPos ? socketPos[0] : 0;
        const distFromRear = Math.max(0, Math.min(wheelbaseM, bagX - rearAxleX));
        const bagShareOfPayload = (bag.volumeLiters / totalCapacity) * payloadEstimateGrams;
        sumMomentsFromRear += bagShareOfPayload * distFromRear;
      });
    } else {
      // No bags, payload centered at bike CG
      sumMomentsFromRear += payloadEstimateGrams * (bikeCgX - rearAxleX);
    }
  }

  const totalRigWeight = bikeBaseWeight + totalBagsWeight + payloadEstimateGrams;

  // Front ratio = sum(W_i * d_{i, rear}) / (Wheelbase * TotalWeight)
  const frontRatio = sumMomentsFromRear / (wheelbaseM * totalRigWeight);
  const frontRatioPercent = Math.round(Math.min(100, Math.max(0, frontRatio * 100)));
  const rearRatioPercent = 100 - frontRatioPercent;

  const frontAxleWeightGrams = Math.round(totalRigWeight * (frontRatioPercent / 100));
  const rearAxleWeightGrams = totalRigWeight - frontAxleWeightGrams;

  let balanceStatus: "balanced" | "front_heavy" | "rear_heavy" = "balanced";
  if (frontRatioPercent < 38) {
    balanceStatus = "rear_heavy";
  } else if (frontRatioPercent > 48) {
    balanceStatus = "front_heavy";
  }

  return {
    bikeBaseWeightGrams: bikeBaseWeight,
    totalBagsDryWeightGrams: totalBagsWeight,
    payloadEstimateGrams,
    totalRigWeightGrams: totalRigWeight,
    totalCapacityLiters: Math.round(totalCapacity * 10) / 10,
    frontAxleWeightGrams,
    rearAxleWeightGrams,
    frontRatioPercent,
    rearRatioPercent,
    balanceStatus,
  };
}
