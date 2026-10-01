"use client";

import React from "react";
import { useRigStore } from "@/store/useRigStore";
import { CameraPreset } from "@/types";
import { Eye, Compass, ArrowLeft, Box } from "lucide-react";

export function CameraControls() {
  const activePreset = useRigStore((s) => s.activeCameraPreset);
  const setCameraPreset = useRigStore((s) => s.setCameraPreset);

  const presets: { id: CameraPreset; label: string; icon: React.ReactNode }[] = [
    { id: "iso", label: "Isometric", icon: <Box className="w-3.5 h-3.5" /> },
    { id: "side", label: "Side View", icon: <Eye className="w-3.5 h-3.5" /> },
    { id: "cockpit", label: "Cockpit", icon: <Compass className="w-3.5 h-3.5" /> },
    { id: "rear", label: "Rear Tire", icon: <ArrowLeft className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="absolute bottom-6 left-6 z-20 flex items-center bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-1.5 shadow-2xl">
      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 border-r border-slate-700/60 mr-1 hidden sm:block">
        Camera
      </div>
      <div className="flex space-x-1">
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setCameraPreset(p.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
