import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { computeSky, computeSunHorizontal } from "../lib/astronomy/compute-sky.js";
import { brightStarCatalogMetadata, brightStars } from "../lib/astronomy/catalog.js";
import { altitudeLabel, buildConstellationSummaries, directionLabel } from "../lib/astronomy/constellation-summary.js";
import { constellationCopyById } from "../lib/astronomy/constellation-copy.js";
import { projectConstellations, slerp, type TransformedCatalogStar } from "../lib/astronomy/constellation-transform.js";
import { westernConstellations, westernConstellationMetadata } from "../lib/astronomy/constellations.js";
import { findNextAstronomicalNight, isAstronomicalNight, selectInitialDestinationSky } from "../lib/astronomy/next-night.js";
import { createSkyLocation, resolvePrimaryObservationSite } from "../lib/astronomy/primary-site.js";
import { classifySkyCondition, getEffectiveLimitingMagnitude } from "../lib/astronomy/visibility.js";
import { formatSkyLocalTime, shouldScheduleSkyRefresh } from "../lib/astronomy/time.js";
import type { ConstellationDefinition, SkyLocation } from "../lib/astronomy/types.js";
import { loadDestinations, loadSites } from "../lib/data/load.js";

const westhavelland: SkyLocation = { id: "westhavelland:core", destinationId: "westhavelland", destinationSlug: "westhavelland", destinationName: "Westhavelland", siteId: "westhavelland-core", siteName: "Westhavelland Core", label: "Westhavelland Core · Westhavelland", lat: 52.72, lon: 12.28, elevationM: 45, timeZone: "Europe/Berlin" };
const namib: SkyLocation = { id: "namibrand:reserve", destinationId: "namibrand", destinationSlug: "namibrand", destinationName: "NamibRand", siteId: "namibrand-reserve", siteName: "NamibRand Reserve", label: "NamibRand Reserve · NamibRand", lat: -24.95, lon: 15.89, elevationM: 1000, timeZone: "Africa/Windhoek" };

test("licensed compact catalog stays within the approved source and size contract", () => {
  assert.equal(brightStarCatalogMetadata.name, "HYG Stellar Database");
  assert.equal(brightStarCatalogMetadata.version, "4.1");
  assert.equal(brightStarCatalogMetadata.sourceCommit, "ba2dec4eb0f6768914c7fc1051258100214ddf84");
  assert.equal(brightStarCatalogMetadata.license, "CC BY-SA 4.0");
  assert.equal(brightStarCatalogMetadata.magnitudeCutoff, 6);
  assert.equal(brightStarCatalogMetadata.idSystem, "HIP");
  assert.equal(brightStars.length, 5041);
});

test("Western constellation data is pinned, licensed, resolvable, and fully curated", () => {
  assert.equal(westernConstellationMetadata.license, "CC BY-SA 4.0");
  assert.equal(westernConstellationMetadata.sourceCommit, "014fbb5e59233d133c22f9811af96b67d05a95c9");
  assert.equal(westernConstellations.length, 18);
  const starIds = new Set(brightStars.map((star) => star.id));
  for (const constellation of westernConstellations) {
    assert.ok(constellationCopyById.has(constellation.id), constellation.id);
    assert.ok(constellation.linePaths.length > 0, constellation.id);
    for (const path of constellation.linePaths) for (const starId of path.starIds) assert.ok(starIds.has(starId), `${constellation.id}:${starId}`);
  }
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
  assert.deepEqual(second.constellations, first.constellations);
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
  assert.notDeepEqual(north.constellations.map((item) => [item.id, item.centerAltitudeDeg]), south.constellations.map((item) => [item.id, item.centerAltitudeDeg]));
});

test("daylight does not produce fake catalog stars", () => {
  const snapshot = computeSky(westhavelland, "2027-06-21T12:00:00.000Z");
  assert.equal(snapshot.skyCondition, "daylight");
  assert.equal(snapshot.stars.length, 0);
  assert.equal(snapshot.constellations.length, 0);
});

test("constellation lines follow the sphere and clip at the geometric horizon", () => {
  const vector = (altitudeDeg: number, azimuthDeg: number) => {
    const altitude = altitudeDeg * Math.PI / 180;
    const azimuth = azimuthDeg * Math.PI / 180;
    return { x: Math.cos(altitude) * Math.cos(azimuth), y: -Math.cos(altitude) * Math.sin(azimuth), z: Math.sin(altitude) };
  };
  const star = (altitudeDeg: number, azimuthDeg: number): TransformedCatalogStar => ({
    horizontalVector: vector(altitudeDeg, azimuthDeg), altitudeDeg, azimuthDeg,
    projected: altitudeDeg > 0 ? { xNormalized: 0, yNormalized: 0 } : null,
    likelyVisible: altitudeDeg > 0, magnitude: 2,
  });
  const definition: ConstellationDefinition = { id: "fixture", skyCulture: "western", iauAbbreviation: "Fix", names: { de: "Test", en: "Fixture" }, linePaths: [{ starIds: [1, 2, 3], weight: "normal" }], explanationId: "fixture" };
  const result = projectConstellations([definition], new Map([[1, star(35, 350)], [2, star(20, 10)], [3, star(-15, 30)]]), -20);
  assert.equal(result.length, 1);
  assert.equal(result[0].visibilityState, "partly-visible");
  assert.ok(result[0].projectedPaths.length >= 1);
  assert.ok(result[0].projectedPaths.every((path) => path.points.every((point) => Math.hypot(point.xNormalized, point.yNormalized) <= 1 + 1e-9)));
  const midpoint = slerp(vector(20, 350), vector(20, 10), 0.5);
  assert.ok(midpoint.z > 0);
});

test("constellation summaries use deterministic priorities, compass sectors, and altitude bands", () => {
  const snapshot = computeSky(westhavelland, "2027-01-01T00:00:00.000Z");
  const first = buildConstellationSummaries(snapshot.constellations, "en");
  assert.deepEqual(buildConstellationSummaries(snapshot.constellations, "en"), first);
  assert.ok(first.length <= 3);
  assert.equal(directionLabel(0, "en"), "north");
  assert.equal(directionLabel(45, "de"), "Nordosten");
  assert.equal(directionLabel(359, "en"), "north");
  assert.equal(altitudeLabel(14.999, "en"), "near the horizon");
  assert.equal(altitudeLabel(15, "de"), "niedrig");
  assert.equal(altitudeLabel(30, "en"), "mid-sky");
  assert.equal(altitudeLabel(60.001, "de"), "hoch");
});

test("destination summaries account for every constellation line drawn over Jasper", () => {
  const destination = loadDestinations().find((item) => item.id === "jasper");
  const site = loadSites().find((item) => item.id === "jasper-medicine-lake");
  assert.ok(destination && site);
  const location = createSkyLocation(destination, site);
  assert.ok(location);
  const snapshot = computeSky(location, "2026-08-28T07:53:00.000Z");
  const summaries = buildConstellationSummaries(snapshot.constellations, "en", snapshot.constellations.length, true);
  assert.equal(summaries.length, snapshot.constellations.length);
  assert.ok(summaries.filter((item) => item.visibilityState === "recognizable").length > 3);
  assert.ok(summaries.some((item) => item.visibilityState === "partly-visible"));
});

test("astronomical computation modules contain no random selection path", () => {
  const computationModules = ["compute-sky.ts", "projection.ts", "visibility.ts"];
  for (const moduleName of computationModules) {
    const source = readFileSync(new URL(`../lib/astronomy/${moduleName}`, import.meta.url), "utf8");
    assert.doesNotMatch(source, /Math\.random|crypto\.getRandomValues/, moduleName);
  }
});

test("homepage sky remains visible below desktop widths and discloses idealized star depth", () => {
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  const component = readFileSync(new URL("../components/sky/astronomical-sky.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(css, /\.orbit\s*\{\s*display:\s*none/);
  assert.match(css, /@media \(max-width: 1050px\)[\s\S]*?\.orbit\s*\{[\s\S]*?position:\s*relative/);
  assert.match(component, /Ideal magnitude-6 star depth; local light pollution/);
  assert.match(component, /Ideale Sternsicht bis Magnitude 6; lokale Lichtverschmutzung/);
  assert.match(css, /\.destination-card\s*\{[\s\S]*?min-width:\s*0/);
  assert.match(css, /\.finder-result\s*\{[\s\S]*?contain-intrinsic-inline-size:\s*none/);
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

test("next-night preview stays near the current date and selects astronomical darkness", () => {
  const fromIso = "2026-08-25T16:50:00.000Z";
  const nextNight = findNextAstronomicalNight(westhavelland, fromIso);
  assert.ok(nextNight);
  assert.ok(Date.parse(nextNight.instantIso) > Date.parse(fromIso));
  assert.ok(Date.parse(nextNight.instantIso) - Date.parse(fromIso) < 36 * 60 * 60 * 1000);
  assert.ok(computeSunHorizontal(westhavelland, nextNight.instantIso).altitudeDeg <= -18);
});

test("next-night preview rejects an invalid starting instant", () => {
  assert.throws(() => findNextAstronomicalNight(westhavelland, "not-an-instant"), /Invalid preview start instant/);
});

test("destination pages support live darkness or the upcoming night for all 150 observation sites throughout the day", () => {
  const instants = Array.from({ length: 8 }, (_, index) => new Date(Date.parse("2026-08-25T00:00:00.000Z") + index * 3 * 60 * 60 * 1000).toISOString());
  const sites = loadSites();
  const destinations = loadDestinations().filter((destination) => destination.active);
  const destinationsById = new Map(destinations.map((destination) => [destination.id, destination]));
  assert.equal(destinations.length, 75);
  assert.equal(sites.length, 150);
  for (const site of sites) {
    const destination = destinationsById.get(site.destinationId);
    assert.ok(destination, site.slug);
    const location = createSkyLocation(destination, site);
    assert.ok(location, site.slug);
    for (const nowIso of instants) {
      const selection = selectInitialDestinationSky(location, nowIso);
      const snapshot = computeSky(location, selection.instantIso);
      assert.equal(snapshot.skyCondition, "night", `${site.slug} at ${nowIso}`);
      assert.ok(snapshot.stars.length >= 500, `${site.slug} at ${nowIso}`);
      assert.equal(selection.mode === "live-night", isAstronomicalNight(location, nowIso), `${site.slug} at ${nowIso}`);
    }
  }
});

test("destination client defaults to a useful night view, preserves fixed preview links, and keeps live mode available", () => {
  const component = readFileSync(new URL("../components/sky/destination-sky-section.tsx", import.meta.url), "utf8");
  const page = readFileSync(new URL("../app/[locale]/stargazing-destinations/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(component, /window\.addEventListener\("pageshow", restore\)/);
  assert.match(component, /setPreview\(linkedPreview\)/);
  assert.match(component, /selectInitialDestinationSky\(location, nowIso\)/);
  assert.match(component, /initialSelection\?\.mode === "night-preview"/);
  assert.match(component, /findNextAstronomicalNight\(location, nowIso\)/);
  assert.match(component, /Show next night/);
  assert.match(component, /Show live sky/);
  assert.match(page, /<DestinationSiteExplorer options=\{siteViews\}/);
  const explorer = readFileSync(new URL("../components/sky/destination-site-explorer.tsx", import.meta.url), "utf8");
  assert.match(explorer, /<DestinationSkySection key=\{selected\.location\.id\}/);
  assert.match(explorer, /selected\.monthly\.months\.map/);
});

test("destination sky exposes constellation toggle, localized summaries, and keyboard focus highlighting", () => {
  const component = readFileSync(new URL("../components/sky/astronomical-sky.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(component, /aria-pressed=\{showConstellations\}/);
  assert.match(component, /Sternbilder anzeigen/);
  assert.match(component, /What you can see/);
  assert.match(component, /onFocus=\{\(\) => setActiveConstellationId/);
  assert.match(component, /Western sky culture/);
  assert.match(component, /Moon.*the horizon.*illuminated/);
  assert.match(component, /Mond.*dem Horizont.*beleuchtet/);
  assert.match(component, /Also in the sky/);
  assert.match(component, /partly visible/);
  assert.match(css, /\.constellation-secondary-grid/);
});
