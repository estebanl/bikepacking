"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";

const thread = new THREE.MeshStandardMaterial({ color: "#46504d", roughness: .98 });
/** Original rounded sewn outline with softly crowned side panels. All corners stay inside the input outline. */
export function SoftPanelShell({ outline, depth, material }: { outline: number[][]; depth: number; material: THREE.Material }) {
  const data = useMemo(() => {
    const vertices = outline.map(([x,y]) => new THREE.Vector2(x,y));
    if (THREE.ShapeUtils.isClockWise(vertices)) vertices.reverse();
    const shape = new THREE.Shape();
    vertices.forEach((current,i) => {
      const previous = vertices[(i+vertices.length-1)%vertices.length], next = vertices[(i+1)%vertices.length];
      const radius = Math.min(depth*.24, current.distanceTo(previous)*.14, current.distanceTo(next)*.14);
      const a = current.clone().lerp(previous, radius/current.distanceTo(previous));
      const b = current.clone().lerp(next, radius/current.distanceTo(next));
      if (!i) shape.moveTo(a.x,a.y); else shape.lineTo(a.x,a.y);
      shape.quadraticCurveTo(current.x,current.y,b.x,b.y);
    });
    shape.closePath();
    const points = shape.getPoints(4); points.pop();
    const center = vertices.reduce((a,b)=>a.add(b),new THREE.Vector2()).multiplyScalar(1/vertices.length);
    const profiles = [[1,.29],[.975,.385],[.89,.465],[.63,.494],[.2,.5]];
    const positions:number[]=[],uv:number[]=[],indices:number[]=[];
    const n=points.length, rings=profiles.length;
    for (const side of [1,-1]) {
      const base=positions.length/3;
      for (const [scale,z] of profiles) for (const p of points) {
        const point=p.clone().sub(center).multiplyScalar(scale).add(center);
        positions.push(point.x,point.y,side*z*depth); uv.push(point.x*3,point.y*3);
      }
      for(let r=0;r<rings-1;r++)for(let j=0;j<n;j++){
        const a=base+r*n+j,b=base+r*n+(j+1)%n,c=a+n,d=b+n;
        if(side===1)indices.push(a,b,c,b,d,c);else indices.push(a,c,b,b,c,d);
      }
      const tip=positions.length/3;positions.push(center.x,center.y,side*depth*.5);uv.push(center.x*3,center.y*3);
      for(let j=0;j<n;j++){
        const a=base+(rings-1)*n+j,b=base+(rings-1)*n+(j+1)%n;
        if(side===1)indices.push(a,b,tip);else indices.push(a,tip,b);
      }
    }
    const back=n*rings+1;
    for(let j=0;j<n;j++){const k=(j+1)%n;indices.push(j,back+j,k,k,back+j,back+k);}
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const seams=[-1,1].map(side=>{
      const path=points.map(p=>new THREE.Vector3(center.x+(p.x-center.x)*.974,center.y+(p.y-center.y)*.974,side*depth*.389));
      path.push(path[0].clone());
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path,false,"centripetal"),Math.min(96,n*3),.00055,4,false);
    });
    return {geometry,seams};
  },[outline,depth]);
  useEffect(()=>()=>{data.geometry.dispose();data.seams.forEach(g=>g.dispose());},[data]);
  return <group dispose={null} name="illustrative-soft-sewn-panels">
    <mesh geometry={data.geometry} material={material} castShadow receiveShadow/>
    {data.seams.map((geometry,i)=><mesh key={i} geometry={geometry} material={thread}/>)}
  </group>;
}

/** Side-panel crown at a point, for details that must follow the cloth instead of a flat plane. */
export function softPanelDepthAt(outline: number[][], depth: number, x: number, y: number) {
  const center=outline.reduce((a,p)=>[a[0]+p[0]/outline.length,a[1]+p[1]/outline.length],[0,0]);
  const dx=x-center[0],dy=y-center[1];
  let boundary=Infinity;
  for(let i=0;i<outline.length;i++){
    const a=outline[i],b=outline[(i+1)%outline.length],ex=b[0]-a[0],ey=b[1]-a[1];
    const den=dx*ey-dy*ex;if(Math.abs(den)<1e-10)continue;
    const ax=a[0]-center[0],ay=a[1]-center[1];
    const t=(ax*ey-ay*ex)/den,u=(ax*dy-ay*dx)/den;
    if(t>0&&u>=0&&u<=1)boundary=Math.min(boundary,t);
  }
  const radial=Number.isFinite(boundary)?1/boundary:0;
  const profile=[[0,.5],[.2,.5],[.63,.494],[.89,.465],[.975,.385],[1,.29]];
  for(let i=1;i<profile.length;i++)if(radial<=profile[i][0]){
    const [a,z]=profile[i-1],[b,w]=profile[i];return depth*(z+(w-z)*(radial-a)/(b-a));
  }
  return depth*.29;
}

export function SoftPanelZipper({outline,depth,length,y,side,material}:{outline:number[][];depth:number;length:number;y:number;side:number;material:THREE.Material}){
  const geometry=useMemo(()=>{
    const positions:number[]=[],indices:number[]=[];
    for(let i=0;i<=24;i++)for(const edge of[-1,1]){
      const x=(i/24-.5)*length,py=y+edge*.003;
      positions.push(x,py,side*(softPanelDepthAt(outline,depth,x,py)+.0012));
    }
    for(let i=0;i<24;i++){const a=i*2;if(side===1)indices.push(a,a+2,a+1,a+1,a+2,a+3);else indices.push(a,a+1,a+2,a+1,a+3,a+2);}
    const result=new THREE.BufferGeometry();result.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));result.setIndex(indices);result.computeVertexNormals();return result;
  },[outline,depth,length,y,side]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  return <mesh dispose={null} geometry={geometry} material={material}/>;
}
