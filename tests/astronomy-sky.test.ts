import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { computeSky } from "../lib/astronomy/compute-sky.js";
import { brightStarCatalogMetadata, brightStars } from "../lib/astronomy/catalog.js";
import { classifySkyCondition, getEffectiveLimitingMagnitude } from "../lib/astronomy/visibility.js";
import { formatSkyLocalTime, shouldScheduleSkyRefresh } from "../lib/astronomy/time.js";
import type { SkyLocation } from "../lib/astronomy/types.js";

const westhavelland: SkyLocation = { id: "westhavelland:core", destinationId: "westhavelland", destinationSlug: "westhavelland", destinationName: "Westhavelland", siteId: "westhavelland-core", siteName: "Westhavelland Core", label: "Westhavelland Core · Westhavelland", lat: 52.72, lon: 12.28, elevationM: 45, timeZone: "Europe/Berlin" };
const namib: SkyLocation = { id: "namibrand:reserve", destinationId: "namibrand", destinationSlug: "namibrand", destinationName: "NamibRand", siteId: "namibrand-reserve", siteName: "NamibRand Reserve", label: "NamibRand Reserve · NamibRand", lat: -24.95, lon: 15.89, elevationM: 1000, timeZone: "Africa/Windhoek" };

test("licensed compact catalog stays within the approved source and size contract", () => {
  assert.equal(brightStarCatalogMetadata.name, "HYG Stellar Database");
  assert.equal(brightStarCatalogMetadata.version, "4.1");
  assert.equal(brightStarCatalogMetadata.sourceCommit, "ba2dec4eb0f6768914c7fc1051258100214ddf84");
  assert.equal(brightStarCatalogMetadata.license, "CC BY-SA 4.0");
  assert.equal(brightStarCatalogMetadata.magnitudeCutoff, 6);
  assert.equal(brightStars.length, 5070);
});

test("twilight limiting magnitude is bounded and monotonic as the Sun descends", () => {
  const altitudes = [2, -6, -9, -12, -15, -18, -24];
  const limits = altitudes.map((sunAltitudeDeg) => getEffectiveLimitingMagnitude({ baseLimitingMagnitude: 6, sunAltitudeDeg }));
  for (let index = 1; index < limits.length; index += 1) assert.ok(limits[index] >= limits[index - 1]);
  assert.deepEqual(altitudes.map(classifySkyCondition), ["daylight", "civil-twilight", "nautical-twilight", "nautical-twilight", "astronomical-twilight", "astronomical-twilight", "night"]);
});

test("same location and fixed instant produce deterministic finite sky snapshots", () => {
  const first = computeSky(westhavelland, "2027-01-01T00:00:00.000Z");
  const second = computeSky(westhavelland, "2027-01-01T00:00:00.000Z");
  assert.deepEqual(second, first);
  assert.ok(first.stars.length > 500);
  assert.ok(first.stars.every((star) => Number.isFinite(star.altitudeDeg) && Number.isFinite(star.azimuthDeg)));
  assert.ok(Number.isFinite(first.moon.phaseDeg));
});

test("same UTC instant at northern and southern sites yields different local skies", () => {
  const north = computeSky(westhavelland, "2027-01-01T00:00:00.000Z");
  const south = computeSky(namib, "2027-01-01T00:00:00.000Z");
  assert.notEqual(north.sun.altitudeDeg, south.sun.altitudeDeg);
  const southernById = new Map(south.stars.map((star) => [star.id, star]));
  const altitudeDifferences = north.stars.flatMap((star) => {
    const southern = southernById.get(star.id);
    return southern ? [Math.abs(star.altitudeDeg - southern.altitudeDeg)] : [];
  });
  assert.ok(altitudeDifferences.length > 0);
  assert.ok(Math.max(...altitudeDifferences) > 10);
});

test("daylight does not produce fake catalog stars", () => {
  const snapshot = computeSky(westhavelland, "2027-06-21T12:00:00.000Z");
  assert.equal(snapshot.skyCondition, "daylight");
  assert.equal(snapshot.stars.length, 0);
});

test("astronomical computation modules contain no random selection path", () => {
  const computationModules = ["compute-sky.ts", "projection.ts", "visibility.ts"];
  for (const moduleName of computationModules) {
    const source = readFileSync(new URL(`../lib/astronomy/${moduleName}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /Math\.random|crypto\.getRandomValues/, moduleName);
  }
});

test("local labels use destination timezone, including DST, and fixed previews do not schedule refresh", () => {
  const winter = formatSkyLocalTime("en", "Europe/Berlin", "2027-01-01T00:00:00.000Z");
  const summer = formatSkyLocalTime("en", "Europe/Berlin", "2027-07-01T00:00:00.000Z");
  const auckland = formatSkyLocalTime("en", "Pacific/Auckland", "2027-01-01T00:00:00.000Z");
  assert.match(winter, /1:00/);
  assert.match(summer, /2:00/);
  assert.notEqual(winter, auckland);
  assert.equal(shouldScheduleSkyRefresh("live-night"), true);
  assert.equal(shouldScheduleSkyRefresh("night-preview"), false);
  assert.throws(() => formatSkyLocalTime("en", "Invalid/Timezone", "2027-01-01T00:00:00.000Z"));
});
