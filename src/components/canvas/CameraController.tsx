"use client";

import { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useRigStore } from "@/store/useRigStore";

export function CameraController() {
  const { camera } = useThree();
  const activeCameraPreset = useRigStore((s) => s.activeCameraPreset);

  const targetPos = useRef(new THREE.Vector3(1.6, 1.3, 1.8));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.6, 0));
  const currentLookAt = useRef(new THREE.Vector3(0, 0.6, 0));

  useEffect(() => {
    switch (activeCameraPreset) {
      case "side":
        targetPos.current.set(0, 0.65, 2.2);
        targetLookAt.current.set(0, 0.6, 0);
        break;
      case "cockpit":
        targetPos.current.set(0.25, 1.25, 0.45);
        targetLookAt.current.set(0.42, 0.92, 0);
        break;
      case "rear":
        targetPos.current.set(-2.0, 0.8, 0.1);
        targetLookAt.current.set(0, 0.6, 0);
        break;
      case "iso":
      default:
        targetPos.current.set(1.5, 1.25, 1.7);
        targetLookAt.current.set(0, 0.6, 0);
        break;
    }
  }, [activeCameraPreset]);

  useFrame((_, delta) => {
    // Smooth lerp to camera preset
    const step = Math.min(1, delta * 3.5);
    camera.position.lerp(targetPos.current, step);
    currentLookAt.current.lerp(targetLookAt.current, step);
    camera.lookAt(currentLookAt.current);
  });

  return null;
}
