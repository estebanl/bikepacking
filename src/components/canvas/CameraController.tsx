"use client";

import { useEffect, useRef, type ComponentRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { getBikeGeometry } from "@/lib/bikeGeometry";
import { getSocketAnchors } from "@/lib/sockets";
import { getEquipmentPlacement, rotateEquipmentPoint } from "@/lib/equipmentGeometry";
import { useRigStore } from "@/store/useRigStore";

export function CameraController() {
  const { camera, size } = useThree();
  const preset = useRigStore((s) => s.activeCameraPreset);
  const revision = useRigStore((s) => s.cameraRevision);
  const bikeId = useRigStore((s) => s.currentBike.id);
  const geometry = useRigStore((s) => s.currentSizeConfig.geometry);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transitioning = useRef(true);
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    // Refit only on a requested view/resize, preserving ownership of manual orbit.
    const state=useRigStore.getState();
    const g=getBikeGeometry(state.currentBike,state.currentSizeConfig,state.dropperPostCompressed);
    const points:THREE.Vector3[]=[];
    for(const axle of [g.rearAxle,g.frontAxle]) for(const x of [-1,1]) for(const y of [-1,1])
      points.push(new THREE.Vector3(axle[0]+x*g.wheelRadius,axle[1]+y*g.wheelRadius,0));
    points.push(new THREE.Vector3(g.saddleBase[0]-.14,g.saddleBase[1]+.05,0));
    for(const z of [-1,1]) points.push(new THREE.Vector3(g.stemClamp[0]+.16,g.stemClamp[1]+.09,z*(state.currentBike.handlebarType==='flat'?.39:.24)));
    for(const anchor of getSocketAnchors(state.currentSizeConfig,state.mountedBags)) {
      const bag=state.mountedBags[anchor.id]; if(!bag) continue;
      const pose=getEquipmentPlacement(bag,anchor,state.dropperPostCompressed);
      for(const x of [-1,1]) for(const y of [-1,1]) for(const z of [-1,1]) {
        const offset=rotateEquipmentPoint([x*pose.dimensions.length/2,y*pose.dimensions.height/2,z*pose.dimensions.depth/2],pose.rotation);
        points.push(new THREE.Vector3(...pose.position).add(new THREE.Vector3(...offset)));
      }
    }
    const bounds=new THREE.Box3().setFromPoints(points),center=bounds.getCenter(new THREE.Vector3());
    const direction=new THREE.Vector3(...(preset==='side'?[0,.04,1]:[.32,.2,.94])).normalize();
    const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
    const up=new THREE.Vector3().crossVectors(direction,right);
    const tangent=Math.tan(THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov/2));
    let distance=1.5;
    for(const point of points) {
      const relative=point.clone().sub(center),depth=relative.dot(direction);
      distance=Math.max(distance,depth+1.14*Math.abs(relative.dot(right))/(tangent*aspect),depth+1.14*Math.abs(relative.dot(up))/tangent);
    }
    targetLookAt.current.copy(center);
    switch (preset) {
      case "side": targetPos.current.copy(center).addScaledVector(direction,distance); break;
      case "cockpit":
        targetPos.current.set(0.9, 1.4, 1.05);
        targetLookAt.current.set(0.42, 0.86, 0);
        break;
      case "rear": targetPos.current.set(-2.2, 0.9, 0.35); break;
      default: targetPos.current.copy(center).addScaledVector(direction,distance);
    }
    transitioning.current = true;
  }, [preset, revision, bikeId, geometry, size.width, size.height]);

  useFrame((_, delta) => {
    if (!transitioning.current || !controls.current) return;
    const step = Math.min(1, delta * 6);
    camera.position.lerp(targetPos.current, step);
    controls.current.target.lerp(targetLookAt.current, step);
    controls.current.update();
    if (camera.position.distanceTo(targetPos.current) < 0.002 && controls.current.target.distanceTo(targetLookAt.current) < 0.002) {
      transitioning.current = false;
    }
  });

  return <OrbitControls ref={controls} makeDefault minDistance={0.7} maxDistance={7} maxPolarAngle={Math.PI / 2 - 0.02} target={[0, 0.52, 0]} dampingFactor={0.08} enableDamping onStart={() => { transitioning.current = false; }} />;
}
