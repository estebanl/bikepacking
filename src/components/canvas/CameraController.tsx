"use client";

import { useEffect, useRef, type ComponentRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";

export function CameraController() {
  const { camera, size } = useThree();
  const preset = useRigStore((s) => s.activeCameraPreset);
  const revision = useRigStore((s) => s.cameraRevision);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const transitioning = useRef(true);
  const targetPos = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    // Fit the whole rig in narrow or tall viewports, including mounted bags.
    const distance = Math.max(2.15, 2.4 / Math.max(aspect, 0.5));
    targetLookAt.current.set(0, 0.52, 0);
    switch (preset) {
      case "side": targetPos.current.set(0, 0.65, distance); break;
      case "cockpit":
        targetPos.current.set(0.9, 1.4, 1.05);
        targetLookAt.current.set(0.42, 0.86, 0);
        break;
      case "rear": targetPos.current.set(-2.2, 0.9, 0.35); break;
      default: targetPos.current.set(distance * 0.32, 1.12, distance * 0.94);
    }
    transitioning.current = true;
  }, [preset, revision, size.width, size.height]);

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
