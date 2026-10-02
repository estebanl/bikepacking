import type { BikeModel, BikeSizeConfig } from "../types/index.ts";
import { getBikeGeometry, interpolate } from "./bikeGeometry.ts";

/** Mount frame bags from the tube, not an arbitrary triangle centre.
 * This locates original visual geometry only; it does not certify shock, bottle or frame clearance.
 */
export function alignFrameSocket(
  bike: BikeModel,
  size: BikeSizeConfig,
): BikeSizeConfig {
  const { seatCluster, headTubeTop } = getBikeGeometry(bike, size);
  const slope = Math.atan2(
    headTubeTop[1] - seatCluster[1],
    headTubeTop[0] - seatCluster[0],
  );
  const onTube = (t: number): [number,number,number] => {
    const p=interpolate(seatCluster,headTubeTop,t);
    return [p[0]-.021*Math.sin(slope),p[1]+.021*Math.cos(slope),0];
  };
  return {
    ...size,
    sockets: {
      ...size.sockets,
      topTubeFront: {...size.sockets.topTubeFront,position:onTube(.73),rotation:[0,0,slope]},
      ...(size.sockets.topTubeRear ? {topTubeRear:{...size.sockets.topTubeRear,position:onTube(.18),rotation:[0,0,slope] as [number,number,number]}} : {}),
      frameTriangle: {
        ...size.sockets.frameTriangle,
        position: interpolate(seatCluster, headTubeTop, 0.48),
        rotation: [0, 0, slope],
      },
    },
  };
}
export function alignFrameSockets(bike: BikeModel): BikeModel {
  return {
    ...bike,
    sizes: Object.fromEntries(
      Object.entries(bike.sizes).map(([key, size]) => [
        key,
        alignFrameSocket(bike, size),
      ]),
    ),
  };
}
