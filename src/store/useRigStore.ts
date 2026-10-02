import { create } from "zustand";
import { BIKES } from "@/data/bikes";
import { BAGS } from "@/data/bags";
import {
  BikeModel,
  BikeSizeConfig,
  BagItem,
  RigMetrics,
  ClearanceWarning,
  CameraPreset,
} from "@/types";
import { calculateRigMetrics } from "@/lib/balance";
import { evaluateClearances } from "@/lib/clearance";
import {
  clampPayloadGrams,
  deserializeRigFromUrlQuery,
  serializeRigToUrlQuery,
} from "@/lib/export";

import { findSocket, validateMount, sanitizeMountedBags } from "@/lib/sockets";

interface RigState {
  lastActionMessage: string | null;
  bikes: BikeModel[];
  bags: BagItem[];
  selectedBikeId: string;
  selectedSizeKey: string;
  mountedBags: Record<string, BagItem>;
  payloadEstimateGrams: number;
  dropperPostCompressed: boolean;
  waterBottlesMounted: boolean;
  activeCameraPreset: CameraPreset;
  cameraRevision: number;
  selectedSocketId: string | null;
  activeSidebarTab: "bike" | "bags" | "payload";
  isExportModalOpen: boolean;

  // Computed state
  currentBike: BikeModel;
  currentSizeConfig: BikeSizeConfig;
  metrics: RigMetrics;
  clearanceWarnings: ClearanceWarning[];

  // Actions
  selectBike: (bikeId: string) => void;
  selectSize: (sizeKey: string) => void;
  mountBag: (socketId: string, bag: BagItem) => void;
  unmountBag: (socketId: string) => void;
  clearAllBags: () => void;
  setPayloadEstimate: (grams: number) => void;
  toggleDropper: () => void;
  toggleBottles: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setSelectedSocketId: (socketId: string | null) => void;
  setActiveSidebarTab: (tab: "bike" | "bags" | "payload") => void;
  setExportModalOpen: (open: boolean) => void;
  loadPresetDemo: (
    presetName: "endurance" | "minimalist" | "overloaded",
  ) => void;
  syncFromUrl: () => void;
  getShareableUrl: () => string;
}

const defaultBike = BIKES[0];
const defaultSizeKey = Object.keys(defaultBike.sizes)[0];
const defaultSizeConfig = defaultBike.sizes[defaultSizeKey];

function computeState(
  bike: BikeModel,
  sizeConfig: BikeSizeConfig,
  mountedBags: Record<string, BagItem>,
  payloadGrams: number,
  dropper: boolean,
  bottles: boolean,
) {
  const metrics = calculateRigMetrics(
    bike,
    sizeConfig,
    mountedBags,
    payloadGrams,
  );
  const clearanceWarnings = evaluateClearances({
    bike,
    sizeConfig,
    mountedBags,
    dropperPostCompressed: dropper,
    waterBottlesMounted: bottles,
    payloadEstimateGrams: payloadGrams,
  });
  return { metrics, clearanceWarnings };
}

export const useRigStore = create<RigState>((set, get) => {
  const initialComputed = computeState(
    defaultBike,
    defaultSizeConfig,
    {},
    0,
    false,
    true,
  );

  const applyConfiguration = (
    bike: BikeModel,
    sizeKey: string,
    bags: Record<string, BagItem>,
    payload = get().payloadEstimateGrams,
    dropper = get().dropperPostCompressed,
    bottles = get().waterBottlesMounted,
  ) => {
    const sizeConfig = bike.sizes[sizeKey];
    if (bike.seatpostType === "rigid") dropper = false;
    const clean = sanitizeMountedBags(bags, sizeConfig);
    const safePayload = clampPayloadGrams(payload);
    set({
      selectedBikeId: bike.id,
      selectedSizeKey: sizeKey,
      currentBike: bike,
      currentSizeConfig: sizeConfig,
      mountedBags: clean.mountedBags,
      payloadEstimateGrams: safePayload,
      dropperPostCompressed: dropper,
      waterBottlesMounted: bottles,
      selectedSocketId: null,
      lastActionMessage: clean.removed.length
        ? `Removed equipment: ${clean.removed.map((item) => `${item.bagId} (${item.reasons.join("; ")})`).join(", ")}`
        : null,
      ...computeState(
        bike,
        sizeConfig,
        clean.mountedBags,
        safePayload,
        dropper,
        bottles,
      ),
    });
  };

  return {
    lastActionMessage: null,
    bikes: BIKES,
    bags: BAGS,
    selectedBikeId: defaultBike.id,
    selectedSizeKey: defaultSizeKey,
    mountedBags: {},
    payloadEstimateGrams: 0,
    dropperPostCompressed: false,
    waterBottlesMounted: true,
    activeCameraPreset: "iso",
    cameraRevision: 0,
    selectedSocketId: null,
    activeSidebarTab: "bike",
    isExportModalOpen: false,

    currentBike: defaultBike,
    currentSizeConfig: defaultSizeConfig,
    metrics: initialComputed.metrics,
    clearanceWarnings: initialComputed.clearanceWarnings,

    selectBike: (bikeId: string) => {
      const bike = get().bikes.find((b) => b.id === bikeId);
      if (!bike) {
        set({ lastActionMessage: "Unknown bicycle." });
        return;
      }
      const sizeKey = Object.prototype.hasOwnProperty.call(
        bike.sizes,
        get().selectedSizeKey,
      )
        ? get().selectedSizeKey
        : Object.keys(bike.sizes)[0];
      applyConfiguration(bike, sizeKey, get().mountedBags);
    },
    selectSize: (sizeKey: string) => {
      if (
        !Object.prototype.hasOwnProperty.call(get().currentBike.sizes, sizeKey)
      ) {
        set({ lastActionMessage: "Unknown frame size." });
        return;
      }
      applyConfiguration(get().currentBike, sizeKey, get().mountedBags);
    },
    mountBag: (socketId: string, bag: BagItem) => {
      const catalogBag = get().bags.find((item) => item.id === bag.id);
      if (!catalogBag) {
        set({ lastActionMessage: "Equipment is not in the catalogue." });
        return;
      }
      const check = validateMount(
        catalogBag,
        socketId,
        get().currentSizeConfig,
        get().mountedBags,
      );
      if (!check.allowed) {
        set({ lastActionMessage: check.reasons.join(" ") });
        return;
      }
      applyConfiguration(get().currentBike, get().selectedSizeKey, {
        ...get().mountedBags,
        [socketId]: catalogBag,
      });
    },
    unmountBag: (socketId: string) => {
      const next = { ...get().mountedBags };
      delete next[socketId];
      applyConfiguration(get().currentBike, get().selectedSizeKey, next);
    },

    clearAllBags: () => {
      applyConfiguration(get().currentBike, get().selectedSizeKey, {}, 0);
    },
    setPayloadEstimate: (grams: number) => {
      const payload = clampPayloadGrams(grams);
      applyConfiguration(
        get().currentBike,
        get().selectedSizeKey,
        get().mountedBags,
        payload,
      );
      if (payload !== grams)
        set({
          lastActionMessage:
            "Payload must be a finite value between 0 and 50,000 g. It has been adjusted.",
        });
    },

    toggleDropper: () => {
      if (get().currentBike.seatpostType === "rigid") return;
      const nextDropper = !get().dropperPostCompressed;
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        get().mountedBags,
        get().payloadEstimateGrams,
        nextDropper,
        get().waterBottlesMounted,
      );

      set({
        dropperPostCompressed: nextDropper,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    toggleBottles: () => {
      const nextBottles = !get().waterBottlesMounted;
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        get().mountedBags,
        get().payloadEstimateGrams,
        get().dropperPostCompressed,
        nextBottles,
      );

      set({
        waterBottlesMounted: nextBottles,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    setCameraPreset: (preset: CameraPreset) => {
      set({
        activeCameraPreset: preset,
        cameraRevision: get().cameraRevision + 1,
      });
    },

    setSelectedSocketId: (socketId: string | null) => {
      set({
        selectedSocketId:
          socketId && findSocket(get().currentSizeConfig, socketId)
            ? socketId
            : null,
      });
    },

    setActiveSidebarTab: (tab: "bike" | "bags" | "payload") => {
      set({ activeSidebarTab: tab });
    },

    setExportModalOpen: (open: boolean) => {
      set({ isExportModalOpen: open });
    },

    loadPresetDemo: (presetName) => {
      const bike =
        get().bikes.find((b) => b.id === "salsa-cutthroat-2024") ??
        get().bikes[0];
      const sizeKey = Object.prototype.hasOwnProperty.call(bike.sizes, "56cm")
        ? "56cm"
        : Object.keys(bike.sizes)[0];
      const sizeConfig = bike.sizes[sizeKey];

      const newBags: Record<string, BagItem> = {};
      let payload = 0;
      let dropper = false;

      if (presetName === "endurance") {
        // Balanced 42/58 setup
        const frameBag = get().bags.find(
          (b) => b.id === "ortlieb-frame-pack-rc-4l",
        );
        const seatBag = get().bags.find(
          (b) => b.id === "apidura-expedition-saddle-pack-9l",
        );
        const barBag = get().bags.find(
          (b) => b.id === "revelate-sweetroll-11l",
        );
        const topBag = get().bags.find(
          (b) => b.id === "apidura-racing-bolt-on-top-tube-1l",
        );
        if (frameBag) newBags["frameTriangle"] = frameBag;
        if (seatBag) newBags["seatpost"] = seatBag;
        if (barBag) newBags["handlebar"] = barBag;
        if (topBag) newBags["topTubeFront"] = topBag;
        payload = 2500;
      } else if (presetName === "minimalist") {
        // Ultra-light race setup
        const topBag = get().bags.find(
          (b) => b.id === "apidura-racing-bolt-on-top-tube-1l",
        );
        const seatBag = get().bags.find(
          (b) => b.id === "apidura-expedition-saddle-pack-9l",
        );
        if (topBag) newBags["topTubeFront"] = topBag;
        if (seatBag) newBags["seatpost"] = seatBag;
        payload = 800;
      } else if (presetName === "overloaded") {
        // Expeditions with massive rear load + dropper drop to trigger clearance alert
        const frameBag = get().bags.find(
          (b) => b.id === "salsa-exp-full-frame-pack",
        );
        const seatBag = get().bags.find(
          (b) => b.id === "ortlieb-seat-pack-16-5l",
        );
        const barBag = get().bags.find(
          (b) => b.id === "ortlieb-handlebar-pack-15l",
        );
        const forkL = get().bags.find((b) => b.id === "ortlieb-fork-pack-4-1l");
        const forkR = get().bags.find((b) => b.id === "tailfin-cargo-pack-5l");
        if (frameBag) newBags["frameTriangle"] = frameBag;
        if (seatBag) newBags["seatpost"] = seatBag;
        if (barBag) newBags["handlebar"] = barBag;
        if (forkL) newBags["forkLeft_0"] = forkL;
        if (forkR) newBags["forkRight_0"] = forkR;
        payload = 5000;
        dropper = true; // Intentionally trigger buzz warning!
      }

      applyConfiguration(bike, sizeKey, newBags, payload, dropper, true);
    },

    syncFromUrl: () => {
      if (typeof window === "undefined") return;
      const urlQuery = window.location.search;
      if (!urlQuery) return;

      const parsed = deserializeRigFromUrlQuery(urlQuery, get().bags);
      const bike = parsed.bikeId
        ? get().bikes.find((b) => b.id === parsed.bikeId) || get().currentBike
        : get().currentBike;
      const sizeKey =
        parsed.sizeKey &&
        Object.prototype.hasOwnProperty.call(bike.sizes, parsed.sizeKey)
          ? parsed.sizeKey
          : Object.keys(bike.sizes)[0];
      const payload = parsed.payloadGrams ?? get().payloadEstimateGrams;
      const dropper = parsed.dropper ?? get().dropperPostCompressed;
      const bottles = parsed.bottles ?? get().waterBottlesMounted;

      applyConfiguration(
        bike,
        sizeKey,
        parsed.mountedBags,
        payload,
        dropper,
        bottles,
      );
    },

    getShareableUrl: () => {
      if (typeof window === "undefined") return "";
      const queryString = serializeRigToUrlQuery({
        bikeId: get().selectedBikeId,
        sizeKey: get().selectedSizeKey,
        mountedBags: get().mountedBags,
        payloadGrams: get().payloadEstimateGrams,
        dropper: get().dropperPostCompressed,
        bottles: get().waterBottlesMounted,
      });
      return `${window.location.origin}${window.location.pathname}?${queryString}`;
    },
  };
});
