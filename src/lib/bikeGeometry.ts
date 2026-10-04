import type { BikeModel, BikeSizeConfig } from "../types/index.ts";
export type Point3 = [number, number, number];
export const interpolate = (a: Point3, b: Point3, t: number): Point3 =>
  a.map((n, i) => n + (b[i] - n) * t) as Point3;
/** Original parametric reconstruction, not manufacturer CAD. x forward, y up, z lateral; metres. */
export function getBikeGeometry(
  bike: BikeModel,
  size: BikeSizeConfig,
  dropperCompressed = false,
) {
  const g = size.geometry;
  const wheelRadius = (bike.wheelRadiusMm ?? 354) / 1000;
  const wheelbase = (g.wheelbaseMm ?? bike.wheelbaseMm) / 1000;
  const drop = (g.bbDropMm ?? (bike.category === "mtb" ? 40 : 70)) / 1000;
  const chainstay = (g.chainstayMm ?? 435) / 1000;
  const rearX = -wheelbase / 2;
  const bb: Point3 = [
    rearX + Math.sqrt(chainstay ** 2 - drop ** 2),
    wheelRadius - drop,
    0,
  ];
  const rearAxle: Point3 = [rearX, wheelRadius, 0];
  const frontAxle: Point3 = [wheelbase / 2, wheelRadius, 0];
  const sa = (g.seatTubeAngleDeg * Math.PI) / 180,
    ha = (g.headTubeAngleDeg * Math.PI) / 180;
  const seatCluster: Point3 = [
    bb[0] - (Math.cos(sa) * g.seatTubeLengthMm) / 1000,
    bb[1] + (Math.sin(sa) * g.seatTubeLengthMm) / 1000,
    0,
  ];
  const headTubeTop: Point3 = [
    bb[0] + g.reachMm / 1000,
    bb[1] + g.stackMm / 1000,
    0,
  ];
  const forkLength =
    (g.forkLengthMm ?? (bike.suspension?.frontTravelMm ? 530 : 430)) / 1000;
  const forkOffset = (g.forkOffsetMm ?? 50) / 1000;
  // Project the estimated crown onto the published steering axis, preserving head angle.
  const crownY =
    frontAxle[1] + Math.sin(ha) * forkLength - Math.cos(ha) * forkOffset;
  const headLength = Math.max(0.08, (headTubeTop[1] - crownY) / Math.sin(ha));
  const headTubeBottom: Point3 = [
    headTubeTop[0] + Math.cos(ha) * headLength,
    headTubeTop[1] - Math.sin(ha) * headLength,
    0,
  ];
  const postExtension =
    Math.max(0.12, 0.72 - g.seatTubeLengthMm / 1000) -
    (dropperCompressed && bike.seatpostType !== "rigid" ? 0.12 : 0);
  const saddleBase: Point3 = [
    seatCluster[0] - Math.cos(sa) * postExtension,
    seatCluster[1] + Math.sin(sa) * postExtension,
    0,
  ];
  const stemClamp: Point3 = [
    headTubeTop[0] + (bike.handlebarType === "flat" ? 0.045 : 0.065),
    headTubeTop[1] + 0.028,
    0,
  ];
  const topTubeEnd: Point3 = [headTubeTop[0], headTubeTop[1] - 0.018, 0];
  return {
    topTubeEnd,
    bb,
    rearAxle,
    frontAxle,
    seatCluster,
    headTubeTop,
    headTubeBottom,
    saddleBase,
    stemClamp,
    wheelRadius,
    wheelbase,
    tireWidth: (bike.tireWidthMm ?? 45) / 1000,
  };
}

/** Shared original tube profile for visible surfaces and attachment anchors. */
export function topTubeRadius(t: number) {
  const radii = [0.022, 0.018, 0.032];
  const at = Math.max(0, Math.min(1, t)) * 2;
  const k = Math.min(Math.floor(at), 1);
  return radii[k] + (radii[k + 1] - radii[k]) * (at - k);
}
