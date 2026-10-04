import type { BagItem, SocketAnchor } from '../types/index.ts';
import { getEquipmentPlacement, rotateEquipmentPoint, type Point3 } from './equipmentGeometry.ts';
/** Shared original preview attachment geometry, not manufacturer interface dimensions. */
export function resolveRearAccessoryAnchor(anchor: SocketAnchor, anchors: SocketAnchor[], mounted: Record<string,BagItem>): SocketAnchor {
  if (!['rearLightMount','journeyMudguard'].includes(anchor.id)) return anchor;
  const required = mounted[anchor.id]?.requires ?? (anchor.id === 'journeyMudguard' ? ['journey-rack'] : ['tailfin-rear-light-interface']);
  const hostId = ['rackTop','rearRack'].find(id=>mounted[id] && required.every(cap=>mounted[id].provides?.includes(cap)));
  const hostAnchor = anchors.find(a=>a.id===hostId);
  const host = hostId ? mounted[hostId] : undefined;
  if (!host || !hostAnchor) return anchor;
  const pose = getEquipmentPlacement(host,hostAnchor);
  const {length:l,height:h} = pose.dimensions;
  const rack = host.visualKind === 'rack';
  const integrated = host.visualKind === 'aeropack';
  const local: Point3 = anchor.id === 'journeyMudguard'
    ? [0,h*.44-.006,0]
    : rack ? [-l*.43-.006,h*.44,0]
    : [-l*.480625,integrated ? h*.32 : 0,0];
  const offset = rotateEquipmentPoint(local,pose.rotation);
  return {...anchor,position:pose.position.map((v,i)=>v+offset[i]) as Point3,
    rotation: anchor.id === 'journeyMudguard' ? pose.rotation : [0,Math.PI,0]};
}
