"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";
import { RigHUD } from "@/components/ui/RigHUD";
import { CameraControls } from "@/components/ui/CameraControls";
import { ExportModal } from "@/components/ui/ExportModal";
import { useRigStore } from "@/store/useRigStore";
import { Loader2, MousePointer2 } from "lucide-react";

// Dynamically import 3D Canvas with ssr disabled for WebGL safety
const ConfiguratorCanvas = dynamic(
  () =>
    import("@/components/canvas/ConfiguratorCanvas").then(
      (mod) => mod.ConfiguratorCanvas,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Preparing your bicycle preview…
        </span>
      </div>
    ),
  },
);

export default function ConfiguratorPage() {
  const syncFromUrl = useRigStore((s) => s.syncFromUrl);
  const bike = useRigStore((s) => s.currentBike);
  const size = useRigStore((s) => s.selectedSizeKey);
  const loadPreset = useRigStore((s) => s.loadPresetDemo);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncFromUrl();
  }, [syncFromUrl]);

  return (
    <main className="rig-app">
      <Header />
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">PLAN THE RIDE. PACK YOUR WAY.</p>
          <h2>Build your next adventure.</h2>
          <p className="workspace-description">
            Choose a bike, dial in your gear, and find your balance.
          </p>
        </div>
        <label className="preset-picker">
          <span>Start with a setup</span>
          <select
            aria-label="Load a preset"
            value=""
            onChange={(event) => {
              if (event.target.value)
                loadPreset(
                  event.target.value as
                    "endurance" | "minimalist" | "overloaded",
                );
            }}
          >
            <option value="" disabled>
              Choose a preset
            </option>
            <option value="endurance">Endurance</option>
            <option value="minimalist">Ultra-light</option>
            <option value="overloaded">Clearance test</option>
          </select>
        </label>
      </div>
      <div className="rig-workspace">
        <Sidebar />
        <section
          className="preview-panel"
          aria-label="Interactive 3D rig preview"
        >
          <div className="preview-heading">
            <div>
              <p className="eyebrow">YOUR RIG / SIZE {size}</p>
              <h3>
                {bike.brand} {bike.name}
              </h3>
            </div>
            <span className="preview-badge">
              <span />
              3D PREVIEW
            </span>
          </div>
          <div className="canvas-stage">
            {mounted ? (
              <ConfiguratorCanvas />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Loader2
                  className="animate-spin text-emerald-600"
                  aria-label="Loading 3D preview"
                />
              </div>
            )}
          </div>
          <div className="preview-footer">
            <CameraControls />
            <p>
              <MousePointer2 size={13} /> Drag to orbit · Scroll or pinch to
              zoom
            </p>
          </div>
        </section>
        <RigHUD />
      </div>

      {/* Manifest & Share Modal */}
      <ExportModal />
    </main>
  );
}
