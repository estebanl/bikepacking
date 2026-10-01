"use client";

import React from "react";
import { useRigStore } from "@/store/useRigStore";
import { AlertTriangle, AlertOctagon, Scale, Package, Activity, Info } from "lucide-react";

export function RigHUD() {
  const metrics = useRigStore((s) => s.metrics);
  const clearanceWarnings = useRigStore((s) => s.clearanceWarnings);
  const dropperCompressed = useRigStore((s) => s.dropperPostCompressed);
  const toggleDropper = useRigStore((s) => s.toggleDropper);
  const waterBottlesMounted = useRigStore((s) => s.waterBottlesMounted);
  const toggleBottles = useRigStore((s) => s.toggleBottles);

  const totalKg = (metrics.totalRigWeightGrams / 1000).toFixed(2);
  const bikeKg = (metrics.bikeBaseWeightGrams / 1000).toFixed(2);
  const bagsKg = (metrics.totalBagsDryWeightGrams / 1000).toFixed(2);
  const payloadKg = (metrics.payloadEstimateGrams / 1000).toFixed(2);

  return (
    <div className="absolute top-20 right-6 z-20 flex flex-col items-end space-y-3 pointer-events-none max-w-sm w-full">
      {/* --- Clearance Warning Banner --- */}
      {clearanceWarnings.length > 0 && (
        <div className="w-full flex flex-col space-y-2 pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {clearanceWarnings.map((warning) => {
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
                  <div className="font-semibold text-white flex items-center justify-between">
                    <span>{isError ? "Clearance Hazard" : "Clearance Warning"}</span>
                    {warning.measuredMm !== undefined && (
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/40">
                        {warning.measuredMm}mm / min {warning.recommendedMinMm}mm
                      </span>
                    )}
                  </div>
                  <p className="mt-1 leading-relaxed opacity-90">{warning.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- Rig Summary Card --- */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 shadow-2xl pointer-events-auto text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Live Rig Summary
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-emerald-400 font-extrabold text-base">{totalKg}</span>
            <span className="text-slate-400 font-medium">kg</span>
          </div>
        </div>

        {/* Breakdown Row */}
        <div className="grid grid-cols-3 gap-2 my-3 text-center">
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Bike Base</div>
            <div className="text-xs font-bold text-white mt-0.5">{bikeKg} kg</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Bags Dry</div>
            <div className="text-xs font-bold text-white mt-0.5">{bagsKg} kg</div>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2 border border-slate-700/40">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Capacity</div>
            <div className="text-xs font-bold text-emerald-400 mt-0.5">
              {metrics.totalCapacityLiters} L
            </div>
          </div>
        </div>

        {/* Weight Distribution & Balance Gauge */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1 text-sky-400" />
              Axle Balance
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
              style={{ width: `${metrics.frontRatioPercent}%` }}
              className="bg-sky-500 h-full transition-all duration-300 relative"
            />
            {/* Rear section */}
            <div
              style={{ width: `${metrics.rearRatioPercent}%` }}
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
              Front: {metrics.frontRatioPercent}% ({(metrics.frontAxleWeightGrams / 1000).toFixed(1)}kg)
            </span>
            <span className="text-indigo-300 font-semibold">
              Rear: {metrics.rearRatioPercent}% ({(metrics.rearAxleWeightGrams / 1000).toFixed(1)}kg)
            </span>
          </div>
        </div>

        {/* Quick Simulation Toggles */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={toggleDropper}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              dropperCompressed
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Dropper: {dropperCompressed ? "Compressed (-14cm)" : "Extended"}
          </button>

          <button
            onClick={toggleBottles}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              waterBottlesMounted
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
            }`}
          >
            Bottles: {waterBottlesMounted ? "Mounted" : "Removed"}
          </button>
        </div>
      </div>
    </div>
  );
}
