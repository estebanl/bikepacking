import test from "node:test";
import assert from "node:assert/strict";

import { BIKES } from "../src/data/bikes.ts";
import { BAGS } from "../src/data/bags.ts";
import { calculateRigMetrics } from "../src/lib/balance.ts";
import { evaluateClearances } from "../src/lib/clearance.ts";
import {
  generateCsvManifest,
  generateMarkdownManifest,
  serializeRigToUrlQuery,
  deserializeRigFromUrlQuery,
} from "../src/lib/export.ts";

test("calculateRigMetrics accurately computes base weight and volume with no bags", () => {
  const cutthroat = BIKES[0];
  const sizeConfig = cutthroat.sizes["56cm"];

  const metrics = calculateRigMetrics(cutthroat, sizeConfig, {}, 0);

  assert.equal(metrics.bikeBaseWeightGrams, 10200);
  assert.equal(metrics.totalBagsDryWeightGrams, 0);
  assert.equal(metrics.payloadEstimateGrams, 0);
  assert.equal(metrics.totalRigWeightGrams, 10200);
  assert.equal(metrics.totalCapacityLiters, 0);
  assert.equal(metrics.frontRatioPercent + metrics.rearRatioPercent, 100);
  assert.equal(metrics.balanceStatus, "balanced");
});

test("calculateRigMetrics updates weight, capacity, and axle balance with mounted gear", () => {
  const cutthroat = BIKES[0];
  const sizeConfig = cutthroat.sizes["56cm"];

  const frameBag = BAGS.find((b) => b.id === "ortlieb-frame-pack-rc-4l")!;
  const seatBag = BAGS.find((b) => b.id === "revelate-terrapin-14l")!;
  const barBag = BAGS.find((b) => b.id === "ortlieb-handlebar-pack-15l")!;

  const mountedBags = {
    frameTriangle: frameBag,
    seatpost: seatBag,
    handlebar: barBag,
  };

  const metrics = calculateRigMetrics(cutthroat, sizeConfig, mountedBags, 2500);

  const expectedBagsWeight =
    frameBag.dryWeightGrams + seatBag.dryWeightGrams + barBag.dryWeightGrams;
  const expectedTotalWeight = 10200 + expectedBagsWeight + 2500;
  const expectedCapacity =
    frameBag.volumeLiters + seatBag.volumeLiters + barBag.volumeLiters;

  assert.equal(metrics.totalBagsDryWeightGrams, expectedBagsWeight);
  assert.equal(metrics.totalRigWeightGrams, expectedTotalWeight);
  assert.equal(metrics.totalCapacityLiters, expectedCapacity);
  assert.equal(metrics.payloadEstimateGrams, 2500);

  // Check axle ratio sums to 100%
  assert.equal(metrics.frontRatioPercent + metrics.rearRatioPercent, 100);
  assert.ok(metrics.frontRatioPercent >= 35 && metrics.frontRatioPercent <= 55);
});

test("evaluateClearances flags frame bag collision with water bottles", () => {
  const cutthroat = BIKES[0];
  const sizeConfig = cutthroat.sizes["56cm"];

  const fullFrameBag = BAGS.find((b) => b.id === "salsa-exp-full-frame-pack")!;

  const warningsWithBottles = evaluateClearances({
    bike: cutthroat,
    sizeConfig,
    mountedBags: { frameTriangle: fullFrameBag },
    dropperPostCompressed: false,
    waterBottlesMounted: true,
  });

  const bottleWarning = warningsWithBottles.find((w) => w.type === "frame_bottle");
  assert.ok(bottleWarning, "Expected bottle cage collision warning with full frame bag");
  assert.equal(bottleWarning.severity, "error");

  // When bottles are unmounted, collision should disappear
  const warningsWithoutBottles = evaluateClearances({
    bike: cutthroat,
    sizeConfig,
    mountedBags: { frameTriangle: fullFrameBag },
    dropperPostCompressed: false,
    waterBottlesMounted: false,
  });

  const noBottleWarning = warningsWithoutBottles.find((w) => w.type === "frame_bottle");
  assert.equal(noBottleWarning, undefined, "Bottle warning should be cleared when bottles are removed");
});

test("evaluateClearances flags seat pack tire buzz under dropper compression", () => {
  const cutthroat = BIKES[0];
  const sizeConfig = cutthroat.sizes["56cm"];

  const largeSeatPack = BAGS.find((b) => b.id === "ortlieb-seat-pack-16-5l")!;

  const warningsCompressed = evaluateClearances({
    bike: cutthroat,
    sizeConfig,
    mountedBags: { seatpost: largeSeatPack },
    dropperPostCompressed: true,
    waterBottlesMounted: false,
  });

  const seatWarning = warningsCompressed.find((w) => w.type === "seat_tire");
  assert.ok(seatWarning, "Expected seat tire clearance warning under dropper compression");
  assert.ok(seatWarning.measuredMm !== undefined);
  assert.ok(seatWarning.recommendedMinMm === 100);
});

test("export manifests serialize and contain complete component breakdown", () => {
  const bike = BIKES[1]; // Trek Checkpoint
  const sizeConfig = bike.sizes["56cm"];
  const seatBag = BAGS.find((b) => b.id === "apidura-expedition-saddle-pack-9l")!;

  const mountedBags = { seatpost: seatBag };
  const metrics = calculateRigMetrics(bike, sizeConfig, mountedBags, 1200);

  const csv = generateCsvManifest({
    bike,
    sizeKey: "56cm",
    mountedBags,
    metrics,
  });

  assert.ok(csv.includes("Trek"));
  assert.ok(csv.includes("Checkpoint"));
  assert.ok(csv.includes("Apidura"));
  assert.ok(csv.includes("TOTAL RIG SUMMARY"));

  const md = generateMarkdownManifest({
    bike,
    sizeKey: "56cm",
    mountedBags,
    metrics,
  });

  assert.ok(md.includes("# 🚲 Bikepacking Rig Manifest"));
  assert.ok(md.includes("Checkpoint"));
  assert.ok(md.includes("Apidura"));
  assert.ok(md.includes("Axle Weight Balance"));
});

test("URL query serialization and deserialization round-trip correctly", () => {
  const bike = BIKES[0];
  const frameBag = BAGS.find((b) => b.id === "ortlieb-frame-pack-rc-4l")!;
  const seatBag = BAGS.find((b) => b.id === "revelate-terrapin-14l")!;

  const mountedBags = {
    frameTriangle: frameBag,
    seatpost: seatBag,
  };

  const queryString = serializeRigToUrlQuery({
    bikeId: bike.id,
    sizeKey: "56cm",
    mountedBags,
    payloadGrams: 3500,
    dropper: true,
    bottles: false,
  });

  const deserialized = deserializeRigFromUrlQuery(queryString, BAGS);

  assert.equal(deserialized.bikeId, bike.id);
  assert.equal(deserialized.sizeKey, "56cm");
  assert.equal(deserialized.payloadGrams, 3500);
  assert.equal(deserialized.dropper, true);
  assert.equal(deserialized.bottles, false);
  assert.equal(deserialized.mountedBags["frameTriangle"].id, frameBag.id);
  assert.equal(deserialized.mountedBags["seatpost"].id, seatBag.id);
});
