import type { BikeModel, BikeSizeConfig } from '../types/index.ts';
import { getBikeGeometry, type Point3 } from './bikeGeometry.ts';

export interface AxleHardwarePose {position:Point3;rotation:Point3}
/** Shared original axle datums. The modeled drivetrain is on +Z, so the hanger
 * is also +Z. Display offsets do not establish axle length, pitch or dropout fit.
 * Keep this pure so static socket generation never imports the 3D renderer.
 */
export function getAxleHardwarePoses(bike:BikeModel,size:BikeSizeConfig):{axle:AxleHardwarePose;udh:AxleHardwarePose} {
 const {rearAxle}=getBikeGeometry(bike,size);
 return {
  axle:{position:[...rearAxle],rotation:[0,0,0]},
  udh:{position:[rearAxle[0],rearAxle[1],rearAxle[2]+.085],rotation:[0,0,0]},
 };
}
