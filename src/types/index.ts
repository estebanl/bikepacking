export type BagCategory =
  | "frame_full"
  | "frame_half"
  | "seat_pack"
  | "handlebar_roll"
  | "top_tube"
  | "stem_bag"
  | "fork_cage_bag"
  | "pannier"
  | "rack"
  | "cargo_cage"
  | "mount"
  | "accessory"
  | "spare";

export interface SocketAnchor {
  handlebarType?: "flat" | "drop";
  id: string;
  name: string;
  position: [number, number, number]; // [x, y, z] in meters (Three.js units)
  rotation: [number, number, number]; // Euler angles [x, y, z] in radians
  allowedBagCategories: BagCategory[];
  tubeAttachment?: {position:[number,number,number];rotation:[number,number,number];radius:number};
  dropperOffset?: [number, number, number]; // World-space displacement for full modeled dropper travel.
  maxVolumeLiters?: number;
  maxLoadGrams?: number;
  verification?: "verified" | "estimated" | "unverified";
  notes?: string;
  requires?: string[]; // Product capability IDs needed before this socket is usable.
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
    wheelbaseMm?: number;
    chainstayMm?: number;
    bbDropMm?: number;
    forkLengthMm?: number;
    forkOffsetMm?: number;
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
    additional?: SocketAnchor[]; // Rack, pannier, cockpit and hardware attachment points.
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
  generation?: string;
  sourceUrl?: string;
  geometrySourceUrl?: string;
  referenceNotes?: string;
  weightStatus?: "verified" | "estimated" | "unknown";
  wheelRadiusMm?: number;
  tireWidthMm?: number;
  suspension?: { frontTravelMm: number; rearTravelMm: number };
  seatpostType?: "rigid" | "dropper";
  sizes: {
    [sizeKey: string]: BikeSizeConfig;
  };
}

export interface BagItem {
  handlebarType?: "flat" | "drop";
  id: string;
  brand: string;
  name: string;
  category: BagCategory;
  volumeLiters: number | null;
  dryWeightGrams: number | null;
  dimensionsMm: {
    length: number | null;
    height: number | null;
    depth: number | null;
  };
  meshUrl?: string;
  compatibleSockets: string[];
  waterproofRating?: string;
  productUrl: string;
  priceUsd: number | null;
  price?: { amount: number; currency: "USD" | "CAD" | "GBP" };
  visualDimensionsMm?: { length: number; height: number; depth: number };
  colorHex?: string;
  collisionMeshUrl?: string;
  productKind?: "bag" | "rack" | "cage" | "mount" | "accessory" | "spare";
  visualKind?:
    | "frame"
    | "half_frame"
    | "top_tube"
    | "seat_pack"
    | "bar_roll"
    | "bar_bag"
    | "fork_pack"
    | "pannier"
    | "trunk"
    | "rack"
    | "aeropack"
    | "cage"
    | "mount"
    | "strap"
    | "fender"
    | "accessory"
    | "spare";
  dimensionsStatus?: "verified" | "estimated" | "unknown";
  weightStatus?: "verified" | "estimated" | "unknown";
  specSourceUrl?: string;
  specNotes?: string;
  previewStatus?: "mountable" | "implementation-pending" | "unsupported-fit" | "nonvisual-spare" | "off-bike";
  previewStatusLabel?: string;
  previewStatusReason?: string;
  capacityOptions?: number[];
  currency?: "USD" | "CAD" | "GBP";
  provides?: string[]; // Capabilities such as rear-rack or cargo-cage-left.
  requires?: string[]; // Required capabilities; all must be mounted.
  excludes?: string[];
  fitStatus?: "verified" | "conditional" | "unverified";
}

export interface MountedBagEntry {
  socketId: string;
  bag: BagItem;
}

export interface ClearanceWarning {
  id: string;
  type:
    | "seat_tire"
    | "bar_tire"
    | "frame_bottle"
    | "socket_conflict"
    | "dependency"
    | "bag_collision"
    | "fit_unverified";
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
  unknownWeightItemIds?: string[];
  unknownCapacityItemIds?: string[];
}

export type CameraPreset = "side" | "cockpit" | "rear" | "iso";
