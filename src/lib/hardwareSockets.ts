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
      hardware("rearLightMount", "Rear light or light mount", [g.rearAxle[0]-.2,g.rearAxle[1]+.4,0], ["mount","accessory"]),
      hardware("journeyMudguard", "Journey rack mudguard", [g.rearAxle[0],g.rearAxle[1]+.4,0], ["accessory"], ["journey-rack"]),
      hardware("barCageAccessory", "Bar Cage accessory", [g.stemClamp[0]+.06,g.stemClamp[1]+.055,0], ["mount"], ["bar-cage-accessory"]),
      hardware("rearAxleHardware", "Rear axle hardware", g.rearAxle, ["mount"]),
      hardware(
        "rearUdhHardware",
        "UDH adapter",
        [g.rearAxle[0], g.rearAxle[1], -0.085],
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
        socket.requires = ["pannier-mounts"];
      if (socket.id === "rackTop") socket.requires = ["rack-top"];
    }
    for (const socket of [...size.sockets.forkLeft, ...size.sockets.forkRight])
      socket.requires = ["fork-mount"];
  }
  return bike;
}
