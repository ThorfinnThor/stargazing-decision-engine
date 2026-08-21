import assert from "node:assert/strict";
import test from "node:test";

import type { Era5ClimateSnapshot, Era5MonthlyAggregate } from "../lib/climate/era5/types.js";
import type { ObservationSite } from "../lib/data/types.js";
import type { BlackMarbleSnapshot } from "../lib/darkness/black-marble/types.js";
import type { DemSnapshot } from "../lib/elevation/dem/types.js";
import { piecewiseScore } from "../lib/scoring/piecewise.js";
import { scoreSite, scoreSiteMonth, validateSiteScoreConfig } from "../lib/scoring/site-score.js";
import { loadSiteScoreConfig } from "../scripts/score/score-config.js";
import { validateSiteScoreSnapshot } from "../scripts/validate/validate-site-score-snapshots.js";

const config = loadSiteScoreConfig();
const site: ObservationSite = {
  id: "score-fixture",
  slug: "score-fixture",
  destinationId: "fixture",
  name: "Score fixture",
  lat: 10,
  lon: 20,
  elevationM: 1000,
  siteType: "fixture",
  publicAccess: "yes",
  accessScore: 85,
  active: true,
  priority: 1,
  certificationIds: [],
};

const month: Era5MonthlyAggregate = {
  month: 1,
  astronomicalHourCount: 100,
  nightCount: 20,
  clearHourProbability: 0.6,
  goodHourProbability: 0.7,
  overcastHourProbability: 0.2,
  clearNightProbability: 0.5,
  goodNightProbability: 0.6,
  wetNightHourProbability: 0.05,
  dewRiskProbability: 0.2,
  nightTempMeanC: 10,
  nightTempP10C: 5,
  nightTempP90C: 15,
  nightWindMeanKmh: 12,
  highWindHourProbability: 0.1,
  dataCompleteness: 0.95,
  sampleYearCount: 30,
};

function climate(months = Array.from({ length: 12 }, (_, index) => ({ ...month, month: (index + 1) as Era5MonthlyAggregate["month"] }))): Era5ClimateSnapshot {
  return {
    siteId: site.id,
    source: "era5-single-levels-timeseries",
    climateNormal: { startYear: 1991, endYear: 2020 },
    requestedPoint: [site.lat, site.lon],
    gridPoint: [10, 20],
    gridDistanceKm: 10,
    retrievedAt: "2026-08-20T00:00:00Z",
    precipitationConvention: "hourly-accumulation-ending-at-valid-time-metres-to-mm",
    months,
  };
}

function darkness(overrides: Partial<BlackMarbleSnapshot> = {}): BlackMarbleSnapshot {
  return {
    siteId: site.id,
    source: "VNP46A4",
    collectionVersion: "2",
    radianceLayer: "AllAngle_Composite_Snow_Free",
    qualityLayer: "AllAngle_Composite_Snow_Free_Quality",
    units: "nW/cm2/sr",
    blackMarbleYears: [2023, 2024, 2025],
    baselineOverrideUsed: false,
    coverageOverrideUsed: false,
    rings: [],
    radiance0to2: 1,
    radiance2to10: 1,
    radiance10to30: 1,
    radiance30to75: 1,
    alanExposure: 0.5,
    darknessScore: 90,
    coverage: 0.95,
    warnings: [],
    retrievedAt: "2026-08-20T00:00:00Z",
    ...overrides,
  };
}

function dem(overrides: Partial<DemSnapshot> = {}): DemSnapshot {
  return {
    siteId: site.id,
    source: "copernicus-dem-glo-30",
    dataset: "COP-DEM_GLO-30-DGED",
    modelType: "DSM",
    resolutionM: 30,
    resolutionArcSeconds: 1,
    verticalDatum: "EGM2008",
    requestedPoint: [site.lat, site.lon],
    tile: "N10_00_E020_00",
    sourceObject: "s3://fixture/dem.tif",
    publicFallback: false,
    elevationM: 1000,
    neighborhoods: [],
    noDataPolicy: "masked-or-nodata-values-excluded",
    coverage: 1,
    warnings: [],
    retrievedAt: "2026-08-20T00:00:00Z",
    ...overrides,
  };
}

test("published scoring curves clamp and interpolate at specified anchors", () => {
  assert.equal(piecewiseScore(0.5, config.cloud.clearNightCurve), 88);
  assert.equal(piecewiseScore(0.6, config.cloud.clearHourCurve), 92);
  assert.equal(piecewiseScore(-30, config.temperature.curve), 0);
  assert.equal(piecewiseScore(14, config.temperature.curve), 100);
  assert.equal(piecewiseScore(40, config.temperature.curve), 25);
  assert.equal(piecewiseScore(100, config.elevation.curve), 44);
});

test("score configuration rejects weight drift and reversed monotonic curves", () => {
  assert.throws(() => validateSiteScoreConfig({
    ...config,
    weights: { ...config.weights, skyQuality: { ...config.weights.skyQuality, darkness: 0.5 } },
  }), /sum to one/i);
  assert.throws(() => validateSiteScoreConfig({
    ...config,
    dew: { ...config.dew, curve: [[0, 10], [1, 100]] },
  }), /dew curve scores must be decreasing/i);
});

test("real site score follows the documented component weights and final rounding", () => {
  const result = scoreSiteMonth({ site, month, climate: climate(), darkness: darkness(), dem: dem(), config });
  assert.equal(result.clearSkyScore, 89);
  assert.equal(result.dewScore, 78);
  assert.equal(result.elevationScore, 75);
  assert.equal(result.skyQuality, 88);
  assert.equal(result.temperatureComfortScore, 100);
  assert.equal(result.windComfortScore, 94);
  assert.equal(result.rainComfortScore, 85);
  assert.equal(result.tripComfort, 94);
  assert.equal(result.stargazingTrip, 89);
  assert.equal(result.confidenceScore, 95);
  assert.equal(result.confidenceLevel, "high");
});

test("unknown access renormalizes climate comfort and reduces confidence", () => {
  const unknown = { ...site, publicAccess: "unknown" as const, accessScore: null };
  const result = scoreSiteMonth({ site: unknown, month, climate: { ...climate(), siteId: unknown.id }, darkness: darkness(), dem: dem(), config });
  assert.equal(result.tripComfort, 95);
  assert.ok(result.caveats.some((item) => item.includes("renormalized")));
  assert.equal(result.confidenceScore, 87);
});

test("curated elevation fallback keeps the component but DEM confidence becomes zero", () => {
  const result = scoreSiteMonth({ site, month, climate: climate(), darkness: darkness(), dem: null, config });
  assert.equal(result.elevationScore, 75);
  assert.equal(result.confidenceScore, 85);
  assert.ok(result.caveats.some((item) => item.includes("Curated elevation fallback")));
});

test("zero astronomical-night hours force a visible zero stargazing score", () => {
  const polarMonth = { ...month, astronomicalHourCount: 0, clearHourProbability: null, clearNightProbability: null };
  const result = scoreSiteMonth({ site, month: polarMonth, climate: climate(), darkness: darkness(), dem: dem(), config });
  assert.equal(result.skyQuality, 0);
  assert.equal(result.stargazingTrip, 0);
  assert.match(result.caveats[0], /forced to zero/i);
});

test("missing calibration and incomplete non-polar metrics fail closed", () => {
  assert.throws(() => scoreSiteMonth({ site, month, climate: climate(), darkness: darkness({ darknessScore: null }), dem: dem(), config }), /calibrated darkness/i);
  assert.throws(() => scoreSiteMonth({ site, month: { ...month, nightTempMeanC: null }, climate: climate(), darkness: darkness(), dem: dem(), config }), /missing night temperature/i);
});

test("low-confidence scores carry an explicit ranking exclusion caveat", () => {
  const weakSite = { ...site, publicAccess: "unknown" as const, accessScore: null };
  const weakMonth = { ...month, dataCompleteness: 0.2 };
  const weakClimate = { ...climate(), siteId: weakSite.id, gridDistanceKm: 50 };
  const result = scoreSiteMonth({
    site: weakSite,
    month: weakMonth,
    climate: weakClimate,
    darkness: darkness({ blackMarbleYears: [2025], baselineOverrideUsed: true, coverageOverrideUsed: true, coverage: 0.7 }),
    dem: null,
    config,
  });
  assert.equal(result.confidenceLevel, "low");
  assert.ok(result.caveats.some((item) => item.includes("top rankings")));
});

test("site scoring emits 12 unique schema-valid months", () => {
  const months = scoreSite({ site, climate: climate(), darkness: darkness(), dem: dem(), config });
  const snapshot = { siteId: site.id, algorithmVersion: "site-score-1.0.0", generatedAt: "2026-08-20T00:00:00Z", months };
  assert.equal(months.length, 12);
  assert.deepEqual(validateSiteScoreSnapshot(snapshot), []);
});
