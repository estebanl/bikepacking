import type { BagItem } from '../types/index.ts';
import { effectiveMountCapabilities } from './rearArchReplacement.ts';
export const EXTERIOR_SERVICE_PARTS: Record<string, {socketIds: string[]; requiredCapabilities: string[]}> = {
  'tailfin-661861': {socketIds: ['rearPannierLowerLeft', 'rearPannierLowerRight'], requiredCapabilities: ['current-large-pannier-host']},
  'tailfin-141888': {socketIds: ['rearPannierInsertsLeft', 'rearPannierInsertsRight'], requiredCapabilities: ['rear-pannier-insert-host']},
  'tailfin-917654': {socketIds: ['rackTopConnector'], requiredCapabilities: ['speedpack-removable-host']},
  'tailfin-734886': {socketIds: ['topTubeFlipBuckle'], requiredCapabilities: ['flip-top-tube-host']},
};
const family = (bag: BagItem) => bag.id.replace(/-v\d+$/, '');
export function exteriorServicePartConflictReasons(bag: BagItem, socket: string, mounted: Record<string, BagItem>): string[] {
  const side = socket.endsWith('Left') ? 'Left' : socket.endsWith('Right') ? 'Right' : null;
  // Symmetric lower-hook exclusion at insertion time; sanitization checks the
  // child first on host changes so a stale replacement cannot evict a new bag.
  if (/^pannier(Left|Right)$/.test(socket) && mounted[`rearPannierLower${side}`]?.id === 'tailfin-661861-v1' && !/^tailfin-968191-v[12]$/.test(bag.id)) return ['The current 16/22 L lower hook cannot be used with this pannier.'];
  const part = EXTERIOR_SERVICE_PARTS[family(bag)];
  if (!part) return [];
  if (!part.socketIds.includes(socket)) return ['This exterior spare is not configured for this attachment point.'];
  const host = side ? mounted[`pannier${side}`] : undefined;
  if (bag.id === 'tailfin-661861-v1' && !/^tailfin-968191-v[12]$/.test(host?.id ?? '')) return ['Requires the current same-side 16 L or 22 L Tailfin pannier.'];
  if (bag.id === 'tailfin-141888-v1' && !(/^tailfin-(968191|972100)-v[12]$/.test(host?.id ?? '') ||
      (/^tailfin-655674-v[12]$/.test(host?.id ?? '') && mounted[`rearPannierUpper${side}`]?.id === 'tailfin-48947-v1'))) return ['Requires a same-side current Tailfin rear pannier or a converted Fork Pack with its compatible upper clamp.'];
  if (bag.id === 'tailfin-917654-v1' && !(mounted.rackTop?.id === 'tailfin-930095-v1' && mounted.rearRack &&
    effectiveMountCapabilities(mounted.rearRack, 'rearRack', mounted).includes('rack-top'))) return ['Requires a removable SpeedPack on a compatible complete rack; fixed SpeedPack kits are excluded.'];
  if (bag.id === 'tailfin-734886-v1' && !/^tailfin-1051880-v[35]$/.test(mounted.topTubeFront?.id ?? '')) return ['Requires the 1.1 L or 1.5 L Flip Top Tube Pack at the front top-tube position.'];
  return [];
}
export function getModifiedExteriorServiceHostSockets(mounted: Record<string, BagItem>): Set<string> {
  const hosts = new Set<string>();
  for (const [id, mapping] of Object.entries(EXTERIOR_SERVICE_PARTS)) for (const socket of mapping.socketIds) {
    const part = mounted[socket];
    if (!part || family(part) !== id || exteriorServicePartConflictReasons(part, socket, mounted).length) continue;
    hosts.add(socket === 'rackTopConnector' ? 'rackTop' : socket === 'topTubeFlipBuckle' ? 'topTubeFront' : `pannier${socket.endsWith('Left') ? 'Left' : 'Right'}`);
  }
  return hosts;
}
