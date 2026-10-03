import { CatmullRomCurve3, Vector3 } from 'three';
import type { BagItem, BikeModel, BikeSizeConfig, SocketAnchor } from '../types/index.ts';
import { getBikeGeometry, topTubeRadius } from './bikeGeometry.ts';
import { getEquipmentPlacement, equipmentKind, rotateEquipmentPoint, type Point3 } from './equipmentGeometry.ts';

export interface FrameAttachmentStation {
  id: 'rear' | 'front' | 'seatpost';
  position: Point3;
  rotation: Point3;
  radius: number;
  lateralRadius: number;
  tabs: [Point3,Point3]; // tube-local coordinates
  contact: Point3; // tube-local bag fabric contact
  direction: 1 | -1;
}
/** Original attachment estimates sampled from the same tube path/radii as BikeMesh.
 * Stations and tabs are display geometry; no guessed strap length or fit approval.
 * Down-tube bags use local Y along the tube and local +X facing out below it.
 */
export function getFrameAttachmentStations(bike:BikeModel,size:BikeSizeConfig,bag:BagItem,anchor:SocketAnchor):FrameAttachmentStation[] {
 const kind=equipmentKind(bag),down=anchor.id==='downtubeUnderside';
 if(!down && !['frame','half_frame','top_tube'].includes(kind)) return [];
 const geometry=getBikeGeometry(bike,size),pose=getEquipmentPlacement(bag,anchor);
 const {length:l,height:h,depth:d}=pose.dimensions;
 const path=new CatmullRomCurve3((down ? [geometry.bb,[geometry.bb[0]+.11,geometry.bb[1]+.09,0] as Point3,[geometry.headTubeBottom[0],geometry.headTubeBottom[1]+.025,0] as Point3] : [geometry.seatCluster,geometry.seatCluster.map((v,i)=>(v+geometry.topTubeEnd[i])/2) as Point3,geometry.topTubeEnd]).map(point=>new Vector3(...point)));
 const toWorld=(point:Point3):Point3=>rotateEquipmentPoint(point,pose.rotation).map((value,i)=>value+pose.position[i]) as Point3;
 return (['rear','front'] as const).map((id,index)=>{
  const fraction=(down ? [-.30,.30] : kind==='top_tube' ? [-.30,.22] : [-.31,.22])[index];
  const contactLocal:Point3=down ? [-l*.46,h*fraction,0] : [l*fraction,kind==='top_tube' ? -h*.46 : h*.45,0];
  const contactWorld=toWorld(contactLocal),target=new Vector3(...contactWorld);
  let parameter=0,closest=Infinity;
  // Coarse-to-fine nearest point keeps a single deterministic station on curved tubes.
  for(let step=0;step<=160;step++) {const t=step/160,distance=path.getPoint(t).distanceToSquared(target);if(distance<closest){closest=distance;parameter=t;}}
  const coarse=parameter;
  for(let step=-10;step<=10;step++) {const t=Math.max(0,Math.min(1,coarse+step/1600)),distance=path.getPoint(t).distanceToSquared(target);if(distance<closest){closest=distance;parameter=t;}}
  const position=path.getPoint(parameter).toArray() as Point3,tangent=path.getTangent(parameter);
  const slope=Math.atan2(tangent.y,tangent.x),rotation:Point3=[0,0,slope];
  const toTube=(point:Point3):Point3=>rotateEquipmentPoint(point.map((value,i)=>value-position[i]) as Point3,[0,0,-slope]);
  const radius=down ? .037+Math.max(0,parameter-.5)*2*.008 : topTubeRadius(parameter);
  const contact=toTube(contactWorld);
  const tabs=([-1,1] as const).map(side=>toTube(toWorld(down ? [-l*.40,h*fraction,side*d*.46] : [l*fraction,kind==='top_tube' ? -h*.30 : h*.39,side*d*.46]))) as [Point3,Point3];
  return {id,position,rotation,radius,lateralRadius:radius*.75,tabs,contact,direction:contact[1]>=0 ? 1 : -1};
 });
}

/** Optional rear top-tube bag strap to the fixed post; stays independent of dropper travel.
 * SaddleMesh currently renders a 14mm-radius post. Keep this loop on that surface.
 */
export function getRearSeatStrapStation(bike:BikeModel,size:BikeSizeConfig,bag:BagItem,anchor:SocketAnchor):FrameAttachmentStation {
 const g=getBikeGeometry(bike,size),angle=size.geometry.seatTubeAngleDeg*Math.PI/180;
 const position:Point3=[g.seatCluster[0]-.045*Math.cos(angle),g.seatCluster[1]+.045*Math.sin(angle),0];
 const rotation:Point3=[0,0,Math.PI-angle],pose=getEquipmentPlacement(bag,anchor);
 const {length:l,height:h,depth:d}=pose.dimensions;
 const toTube=(local:Point3):Point3=>rotateEquipmentPoint(rotateEquipmentPoint(local,pose.rotation).map((value,i)=>value+pose.position[i]-position[i]) as Point3,[0,0,-rotation[2]]);
 const contact=toTube([-l*.46,-h*.12,0]);
 return {id:'seatpost',position,rotation,radius:.014,lateralRadius:.014,
  tabs:[toTube([-l*.46,-h*.12,-d*.40]),toTube([-l*.46,-h*.12,d*.40])],contact,direction:contact[1]>=0 ? 1 : -1};
}
