"use client";

import React, { useState } from "react";
import { useRigStore } from "@/store/useRigStore";
import {
  Compass,
  Share2,
  FileDown,
  Sparkles,
  MapPin,
  Check,
  RotateCcw,
} from "lucide-react";

export function Header() {
  const loadPresetDemo = useRigStore((s) => s.loadPresetDemo);
  const getShareableUrl = useRigStore((s) => s.getShareableUrl);
  const setExportModalOpen = useRigStore((s) => s.setExportModalOpen);
  const clearAllBags = useRigStore((s) => s.clearAllBags);

  const [copiedShare, setCopiedShare] = useState(false);

  function handleShare() {
    const url = getShareableUrl();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  }

  return (
    <header className="h-16 w-full bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center shadow-lg shadow-emerald-950">
          <Compass className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-extrabold tracking-tight text-white">
              Bikepack<span className="text-emerald-400">3D</span>
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Rig Configurator
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Exact-fit gear catalog • Live weight distribution • 3D clearance validator
          </p>
        </div>
      </div>

      {/* Preset Demos */}
      <div className="hidden lg:flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-xl">
        <span className="text-[11px] font-semibold text-slate-400 px-2 flex items-center">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-1" />
          Presets:
        </span>
        <button
          onClick={() => loadPresetDemo("endurance")}
          className="text-xs px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Endurance (42/58)
        </button>
        <button
          onClick={() => loadPresetDemo("minimalist")}
          className="text-xs px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          Ultra-Light
        </button>
        <button
          onClick={() => loadPresetDemo("overloaded")}
          className="text-xs px-2.5 py-1 rounded-lg text-amber-300 hover:bg-slate-800 transition-colors"
          title="Simulate clearance hazard with heavy load & dropper post"
        >
          Clearance Buzz Test
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2.5">
        {/* Canadian Routes link to preserve existing website content */}
        <a
          href="/routes/index.html"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>Route Maps</span>
        </a>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl border border-sky-500/40 bg-sky-950/40 text-xs font-semibold text-sky-200 hover:bg-sky-900/50 transition-colors"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Share Rig</span>
            </>
          )}
        </button>

        {/* Export Manifest Button */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-sm transition-colors"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span>Export Manifest</span>
        </button>
      </div>
    </header>
  );
}
