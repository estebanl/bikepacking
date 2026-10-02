import type {
  BagItem,
  BikeModel,
  BikeSizeConfig,
  SocketAnchor,
} from "../types/index.ts";
import { resolveRearAccessoryAnchor } from "./rearAccessoryMounts.ts";
import { equipmentDimensions, rotateEquipmentPoint, getEquipmentPlacement } from "./equipmentGeometry.ts";
export function getSocketAnchors(size: BikeSizeConfig, mounted: Record<string, BagItem> = {}): SocketAnchor[] {
  const anchors = Object.values(size.sockets).flatMap((value) =>
    Array.isArray(value) ? value : value ? [value] : [],
  );
  // Shared illustrative attachment stack. Separate the fork, backplate and bag;
  // local +X faces outboard on each side, never through the tire.
  const resolved: SocketAnchor[] = anchors.map(anchor => {
    if (anchor.id === "rackTop" && mounted.rearRack && mounted.rackTop) {
      const rackAnchor = anchors.find(a=>a.id === "rearRack");
      if (rackAnchor && mounted.rearRack.visualKind === "rack") {
        const rack = getEquipmentPlacement(mounted.rearRack,rackAnchor);
        const [,bagHeight] = equipmentDimensions(mounted.rackTop);
        // Deck rail radius6mm; fixed connector underside is .499 of bag height.
        const underside = /fixed connector/i.test(mounted.rackTop.name) ? .499 : .47;
        return {...anchor,rotation:rack.rotation,position:[rack.position[0],rack.position[1]+rack.dimensions.height*.44+.006+bagHeight*underside,rack.position[2]]};
      }
    }
    const match = /^(cage|cargoFoot|forkMount|fork)(Left|Right)(?:_0)?$/.exec(anchor.id);
    if (!match) return anchor;
    const [,kind,sideName] = match;
    const side = sideName === "Left" ? 1 : -1;
    const fork = anchors.find(a => a.id === `fork${sideName}_0`);
    if (!fork) return anchor;
    const cage = mounted[`cage${sideName}`];
    const [cl,ch] = cage ? equipmentDimensions(cage) : [.035,.17,.072];
    const rotation: [number,number,number] = [0,-side*Math.PI/2,0];
    const center: [number,number,number] = [fork.position[0],fork.position[1],side*(.088+cl*.32)];
    if (kind === "forkMount") return {...anchor,position:[fork.position[0],fork.position[1],side*.055],rotation};
    if (kind === "cage") return {...anchor,position:center,rotation};
    if (kind === "cargoFoot") {
      const chip = mounted[anchor.id];
      const chipLength = chip ? equipmentDimensions(chip)[0] : .03;
      const delta = rotateEquipmentPoint([chipLength*.4-cl*.32,-ch*.47,0],rotation);
      return {...anchor,rotation,position:center.map((v,i)=>v+delta[i]) as [number,number,number]};
    }
    const bag = mounted[anchor.id];
    if (!bag) return {...anchor,rotation};
    const [bl,bh] = equipmentDimensions(bag);
    return {...anchor,rotation,position:[fork.position[0],fork.position[1]+(cage ? -ch*.47+bh*.44 : 0),side*(.106+bl*.5)]};
  });
  return resolved.map(anchor => resolveRearAccessoryAnchor(anchor, resolved, mounted));
}
export const findSocket = (size: BikeSizeConfig, id: string, mounted: Record<string, BagItem> = {}) =>
  getSocketAnchors(size, mounted).find((socket) => socket.id === id);
export const getWheelbaseMm = (bike: BikeModel, size: BikeSizeConfig) =>
  size.geometry.wheelbaseMm ?? bike.wheelbaseMm;
export function hasMountCapability(
  mounted: Record<string, BagItem>,
  socketId: string,
  required: string,
): boolean {
  const side = (id: string) =>
    id.toLowerCase().includes("left")
      ? "left"
      : id.toLowerCase().includes("right")
        ? "right"
        : null;
  const scoped = ["cargo-cage", "fork-mount", "cargo-cage-load-chip-host"].includes(required);
  return Object.entries(mounted).some(
    ([id, item]) =>
      id !== socketId &&
      (item.id === required || item.provides?.includes(required)) &&
      (!scoped || (side(id) !== null && side(id) === side(socketId))),
  );
}
export function validateMount(
  bag: BagItem,
  socketId: string,
  size: BikeSizeConfig,
  mounted: Record<string, BagItem>,
) {
  const reasons: string[] = [];
  const socket = findSocket(size, socketId);
  if (!socket)
    return {
      allowed: false,
      reasons: ["This attachment point does not exist on the selected frame."],
    };
  if (
    !socket.allowedBagCategories.includes(bag.category) ||
    !bag.compatibleSockets.some(
      (id) =>
        id === socketId ||
        (id === "forkLeft" && socketId.startsWith("forkLeft")) ||
        (id === "forkRight" && socketId.startsWith("forkRight")),
    )
  )
    reasons.push("This product is not configured for this attachment point.");
  if (
    bag.handlebarType &&
    socket.handlebarType &&
    bag.handlebarType !== socket.handlebarType
  )
    reasons.push(`This variant requires a ${bag.handlebarType} handlebar.`);
  const others = Object.entries(mounted)
    .filter(([id]) => id !== socketId)
    .map(([, item]) => item);
  const capabilities = new Set(
    others.flatMap((item) => [item.id, ...(item.provides ?? [])]),
  );
  for (const required of [...(bag.requires ?? []), ...(socket.requires ?? [])])
    if (!hasMountCapability(mounted, socketId, required))
      reasons.push(
        `Requires ${required}${["cargo-cage", "fork-mount", "cargo-cage-load-chip-host"].includes(required) ? " on this side" : ""}.`,
      );
  if (
    (bag.excludes ?? []).some((id) => capabilities.has(id)) ||
    others.some((item) =>
      (item.excludes ?? []).some(
        (id) => id === bag.id || bag.provides?.includes(id),
      ),
    )
  )
    reasons.push("Conflicts with equipment already fitted.");
  return { allowed: reasons.length === 0, reasons };
}
export function sanitizeMountedBags(
  bags: Record<string, BagItem>,
  size: BikeSizeConfig,
) {
  const mountedBags: Record<string, BagItem> = Object.create(null);
  const removed: { socketId: string; bagId: string; reasons: string[] }[] = [];
  for (const [socket, item] of Object.entries(bags))
    if (findSocket(size, socket)) mountedBags[socket] = item;
    else
      removed.push({
        socketId: socket,
        bagId: item.id,
        reasons: ["Attachment point unavailable."],
      });
  let changed = true;
  while (changed) {
    changed = false;
    for (const [socket, item] of Object.entries(mountedBags)) {
      const result = validateMount(item, socket, size, mountedBags);
      if (!result.allowed) {
        delete mountedBags[socket];
        removed.push({
          socketId: socket,
          bagId: item.id,
          reasons: result.reasons,
        });
        changed = true;
      }
    }
  }
  return { mountedBags, removed };
}
