import type { BagItem, SocketAnchor } from '../types/index.ts';
import { equipmentDimensions, getEquipmentPlacement, type Point3 } from './equipmentGeometry.ts';
export function getCargoStrapEnvelope(mounted: Record<string,BagItem>, socketId: string): Point3 {
 const side=socketId.endsWith('Left')?'Left':'Right';
 const bag=mounted[`fork${side}_0`];
 if(bag?.id.startsWith('tailfin-56316-')) {
  const [l,,d]=equipmentDimensions(bag);
  // Inner diameters follow the original elliptical soft shell, not flat strap length.
  return [l*.98+.002,.02,d*.90+.002];
 }
 const cage=mounted[`cage${side}`];
 const [l,,d]=cage?equipmentDimensions(cage):[.035,.17,.072];
 return [Math.max(.04,l+.012),.02,d+.008];
}
export function getCargoStrapRearExtension(mounted: Record<string,BagItem>, socketId: string): number {
 const side=socketId.endsWith('Left')?'Left':'Right';
 const bag=mounted[`fork${side}_0`];
 return bag?.id.startsWith('tailfin-56316-') ? .021+equipmentDimensions(bag)[0]*.01 : 0;
}
export function resolveCargoStrapAnchor(anchor: SocketAnchor, anchors: SocketAnchor[], mounted: Record<string,BagItem>): SocketAnchor {
 if(!/^cargoStrap(Upper|Lower)(Left|Right)$/.test(anchor.id)) return anchor;
 const side=anchor.id.endsWith('Left')?'Left':'Right';
 const bagId=`fork${side}_0`, cageId=`cage${side}`;
 const hostId=mounted[bagId]?.id.startsWith('tailfin-56316-')?bagId:cageId;
 const host=mounted[hostId],hostAnchor=anchors.find(a=>a.id===hostId);
 if(!host||!hostAnchor) return anchor;
 const pose=getEquipmentPlacement(host,hostAnchor);
 const cage=mounted[cageId],cageAnchor=anchors.find(a=>a.id===cageId);
 if(!cage||!cageAnchor) return anchor;
 const cagePose=getEquipmentPlacement(cage,cageAnchor);
 // Encircling bands engage the rendered cage crossbars, not arbitrary bag heights.
 const bandY=cagePose.position[1]+(anchor.id.includes('Upper')?1:-1)*cagePose.dimensions.height*.32;
 return {...anchor,position:[pose.position[0],bandY,pose.position[2]],rotation:pose.rotation};
}

export function getBarCageEnvelope(mounted: Record<string,BagItem>): Point3 {
 const bag=mounted.handlebar;
 return bag?.requires?.includes("bar-cage") ? equipmentDimensions(bag) : [.16,.16,.36];
}
