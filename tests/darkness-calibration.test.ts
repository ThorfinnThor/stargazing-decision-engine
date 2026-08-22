import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  applyDarknessCurve,
  calibrateDarkness,
  darknessLabelForScore,
  darknessScoreForExposure,
  percentile,
} from "../lib/darkness/calibration/calibration.js";
import type {
  DarknessAnchor,
  DarknessAnchorClass,
  DarknessAnchorConfig,
  DarknessAnchorSnapshot,
  DarknessCurveConfig,
} from "../lib/darkness/calibration/types.js";
import type { BlackMarbleRingMetric } from "../lib/darkness/black-marble/types.js";

interface Fixture {
  fixtureOnly: true;
  notes: string;
  dark_reference: number[];
  mid_reference: number[];
  urban_control: number[];
}

const fixture = JSON.parse(readFileSync(resolve(process.cwd(), "tests/fixtures/calibration/darkness-anchors.json"), "utf8")) as Fixture;
const classes: DarknessAnchorClass[] = ["dark_reference", "mid_reference", "urban_control"];
const rings: BlackMarbleRingMetric[] = ["0to2", "2to10", "10to30", "30to75"].map((id, index) => ({
  id: id as BlackMarbleRingMetric["id"],
  minKm: [0, 2, 10, 30][index],
  maxKm: [2, 10, 30, 75][index],
  upperInclusive: index === 3,
  statistic: "median",
  alanWeight: [0.45, 0.30, 0.15, 0.10][index],
  radiance: 1,
  coverage: 1,
  years: [2023, 2024, 2025].map((year) => ({ year, radiance: 1, coverage: 1, validPixelCount: 1, totalPixelCount: 1 })),
}));

function testInputs() {
  const anchors: DarknessAnchor[] = [];
  const snapshots: DarknessAnchorSnapshot[] = [];
  for (const group of classes) {
    fixture[group].forEach((alanExposure, index) => {
      const id = `${group}-${String(index + 1).padStart(2, "0")}`;
      anchors.push({ id, lat: index, lon: index, class: group, source: "synthetic test fixture", notes: fixture.notes, operatorApproved: true });
      snapshots.push({
        siteId: id,
        source: "VNP46A4",
        collectionVersion: "2",
        radianceLayer: "AllAngle_Composite_Snow_Free",
        qualityLayer: "AllAngle_Composite_Snow_Free_Quality",
        units: "nW/cm2/sr",
        blackMarbleYears: [2023, 2024, 2025],
        baselineOverrideUsed: false,
        coverageOverrideUsed: false,
        rings,
        radiance0to2: 1,
        radiance2to10: 1,
        radiance10to30: 1,
        radiance30to75: 1,
        alanExposure,
        darknessScore: null,
        coverage: 1,
        warnings: [],
        retrievedAt: "2026-08-20T00:00:00Z",
      });
    });
  }
  const anchorConfig: DarknessAnchorConfig = {
    version: 1,
    status: "approved",
    minimumClassCounts: { dark_reference: 30, mid_reference: 20, urban_control: 20 },
    anchors,
  };
  return { anchorConfig, snapshots };
}

test("percentiles use deterministic linear interpolation", () => {
  assert.equal(percentile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(percentile([1, 2, 3, 4], 0.25), 1.75);
});

test("70 reviewed anchors produce a fixed strictly decreasing curve", () => {
  const result = calibrateDarkness(testInputs());
  assert.equal(result.anchorCount, 70);
  assert.deepEqual(result.blackMarbleYears, [2023, 2024, 2025]);
  assert.equal(result.distributions.dark_reference.count, 30);
  assert.equal(result.distributions.mid_reference.count, 20);
  assert.equal(result.distributions.urban_control.count, 20);
  for (let index = 1; index < result.curve.length; index += 1) {
    assert.ok(result.curve[index].alanExposure > result.curve[index - 1].alanExposure);
    assert.ok(result.curve[index].darknessScore < result.curve[index - 1].darknessScore);
  }
  assert.equal(darknessScoreForExposure(-0, result), 100);
  assert.equal(darknessScoreForExposure(99, result), 0);
  assert.ok(darknessScoreForExposure(result.distributions.mid_reference.median, result) === 50);
});

test("curve interpolation is monotonic and labels never imply Bortle classes", () => {
  const result = calibrateDarkness(testInputs());
  let previous = 101;
  for (let exposure = 0; exposure <= 5; exposure += 0.01) {
    const score = darknessScoreForExposure(exposure, result);
    assert.ok(score <= previous);
    previous = score;
  }
  assert.equal(darknessLabelForScore(90, result), "Very dark");
  assert.equal(darknessLabelForScore(70, result), "Dark");
  assert.equal(darknessLabelForScore(50, result), "Moderate artificial light");
  assert.equal(darknessLabelForScore(20, result), "Bright surroundings");
  assert.ok(result.labels.every((item) => !item.label.includes("Bortle")));
});

test("a calibrated curve can score a committed ALAN snapshot without raw raster files", () => {
  const result = calibrateDarkness(testInputs());
  const snapshot = testInputs().snapshots[0];
  const scored = applyDarknessCurve(snapshot, result);
  assert.equal(scored.darknessScore, darknessScoreForExposure(snapshot.alanExposure as number, result));
  assert.equal(snapshot.darknessScore, null);
  assert.throws(
    () => applyDarknessCurve({ ...snapshot, blackMarbleYears: [2022, 2023, 2024] }, result),
    /baseline years/i,
  );
});

test("calibration fails closed on pending approval, missing counts, weak snapshots, and overlapping medians", () => {
  const pending = testInputs();
  pending.anchorConfig.status = "operator_review_pending";
  assert.throws(() => calibrateDarkness(pending), /operator approval/i);

  const underfilled = testInputs();
  underfilled.anchorConfig.anchors.pop();
  underfilled.snapshots.pop();
  assert.throws(() => calibrateDarkness(underfilled), /requires at least 20 anchors/i);

  const weak = testInputs();
  weak.snapshots[0] = { ...weak.snapshots[0], coverage: 0.69, coverageOverrideUsed: true };
  assert.throws(() => calibrateDarkness(weak), /coverage/i);

  const overlap = testInputs();
  overlap.snapshots = overlap.snapshots.map((snapshot) => ({ ...snapshot, alanExposure: 1 }));
  assert.throws(() => calibrateDarkness(overlap), /medians/i);
});

test("the committed curve enforces its declared availability", () => {
  const config = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/scoring/darkness.json"), "utf8")) as DarknessCurveConfig;
  if (config.status === "awaiting_calibration") {
    assert.throws(() => darknessScoreForExposure(1, config), /not available/i);
    return;
  }

  const anchors = JSON.parse(
    readFileSync(resolve(process.cwd(), "data-config/calibration/darkness-anchors.json"), "utf8"),
  ) as DarknessAnchorConfig;
  assert.equal(config.anchorConfigVersion, anchors.version);
  assert.equal(config.anchorCount, anchors.anchors.length);
  assert.ok(config.curve.length >= 2);
  assert.doesNotThrow(() => darknessScoreForExposure(1, config));
});
