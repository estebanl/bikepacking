"use client";

import React, { useState } from "react";
import { useRigStore } from "@/store/useRigStore";
import { BagCategory, BagItem } from "@/types";
import {
  Bike,
  Luggage,
  Sliders,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  X,
} from "lucide-react";

export function Sidebar() {
  const bikes = useRigStore((s) => s.bikes);
  const bags = useRigStore((s) => s.bags);
  const currentBike = useRigStore((s) => s.currentBike);
  const selectedSizeKey = useRigStore((s) => s.selectedSizeKey);
  const currentSizeConfig = useRigStore((s) => s.currentSizeConfig);
  const mountedBags = useRigStore((s) => s.mountedBags);
  const payloadEstimateGrams = useRigStore((s) => s.payloadEstimateGrams);
  const activeTab = useRigStore((s) => s.activeSidebarTab);
  const selectedSocketId = useRigStore((s) => s.selectedSocketId);

  const selectBike = useRigStore((s) => s.selectBike);
  const selectSize = useRigStore((s) => s.selectSize);
  const mountBag = useRigStore((s) => s.mountBag);
  const unmountBag = useRigStore((s) => s.unmountBag);
  const clearAllBags = useRigStore((s) => s.clearAllBags);
  const setPayloadEstimate = useRigStore((s) => s.setPayloadEstimate);
  const setActiveTab = useRigStore((s) => s.setActiveSidebarTab);
  const setSelectedSocketId = useRigStore((s) => s.setSelectedSocketId);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Categories filter list
  const categoryFilters: { id: string; label: string }[] = [
    { id: "all", label: "All Gear" },
    { id: "frame_full", label: "Full Frame" },
    { id: "frame_half", label: "Half Frame" },
    { id: "seat_pack", label: "Seat Packs" },
    { id: "handlebar_roll", label: "Handlebar" },
    { id: "top_tube", label: "Top Tube" },
    { id: "fork_cage_bag", label: "Fork Cages" },
  ];

  const filteredBags = bags.filter((bag) => {
    const matchesCategory =
      selectedCategory === "all" || bag.category === selectedCategory;
    const matchesQuery =
      searchQuery === "" ||
      bag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Helper to determine the best compatible socket for a bag
  function getTargetSocketForBag(bag: BagItem): string | null {
    if (selectedSocketId && bag.compatibleSockets.includes(selectedSocketId.split("_")[0])) {
      return selectedSocketId;
    }
    // Default fallback to first compatible socket
    if (bag.category === "frame_full" || bag.category === "frame_half") {
      return "frameTriangle";
    }
    if (bag.category === "seat_pack") {
      return "seatpost";
    }
    if (bag.category === "handlebar_roll") {
      return "handlebar";
    }
    if (bag.category === "top_tube") {
      return "topTubeFront";
    }
    if (bag.category === "fork_cage_bag") {
      // Pick first unoccupied fork socket or forkLeft_0
      if (!mountedBags["forkLeft_0"]) return "forkLeft_0";
      if (!mountedBags["forkRight_0"]) return "forkRight_0";
      return "forkLeft_0";
    }
    return bag.compatibleSockets[0] || null;
  }

  return (
    <aside className="w-96 h-[calc(100vh-64px)] bg-slate-900 border-r border-slate-800 flex flex-col z-20 text-slate-100 shadow-2xl">
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          onClick={() => setActiveTab("bike")}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "bike"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bike className="w-4 h-4 text-emerald-400" />
          <span>Bike Frame</span>
        </button>
        <button
          onClick={() => setActiveTab("bags")}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "bags"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Luggage className="w-4 h-4 text-sky-400" />
          <span>Bikepacking Gear</span>
        </button>
        <button
          onClick={() => setActiveTab("payload")}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "payload"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Payload</span>
        </button>
      </div>

      {/* --- TAB CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ================= BIKE TAB ================= */}
        {activeTab === "bike" && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Bike Model Selection */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Select Bike Model
              </label>
              <div className="space-y-2">
                {bikes.map((bike) => {
                  const isSelected = bike.id === currentBike.id;
                  return (
                    <button
                      key={bike.id}
                      onClick={() => selectBike(bike.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-950/30 border-emerald-500/70 shadow-sm"
                          : "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>{bike.brand} {bike.name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Category: <span className="capitalize">{bike.category}</span> • {(bike.baseWeightGrams / 1000).toFixed(1)}kg
                        </div>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                        style={{ backgroundColor: bike.colorHex }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Frame Size Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Frame Size (Geometry Scale)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(currentBike.sizes).map((sizeKey) => {
                  const isSelected = sizeKey === selectedSizeKey;
                  return (
                    <button
                      key={sizeKey}
                      onClick={() => selectSize(sizeKey)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      Size {sizeKey}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Calibrated Geometry Specs */}
            <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Geometry Specifications ({selectedSizeKey})
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Reach</span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.reachMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Stack</span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.stackMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Standover</span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.standoverMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Wheelbase</span>
                  <span className="font-mono font-bold text-white">
                    {currentBike.wheelbaseMm} mm
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= GEAR TAB ================= */}
        {activeTab === "bags" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Active Snap Target Notice */}
            {selectedSocketId && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-950/60 border border-sky-500/50 text-sky-200 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sky-400 block">
                    Active 3D Snap Anchor
                  </span>
                  <span className="font-semibold">{selectedSocketId}</span>
                </div>
                <button
                  onClick={() => setSelectedSocketId(null)}
                  className="p-1 hover:bg-sky-900 rounded-lg text-sky-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex overflow-x-auto space-x-1.5 pb-1 text-xs no-scrollbar">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-sky-600 text-white"
                      : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Bags Catalog List */}
            <div className="space-y-3">
              {filteredBags.map((bag) => {
                // Check if this bag is currently mounted on any socket
                const mountedSocket = Object.entries(mountedBags).find(
                  ([_, b]) => b.id === bag.id
                )?.[0];
                const isMounted = !!mountedSocket;
                const targetSocket = getTargetSocketForBag(bag);

                return (
                  <div
                    key={bag.id}
                    className={`p-3 rounded-2xl border transition-all ${
                      isMounted
                        ? "bg-slate-800/90 border-emerald-500/60 shadow-md"
                        : "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-400">
                          {bag.brand}
                        </div>
                        <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">
                          {bag.name}
                        </h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-400">${bag.priceUsd}</span>
                    </div>

                    {/* Specs Row */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 text-center text-[10px]">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Volume</span>
                        <span className="font-bold text-white">{bag.volumeLiters} L</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Weight</span>
                        <span className="font-bold text-white">{bag.dryWeightGrams} g</span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Rating</span>
                        <span className="font-bold text-white truncate">{bag.waterproofRating || "Standard"}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-700/50">
                      <a
                        href={bag.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center"
                      >
                        Specs & Store <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </a>

                      {isMounted ? (
                        <button
                          onClick={() => unmountBag(mountedSocket)}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (targetSocket) {
                              mountBag(targetSocket, bag);
                            }
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Mount to Rig</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= PAYLOAD TAB ================= */}
        {activeTab === "payload" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Gear Payload Estimate
                </label>
                <span className="font-mono text-xs font-bold text-emerald-400">
                  {(payloadEstimateGrams / 1000).toFixed(1)} kg ({payloadEstimateGrams} g)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12000"
                step="250"
                value={payloadEstimateGrams}
                onChange={(e) => setPayloadEstimate(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Estimates weight of packed sleep system, food, water, and clothing distributed across bags.
              </p>
            </div>

            {/* Quick Add Payload Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Quick Payload Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPayloadEstimate(payloadEstimateGrams + 2000)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-medium hover:bg-slate-800 text-left"
                >
                  ⛺ +2.0kg Sleep Kit
                </button>
                <button
                  onClick={() => setPayloadEstimate(payloadEstimateGrams + 1500)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-medium hover:bg-slate-800 text-left"
                >
                  💧 +1.5kg Water
                </button>
                <button
                  onClick={() => setPayloadEstimate(payloadEstimateGrams + 1000)}
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-medium hover:bg-slate-800 text-left"
                >
                  🍳 +1.0kg Cook Kit
                </button>
                <button
                  onClick={() => setPayloadEstimate(0)}
                  className="p-2 rounded-xl border border-rose-900/60 bg-rose-950/30 text-xs font-medium text-rose-300 hover:bg-rose-950/50 text-left"
                >
                  Reset to Dry Weight
                </button>
              </div>
            </div>

            {/* Clear All Gear */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={clearAllBags}
                className="w-full py-2.5 px-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-semibold hover:bg-rose-950/40 flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Mounted Bags</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
