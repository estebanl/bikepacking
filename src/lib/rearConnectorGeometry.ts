import type { BagItem, BikeModel, BikeSizeConfig, SocketAnchor } from '../types/index.ts';
import { getBikeGeometry } from './bikeGeometry.ts';
import { getEquipmentPlacement, rotateEquipmentPoint, type Point3 } from './equipmentGeometry.ts';

export interface RearConnectorGeometry {
  a: Point3;
  b: Point3;
  seatAngle: number;
}
/** Shared illustrative attachment endpoints, independent of dropper compression.
 * b touches the fixed outer post 45mm above the frame's seat cluster. These are
 * display coordinates, not certified connector length or suspension clearance.
 */
export function getRearConnectorGeometry(bike: BikeModel, size: BikeSizeConfig, host: BagItem, anchor: SocketAnchor): RearConnectorGeometry {
  const geometry = getBikeGeometry(bike, size);
  const pose = getEquipmentPlacement(host, anchor);
  const {length:l,height:h} = pose.dimensions;
  const seatAngle = size.geometry.seatTubeAngleDeg * Math.PI / 180;
  const b:Point3 = [geometry.seatCluster[0] - .045 * Math.cos(seatAngle), geometry.seatCluster[1] + .045 * Math.sin(seatAngle), 0];
  const local:Point3 = host.visualKind === 'aeropack' ? [l*.96*.44,h*(-.15+.65*.44),0] : [l*.44,h*.44,0];
  const offset = rotateEquipmentPoint(local, pose.rotation);
  return {a:offset.map((value,i)=>value+pose.position[i]) as Point3,b,seatAngle};
}
