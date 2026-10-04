import type { BagItem, SocketAnchor } from '../types/index.ts';
import { getRearArchPose } from './rearArchReplacement.ts';
import { equipmentDimensions, getEquipmentPlacement, rotateEquipmentPoint, type Point3 } from './equipmentGeometry.ts';
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

/** Place the inboard hardware datum on the shared rear-arch receiver. */
export function getRearPannierPose(host:BagItem|undefined, rack:BagItem, rackAnchor:SocketAnchor, side:'Left'|'Right') {
 const arch=getRearArchPose(rack,rackAnchor);
 const dimensions=host ? equipmentDimensions(host) : [.16,.30,.13] as Point3;
 const [,h,d]=dimensions;
 const rotation:Point3=[arch.rotation[0],arch.rotation[1]+(side==='Right'?Math.PI:0),arch.rotation[2]];
 const receiver=rotateEquipmentPoint([-arch.dimensions[0]*.065,arch.dimensions[1]*.36,(side==='Left'?1:-1)*arch.dimensions[2]*.44],arch.rotation);
 const datum=rotateEquipmentPoint([0,h*.30,-d*.5-.014],rotation);
 return {dimensions,rotation,position:arch.position.map((v,i)=>v+receiver[i]-datum[i]) as Point3};
}
