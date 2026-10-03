import type { BagItem } from '../types/index.ts';

export interface AxleSparePart {
  socketId: string;
  hostSocket: 'rearAxleHardware' | 'rearUdhHardware';
  hostProductIds: string[];
  requiredCapability: string;
}
export const AXLE_SPARE_PARTS: Record<string, AxleSparePart> = {
  'tailfin-1027496': { socketId: 'rearAxleNds', hostSocket: 'rearAxleHardware', hostProductIds: ['tailfin-34167'], requiredCapability: 'universal-axle-host' },
  'tailfin-129619': { socketId: 'rearAxleDs', hostSocket: 'rearAxleHardware', hostProductIds: ['tailfin-34167'], requiredCapability: 'universal-axle-host' },
  'tailfin-994176': { socketId: 'rearAxleSpacers', hostSocket: 'rearAxleHardware', hostProductIds: ['tailfin-34167', 'tailfin-564'], requiredCapability: 'tailfin-thru-axle-host' },
  'tailfin-836241': { socketId: 'rearUdhHanger', hostSocket: 'rearUdhHardware', hostProductIds: ['tailfin-664853'], requiredCapability: 'udh-kit-host' },
};
const productId = (bag: BagItem) => bag.id.replace(/-v\d+$/, '');

export function axleSpareConflictReasons(bag: BagItem, socketId: string, mounted: Record<string, BagItem>): string[] {
  const part = AXLE_SPARE_PARTS[productId(bag)];
  if (!part) return [];
  if (socketId !== part.socketId) return ['This axle spare is not configured for this attachment point.'];
  const host = mounted[part.hostSocket];
  if (!host || !part.hostProductIds.includes(productId(host))) return ['Requires its compatible complete axle or UDH kit at the matching attachment point.'];
  if ((socketId === 'rearAxleNds' && mounted.rearAxleSpacers?.id === 'tailfin-994176-v1') ||
      (socketId === 'rearAxleSpacers' && mounted.rearAxleNds?.id === 'tailfin-1027496-v1')) {
    return ['The non-drive-side kit already includes spacers. Remove the separate spacer set to avoid overlapping hardware.'];
  }
  return [];
}

export function getModifiedAxleHostSockets(mounted: Record<string, BagItem>): Set<string> {
  const hosts = new Set<string>();
  for (const [id, part] of Object.entries(AXLE_SPARE_PARTS)) {
    const installed = mounted[part.socketId], host = mounted[part.hostSocket];
    // Account for replacements even before conflicting duplicate hardware is
    // sanitized; never reuse complete host mass when its included parts change.
    if (installed && productId(installed) === id && host && part.hostProductIds.includes(productId(host))) hosts.add(part.hostSocket);
  }
  return hosts;
}
