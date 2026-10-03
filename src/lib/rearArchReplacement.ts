import type { BagItem, SocketAnchor } from '../types/index.ts';
import { equipmentDimensions, getEquipmentPlacement, rotateEquipmentPoint, type Point3 } from './equipmentGeometry.ts';
const ARCHES = /^(?:tailfin-)(642|641|591|446|43567|43576)-v1$/;
export function isRearArchReplacement(item?: BagItem): boolean { return ARCHES.test(item?.id ?? ''); }
export function archHasPannierMounts(item?: BagItem): boolean {
  return item?.id === 'tailfin-591-v1' || item?.id === 'tailfin-446-v1';
}
export function rackHasPannierMounts(mounted: Record<string,BagItem>): boolean {
 return isRearArchReplacement(mounted.rearArchReplacement) ? archHasPannierMounts(mounted.rearArchReplacement) : !!mounted.rearRack?.provides?.includes('pannier-mounts');
}
export function effectiveMountCapabilities(item: BagItem, socketId: string, mounted: Record<string,BagItem>): string[] {
 const capabilities = (item.provides ?? []).filter(c=>c !== "tailfin-pannier" || /^pannier(Left|Right)$/.test(socketId));
 if(socketId !== 'rearRack' || !isRearArchReplacement(mounted.rearArchReplacement)) return capabilities;
 return [...capabilities.filter(c=>c!=='pannier-mounts'),...(archHasPannierMounts(mounted.rearArchReplacement)?['pannier-mounts']:[])];
}
export function getRearArchPose(host: BagItem, anchor: SocketAnchor) {
 const pose=getEquipmentPlacement(host,anchor);
 const [l,h,d]=equipmentDimensions(host);
 const integrated=host.visualKind==='aeropack';
 const offset=rotateEquipmentPoint([0,integrated ? -h*.15 : 0,0],pose.rotation);
 return {position:pose.position.map((v,i)=>v+offset[i]) as Point3,rotation:pose.rotation,
 dimensions:(integrated ? [l*.96,h*.65,d*.68] : [l,h,d]) as Point3};
}
