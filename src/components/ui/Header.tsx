"use client";

import { useState } from "react";
import { useRigStore } from "@/store/useRigStore";
import { Compass, Share2, FileDown, MapPin, Check } from "lucide-react";

export function Header() {
  const getShareableUrl = useRigStore((s) => s.getShareableUrl);
  const setExportModalOpen = useRigStore((s) => s.setExportModalOpen);
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 2500);
    } catch {
      setShareState("error");
      setExportModalOpen(true);
    }
  }

  return (
    <header className="app-header">
      <div className="flex items-center gap-3">
        <div className="brand-mark"><Compass size={22} /></div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white">Bikepack<span className="text-emerald-400">3D</span></h1>
          <p className="brand-subtitle">THE RIG BUILDER</p>
        </div>
      </div>
      <nav aria-label="Rig actions" className="flex items-center gap-2">
        <a href="/routes/index.html" target="_blank" rel="noreferrer" className="header-action route-link" aria-label="Route maps (opens in a new tab)"><MapPin size={16} /><span>Route maps</span></a>
        <button onClick={handleShare} className="header-action" aria-label={shareState === "copied" ? "Rig link copied" : "Share rig"}>
          {shareState === "copied" ? <Check size={16} /> : <Share2 size={16} />}<span>{shareState === "copied" ? "Copied" : "Share"}</span>
        </button>
        <button onClick={() => setExportModalOpen(true)} className="header-action primary-action" aria-label="Export manifest"><FileDown size={16} /><span>Export</span></button>
      </nav>
      <span className="sr-only" role="status">{shareState === "error" ? "Clipboard unavailable. Copy the rig link from the export dialog." : shareState === "copied" ? "Rig link copied" : ""}</span>
    </header>
  );
}
