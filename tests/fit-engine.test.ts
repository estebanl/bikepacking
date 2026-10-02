import test from "node:test";
import assert from "node:assert/strict";
import type {
  BagItem,
  BikeModel,
  BikeSizeConfig,
  SocketAnchor,
} from "../src/types/index.ts";
import { calculateRigMetrics } from "../src/lib/balance.ts";
import { evaluateClearances } from "../src/lib/clearance.ts";

// Independent synthetic rig: 1m wheelbase, 10kg bike, 45% unloaded front load.
// This isolates physical equations from vendor catalog entries and mesh details.
const anchor = (id: string, x: number, y = 1.1): SocketAnchor => ({
  id,
  name: id,
  position: [x, y, 0],
  rotation: [0, 0, 0],
  allowedBagCategories: [
    "top_tube",
    "fork_cage_bag",
    "seat_pack",
    "handlebar_roll",
    "rack",
  ],
  maxVolumeLiters: 2,
  verification: "verified",
});
const size: BikeSizeConfig = {
  geometry: {
    reachMm: 400,
    stackMm: 600,
    standoverMm: 780,
    seatTubeLengthMm: 500,
    topTubeLengthMm: 560,
    headTubeAngleDeg: 70,
    seatTubeAngleDeg: 74,
    wheelbaseMm: 1000,
  },
  sockets: {
    frameTriangle: anchor("frameTriangle", 0),
    seatpost: anchor("seatpost", -0.3),
    handlebar: anchor("handlebar", 0.4),
    topTubeFront: anchor("topTubeFront", 0.25),
    topTubeRear: anchor("topTubeRear", -0.25),
    downtubeUnderside: anchor("downtubeUnderside", 0.25),
    forkLeft: [anchor("forkLeft_0", 0.4)],
    forkRight: [anchor("forkRight_0", 0.4)],
    additional: [anchor("rearRack", -0.6)],
  },
  clearanceZones: {
    rearTireMaxRadiusMm: 350,
    frontTireMaxRadiusMm: 350,
    seatStayClearanceMm: 80,
  },
};
const bike: BikeModel = {
  id: "physics-fixture",
  brand: "Fixture",
  name: "Reference",
  category: "gravel",
  baseWeightGrams: 10000,
  wheelbaseMm: 1300,
  handlebarType: "drop",
  colorHex: "#888",
  sizes: { M: size },
};
const bag = (overrides: Partial<BagItem> = {}): BagItem => ({
  id: "test-bag",
  brand: "Fixture",
  name: "Bag",
  category: "top_tube",
  volumeLiters: 2,
  dryWeightGrams: 1000,
  dimensionsMm: { length: 200, height: 100, depth: 100 },
  dimensionsStatus: "verified",
  weightStatus: "verified",
  fitStatus: "verified",
  compatibleSockets: ["topTubeRear", "downtubeUnderside", "rearRack"],
  productUrl: "https://example.test/bag",
  priceUsd: null,
  ...overrides,
});
const warnings = (mountedBags: Record<string, BagItem>) =>
  evaluateClearances({
    bike,
    sizeConfig: size,
    mountedBags,
    dropperPostCompressed: false,
    waterBottlesMounted: false,
  });

for (const [socket, distanceFromRear] of [
  ["topTubeRear", 0.25],
  ["downtubeUnderside", 0.75],
  ["rearRack", -0.1],
] as const) {
  test(`mass and moment conservation: 1kg dry + 3kg payload at ${socket}`, () => {
    const metrics = calculateRigMetrics(bike, size, { [socket]: bag() }, 3000);
    const expectedFrontGrams = Math.round(4500 + 4000 * distanceFromRear);
    assert.equal(metrics.totalRigWeightGrams, 14000);
    assert.equal(
      metrics.frontAxleWeightGrams + metrics.rearAxleWeightGrams,
      14000,
    );
    assert.ok(
      Math.abs(metrics.frontAxleWeightGrams - expectedFrontGrams) <= 1,
      `expected ${expectedFrontGrams}g front from static moments, got ${metrics.frontAxleWeightGrams}g`,
    );
  });
}

test("zero-volume hardware contributes dry mass, but receives no distributed payload", () => {
  const metrics = calculateRigMetrics(
    bike,
    size,
    {
      downtubeUnderside: bag(),
      rearRack: bag({
        id: "rack",
        category: "rack",
        volumeLiters: 0,
        dryWeightGrams: 500,
      }),
    },
    2000,
  );
  assert.equal(metrics.totalRigWeightGrams, 13500);
  assert.equal(metrics.totalCapacityLiters, 2);
  assert.equal(metrics.frontAxleWeightGrams, 6700); // 4500 + 3000*.75 - 500*.1
});

test("unknown dry weight is explicitly reported and does not produce NaN", () => {
  const metrics = calculateRigMetrics(
    bike,
    size,
    { topTubeRear: bag({ dryWeightGrams: null, weightStatus: "unknown" }) },
    0,
  );
  assert.equal(metrics.totalRigWeightGrams, 10000);
  assert.ok(metrics.unknownWeightItemIds?.includes("test-bag"));
  assert.ok(Number.isFinite(metrics.frontAxleWeightGrams));
});

for (const socket of [
  "topTubeRear",
  "downtubeUnderside",
  "forkLeft_0",
  "forkRight_0",
  "rearRack",
]) {
  test(`capacity warning covers ${socket}`, () => {
    assert.ok(
      warnings({ [socket]: bag({ volumeLiters: 4.1 }) }).some(
        (w) => w.id === `oversize_${socket}`,
      ),
    );
  });
}

test("physical bag height changes tire warning even with identical volume", () => {
  const small = bag({
    category: "handlebar_roll",
    dimensionsMm: { length: 300, height: 100, depth: 100 },
  });
  const large = bag({
    ...small,
    dimensionsMm: { length: 300, height: 400, depth: 100 },
  });
  assert.equal(
    warnings({ handlebar: small }).filter((w) => w.type === "bar_tire").length,
    0,
  );
  assert.ok(warnings({ handlebar: large }).some((w) => w.type === "bar_tire"));
});

test("visual estimates cannot create measured physical clearance claims", () => {
  const unknown = bag({
    category: "handlebar_roll",
    dimensionsMm: { length: null, height: null, depth: null },
    dimensionsStatus: "unknown",
    fitStatus: "unverified",
    visualDimensionsMm: { length: 300, height: 400, depth: 100 },
  });
  const result = warnings({ handlebar: unknown });
  assert.ok(result.some((w) => w.type === "fit_unverified"));
  assert.ok(
    result.every((w) => w.measuredMm === undefined),
    "unknown dimensions must not become a numeric clearance",
  );
});

test("required hardware warning clears only when capability is present", () => {
  const pannier = bag({ id: "pannier", requires: ["rear-rack"] });
  assert.ok(
    warnings({ topTubeRear: pannier }).some((w) => w.type === "dependency"),
  );
  const rack = bag({
    id: "rack",
    category: "rack",
    volumeLiters: 0,
    provides: ["rear-rack"],
  });
  assert.equal(
    warnings({ topTubeRear: pannier, rearRack: rack }).filter(
      (w) => w.type === "dependency",
    ).length,
    0,
  );
});

test("negative or nonfinite payload cannot corrupt rig weight", () => {
  for (const payload of [-1000, NaN, Infinity]) {
    const metrics = calculateRigMetrics(bike, size, {}, payload);
    assert.equal(metrics.payloadEstimateGrams, 0);
    assert.equal(metrics.totalRigWeightGrams, 10000);
    assert.equal(metrics.frontAxleWeightGrams, 4500);
  }
});

// Geometry is checked against inputs in millimetres/degrees, not mesh snapshots.
import { getBikeGeometry } from "../src/lib/bikeGeometry.ts";
test("reconstructed frame preserves selected-size wheelbase, reach, stack, chainstay and head angle", () => {
  const measuredSize = structuredClone(size);
  measuredSize.geometry = {
    ...size.geometry,
    wheelbaseMm: 1209,
    reachMm: 475,
    stackMm: 597,
    chainstayMm: 437,
    bbDropMm: 38.5,
    headTubeAngleDeg: 66,
  };
  const geometry = getBikeGeometry(
    { ...bike, wheelRadiusMm: 372.5 },
    measuredSize,
  );
  const close = (actual: number, expected: number) =>
    assert.ok(Math.abs(actual - expected) < 0.001, `${actual} != ${expected}`);
  close((geometry.frontAxle[0] - geometry.rearAxle[0]) * 1000, 1209);
  close((geometry.headTubeTop[0] - geometry.bb[0]) * 1000, 475);
  close((geometry.headTubeTop[1] - geometry.bb[1]) * 1000, 597);
  close(
    Math.hypot(
      geometry.bb[0] - geometry.rearAxle[0],
      geometry.bb[1] - geometry.rearAxle[1],
    ) * 1000,
    437,
  );
  close((geometry.rearAxle[1] - geometry.bb[1]) * 1000, 38.5);
  close(
    (Math.atan2(
      geometry.headTubeTop[1] - geometry.headTubeBottom[1],
      geometry.headTubeBottom[0] - geometry.headTubeTop[0],
    ) *
      180) /
      Math.PI,
    66,
  );
});

import {
  getEquipmentDimensions,
  getEquipmentBounds,
} from "../src/lib/equipmentGeometry.ts";
test("display envelopes never substitute for measured dimensions in fit checks", () => {
  const unknown = bag({
    dimensionsMm: { length: null, height: null, depth: null },
    dimensionsStatus: "unknown",
    visualDimensionsMm: { length: 500, height: 250, depth: 80 },
  });
  assert.deepEqual(getEquipmentDimensions(unknown), {
    length: 0.5,
    height: 0.25,
    depth: 0.08,
  });
  assert.equal(getEquipmentDimensions(unknown, { allowEstimate: false }), null);
  const estimated = bag({ dimensionsStatus: "estimated" });
  assert.equal(
    getEquipmentDimensions(estimated, { allowEstimate: false }),
    null,
  );
  const verified = bag({ dimensionsStatus: "verified" });
  assert.deepEqual(getEquipmentDimensions(verified, { allowEstimate: false }), {
    length: 0.2,
    height: 0.1,
    depth: 0.1,
  });
});

test("quarter-turn rotates physical equipment envelope without changing dimensions", () => {
  const rotatedSocket = {
    ...anchor("topTubeRear", 0, 0),
    rotation: [0, 0, Math.PI / 2] as [number, number, number],
  };
  const bounds = getEquipmentBounds(bag(), rotatedSocket, false, {
    allowEstimate: false,
  });
  assert.ok(bounds);
  assert.ok(Math.abs(bounds.max[0] - bounds.min[0] - 0.1) < 1e-9);
  assert.ok(Math.abs(bounds.max[1] - bounds.min[1] - 0.2) < 1e-9);
  assert.ok(Math.abs(bounds.max[2] - bounds.min[2] - 0.1) < 1e-9);
});

import {
  getSocketAnchors,
  validateMount,
  sanitizeMountedBags,
} from "../src/lib/sockets.ts";
test("every listed socket resolves once, including both forks and additional hardware", () => {
  const ids = getSocketAnchors(size).map((socket) => socket.id);
  assert.equal(ids.length, 9);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of [
    "topTubeRear",
    "downtubeUnderside",
    "rearRack",
    "forkLeft_0",
    "forkRight_0",
  ])
    assert.ok(ids.includes(id));
});
test("mount validation rejects missing anchors and category mismatches, but does not forbid an oversize preview", () => {
  assert.equal(validateMount(bag(), "invented", size, {}).allowed, false);
  assert.equal(
    validateMount(bag({ category: "pannier" }), "topTubeRear", size, {})
      .allowed,
    false,
  );
  assert.equal(
    validateMount(bag({ volumeLiters: 4.1 }), "topTubeRear", size, {}).allowed,
    true,
  );
});
test("mounting on right fork preserves side and cannot use a left-only capability", () => {
  const fork = bag({
    category: "fork_cage_bag",
    compatibleSockets: ["forkRight_0"],
    requires: ["cage-right"],
  });
  const leftCage = bag({ id: "left-cage", provides: ["cage-left"] });
  assert.equal(validateMount(fork, "forkLeft_0", size, {}).allowed, false);
  assert.equal(
    validateMount(fork, "forkRight_0", size, { forkLeft_0: leftCage }).allowed,
    false,
  );
  const rightMount = bag({ id: "right-mount", provides: ["cage-right"] });
  assert.equal(
    validateMount(fork, "forkRight_0", size, { rearRack: rightMount }).allowed,
    true,
  );
});
test("sanitizing imported or model-switched rig removes unavailable hardware and its dependents recursively", () => {
  const provider = bag({
    id: "rack",
    category: "rack",
    provides: ["rack"],
    compatibleSockets: ["rearRack"],
  });
  const dependent = bag({ id: "pouch", requires: ["rack"] });
  const changedFrame = structuredClone(size);
  changedFrame.sockets.additional = [];
  const result = sanitizeMountedBags(
    {
      rearRack: provider,
      topTubeRear: dependent,
      downtubeUnderside: bag({ id: "valid" }),
    },
    changedFrame,
  );
  assert.deepEqual(Object.keys(result.mountedBags), ["downtubeUnderside"]);
  assert.deepEqual(result.removed.map((item) => item.bagId).sort(), [
    "pouch",
    "rack",
  ]);
});
test("valid imported dependencies survive regardless of object insertion order", () => {
  const provider = bag({
    id: "rack",
    category: "rack",
    provides: ["rack"],
    compatibleSockets: ["rearRack"],
  });
  const dependent = bag({ id: "pouch", requires: ["rack"] });
  for (const input of [
    { topTubeRear: dependent, rearRack: provider },
    { rearRack: provider, topTubeRear: dependent },
  ]) {
    const result = sanitizeMountedBags(input, size);
    assert.equal(result.removed.length, 0);
    assert.equal(Object.keys(result.mountedBags).length, 2);
  }
});
test("import cannot retain a dependent whose provider is itself incompatible", () => {
  const incompatibleProvider = bag({
    id: "rack",
    category: "pannier",
    provides: ["rack"],
  });
  const dependent = bag({ id: "pouch", requires: ["rack"] });
  const result = sanitizeMountedBags(
    { topTubeRear: dependent, rearRack: incompatibleProvider },
    size,
  );
  assert.equal(Object.keys(result.mountedBags).length, 0);
});

import {
  deserializeRigFromUrlQuery,
  generateCsvManifest,
  generateMarkdownManifest,
} from "../src/lib/export.ts";
test("URL payload parsing rejects nonnumeric, partially numeric and negative values", () => {
  for (const payload of ["NaN", "Infinity", "100oops", "-10", "1e999"]) {
    assert.equal(
      deserializeRigFromUrlQuery(`?p=${payload}`, []).payloadGrams,
      0,
    );
  }
  assert.equal(deserializeRigFromUrlQuery("?p=2500", []).payloadGrams, 2500);
});
test("URL prototype-like socket names are discarded before mounted-map construction", () => {
  const item = bag();
  const parsed = deserializeRigFromUrlQuery(
    "?bags=__proto__:test-bag,constructor:test-bag,topTubeRear:test-bag",
    [item],
  );
  assert.deepEqual(Object.keys(parsed.mountedBags), ["topTubeRear"]);
});
test("unknown specifications survive manifests as explicit uncertainty rather than null or zero", () => {
  const item = bag({
    volumeLiters: null,
    dryWeightGrams: null,
    priceUsd: null,
  });
  const mountedBags = { topTubeRear: item };
  const metrics = calculateRigMetrics(bike, size, mountedBags, 0);
  for (const manifest of [generateCsvManifest, generateMarkdownManifest]) {
    const text = manifest({ bike, sizeKey: "M", mountedBags, metrics });
    assert.match(text, /Unknown/);
    assert.match(text, /Known subtotals only/);
    assert.doesNotMatch(text, /null|NaN|\$0/);
  }
});

import { SANTA_CRUZ_BIKES } from "../src/data/santaCruz.ts";
import { getEquipmentPlacement } from "../src/lib/equipmentGeometry.ts";
test("seat equipment follows modeled saddle displacement through full dropper movement on every Santa Cruz size", () => {
  for (const model of SANTA_CRUZ_BIKES)
    for (const config of Object.values(model.sizes)) {
      const extended = getBikeGeometry(model, config),
        compressed = getBikeGeometry(model, config, true);
      const seatBag = bag({ category: "seat_pack" });
      const before = getEquipmentPlacement(seatBag, config.sockets.seatpost);
      const after = getEquipmentPlacement(
        seatBag,
        config.sockets.seatpost,
        true,
      );
      for (let axis = 0; axis < 3; axis++) {
        assert.ok(
          Math.abs(
            after.position[axis] -
              before.position[axis] -
              (compressed.saddleBase[axis] - extended.saddleBase[axis]),
          ) < 1e-9,
        );
      }
    }
});
test("collision checks respond to known equipment dimensions, preserving separated envelopes", () => {
  const fixture = structuredClone(size);
  fixture.sockets.topTubeFront.position = [0, 1.1, 0];
  fixture.sockets.topTubeRear!.position = [0.15, 1.1, 0];
  const check = (length: number) =>
    evaluateClearances({
      bike,
      sizeConfig: fixture,
      mountedBags: {
        topTubeFront: bag({
          id: "front",
          dimensionsMm: { length, height: 100, depth: 100 },
        }),
        topTubeRear: bag({
          id: "rear",
          dimensionsMm: { length, height: 100, depth: 100 },
        }),
      },
      dropperPostCompressed: false,
      waterBottlesMounted: false,
    });
  assert.equal(check(100).filter((w) => w.type === "bag_collision").length, 0);
  assert.equal(check(300).filter((w) => w.type === "bag_collision").length, 1);
});

test("loaded socket limit includes allocated payload, not just empty bag mass", () => {
  const fixture = structuredClone(size);
  fixture.sockets.downtubeUnderside!.maxLoadGrams = 2000;
  const loaded = evaluateClearances({
    bike,
    sizeConfig: fixture,
    mountedBags: { downtubeUnderside: bag({ dryWeightGrams: 100 }) },
    payloadEstimateGrams: 3000,
    dropperPostCompressed: false,
    waterBottlesMounted: false,
  });
  assert.ok(loaded.some((w) => w.id === "overload_downtubeUnderside"));
  const unloaded = evaluateClearances({
    bike,
    sizeConfig: fixture,
    mountedBags: { downtubeUnderside: bag({ dryWeightGrams: 100 }) },
    payloadEstimateGrams: 0,
    dropperPostCompressed: false,
    waterBottlesMounted: false,
  });
  assert.equal(
    unloaded.filter((w) => w.id === "overload_downtubeUnderside").length,
    0,
  );
});

import { TAILFIN_CATALOG } from "../src/data/tailfin.ts";
test("actual Tailfin fork pack cannot depend on the opposite fork mounting hardware", () => {
  const config = SANTA_CRUZ_BIKES[0].sizes.M;
  const mount = TAILFIN_CATALOG.find(
    (item) => item.sourceProductId === "tailfin-42733",
  )!;
  const cage = TAILFIN_CATALOG.find(
    (item) => item.sourceProductId === "tailfin-32010",
  )!;
  const pack = TAILFIN_CATALOG.find(
    (item) => item.sourceProductId === "tailfin-56316",
  )!;
  assert.ok(mount && cage && pack);
  assert.equal(
    validateMount(pack, "forkRight_0", config, {
      forkMountLeft: mount,
      cageLeft: cage,
    }).allowed,
    false,
  );
  assert.equal(
    validateMount(pack, "forkRight_0", config, {
      forkMountRight: mount,
      cageRight: cage,
    }).allowed,
    true,
  );
  assert.equal(
    validateMount(cage, "cageRight", config, { forkMountLeft: mount }).allowed,
    false,
  );
  assert.equal(
    validateMount(cage, "cageRight", config, { forkMountRight: mount }).allowed,
    true,
  );
});
test("all indexed Tailfin variants have unique identities and explicit source/uncertainty, reference-only variants cannot mount", () => {
  assert.equal(TAILFIN_CATALOG.length, 191);
  assert.equal(new Set(TAILFIN_CATALOG.map((item) => item.id)).size, 191);
  for (const item of TAILFIN_CATALOG) {
    assert.match(item.productUrl, /^https:\/\/www\.tailfin\.cc\//);
    assert.equal(item.fitStatus, "unverified");
    if (item.referenceOnly) assert.equal(item.compatibleSockets.length, 0);
    if (item.weightStatus === "unknown")
      assert.equal(item.dryWeightGrams, null);
    if (item.dimensionsStatus === "unknown")
      assert.equal(
        getEquipmentDimensions(item, { allowEstimate: false }),
        null,
      );
  }
});

test("rigid Stigmata saddle and equipment cannot move under a dropper request", () => {
  const model = SANTA_CRUZ_BIKES.find((item) => item.id.includes("stigmata"))!;
  assert.equal(model.seatpostType, "rigid");
  for (const config of Object.values(model.sizes)) {
    assert.deepEqual(getBikeGeometry(model, config, true).saddleBase, getBikeGeometry(model, config).saddleBase);
    assert.deepEqual(config.sockets.seatpost.dropperOffset, [0, 0, 0]);
  }
});

test("hardware without a storage compartment does not create an unknown-capacity warning", () => {
  const fixture = structuredClone(size);
  fixture.sockets.topTubeFront.allowedBagCategories.push("mount");
  const hardware = bag({ category: "mount", productKind: "mount", volumeLiters: null });
  const metrics = calculateRigMetrics(bike, fixture, { topTubeFront: hardware }, 0);
  assert.deepEqual(metrics.unknownCapacityItemIds, []);
  assert.equal(metrics.totalCapacityLiters, 0);
  assert.equal(hardware.volumeLiters, null);
});
