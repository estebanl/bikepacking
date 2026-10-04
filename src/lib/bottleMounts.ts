import type { BagItem, BikeModel, BikeSizeConfig, SocketAnchor } from '../types/index.ts';
import { getBikeGeometry, interpolate, type Point3 } from './bikeGeometry.ts';

export type BottleMountId = 'bottleMountDown' | 'bottleMountSeat';
/** Published adjustment range; 45 mm downward is this preview's fixed setting, not a fit recommendation. */
export const BOTTLE_DROPPER_PREVIEW_OFFSET_MM = 45;
export function bottleAdapterKind(item?: BagItem): 'hydromount' | 'bottle-dropper' | null {
  const source = item?.id ?? '';
  if (source === 'tailfin-959100' || source.startsWith('tailfin-959100-')) return 'hydromount';
  if (source === 'tailfin-675800' || source.startsWith('tailfin-675800-')) return 'bottle-dropper';
  return null;
}
/** Original location estimates, not measured boss positions.
 * Local X points into the triangle. Local Y runs down the down tube and up the seat tube. */
export function getBottleMountPose(bike: BikeModel, size: BikeSizeConfig, id: BottleMountId) {
  const g = getBikeGeometry(bike, size);
  const down = id === 'bottleMountDown';
  const end: Point3 = down ? [g.headTubeBottom[0], g.headTubeBottom[1] + .025, 0] : g.seatCluster;
  const angle = Math.atan2(end[1] - g.bb[1], end[0] - g.bb[0]);
  const tubePosition = interpolate(g.bb, end, down ? .43 : .39);
  const normal: Point3 = down ? [-Math.sin(angle), Math.cos(angle), 0] : [Math.sin(angle), -Math.cos(angle), 0];
  const radius = down ? .037 : .023;
  return {
    tubePosition, angle, normal, radius,
    position: tubePosition.map((v, i) => v + normal[i] * radius) as Point3,
    rotation: [0, 0, angle + (down ? Math.PI / 2 : -Math.PI / 2)] as Point3,
  };
}
export function getBottleHardwareSockets(bike: BikeModel, size: BikeSizeConfig): SocketAnchor[] {
  return (['bottleMountDown', 'bottleMountSeat'] as const).map(id => {
    const pose = getBottleMountPose(bike, size, id);
    return {
      id, name: id === 'bottleMountDown' ? 'Down tube · bottle adapter' : 'Seat tube · bottle adapter',
      position: pose.position, rotation: pose.rotation, allowedBagCategories: ['mount'], verification: 'unverified',
      notes: 'One adapter per location; replacing it prevents stacked adapters. Tube diameter, boss locations, strap clearance and installation remain unverified. Separate reference bottle/cage is not included in adapter mass. Bottle Dropper preview uses a fixed 45 mm downward adjustment; check actual installation.',
    };
  });
}
/** The existing toggle shows one independent reference bottle/cage on the down tube.
 * Adapter mounting alone never creates a bottle, cage, payload, or additional mass. */
export function getReferenceBottlePose(bike: BikeModel, size: BikeSizeConfig, mounted: Record<string, BagItem>) {
  const pose = getBottleMountPose(bike, size, 'bottleMountDown');
  const kind = bottleAdapterKind(mounted.bottleMountDown);
  const along = kind === 'bottle-dropper' ? -BOTTLE_DROPPER_PREVIEW_OFFSET_MM / 1000 : 0;
  const stack = kind === 'bottle-dropper' ? .005 : 0;
  return {
    position: pose.tubePosition.map((v, i) => v + pose.normal[i] * (.069 + stack) + [Math.cos(pose.angle), Math.sin(pose.angle), 0][i] * along) as Point3,
    rotation: [0, 0, pose.angle - Math.PI / 2] as Point3,
    adapterKind: kind,
  };
}
/** Conservative reference-bottle envelope for advisory overlap only, never numeric fit certification. */
export function getReferenceBottleEnvelope(bike: BikeModel, size: BikeSizeConfig, mounted: Record<string, BagItem>) {
  const pose = getReferenceBottlePose(bike, size, mounted);
  const angle = pose.rotation[2] + Math.PI / 2;
  const center: Point3 = [pose.position[0] + Math.cos(angle) * .05, pose.position[1] + Math.sin(angle) * .05, 0];
  const extent: Point3 = [Math.abs(Math.cos(angle)) * .12 + Math.abs(Math.sin(angle)) * .04, Math.abs(Math.sin(angle)) * .12 + Math.abs(Math.cos(angle)) * .04, .04];
  return { min: center.map((v,i) => v-extent[i]) as Point3, max: center.map((v,i) => v+extent[i]) as Point3 };
}
