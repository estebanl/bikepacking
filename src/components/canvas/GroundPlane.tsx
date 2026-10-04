"use client";

import { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import { useRigStore } from "@/store/useRigStore";
import { getBikeGeometry } from "@/lib/bikeGeometry";

/** Cached illustrative contact projection, not a physical lighting simulation.
 * Drei resets its finite frame counter on rerender. Subscribe only to geometry
 * changes: camera motion, payload edits and UI selections reuse the same texture.
 * Keep dimensions/resolution constant so these rerenders reuse render targets. */
export function GroundPlane() {
  const bike=useRigStore(s=>s.currentBike);
  const size=useRigStore(s=>s.currentSizeConfig);
  useRigStore(s=>s.mountedBags);
  useRigStore(s=>s.dropperPostCompressed);
  useRigStore(s=>s.waterBottlesMounted);
  const g=getBikeGeometry(bike,size);
  const contactUniforms=useMemo(()=>({opacity:{value:.72}}),[]);
  return <group>
    {/* Analytic grounding cues at the wheel contact locations, not tire deformation.
      * Two small quads add no render targets or extra depth-capture passes. */}
    {[g.rearAxle[0],g.frontAxle[0]].map((x,i)=><mesh key={i}
      name={`tire-contact-cue-${i}`} position={[x,-.0008,0]}
      rotation={[-Math.PI/2,0,0]} renderOrder={2}>
      <planeGeometry args={[.20,(bike.tireWidthMm??45)/1000*2.8]}/>
      <shaderMaterial transparent depthWrite={false} uniforms={contactUniforms}
        vertexShader={`varying vec2 contactUv; void main(){contactUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`}
        fragmentShader={`varying vec2 contactUv; uniform float opacity; void main(){float r=length((contactUv-.5)*2.0);float a=(1.0-smoothstep(.25,1.0,r))*opacity;gl_FragColor=vec4(.10,.13,.11,a);}`}/>
    </mesh>)}
    {/* Capture starts above the analytic cues so its depth override cannot bake their quads. */}
    <ContactShadows
    name="cached-soft-ground-contact"
    position={[0,-.0004,0]}
    scale={1}
    width={3.8}
    height={2.4}
    resolution={512}
    frames={2}
    near={0}
    far={.85}
    opacity={.28}
    blur={1.25}
    smooth
    color="#242c28"
    depthWrite={false}
  />
  </group>;
}
