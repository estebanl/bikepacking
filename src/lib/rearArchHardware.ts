import type { BagItem } from '../types/index.ts';
import { effectiveMountCapabilities } from './rearArchReplacement.ts';

export const REAR_ARCH_HARDWARE_PARTS: Record<string, { socketIds: string[]; requiredCapabilities: string[] }> = {
  'tailfin-129215': { socketIds: ['rearArchBumpers'], requiredCapabilities: ['tailfin-carbon-arch-host', 'pannier-mounts'] },
  'tailfin-129212': { socketIds: ['rearArchBumpers'], requiredCapabilities: ['tailfin-alloy-arch-host', 'pannier-mounts'] },
  'tailfin-827': { socketIds: ['rearDropoutLeft', 'rearDropoutRight'], requiredCapabilities: ['fast-release-host'] },
  'tailfin-33026': { socketIds: ['rearDropoutBushings'], requiredCapabilities: ['fast-release-host'] },
};
const productId = (bag: BagItem) => bag.id.replace(/-v\d+$/, '');
const supportedHost = (host?: BagItem) => !!host && /^tailfin-(895075|913333|894178)-v\d+$/.test(host.id);

export function rearArchHardwareConflictReasons(bag: BagItem, socketId: string, mounted: Record<string, BagItem>): string[] {
  const id = productId(bag), part = REAR_ARCH_HARDWARE_PARTS[id];
  if (!part) return [];
  if (!part.socketIds.includes(socketId)) return ['This arch replacement part is not configured for this attachment point.'];
  const host = mounted.rearRack;
  if (!supportedHost(host)) return ['Requires its compatible non-Journey Tailfin rear system at the rear rack attachment point.'];
  const capabilities = effectiveMountCapabilities(host, 'rearRack', mounted);
  if (part.requiredCapabilities.some(cap => !capabilities.includes(cap))) return ['Requires the matching arch material and mounting interfaces on this rear system.'];
  if (socketId === 'rearArchBumpers' && mounted.rearArchReplacement) {
    const archId = mounted.rearArchReplacement.id;
    const materialMatches = id === 'tailfin-129215' ? /^tailfin-(641|446|43576)-v1$/.test(archId) : /^tailfin-(642|591|43567)-v1$/.test(archId);
    if (!materialMatches) return ['Bumper material must match the installed replacement arch.'];
  }
  return [];
}

export function getModifiedRearArchHardwareHostSockets(mounted: Record<string, BagItem>): Set<string> {
  const hosts = new Set<string>();
  if (!supportedHost(mounted.rearRack)) return hosts;
  for (const [id, part] of Object.entries(REAR_ARCH_HARDWARE_PARTS)) {
    if (part.socketIds.some(socket => mounted[socket] && productId(mounted[socket]) === id)) hosts.add('rearRack');
  }
  return hosts;
}
