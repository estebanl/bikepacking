"use client";
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { BagItem } from '@/types';

/** Original illustrative bottle and unweighted reference cage. No vendor texture,
 * measured CAD, claimed cage product, water payload or assumed bottle size. */
export function CatalogBottleModel({item, cageBackSign=1}: {item:BagItem; cageBackSign?:1|-1}) {
  const teal=item.id.startsWith('tailfin-643500');
  const smoke=item.id.startsWith('tailfin-643496');
  const shell=useMemo(()=>new THREE.LatheGeometry([
    [.029,-.115],[.035,-.111],[.037,-.102],[.037,.018],[.034,.029],
    [.032,.043],[.035,.054],[.036,.066],[.034,.077],[.024,.089],[.023,.092],
  ].map(([x,y])=>new THREE.Vector2(x,y)),32),[]);
  const label=useMemo(()=>{
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
    const ctx=canvas.getContext('2d')!;
    ctx.fillStyle=teal?'#53bdc2':'#e8eee9';ctx.font='700 66px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TAILFIN',256,64);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
  },[teal]);
  useEffect(()=>()=>{shell.dispose();label.dispose();},[shell,label]);
  return <group name="catalog-bottle-with-unweighted-reference-cage">
    <mesh geometry={shell} castShadow><meshStandardMaterial color={smoke?'#737d79':'#161e20'} roughness={.56}/></mesh>
    <mesh position={[0,.099,0]} castShadow><cylinderGeometry args={[.024,.025,.018,32]}/><meshStandardMaterial color={teal?'#32989f':'#202729'} roughness={.6}/></mesh>
    <mesh position={[0,.111,0]}><cylinderGeometry args={[.009,.012,.010,20]}/><meshStandardMaterial color="#b0bbb5" roughness={.48}/></mesh>
    {[-1,1].map(side=><mesh key={side} position={[0,-.014,side*.0376]} rotation={[0,side===1?0:Math.PI,0]}><planeGeometry args={[.061,.017]}/><meshStandardMaterial map={label} transparent depthWrite={false} roughness={.9}/></mesh>)}
    <group name="separate-generic-reference-cage-not-included-or-weighed">
      {/* Original estimated boss spacing and support, never a verified frame interface. */}
      <mesh position={[cageBackSign*.041,-.035,0]} castShadow><boxGeometry args={[.005,.11,.02]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
      {[-1,1].map(boss=><mesh key={`boss-${boss}`} position={[cageBackSign*.043,-.035+boss*.032,0]} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[.004,.004,.011,12]}/><meshStandardMaterial color="#6c7775" metalness={.65} roughness={.45}/></mesh>)}
      <mesh position={[cageBackSign*.041,-.0965,0]}><boxGeometry args={[.005,.018,.012]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
      <mesh position={[cageBackSign*.021,-.103,0]}><boxGeometry args={[.044,.005,.012]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
      <mesh position={[0,-.103,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.037,.0025,8,32]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[0,-.043,side*.039]}><cylinderGeometry args={[.0025,.0025,.12,8]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
        <mesh position={[0,.015,side*.036]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.0025,.0025,.012,8]}/><meshStandardMaterial color="#929d9a" metalness={.6} roughness={.45}/></mesh>
      </group>)}
    </group>
  </group>;
}
