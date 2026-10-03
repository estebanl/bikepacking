import type { BagItem, SocketAnchor } from '../types/index.ts';
import { equipmentDimensions, getEquipmentPlacement, type Point3 } from './equipmentGeometry.ts';
export function isForkPackBag(item?:BagItem): boolean { return /^tailfin-655674-v[12]$/.test(item?.id??''); }
export function isMiniPannier(item?:BagItem): boolean { return /^tailfin-972100-v[12]$/.test(item?.id??''); }
export function isForkPackPart(item?:BagItem): boolean { return /^tailfin-(661740|661731|676061|675876)-v1$/.test(item?.id??''); }
export function isWholeForkPackKit(item?:BagItem): boolean { return /^tailfin-(661740|675876)-v1$/.test(item?.id??''); }
export function forkPackSide(socketId:string):'Left'|'Right' { return socketId.includes('Left')?'Left':'Right'; }
export function getForkPackHardwarePose(host:BagItem|undefined, forkAnchor:SocketAnchor, side:'Left'|'Right') {
 if(host && (isForkPackBag(host)||isMiniPannier(host))) {
  const pose=getEquipmentPlacement(host,forkAnchor);
  return {position:pose.position,rotation:pose.rotation,dimensions:equipmentDimensions(host)};
 }
 return {position:[forkAnchor.position[0],forkAnchor.position[1],(side==='Left'?1:-1)*(.106+.14*.5)] as Point3,
 rotation:forkAnchor.rotation,dimensions:[.14,.26,.13] as Point3};
}
