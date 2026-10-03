import type { BagItem, BikeModel, BikeSizeConfig, SocketAnchor } from '../types/index.ts';
import { bottleAdapterKind, BOTTLE_DROPPER_PREVIEW_OFFSET_MM, getBottleMountPose } from './bottleMounts.ts';
import type { Point3 } from './bikeGeometry.ts';

export function isCatalogBottle(item?: BagItem): boolean {
  return /^tailfin-(643500|643499|643496)(-v\d+)?$/.test(item?.id ?? '');
}
export function shouldShowReferenceBottle(mounted: Record<string, BagItem>): boolean {
  return !isCatalogBottle(mounted.bottleDown);
}
/** Body-centred, original 74 x 230 mm visual estimate. Published bottle dimensions,
 * water capacity and dry mass are unavailable; this is not a clearance template. */
export function getCatalogBottleSockets(bike: BikeModel, size: BikeSizeConfig): SocketAnchor[] {
  return (['bottleDown', 'bottleSeat'] as const).map(id => {
    const pose = getBottleMountPose(bike,size,id === 'bottleDown' ? 'bottleMountDown' : 'bottleMountSeat');
    const axial = [Math.cos(pose.angle),Math.sin(pose.angle),0];
    return {
      id, name: id === 'bottleDown' ? 'Down tube · bottle' : 'Seat tube · bottle',
      position: pose.position.map((v,i)=>v+pose.normal[i]*.039+axial[i]*.035) as Point3,
      rotation: [0,0,pose.angle-Math.PI/2], allowedBagCategories:['accessory'], verification:'unverified',
      notes:'Illustrative bottle with a separate generic reference cage. Cage and water are not included or weighed. Verify cage, bosses, tube clearance and fit; bottle dimensions, capacity and dry mass remain unknown.',
    };
  });
}
/** Down means toward the bottom bracket on both tubes. Resolve from the immutable
 * base socket so repeated render/validation calls never accumulate the offset. */
export function resolveCatalogBottleAnchor(anchor: SocketAnchor, size: BikeSizeConfig, mounted: Record<string, BagItem>): SocketAnchor {
  if (anchor.id !== 'bottleDown' && anchor.id !== 'bottleSeat') return anchor;
  const base = size.sockets.additional?.find(a=>a.id===anchor.id) ?? anchor;
  const adapter = mounted[anchor.id === 'bottleDown' ? 'bottleMountDown' : 'bottleMountSeat'];
  if (bottleAdapterKind(adapter) !== 'bottle-dropper') return base;
  const angle = base.rotation[2]+Math.PI/2;
  const sign = anchor.id === 'bottleDown' ? -1 : 1;
  const normal = [sign*Math.sin(angle),-sign*Math.cos(angle),0];
  const axial = [Math.cos(angle),Math.sin(angle),0];
  return {...base,position:base.position.map((v,i)=>v-axial[i]*BOTTLE_DROPPER_PREVIEW_OFFSET_MM/1000+normal[i]*.005) as Point3};
}
