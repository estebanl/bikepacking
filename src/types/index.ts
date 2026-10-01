export type BagCategory =
  | "frame_full"
  | "frame_half"
  | "seat_pack"
  | "handlebar_roll"
  | "top_tube"
  | "stem_bag"
  | "fork_cage_bag"
  | "pannier";

export interface SocketAnchor {
  id: string;
  name: string;
  position: [number, number, number]; // [x, y, z] in meters (Three.js units)
  rotation: [number, number, number]; // Euler angles [x, y, z] in radians
  allowedBagCategories: BagCategory[];
  maxVolumeLiters?: number;
}

export interface BikeSizeConfig {
  meshUrl?: string;
  geometry: {
    reachMm: number;
    stackMm: number;
    standoverMm: number;
    seatTubeLengthMm: number;
    topTubeLengthMm: number;
    headTubeAngleDeg: number;
    seatTubeAngleDeg: number;
  };
  sockets: {
    frameTriangle: SocketAnchor;
    topTubeFront: SocketAnchor;
    topTubeRear?: SocketAnchor;
    seatpost: SocketAnchor;
    handlebar: SocketAnchor;
    forkLeft: SocketAnchor[];
    forkRight: SocketAnchor[];
    downtubeUnderside?: SocketAnchor;
  };
  clearanceZones: {
    rearTireMaxRadiusMm: number;
    frontTireMaxRadiusMm: number;
    seatStayClearanceMm: number;
  };
}

export interface BikeModel {
  id: string;
  brand: string;
  name: string;
  category: "gravel" | "mtb" | "touring" | "all-road";
  baseWeightGrams: number;
  wheelbaseMm: number;
  handlebarType: "drop" | "flat";
  colorHex: string;
  sizes: {
    [sizeKey: string]: BikeSizeConfig;
  };
}

export interface BagItem {
  id: string;
  brand: string;
  name: string;
  category: BagCategory;
  volumeLiters: number;
  dryWeightGrams: number;
  dimensionsMm: {
    length: number;
    height: number;
    depth: number;
  };
  meshUrl?: string;
  compatibleSockets: string[];
  waterproofRating?: string;
  productUrl: string;
  priceUsd: number;
  colorHex?: string;
  collisionMeshUrl?: string;
}

export interface MountedBagEntry {
  socketId: string;
  bag: BagItem;
}

export interface ClearanceWarning {
  id: string;
  type: "seat_tire" | "bar_tire" | "frame_bottle" | "socket_conflict";
  severity: "error" | "warning";
  message: string;
  measuredMm?: number;
  recommendedMinMm?: number;
  affectedBagIds: string[];
}

export interface RigMetrics {
  bikeBaseWeightGrams: number;
  totalBagsDryWeightGrams: number;
  payloadEstimateGrams: number;
  totalRigWeightGrams: number;
  totalCapacityLiters: number;
  frontAxleWeightGrams: number;
  rearAxleWeightGrams: number;
  frontRatioPercent: number;
  rearRatioPercent: number;
  balanceStatus: "balanced" | "front_heavy" | "rear_heavy";
}

export type CameraPreset = "side" | "cockpit" | "rear" | "iso";
