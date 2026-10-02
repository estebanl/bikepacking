import type {
  BagItem,
  BikeModel,
  BikeSizeConfig,
  SocketAnchor,
} from "../types/index.ts";
export function getSocketAnchors(size: BikeSizeConfig): SocketAnchor[] {
  return Object.values(size.sockets).flatMap((value) =>
    Array.isArray(value) ? value : value ? [value] : [],
  );
}
export const findSocket = (size: BikeSizeConfig, id: string) =>
  getSocketAnchors(size).find((socket) => socket.id === id);
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
  const scoped = ["cargo-cage", "fork-mount"].includes(required);
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
        `Requires ${required}${["cargo-cage", "fork-mount"].includes(required) ? " on this side" : ""}.`,
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
