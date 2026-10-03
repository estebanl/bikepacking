"use client";

import React from "react";
import { getMassUncertainHostIds } from "@/lib/balance";
import { useRigStore } from "@/store/useRigStore";
import { AlertTriangle, AlertOctagon, Scale, Activity } from "lucide-react";

export function RigHUD() {
  const metrics = useRigStore((s) => s.metrics);
  const modifiedHost = useRigStore(s=>getMassUncertainHostIds(s.mountedBags).size > 0);
  const clearanceWarnings = useRigStore((s) => s.clearanceWarnings);
  const dropperCompressed = useRigStore((s) => s.dropperPostCompressed);
  const rigidPost = useRigStore((s) => s.currentBike.seatpostType === "rigid");
  const toggleDropper = useRigStore((s) => s.toggleDropper);
  const waterBottlesMounted = useRigStore((s) => s.waterBottlesMounted);
  const toggleBottles = useRigStore((s) => s.toggleBottles);

  const fitNotes = clearanceWarnings.filter(
    (warning) => warning.type === "fit_unverified",
  );
  const visibleWarnings = clearanceWarnings.filter(
    (warning) => warning.type !== "fit_unverified",
  );
  const unknownWeights = metrics.unknownWeightItemIds?.length ?? 0;
  const unknownCapacity = metrics.unknownCapacityItemIds?.length ?? 0;
  const totalKg = (metrics.totalRigWeightGrams / 1000).toFixed(2);
  const bikeKg = (metrics.bikeBaseWeightGrams / 1000).toFixed(2);
  const bagsKg = (metrics.totalBagsDryWeightGrams / 1000).toFixed(2);
  const payloadKg = (metrics.payloadEstimateGrams / 1000).toFixed(2);

  return (
    <div className="summary-panel flex flex-col space-y-3">
      <div className="panel-heading">
        <span className="eyebrow">02 / FINE-TUNE</span>
        <h3>Check your setup</h3>
        <p>Weight, balance, and fit at a glance.</p>
      </div>
      {/* --- Fit Check Banner --- */}
      {visibleWarnings.length > 0 && (
        <div
          role="status"
          className="clearance-notices w-full flex flex-col space-y-2 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {visibleWarnings.map((warning) => {
            const isError = warning.severity === "error";
            return (
              <div
                key={warning.id}
                className={`flex items-start p-3 rounded-xl border backdrop-blur-md shadow-xl text-xs ${
                  isError
                    ? "bg-rose-950/85 border-rose-500/60 text-rose-200"
                    : "bg-amber-950/85 border-amber-500/60 text-amber-200"
                }`}
              >
                {isError ? (
                  <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 mr-2" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 mr-2" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-white flex flex-wrap gap-1 items-center justify-between">
                    <span>
                      {isError ? "Potential Fit Conflict" : "Fit Check"}
                    </span>
                    {warning.measuredMm !== undefined && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/40">
                        {warning.measuredMm}mm / min {warning.recommendedMinMm}
                        mm
                      </span>
                    )}
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">
                    {warning.message}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fitNotes.length > 0 && (
        <details className="rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-xs text-slate-300">
          <summary className="cursor-pointer font-semibold">
            {fitNotes.length} unverified fit{" "}
            {fitNotes.length === 1 ? "note" : "notes"}
          </summary>
          <ul className="mt-2 space-y-2 text-[11px] leading-relaxed text-slate-400">
            {fitNotes.map((note) => (
              <li key={note.id}>{note.message}</li>
            ))}
          </ul>
        </details>
      )}
      {/* --- Rig Summary Card --- */}
      <div className="summary-card w-full bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {unknownWeights ? "Known Weight Subtotal" : "Live Rig Summary"}
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-emerald-400 font-extrabold text-base">
              {totalKg}
            </span>
            <span className="text-slate-400 font-medium">kg</span>
          </div>
        </div>

        {(unknownWeights > 0 || unknownCapacity > 0) && (
          <p className="mt-3 text-[11px] leading-relaxed text-amber-300">
            {unknownWeights > 0
              ? `${unknownWeights} mounted item(s) have unknown mass. The weight subtotal and axle estimate exclude that mass. `
              : ""}
            {modifiedHost ? "Modified host assemblies are also excluded: removed hardware masses are unknown. " : ""}
            {unknownCapacity > 0
              ? `${unknownCapacity} item(s) have unknown capacity; capacity is a known subtotal.`
              : ""}
          </p>
        )}
        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 my-3 text-center">
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Bike Base
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {bikeKg} kg
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Gear Dry
            </div>
            <div className="text-xs font-bold text-white mt-0.5">
              {bagsKg} kg
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">
              Capacity
            </div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              {metrics.totalCapacityLiters} L
            </div>
          </div>
        </div>

        <div className="flex justify-between text-xs mb-3 text-slate-400">
          <span>Packed gear payload</span>
          <span className="font-semibold text-white">{payloadKg} kg</span>
        </div>
        {/* Weight Distribution & Balance Gauge */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1 text-sky-400" />
              Axle Balance Estimate
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                metrics.balanceStatus === "balanced"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : metrics.balanceStatus === "front_heavy"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
              }`}
            >
              {metrics.balanceStatus.replace("_", " ")}
            </span>
          </div>

          {/* Visual Percentage Bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex relative border border-slate-700/50">
            {/* Front section */}
            <div
              style={{
                width: `${Math.min(100, Math.max(0, metrics.frontRatioPercent))}%`,
              }}
              className="bg-sky-500 h-full transition-all duration-300 relative"
            />
            {/* Rear section */}
            <div
              style={{
                width: `${Math.min(100, Math.max(0, metrics.rearRatioPercent))}%`,
              }}
              className="bg-indigo-500 h-full transition-all duration-300"
            />
            {/* Target 40-45% sweet spot marker */}
            <div
              style={{ left: "40%", width: "8%" }}
              className="absolute top-0 bottom-0 bg-emerald-400/40 border-x border-emerald-300/60 pointer-events-none"
              title="Target sweet spot (40-48% Front)"
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono mt-1 text-slate-400">
            <span className="text-sky-300 font-semibold">
              Front: {metrics.frontRatioPercent}% (
              {(metrics.frontAxleWeightGrams / 1000).toFixed(1)}kg)
            </span>
            <span className="text-indigo-300 font-semibold">
              Rear: {metrics.rearRatioPercent}% (
              {(metrics.rearAxleWeightGrams / 1000).toFixed(1)}kg)
            </span>
          </div>
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
          Static estimate without rider. Packed payload is allocated by known
          bag capacity; real packing positions and suspension change axle loads.
        </p>
        {/* Quick Simulation Toggles */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
          <button
            aria-pressed={dropperCompressed}
            onClick={toggleDropper}
            disabled={rigidPost}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              dropperCompressed
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            {rigidPost ? "Rigid seatpost" : `Dropper: ${dropperCompressed ? "120 mm lower (preview)" : "Extended"}`}
          </button>

          <button
            aria-pressed={waterBottlesMounted}
            onClick={toggleBottles}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              waterBottlesMounted
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Reference bottle: {waterBottlesMounted ? "Shown" : "Hidden"}
          </button>
        </div>
      </div>
      <p className="summary-note">
        Preview fit before you pack. Confirm dimensions and clearances on your
        actual bike.
      </p>
    </div>
  );
}
