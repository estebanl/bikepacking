"use client";

import React, { useState } from "react";
import { TAILFIN_CATALOG_COVERAGE } from "@/data/tailfin";
import { useRigStore } from "@/store/useRigStore";
import { BagItem } from "@/types";
import {
  findSocket,
  getSocketAnchors,
  getWheelbaseMm,
  validateMount,
} from "@/lib/sockets";
import {
  Bike,
  Luggage,
  Sliders,
  Plus,
  Trash2,
  ExternalLink,
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
  const lastActionMessage = useRigStore((s) => s.lastActionMessage);
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

  const [targets, setTargets] = useState<Record<string, string>>({});
  const anchors = getSocketAnchors(currentSizeConfig);

  // Categories filter list
  const categoryFilters: { id: string; label: string }[] = [
    { id: "all", label: "All Gear" },
    { id: "frame_full", label: "Full Frame" },
    { id: "frame_half", label: "Half Frame" },
    { id: "seat_pack", label: "Seat Packs" },
    { id: "handlebar_roll", label: "Handlebar" },
    { id: "top_tube", label: "Top Tube" },
    { id: "fork_cage_bag", label: "Cargo Bags" },
    { id: "stem_bag", label: "Stem Bags" },
    { id: "pannier", label: "Panniers" },
    { id: "rack", label: "Rear Systems" },
    { id: "cargo_cage", label: "Cages" },
    { id: "mount", label: "Mounts" },
    { id: "accessory", label: "Accessories" },
    { id: "spare", label: "Spares" },
  ];

  const filteredBags = bags.filter((bag) => {
    const matchesCategory =
      selectedCategory === "all" ||
      bag.category === selectedCategory ||
      (selectedCategory === "spare" &&
        "catalogSection" in bag &&
        bag.catalogSection === "spares");
    const matchesQuery =
      searchQuery === "" ||
      bag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bag.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  function availableTargets(bag: BagItem) {
    return anchors.filter(
      (anchor) =>
        anchor.allowedBagCategories.includes(bag.category) &&
        bag.compatibleSockets.some(
          (id) =>
            id === anchor.id ||
            ((id === "forkLeft" || id === "forkRight") &&
              anchor.id.startsWith(id)),
        ),
    );
  }

  return (
    <aside
      aria-label="Configure your rig"
      className="config-panel text-slate-100"
    >
      <div className="panel-heading">
        <span className="eyebrow">01 / CUSTOMIZE</span>
        <h3>Make it yours</h3>
      </div>
      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
        <button
          aria-pressed={activeTab === "bike"}
          onClick={() => setActiveTab("bike")}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "bike"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Bike className="w-4 h-4 text-emerald-400" />
          <span>Bike</span>
        </button>
        <button
          aria-pressed={activeTab === "bags"}
          onClick={() => setActiveTab("bags")}
          className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === "bags"
              ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Luggage className="w-4 h-4 text-sky-400" />
          <span>Gear</span>
        </button>
        <button
          aria-pressed={activeTab === "payload"}
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

      {lastActionMessage && (
        <p
          role="status"
          className="mx-4 mt-3 rounded-lg border border-amber-700/50 bg-amber-950/40 p-3 text-xs leading-relaxed text-amber-200"
        >
          {lastActionMessage}
        </p>
      )}
      {/* --- TAB CONTENT --- */}
      <div className="config-content flex-1 overflow-y-auto p-4 space-y-4">
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
                      aria-pressed={isSelected}
                      onClick={() => selectBike(bike.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-emerald-950/30 border-emerald-500/70 shadow-sm"
                          : "bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-white flex items-center space-x-2">
                          <span>
                            {bike.brand} {bike.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Category:{" "}
                          <span className="capitalize">{bike.category}</span> •{" "}
                          {(bike.baseWeightGrams / 1000).toFixed(1)}kg
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

            {(currentBike.referenceNotes || currentBike.sourceUrl) && (
              <details className="rounded-xl border border-slate-800 p-3 text-xs text-slate-400">
                <summary className="cursor-pointer font-semibold text-slate-300">
                  Model & source notes
                  {currentBike.generation ? ` · ${currentBike.generation}` : ""}
                </summary>
                {currentBike.referenceNotes && (
                  <p className="mt-2 leading-relaxed">
                    {currentBike.referenceNotes}
                  </p>
                )}
                {(currentBike.geometrySourceUrl || currentBike.sourceUrl) && (
                  <a
                    href={
                      currentBike.geometrySourceUrl || currentBike.sourceUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-sky-300"
                  >
                    Manufacturer geometry ↗
                  </a>
                )}
                <p className="mt-2">
                  Mount positions and tube contours are illustrative. Verify
                  loaded fit on the actual frame.
                </p>
              </details>
            )}
            {/* Frame Size Selector */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Frame Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(currentBike.sizes).map((sizeKey) => {
                  const isSelected = sizeKey === selectedSizeKey;
                  return (
                    <button
                      key={sizeKey}
                      aria-pressed={isSelected}
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
                  <span className="text-slate-400 block text-[10px]">
                    Reach
                  </span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.reachMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">
                    Stack
                  </span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.stackMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">
                    Standover
                  </span>
                  <span className="font-mono font-bold text-white">
                    {currentSizeConfig.geometry.standoverMm} mm
                  </span>
                </div>
                <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">
                    Wheelbase
                  </span>
                  <span className="font-mono font-bold text-white">
                    {getWheelbaseMm(currentBike, currentSizeConfig)} mm
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
                  <span className="font-semibold">
                    {findSocket(currentSizeConfig, selectedSocketId)?.name ??
                      selectedSocketId}
                  </span>
                </div>
                <button
                  aria-label="Clear selected mount"
                  onClick={() => setSelectedSocketId(null)}
                  className="p-1 hover:bg-sky-900 rounded-lg text-sky-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <label className="gear-search">
              <span className="sr-only">Search gear</span>
              <input
                type="search"
                placeholder="Search brands or gear…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </label>
            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1 text-xs">
              {categoryFilters.map((cat) => (
                <button
                  key={cat.id}
                  aria-pressed={selectedCategory === cat.id}
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

            <p className="text-[11px] text-slate-400">
              {filteredBags.length} entries · Choose an attachment point per
              item. Unknown specifications stay unknown.
            </p>
            <details className="text-[11px] leading-relaxed text-slate-400">
              <summary className="cursor-pointer">
                Tailfin snapshot · 50 products + 95 spares
              </summary>
              <p className="mt-2">
                {TAILFIN_CATALOG_COVERAGE.note} 191 variant records; 62 have
                illustrative mounting previews. Remaining entries are reference
                only.
              </p>
            </details>
            {/* Bags Catalog List */}
            <div className="space-y-3">
              {filteredBags.length === 0 && (
                <p className="text-sm text-slate-400 py-4">
                  No gear matches. Try another name or category.
                </p>
              )}
              {filteredBags.map((bag) => {
                const options = availableTargets(bag);
                const savedTarget =
                  targets[`${currentBike.id}:${selectedSizeKey}:${bag.id}`];
                const targetSocket =
                  options.find((a) => a.id === savedTarget)?.id ??
                  options.find((a) => a.id === selectedSocketId)?.id ??
                  options.find((a) => !mountedBags[a.id])?.id ??
                  options[0]?.id;
                const mountedPositions = Object.entries(mountedBags).filter(
                  ([, item]) => item.id === bag.id,
                );
                const isMounted = mountedPositions.length > 0;
                const isMountedAtTarget =
                  !!targetSocket && mountedBags[targetSocket]?.id === bag.id;
                const validation = targetSocket
                  ? validateMount(
                      bag,
                      targetSocket,
                      currentSizeConfig,
                      mountedBags,
                    )
                  : {
                      allowed: false,
                      reasons: [
                        "No configured attachment point for this product on this frame.",
                      ],
                    };
                const dimensionsKnown = Object.values(bag.dimensionsMm).every(
                  (value) => value !== null,
                );

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
                        {bag.compatibleSockets.length === 0 && (
                          <span className="text-[9px] uppercase tracking-wide text-amber-300">
                            Reference only
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-white mt-0.5 leading-snug">
                          {bag.name}
                        </h4>
                      </div>
                      <span className="ml-2 shrink-0 text-[11px] font-semibold text-emerald-400">
                        {bag.price
                          ? `${bag.price.currency} ${bag.price.amount}`
                          : bag.priceUsd !== null
                            ? `USD ${bag.priceUsd}`
                            : "Price unknown"}
                      </span>
                    </div>

                    {/* Specs Row */}
                    <div className="gear-specs grid grid-cols-3 gap-1.5 mt-2.5 text-center text-[10px]">
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Volume</span>
                        <span className="font-bold text-white">
                          {bag.volumeLiters === null
                            ? ["mount", "cargo_cage"].includes(bag.category) ||
                              bag.visualKind === "rack"
                              ? "N/A"
                              : "Unknown"
                            : `${bag.volumeLiters} L`}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Weight</span>
                        <span className="font-bold text-white">
                          {bag.dryWeightGrams === null
                            ? "Unknown"
                            : `${bag.dryWeightGrams} g`}
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Rating</span>
                        <span
                          title={bag.waterproofRating || "Unknown"}
                          className="block font-bold text-white truncate"
                        >
                          {bag.waterproofRating || "Unknown"}
                        </span>
                      </div>
                    </div>

                    <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                      Dimensions:{" "}
                      {dimensionsKnown
                        ? `${bag.dimensionsMm.length} × ${bag.dimensionsMm.height} × ${bag.dimensionsMm.depth} mm (L × H × D)`
                        : "Unknown — preview shape is illustrative"}
                      {bag.dimensionsStatus === "estimated"
                        ? " · estimated"
                        : ""}
                    </p>
                    {bag.specNotes && (
                      <details className="mt-2 text-[10px] leading-relaxed text-slate-400">
                        <summary className="cursor-pointer">
                          Specification & fit notes
                        </summary>
                        <p className="mt-1">{bag.specNotes}</p>
                      </details>
                    )}
                    <label className="mt-3 block text-[10px] font-semibold text-slate-400">
                      Attachment point
                      <select
                        aria-label={`Attachment point for ${bag.name}`}
                        value={targetSocket ?? ""}
                        disabled={!options.length}
                        onChange={(event) =>
                          setTargets((previous) => ({
                            ...previous,
                            [`${currentBike.id}:${selectedSizeKey}:${bag.id}`]:
                              event.target.value,
                          }))
                        }
                        className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200 disabled:opacity-60"
                      >
                        {!options.length && (
                          <option value="">Unavailable for this frame</option>
                        )}
                        {options.map((anchor) => (
                          <option key={anchor.id} value={anchor.id}>
                            {anchor.name}
                            {mountedBags[anchor.id] ? " · occupied" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                    {!validation.allowed && (
                      <p className="mt-2 text-[10px] leading-relaxed text-amber-300">
                        {validation.reasons.join(" ")}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                      <a
                        href={bag.specSourceUrl || bag.productUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center"
                      >
                        Specs & Store{" "}
                        <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </a>
                      <button
                        disabled={!validation.allowed || isMountedAtTarget}
                        onClick={() => {
                          if (targetSocket) mountBag(targetSocket, bag);
                        }}
                        className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                        <span>
                          {isMountedAtTarget
                            ? "Mounted here"
                            : targetSocket && mountedBags[targetSocket]
                              ? "Replace gear"
                              : "Mount to Rig"}
                        </span>
                      </button>
                    </div>
                    {mountedPositions.map(([socketId]) => (
                      <div
                        key={socketId}
                        className="mt-2 flex items-center justify-between gap-2 text-[10px] text-emerald-300"
                      >
                        <span>
                          {findSocket(currentSizeConfig, socketId)?.name ??
                            socketId}
                        </span>
                        <button
                          aria-label={`Remove ${bag.name} from ${findSocket(currentSizeConfig, socketId)?.name ?? socketId}`}
                          onClick={() => unmountBag(socketId)}
                          className="rounded-lg px-2 py-2 text-rose-300 hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
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
                  {(payloadEstimateGrams / 1000).toFixed(1)} kg (
                  {payloadEstimateGrams} g)
                </span>
              </div>
              <input
                aria-label="Gear payload estimate"
                type="range"
                min="0"
                max="50000"
                step="250"
                value={payloadEstimateGrams}
                onChange={(e) =>
                  setPayloadEstimate(parseInt(e.target.value, 10))
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Estimates weight of packed sleep system, food, water, and
                clothing distributed across bags.
              </p>
            </div>

            {/* Quick Add Payload Presets */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase text-slate-400 block">
                Quick Payload Presets
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setPayloadEstimate(payloadEstimateGrams + 2000)
                  }
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-medium hover:bg-slate-800 text-left"
                >
                  ⛺ +2.0kg Sleep Kit
                </button>
                <button
                  onClick={() =>
                    setPayloadEstimate(payloadEstimateGrams + 1500)
                  }
                  className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 text-xs font-medium hover:bg-slate-800 text-left"
                >
                  💧 +1.5kg Water
                </button>
                <button
                  onClick={() =>
                    setPayloadEstimate(payloadEstimateGrams + 1000)
                  }
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
                <span>Clear All Mounted Equipment</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
