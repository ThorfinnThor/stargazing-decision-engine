import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { haversineKm } from "../lib/climate/era5/distance.js";
import { ringForDistance, summarizeBlackMarbleYear } from "../lib/darkness/black-marble/rings.js";
import { buildBlackMarbleSnapshot } from "../lib/darkness/black-marble/snapshot.js";
import type { BlackMarbleConfig, BlackMarbleExtractedYear } from "../lib/darkness/black-marble/types.js";
import { validateBlackMarbleSnapshot } from "../scripts/validate/validate-black-marble-snapshots.js";

const root = process.cwd();
const config = JSON.parse(readFileSync(resolve(root, "data-config/sources/black-marble.json"), "utf8")) as BlackMarbleConfig;
const fixture = JSON.parse(readFileSync(resolve(root, "tests/fixtures/black-marble/years.json"), "utf8")) as BlackMarbleExtractedYear[];
const site = { id: "fixture-site", lat: 0, lon: 0 };
const fixtureDistance = (pixel: { lat: number }) => pixel.lat;

test("Black Marble ring intervals are non-overlapping and include 75 km", () => {
  assert.equal(ringForDistance(0, config.rings)?.id, "0to2");
  assert.equal(ringForDistance(1.999999, config.rings)?.id, "0to2");
  assert.equal(ringForDistance(2, config.rings)?.id, "2to10");
  assert.equal(ringForDistance(10, config.rings)?.id, "10to30");
  assert.equal(ringForDistance(30, config.rings)?.id, "30to75");
  assert.equal(ringForDistance(75, config.rings)?.id, "30to75");
  assert.equal(ringForDistance(75.000001, config.rings), undefined);
});

test("only good-quality snow-free pixels enter radiance while all pixels enter coverage", () => {
  const year: BlackMarbleExtractedYear = {
    ...fixture[0],
    pixels: [
      { lat: 0.5, lon: 0, radiance: 1, quality: 0 },
      { lat: 1, lon: 0, radiance: 100, quality: 1 },
      { lat: 1.5, lon: 0, radiance: null, quality: 255 },
    ],
  };
  const metric = summarizeBlackMarbleYear(year, site, config, fixtureDistance)[0];
  assert.equal(metric.radiance, 1);
  assert.equal(metric.validPixelCount, 1);
  assert.equal(metric.totalPixelCount, 3);
  assert.ok(Math.abs(metric.coverage - 1 / 3) < 1e-12);
});

test("three yearly ring metrics aggregate by median without rounded ALAN intermediates", () => {
  // The fixture stores distance in latitude; replace geodesic sampling with equivalent tiny-latitude points.
  // Rebuild using a test-only longitude/latitude scale that yields the desired ring distances.
  const kmPerDegree = haversineKm(0, 0, 1, 0);
  const geodesicYears = fixture.map((year) => ({
    ...year,
    pixels: year.pixels.map((pixel) => ({ ...pixel, lat: pixel.lat / kmPerDegree })),
  }));
  const geodesicSnapshot = buildBlackMarbleSnapshot({
    site,
    years: geodesicYears,
    config,
    retrievedAt: "2026-08-20T00:00:00Z",
  });
  assert.equal(geodesicSnapshot.radiance0to2, 3);
  assert.equal(geodesicSnapshot.radiance2to10, 25);
  assert.equal(geodesicSnapshot.radiance10to30, 250);
  assert.equal(geodesicSnapshot.radiance30to75, 2500);
  const expected = 0.45 * Math.log1p(3) + 0.30 * Math.log1p(25) + 0.15 * Math.log1p(250) + 0.10 * Math.log1p(2500);
  assert.equal(geodesicSnapshot.alanExposure, Math.round(expected * 1e6) / 1e6);
  assert.deepEqual(validateBlackMarbleSnapshot(geodesicSnapshot), []);
  assert.equal(geodesicSnapshot.source, "VNP46A4");
});

test("low coverage and incomplete baselines require explicit overrides", () => {
  const kmPerDegree = haversineKm(0, 0, 1, 0);
  const years = fixture.map((year) => ({
    ...year,
    pixels: year.pixels.map((pixel, index) => ({
      ...pixel,
      lat: pixel.lat / kmPerDegree,
      quality: year.year === 2024 && index % 2 === 0 ? 1 : pixel.quality,
    })),
  }));
  assert.throws(
    () => buildBlackMarbleSnapshot({ site, years, config, retrievedAt: "2026-08-20T00:00:00Z" }),
    /coverage/i,
  );
  const overridden = buildBlackMarbleSnapshot({
    site,
    years,
    config,
    retrievedAt: "2026-08-20T00:00:00Z",
    allowLowCoverage: true,
  });
  assert.equal(overridden.coverageOverrideUsed, true);
  assert.throws(
    () => buildBlackMarbleSnapshot({ site, years: years.slice(0, 2), config, retrievedAt: "2026-08-20T00:00:00Z", allowLowCoverage: true }),
    /requires 3 complete years/i,
  );
  const incomplete = buildBlackMarbleSnapshot({
    site,
    years: years.slice(0, 2),
    config,
    retrievedAt: "2026-08-20T00:00:00Z",
    allowLowCoverage: true,
    allowIncompleteYears: true,
  });
  assert.equal(incomplete.baselineOverrideUsed, true);
});

test("haversine sampling is approximately 111.2 km per equatorial degree", () => {
  assert.ok(Math.abs(haversineKm(0, 0, 0, 1) - 111.195) < 0.01);
});
