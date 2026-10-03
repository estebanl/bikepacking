import { getFrameAttachmentSpec, frameAttachmentConflictReasons } from "./frameAttachments.ts";
import { requiredProductCapabilities, forkPackConflictReasons } from "./forkPackAssembly.ts";
import { getForkPackHardwarePose, forkPackSide, getRearPannierPose } from "./forkPackGeometry.ts";
import { resolveCatalogBottleAnchor } from "./catalogBottles.ts";
import { getRearArchPose, effectiveMountCapabilities } from "./rearArchReplacement.ts";
import type {
  BagItem,
  BikeModel,
  BikeSizeConfig,
  SocketAnchor,
} from "../types/index.ts";
import { resolveCargoStrapAnchor, getBarCageEnvelope, isBarCageBundle } from "./cargoStraps.ts";
import { resolveRearAccessoryAnchor } from "./rearAccessoryMounts.ts";
import { equipmentDimensions, rotateEquipmentPoint, getEquipmentPlacement } from "./equipmentGeometry.ts";
export function getSocketAnchors(size: BikeSizeConfig, mounted: Record<string, BagItem> = {}): SocketAnchor[] {
  const anchors = Object.values(size.sockets).flatMap((value) =>
    Array.isArray(value) ? value : value ? [value] : [],
  );
  // Shared illustrative attachment stack. Separate the fork, backplate and bag;
  // local +X faces outboard on each side, never through the tire.
  const resolved: SocketAnchor[] = anchors.map(anchor => {
    if(anchor.id === "downtubeUnderside" && /^tailfin-129268-v/.test(mounted[anchor.id]?.id ?? "") && anchor.tubeAttachment) {
      const ref=anchor.tubeAttachment,[l]=equipmentDimensions(mounted[anchor.id]);
      const offset=rotateEquipmentPoint([ref.radius+l*.46+.010,0,0],ref.rotation);
      return {...anchor,rotation:ref.rotation,position:ref.position.map((v,i)=>v+offset[i]) as [number,number,number]};
    }
    if (/^pannier(Left|Right)$/.test(anchor.id) && mounted.rearRack && mounted[anchor.id]) {
      const rackAnchor=anchors.find(a=>a.id==='rearRack');
      if(rackAnchor) { const pose=getRearPannierPose(mounted[anchor.id],mounted.rearRack,rackAnchor,forkPackSide(anchor.id)); return {...anchor,position:pose.position,rotation:pose.rotation}; }
    }
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
    if (anchor.id === "barMount" && mounted.barMount?.id === "tailfin-825745-v1") {
      const bag=mounted.handlebar;
      if(bag?.requires?.includes("bar-cage")) {
        const pose=getEquipmentPlacement(bag,size.sockets.handlebar);
        return {...anchor,position:pose.position,rotation:pose.rotation};
      }
      return {...anchor,position:[anchor.position[0]+.065,anchor.position[1]-.13,anchor.position[2]]};
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
  return resolved.map(anchor => {
    const framePart=getFrameAttachmentSpec(anchor.id);
    if(framePart && mounted[framePart.hostSocket]) {
      const host=mounted[framePart.hostSocket],hostAnchor=resolved.find(a=>a.id===framePart.hostSocket);
      if(hostAnchor) { const pose=getEquipmentPlacement(host,hostAnchor); return {...anchor,position:pose.position,rotation:pose.rotation}; }
    }
    if(/^rearPannier(Upper|Lower)(Left|Right)$/.test(anchor.id) && mounted.rearRack) {
      const side=forkPackSide(anchor.id), rackAnchor=resolved.find(a=>a.id==='rearRack');
      if(rackAnchor) { const pose=getRearPannierPose(mounted[`pannier${side}`],mounted.rearRack,rackAnchor,side); return {...anchor,position:pose.position,rotation:pose.rotation}; }
    }
    if(/^forkPack(Hardware|Hook)(Left|Right)$/.test(anchor.id)) {
      const side=forkPackSide(anchor.id), hostId=`fork${side}_0`;
      const hostAnchor=resolved.find(a=>a.id===hostId);
      if(hostAnchor) { const pose=getForkPackHardwarePose(mounted[hostId],hostAnchor,side); return {...anchor,position:pose.position,rotation:pose.rotation}; }
    }
    if((anchor.id === "rearArchReplacement" || anchor.id === "thirdPartyPannierAdapters") && mounted.rearRack) {
      const hostAnchor=resolved.find(a=>a.id === "rearRack");
      if(hostAnchor) { const pose=getRearArchPose(mounted.rearRack,hostAnchor); return {...anchor,position:pose.position,rotation:pose.rotation}; }
    }
    if(anchor.id === "bottleDown" || anchor.id === "bottleSeat") return resolveCatalogBottleAnchor(anchor,size,mounted);
    if(["barCageAccessory", "barCageReplacement", "barCageClampLeft", "barCageClampRight"].includes(anchor.id)) {
      const bundled = mounted.handlebar && isBarCageBundle(mounted.handlebar);
      const hostId = bundled ? "handlebar" : mounted.barMount?.provides?.includes("bar-cage") ? "barMount" : undefined;
      const hostAnchor=resolved.find(a=>a.id === hostId);
      const cageAnchor=hostAnchor && bundled ? {...hostAnchor,...getEquipmentPlacement(mounted.handlebar,hostAnchor)} : hostAnchor;
      if(cageAnchor) {
        if(anchor.id !== "barCageAccessory") return {...anchor,position:cageAnchor.position,rotation:cageAnchor.rotation};
        const [l,h]=getBarCageEnvelope(mounted);
        const offset=rotateEquipmentPoint([-l*.5-.008,h*.5+.018,0],cageAnchor.rotation);
        return {...anchor,position:cageAnchor.position.map((v,i)=>v+offset[i]) as [number,number,number],rotation:cageAnchor.rotation};
      }
    }
    return resolveRearAccessoryAnchor(resolveCargoStrapAnchor(anchor, resolved, mounted), resolved, mounted);
  });
}
export const findSocket = (size: BikeSizeConfig, id: string, mounted: Record<string, BagItem> = {}) =>
  getSocketAnchors(size, mounted).find((socket) => socket.id === id);
export const getWheelbaseMm = (bike: BikeModel, size: BikeSizeConfig) =>
  size.geometry.wheelbaseMm ?? bike.wheelbaseMm;
export function mountRequirementLabel(required: string): string {
  const labels: Record<string,string> = {
    "cargo-cage":"cargo cage", "fork-mount":"fork mounting kit",
    "cargo-cage-load-chip-host":"Small or Large Cargo Cage",
    "cargo-strap-upper":"upper Cargo Strap", "cargo-strap-lower":"lower Cargo Strap",
    "tailfin-axle":"Tailfin axle", "udh-adapter":"UDH adapter", "rack-top":"rack top support",
    "rear-pannier-upper":"same-side rear pannier clamp", "rear-mini-lower":"same-side Mini Pannier lower hook and bar", "fork-pack-host":"same-side Fork Pack", "mini-pannier-conversion":"same-side second-generation Mini Pannier conversion kit",
    "tailfin-carbon-arch-host":"Carbon rack or Carbon rear system", "tailfin-alloy-arch-host":"Alloy rear system",
    "bar-cage-accessory":"Bar Cage accessory interface", "pannier-mounts":"pannier mounts", "bar-cage":"Bar Cage", "bar-bag-mount":"Bar Bag Mounting Kit",
    "journey-rack":"Journey Pannier Rack", "tailfin-rear-light-interface":"compatible rear light attachment",
    "tailfin-fixed-bag-light-interface":"CargoPack or Fixed SpeedPack bag",
    "tailfin-clip-light-interface":"compatible CargoPack clip attachment",
  };
  return labels[required] ?? required.replace(/-/g," ");
}
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
  const scoped = ["cargo-cage", "fork-mount", "cargo-cage-load-chip-host", "cargo-strap-upper", "cargo-strap-lower", "fork-pack-host", "mini-pannier-conversion", "rear-pannier-upper", "rear-mini-lower"].includes(required);
  return Object.entries(mounted).some(
    ([id, item]) =>
      id !== socketId &&
      (item.id === required || effectiveMountCapabilities(item,id,mounted).includes(required)) &&
      (!scoped || (side(id) !== null && side(id) === side(socketId))) &&
      (required !== "fork-pack-host" || /^fork(Left|Right)_0$/.test(id)) &&
      (required !== "mini-pannier-conversion" || /^forkPackHardware(Left|Right)$/.test(id)) &&
      (required !== "rear-pannier-upper" || /^rearPannierUpper(Left|Right)$/.test(id)) &&
      (required !== "rear-mini-lower" || /^rearPannierLower(Left|Right)$/.test(id)) &&
      (required !== "cargo-strap-upper" || /^cargoStrapUpper(Left|Right)$/.test(id)) &&
      (required !== "cargo-strap-lower" || /^cargoStrapLower(Left|Right)$/.test(id)),
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
    Object.entries(mounted).filter(([id])=>id!==socketId).flatMap(([id,item]) => [item.id, ...effectiveMountCapabilities(item,id,mounted)]),
  );
  for (const required of Array.from(new Set([...requiredProductCapabilities(bag,socketId), ...(socket.requires ?? [])])))
    if (!hasMountCapability(mounted, socketId, required))
      reasons.push(
        `Requires ${mountRequirementLabel(required)}${["cargo-cage", "fork-mount", "cargo-cage-load-chip-host", "cargo-strap-upper", "cargo-strap-lower", "fork-pack-host", "mini-pannier-conversion", "rear-pannier-upper", "rear-mini-lower"].includes(required) ? " on this side" : ""}.`,
      );
  // Manufacturer Cage Pack FAQ specifies strap lengths; one individual strap
  // occupies each upper/lower slot. Pack mass excludes these two straps.
  const allowedStraps: Record<string, string[]> = {
    "tailfin-56316-v1": ["tailfin-126220-v1"],
    "tailfin-56316-v2": ["tailfin-126220-v2"],
    "tailfin-56316-v3": ["tailfin-126220-v2", "tailfin-126220-v3"],
  };
  const accepted = allowedStraps[bag.id];
  if (accepted) {
    const side = socketId.includes("Left") ? "Left" : socketId.includes("Right") ? "Right" : null;
    for (const level of ["Upper", "Lower"]) {
      const strap = side ? mounted[`cargoStrap${level}${side}`] : undefined;
      if (strap && !accepted.includes(strap.id)) reasons.push(`${level} Cargo Strap length does not match this Cage Pack. Use ${bag.id.endsWith("v1") ? "40 cm" : bag.id.endsWith("v2") ? "50 cm" : "50 or 65 cm"} straps on this side.`);
    }
  }
  if (
    (bag.excludes ?? []).some((id) => capabilities.has(id)) ||
    others.some((item) =>
      (item.excludes ?? []).some(
        (id) => id === bag.id || effectiveMountCapabilities(bag,socketId,mounted).includes(id),
      ),
    )
  )
    reasons.push("Conflicts with equipment already fitted.");
  reasons.push(...forkPackConflictReasons(bag,socketId,mounted));
  reasons.push(...frameAttachmentConflictReasons(bag,socketId,mounted));
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
