import type { BikeModel, BikeSizeConfig } from '../types/index.ts';
import { getBikeGeometry, type Point3 } from './bikeGeometry.ts';

/** Evaluate the first segment of the modeled three-point centripetal spline.
 * This small scalar implementation keeps Three.js out of static socket creation.
 * Its knot spacing and endpoint extrapolation match the canvas curve exactly.
 */
function firstSegment(a:Point3,b:Point3,c:Point3,weight:number):Point3 {
 const before=a.map((value,i)=>(value-b[i])+value) as Point3;
 const spacing=(p:Point3,q:Point3)=>Math.pow(p.reduce((sum,value,i)=>sum+(value-q[i])**2,0),.25);
 let middle=spacing(a,b);
 if(middle<1e-4) middle=1;
 const leftRaw=spacing(before,a),rightRaw=spacing(b,c);
 const left=leftRaw<1e-4 ? middle : leftRaw,right=rightRaw<1e-4 ? middle : rightRaw;
 return a.map((start,i)=>{
  const end=b[i];
  const incoming=((start-before[i])/left-(end-before[i])/(left+middle)+(end-start)/middle)*middle;
  const outgoing=((end-start)/middle-(c[i]-start)/(middle+right)+(c[i]-end)/right)*middle;
  const quadratic=-3*start+3*end-2*incoming-outgoing;
  const cubic=2*start-2*end+incoming+outgoing;
  return start+incoming*weight+quadratic*(weight*weight)+cubic*(weight*weight*weight);
 }) as Point3;
}

/** Shared down-tube centreline at t=.4, with a tangent matching Curve.getTangent.
 * Position and angle describe illustrative frame geometry, not physical fit.
 */
export function getDownTubePackReference(bike:BikeModel,size:BikeSizeConfig):{position:Point3;rotation:Point3;radius:number} {
 const g=getBikeGeometry(bike,size),a=g.bb;
 const b:Point3=[a[0]+.11,a[1]+.09,0];
 const c:Point3=[g.headTubeBottom[0],g.headTubeBottom[1]+.025,0];
 const point=firstSegment(a,b,c,.4*2);
 const before=firstSegment(a,b,c,(.4-.0001)*2),after=firstSegment(a,b,c,(.4+.0001)*2);
 const dx=after[0]-before[0],dy=after[1]-before[1],dz=after[2]-before[2];
 const length=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;
 const slope=Math.atan2(dy/length,dx/length);
 return {position:point,rotation:[0,0,slope-Math.PI/2],radius:.037};
}
