import { FRAME_ATTACHMENT_SOCKETS } from "./frameAttachments.ts";
import { getCatalogBottleSockets } from "./catalogBottles.ts";
import type { BikeModel, SocketAnchor } from "../types/index.ts";
import { getBottleHardwareSockets } from "./bottleMounts.ts";
import { getBikeGeometry } from "./bikeGeometry.ts";
/** Illustrative hardware locations. Listing an anchor does not approve an installation. */
export function addHardwareSockets(bike: BikeModel) {
  for (const size of Object.values(bike.sizes)) {
    const g = getBikeGeometry(bike, size);
    size.sockets.handlebar.handlebarType = bike.handlebarType;
    const hardware = (
      id: string,
      name: string,
      position: [number, number, number],
      category: SocketAnchor["allowedBagCategories"],
      requires?: string[],
    ): SocketAnchor => ({
      id,
      name,
      position,
      rotation: [0, 0, 0],
      allowedBagCategories: category,
      requires,
      verification: "unverified",
      notes:
        "Hardware preview only. Verify exact fork, axle, drivetrain and manufacturer instructions.",
    });
    size.sockets.additional = [
      ...(size.sockets.additional ?? []),
      ...getBottleHardwareSockets(bike, size),
      ...getCatalogBottleSockets(bike, size),
      ...FRAME_ATTACHMENT_SOCKETS.map(spec=>hardware(spec.id, `${spec.hostSocket === "frameTriangle" ? "Frame bag" : spec.hostSocket === "topTubeFront" ? "Front top-tube bag" : spec.hostSocket === "topTubeRear" ? "Rear top-tube bag" : "DownTube Pack"} · ${spec.position === "seatpost" || spec.position === "distributed" ? "" : spec.position+" "}${spec.role === "vMount" ? "V-Mount cover" : spec.role === "keepers" ? "strap keepers (4)" : spec.role === "seatpostStrap" ? "optional seatpost strap" : "strap"}`, g.seatCluster, ["mount"], [spec.requiredCapability])),
      ...["rearSeatConnector","rearSeatStrap","rearTopStay"].map(id=>hardware(id, id==="rearSeatConnector" ? "Rear system · seatpost connector replacement" : id==="rearSeatStrap" ? "Rear system · seatpost strap replacement" : "Carbon rack · top stay replacement", g.seatCluster, ["mount"])),
      hardware("rearArchReplacement", "Rear system · replacement arch", g.rearAxle, ["mount"]),
      hardware("rackTopConnector", "Removable SpeedPack · connector replacement", g.rearAxle, ["mount"]),
      hardware("topTubeFlipBuckle", "Flip Top Tube Pack · buckle replacement", g.seatCluster, ["mount"]),
      ...(["Left", "Right"] as const).map(side=>hardware(`rearPannierInserts${side}`, `${side} rear pannier · standard16mm clamp inserts`, g.rearAxle, ["mount"])),
      hardware("rearArchBumpers", "Rear arch · matching bumper pair", g.rearAxle, ["mount"]),
      hardware("rearDropoutLeft", "Rear arch · left Fast Release Dropout", g.rearAxle, ["mount"]),
      hardware("rearDropoutRight", "Rear arch · right Fast Release Dropout", g.rearAxle, ["mount"]),
      hardware("rearDropoutBushings", "Rear arch · dropout bushings (4)", g.rearAxle, ["mount"]),
      hardware("thirdPartyPannierAdapters", "Rear system · third-party adapters (pair)", g.rearAxle, ["mount"], ["pannier-mounts"]),
      hardware("rearLightMount", "Rear light or light mount", [g.rearAxle[0]-.2,g.rearAxle[1]+.4,0], ["mount","accessory"]),
      hardware("journeyMudguard", "Journey rack mudguard", [g.rearAxle[0],g.rearAxle[1]+.4,0], ["accessory"], ["journey-rack"]),
      ...(["barCageReplacement", "barCageClampLeft", "barCageClampRight"] as const).map(id=>hardware(id,
        id === "barCageReplacement" ? "Bar Cage · replacement cradle" : `Bar Cage · ${id.endsWith("Left") ? "left" : "right"} replacement clamp (illustrative position)`,
        g.stemClamp, ["mount"], ["bar-cage-accessory"])),
      hardware("barCageAccessory", "Bar Cage accessory", [g.stemClamp[0]+.06,g.stemClamp[1]+.055,0], ["mount"], ["bar-cage-accessory"]),
      ...["rearAxleNds","rearAxleDs","rearAxleSpacers"].map(id=>hardware(id,id === "rearAxleNds" ? "Universal axle · non-drive end replacement" : id === "rearAxleDs" ? "Universal axle · drive end replacement" : "Tailfin axle · spacer replacement", g.rearAxle,["mount"])),
      hardware("rearUdhHanger","UDH kit · hanger replacement",[g.rearAxle[0],g.rearAxle[1],.085],["mount"]),
      hardware("rearAxleHardware", "Rear axle hardware", g.rearAxle, ["mount"]),
      hardware(
        "rearUdhHardware",
        "UDH adapter",
        [g.rearAxle[0], g.rearAxle[1], 0.085],
        ["mount"],
      ),
      hardware(
        "barMount",
        "Handlebar mounting hardware",
        [g.stemClamp[0] + 0.1, g.stemClamp[1], 0],
        ["mount", "cargo_cage"],
      ),
      ...(["Left", "Right"] as const).flatMap((side) => {
        const fork =
          size.sockets[side === "Left" ? "forkLeft" : "forkRight"][0];
        if (!fork) return [];
        return [
          hardware(`rearPannierUpper${side}`, `${side} rear pannier · upper clamp replacement`, g.rearAxle, ["mount"], ["pannier-mounts"]),
          hardware(`rearPannierLower${side}`, `${side} rear pannier · matching lower hook hardware`, g.rearAxle, ["mount"], ["pannier-mounts"]),
          hardware(`forkPackHardware${side}`, `${side} Fork Pack · mount or conversion kit`, fork.position, ["mount"]),
          hardware(`forkPackHook${side}`, `${side} Fork Pack · replacement lower hook`, fork.position, ["mount"]),
          ...(["Upper","Lower"] as const).map(level=>hardware(`cargoStrap${level}${side}`, `${side} cage · ${level.toLowerCase()} cargo strap`, fork.position, ["mount"], ["cargo-cage"])),
          hardware(`cargoFoot${side}`, `${side} optional cargo cage foot`, fork.position,
            ["mount"], ["cargo-cage-load-chip-host"]),
          hardware(
            `forkMount${side}`,
            `${side} fork hardware`,
            [fork.position[0], fork.position[1], fork.position[2] * 0.75],
            ["mount"],
          ),
          hardware(
            `cage${side}`,
            `${side} cargo cage`,
            fork.position,
            ["cargo_cage"],
            ["fork-mount"],
          ),
        ];
      }),
    ];
    for (const socket of size.sockets.additional) {
      if (socket.id === "rearRack")
        socket.requires = ["tailfin-axle", "udh-adapter"];
      if (socket.id === "pannierLeft" || socket.id === "pannierRight")
        { socket.requires = ["pannier-mounts"]; if(!socket.allowedBagCategories.includes("fork_cage_bag")) socket.allowedBagCategories.push("fork_cage_bag"); }
      if (socket.id === "rackTop") socket.requires = ["rack-top"];
    }
    for (const socket of [...size.sockets.forkLeft, ...size.sockets.forkRight])
      { socket.requires = ["fork-mount"]; if(!socket.allowedBagCategories.includes("pannier")) socket.allowedBagCategories.push("pannier"); }
  }
  return bike;
}
