"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Header } from "@/components/ui/Header";
import { Sidebar } from "@/components/ui/Sidebar";
import { RigHUD } from "@/components/ui/RigHUD";
import { CameraControls } from "@/components/ui/CameraControls";
import { ExportModal } from "@/components/ui/ExportModal";
import { useRigStore } from "@/store/useRigStore";
import { Compass, Loader2 } from "lucide-react";

// Dynamically import 3D Canvas with ssr disabled for WebGL safety
const ConfiguratorCanvas = dynamic(
  () =>
    import("@/components/canvas/ConfiguratorCanvas").then(
      (mod) => mod.ConfiguratorCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Initializing 3D Canvas & Physics Engine...
        </span>
      </div>
    ),
  }
);

export default function ConfiguratorPage() {
  const syncFromUrl = useRigStore((s) => s.syncFromUrl);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    syncFromUrl();
  }, [syncFromUrl]);

  return (
    <main className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 select-none">
      <Header />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Gear and Bike Configuration Sidebar */}
        <Sidebar />

        {/* 3D Viewport & HUD Canvas */}
        <section className="flex-1 relative h-full w-full overflow-hidden">
          {mounted ? (
            <ConfiguratorCanvas />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-950">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          )}

          {/* Viewpoint Camera Shortcuts */}
          <CameraControls />

          {/* Live Weight Distribution, Capacity & Clearance HUD */}
          <RigHUD />
        </section>
      </div>

      {/* Manifest & Share Modal */}
      <ExportModal />
    </main>
  );
}
