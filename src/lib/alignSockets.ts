import { getDownTubePackReference } from "./frameAttachmentGeometry.ts";
import type { BikeModel, BikeSizeConfig } from "../types/index.ts";
import { getBikeGeometry, interpolate, topTubeRadius } from "./bikeGeometry.ts";

/** Mount frame bags from the tube, not an arbitrary triangle centre.
 * This locates original visual geometry only; it does not certify shock, bottle or frame clearance.
 */
export function alignFrameSocket(
  bike: BikeModel,
  size: BikeSizeConfig,
): BikeSizeConfig {
  const { seatCluster, topTubeEnd } = getBikeGeometry(bike, size);
  const slope = Math.atan2(
    topTubeEnd[1] - seatCluster[1],
    topTubeEnd[0] - seatCluster[0],
  );
  const onTube = (t: number): [number,number,number] => {
    const p=interpolate(seatCluster,topTubeEnd,t);
    const radius = topTubeRadius(t);
    return [p[0]-radius*Math.sin(slope),p[1]+radius*Math.cos(slope),0];
  };
  return {
    ...size,
    sockets: {
      ...size.sockets,
      ...(size.sockets.downtubeUnderside ? {downtubeUnderside:{...size.sockets.downtubeUnderside,tubeAttachment:getDownTubePackReference(bike,size)}} : {}),
      topTubeFront: {...size.sockets.topTubeFront,position:onTube(.73),rotation:[0,0,slope]},
      ...(size.sockets.topTubeRear ? {topTubeRear:{...size.sockets.topTubeRear,position:onTube(.18),rotation:[0,0,slope] as [number,number,number]}} : {}),
      frameTriangle: {
        ...size.sockets.frameTriangle,
        position: interpolate(seatCluster, topTubeEnd, 0.48),
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
