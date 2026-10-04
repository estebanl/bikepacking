import type { BagItem } from '../types/index.ts';

export type FrameAttachmentHost = 'frameTriangle' | 'topTubeFront' | 'topTubeRear' | 'downtubeUnderside';
export type FrameAttachmentRole = 'vMount' | 'strap' | 'keepers' | 'seatpostStrap';
export interface FrameAttachmentSocket {
  id: string;
  hostSocket: FrameAttachmentHost;
  role: FrameAttachmentRole;
  position: 'fore' | 'aft' | 'distributed' | 'seatpost';
  requiredCapability: string;
}
const capabilities: Record<FrameAttachmentHost, string> = {
  frameTriangle: 'frame-bag-host',
  topTubeFront: 'front-top-tube-host',
  topTubeRear: 'rear-top-tube-host',
  downtubeUnderside: 'downtube-pack-host',
};
const paired = (hostSocket: FrameAttachmentHost, role: 'vMount' | 'strap'): FrameAttachmentSocket[] =>
  (['fore', 'aft'] as const).map(position => ({
    id: `${hostSocket}${role === 'vMount' ? 'VMount' : 'Strap'}${position === 'fore' ? 'Fore' : 'Aft'}`,
    hostSocket, role, position, requiredCapability: capabilities[hostSocket],
  }));
const special = (hostSocket: FrameAttachmentHost, role: 'keepers' | 'seatpostStrap'): FrameAttachmentSocket => ({
  id: `${hostSocket}${role === 'keepers' ? 'Keepers' : 'SeatpostStrap'}`,
  hostSocket, role, position: role === 'keepers' ? 'distributed' : 'seatpost', requiredCapability: capabilities[hostSocket],
});

// Stations are illustrative replacement positions, not a claim about package
// quantity or every original attachment location. One keeper record is a pack of four.
export const FRAME_ATTACHMENT_SOCKETS: FrameAttachmentSocket[] = [
  ...paired('frameTriangle', 'vMount'), ...paired('frameTriangle', 'strap'), special('frameTriangle', 'keepers'),
  ...paired('topTubeFront', 'vMount'), ...paired('topTubeFront', 'strap'), special('topTubeFront', 'keepers'),
  ...paired('topTubeRear', 'vMount'), special('topTubeRear', 'seatpostStrap'),
  ...paired('downtubeUnderside', 'vMount'), ...paired('downtubeUnderside', 'strap'),
];

export interface FrameAttachmentPart {
  socketIds: string[];
  hostProductIds: string[];
}
const frameHosts = ['tailfin-1006881', 'tailfin-1006882'];
const frontHosts = ['tailfin-1051880', 'tailfin-732053'];
export const FRAME_ATTACHMENT_HOST_PRODUCTS: Record<FrameAttachmentHost, string[]> = {
  frameTriangle: frameHosts, topTubeFront: frontHosts,
  topTubeRear: ['tailfin-798331'], downtubeUnderside: ['tailfin-129268'],
};
const slots = (hosts: FrameAttachmentHost[], role: FrameAttachmentRole) =>
  FRAME_ATTACHMENT_SOCKETS.filter(s => hosts.includes(s.hostSocket) && s.role === role).map(s => s.id);
export const FRAME_ATTACHMENT_PARTS: Record<string, FrameAttachmentPart> = {
  'tailfin-661862': { socketIds: slots(['frameTriangle'], 'vMount'), hostProductIds: frameHosts },
  'tailfin-652831': { socketIds: slots(['topTubeFront'], 'vMount'), hostProductIds: frontHosts },
  'tailfin-762364': { socketIds: slots(['downtubeUnderside'], 'vMount'), hostProductIds: ['tailfin-129268'] },
  'tailfin-750317': { socketIds: slots(['topTubeRear'], 'vMount'), hostProductIds: ['tailfin-798331'] },
  'tailfin-661863': { socketIds: slots(['frameTriangle'], 'strap'), hostProductIds: frameHosts },
  'tailfin-652830': { socketIds: slots(['topTubeFront'], 'strap'), hostProductIds: frontHosts },
  'tailfin-652823': { socketIds: slots(['frameTriangle', 'topTubeFront'], 'strap'), hostProductIds: [...frameHosts, ...frontHosts] },
  'tailfin-734868': { socketIds: slots(['frameTriangle', 'topTubeFront'], 'keepers'), hostProductIds: [...frameHosts, ...frontHosts] },
  'tailfin-750325': { socketIds: slots(['topTubeRear'], 'seatpostStrap'), hostProductIds: ['tailfin-798331'] },
  'tailfin-130754': { socketIds: slots(['downtubeUnderside'], 'strap'), hostProductIds: ['tailfin-129268'] },
  'tailfin-130755': { socketIds: slots(['downtubeUnderside'], 'strap'), hostProductIds: ['tailfin-129268'] },
};
const productId = (bag: BagItem) => bag.id.replace(/-v\d+$/, '');
export const getFrameAttachmentSpec = (socketId: string) => FRAME_ATTACHMENT_SOCKETS.find(s => s.id === socketId);

export function frameAttachmentConflictReasons(bag: BagItem, socketId: string, mounted: Record<string, BagItem>): string[] {
  const part = FRAME_ATTACHMENT_PARTS[productId(bag)];
  if (!part) return []; // Parent validation handles unrelated products; never reject a host swap here.
  const spec = getFrameAttachmentSpec(socketId);
  if (!spec || !part.socketIds.includes(socketId)) return ['This replacement is not configured for this attachment position.'];
  const host = mounted[spec.hostSocket];
  if (!host || !part.hostProductIds.includes(productId(host)) || !FRAME_ATTACHMENT_HOST_PRODUCTS[spec.hostSocket].includes(productId(host))) return [`Requires its compatible Tailfin bag at ${spec.hostSocket}.`];
  return [];
}

export function getModifiedFrameHostSockets(mounted: Record<string, BagItem>): Set<string> {
  const hosts = new Set<string>();
  for (const spec of FRAME_ATTACHMENT_SOCKETS) {
    // Rear bag's published 109/112 g covers its two top-tube straps. The
    // optional third seatpost strap adds unknown mass; it replaces no included part.
    if (spec.role === 'seatpostStrap') continue;
    const part = mounted[spec.id];
    if (part && FRAME_ATTACHMENT_PARTS[productId(part)] && frameAttachmentConflictReasons(part, spec.id, mounted).length === 0) hosts.add(spec.hostSocket);
  }
  return hosts;
}
