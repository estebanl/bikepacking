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
import { deserializeRigFromUrlQuery, serializeRigToUrlQuery } from "@/lib/export";

interface RigState {
  bikes: BikeModel[];
  bags: BagItem[];
  selectedBikeId: string;
  selectedSizeKey: string;
  mountedBags: Record<string, BagItem>;
  payloadEstimateGrams: number;
  dropperPostCompressed: boolean;
  waterBottlesMounted: boolean;
  activeCameraPreset: CameraPreset;
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
  loadPresetDemo: (presetName: "endurance" | "minimalist" | "overloaded") => void;
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
  bottles: boolean
) {
  const metrics = calculateRigMetrics(bike, sizeConfig, mountedBags, payloadGrams);
  const clearanceWarnings = evaluateClearances({
    bike,
    sizeConfig,
    mountedBags,
    dropperPostCompressed: dropper,
    waterBottlesMounted: bottles,
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
    true
  );

  return {
    bikes: BIKES,
    bags: BAGS,
    selectedBikeId: defaultBike.id,
    selectedSizeKey: defaultSizeKey,
    mountedBags: {},
    payloadEstimateGrams: 0,
    dropperPostCompressed: false,
    waterBottlesMounted: true,
    activeCameraPreset: "iso",
    selectedSocketId: null,
    activeSidebarTab: "bags",
    isExportModalOpen: false,

    currentBike: defaultBike,
    currentSizeConfig: defaultSizeConfig,
    metrics: initialComputed.metrics,
    clearanceWarnings: initialComputed.clearanceWarnings,

    selectBike: (bikeId: string) => {
      const bike = get().bikes.find((b) => b.id === bikeId) || get().bikes[0];
      const availableSizes = Object.keys(bike.sizes);
      const currentSizeKey = get().selectedSizeKey;
      const sizeKey = availableSizes.includes(currentSizeKey)
        ? currentSizeKey
        : availableSizes[0];
      const sizeConfig = bike.sizes[sizeKey];

      const computed = computeState(
        bike,
        sizeConfig,
        get().mountedBags,
        get().payloadEstimateGrams,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        selectedBikeId: bike.id,
        selectedSizeKey: sizeKey,
        currentBike: bike,
        currentSizeConfig: sizeConfig,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    selectSize: (sizeKey: string) => {
      const bike = get().currentBike;
      if (!bike.sizes[sizeKey]) return;
      const sizeConfig = bike.sizes[sizeKey];

      const computed = computeState(
        bike,
        sizeConfig,
        get().mountedBags,
        get().payloadEstimateGrams,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        selectedSizeKey: sizeKey,
        currentSizeConfig: sizeConfig,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    mountBag: (socketId: string, bag: BagItem) => {
      const updatedBags = { ...get().mountedBags, [socketId]: bag };
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        updatedBags,
        get().payloadEstimateGrams,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        mountedBags: updatedBags,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    unmountBag: (socketId: string) => {
      const updatedBags = { ...get().mountedBags };
      delete updatedBags[socketId];

      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        updatedBags,
        get().payloadEstimateGrams,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        mountedBags: updatedBags,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    clearAllBags: () => {
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        {},
        0,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        mountedBags: {},
        payloadEstimateGrams: 0,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    setPayloadEstimate: (grams: number) => {
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        get().mountedBags,
        grams,
        get().dropperPostCompressed,
        get().waterBottlesMounted
      );

      set({
        payloadEstimateGrams: grams,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    toggleDropper: () => {
      const nextDropper = !get().dropperPostCompressed;
      const computed = computeState(
        get().currentBike,
        get().currentSizeConfig,
        get().mountedBags,
        get().payloadEstimateGrams,
        nextDropper,
        get().waterBottlesMounted
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
        nextBottles
      );

      set({
        waterBottlesMounted: nextBottles,
        clearanceWarnings: computed.clearanceWarnings,
      });
    },

    setCameraPreset: (preset: CameraPreset) => {
      set({ activeCameraPreset: preset });
    },

    setSelectedSocketId: (socketId: string | null) => {
      set({ selectedSocketId: socketId });
    },

    setActiveSidebarTab: (tab: "bike" | "bags" | "payload") => {
      set({ activeSidebarTab: tab });
    },

    setExportModalOpen: (open: boolean) => {
      set({ isExportModalOpen: open });
    },

    loadPresetDemo: (presetName) => {
      const bike = get().bikes[0]; // Cutthroat
      const sizeKey = "56cm";
      const sizeConfig = bike.sizes[sizeKey];

      let newBags: Record<string, BagItem> = {};
      let payload = 0;
      let dropper = false;

      if (presetName === "endurance") {
        // Balanced 42/58 setup
        const frameBag = get().bags.find((b) => b.id === "ortlieb-frame-pack-rc-4l");
        const seatBag = get().bags.find((b) => b.id === "apidura-expedition-saddle-pack-9l");
        const barBag = get().bags.find((b) => b.id === "revelate-sweetroll-11l");
        const topBag = get().bags.find((b) => b.id === "apidura-racing-bolt-on-top-tube-1l");
        if (frameBag) newBags["frameTriangle"] = frameBag;
        if (seatBag) newBags["seatpost"] = seatBag;
        if (barBag) newBags["handlebar"] = barBag;
        if (topBag) newBags["topTubeFront"] = topBag;
        payload = 2500;
      } else if (presetName === "minimalist") {
        // Ultra-light race setup
        const topBag = get().bags.find((b) => b.id === "apidura-racing-bolt-on-top-tube-1l");
        const seatBag = get().bags.find((b) => b.id === "apidura-expedition-saddle-pack-9l");
        if (topBag) newBags["topTubeFront"] = topBag;
        if (seatBag) newBags["seatpost"] = seatBag;
        payload = 800;
      } else if (presetName === "overloaded") {
        // Expeditions with massive rear load + dropper drop to trigger clearance alert
        const frameBag = get().bags.find((b) => b.id === "salsa-exp-full-frame-pack");
        const seatBag = get().bags.find((b) => b.id === "ortlieb-seat-pack-16-5l");
        const barBag = get().bags.find((b) => b.id === "ortlieb-handlebar-pack-15l");
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

      const computed = computeState(
        bike,
        sizeConfig,
        newBags,
        payload,
        dropper,
        true
      );

      set({
        selectedBikeId: bike.id,
        selectedSizeKey: sizeKey,
        currentBike: bike,
        currentSizeConfig: sizeConfig,
        mountedBags: newBags,
        payloadEstimateGrams: payload,
        dropperPostCompressed: dropper,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
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
        parsed.sizeKey && bike.sizes[parsed.sizeKey]
          ? parsed.sizeKey
          : Object.keys(bike.sizes)[0];
      const sizeConfig = bike.sizes[sizeKey];

      const payload = parsed.payloadGrams ?? get().payloadEstimateGrams;
      const dropper = parsed.dropper ?? get().dropperPostCompressed;
      const bottles = parsed.bottles ?? get().waterBottlesMounted;

      const computed = computeState(
        bike,
        sizeConfig,
        parsed.mountedBags,
        payload,
        dropper,
        bottles
      );

      set({
        selectedBikeId: bike.id,
        selectedSizeKey: sizeKey,
        currentBike: bike,
        currentSizeConfig: sizeConfig,
        mountedBags: parsed.mountedBags,
        payloadEstimateGrams: payload,
        dropperPostCompressed: dropper,
        waterBottlesMounted: bottles,
        metrics: computed.metrics,
        clearanceWarnings: computed.clearanceWarnings,
      });
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
