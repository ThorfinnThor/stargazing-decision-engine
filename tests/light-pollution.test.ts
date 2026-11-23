import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { brightStars } from "../lib/astronomy/catalog";
import {
  bortleForLimitingMagnitude, computeSkyComparison, darkestSky, defaultReferenceCity, findReferenceCity, limitingMagnitudeForExposure,
  parseCitySkyRows, referenceCities, referenceCityLocation, selectComparisonInstant, skyglowForLimitingMagnitude, skySituations,
} from "../lib/astronomy/light-pollution";
import { buildCitySky, resolveExposureCurve, type CitySkyBrightnessConfig } from "../scripts/astronomy/build-city-sky";
import { searchCities } from "../components/sky/city-search";
import { computeSunHorizontal } from "../lib/astronomy/compute-sky";
import type { FaintStarCatalog } from "../lib/astronomy/types";

const faintFile = JSON.parse(readFileSync("public/data/stargazing/astronomy/faint-stars.json", "utf8")) as FaintStarCatalog;
const stars = [...brightStars, ...faintFile.stars.map(([id, xEqj, yEqj, zEqj, magnitude, colorIndex]) => ({ id, xEqj, yEqj, zEqj, magnitude, colorIndex }))];

test("faint star file extends the main catalogue without overlap", () => {
  const brightIds = new Set(brightStars.map((star) => star.id));
  assert.equal(faintFile.stars.length, 3829);
  assert.ok(faintFile.stars.every((star) => star[4] > 6 && star[4] <= 6.5 && !brightIds.has(star[0])));
});

test("situations get darker in order and stay below the darkest sky", () => {
  const magnitudes = skySituations.map((situation) => situation.limitingMagnitude);
  assert.deepEqual([...magnitudes].sort((a, b) => a - b), magnitudes);
  assert.ok(magnitudes.every((value) => value < darkestSky.limitingMagnitude));
});

test("comparison is drawn at night and counts fewer stars for brighter skies", () => {
  for (const cityId of ["berlin", "new-york", "sydney"]) {
    const city = findReferenceCity(cityId)!;
    const { instantIso, live } = selectComparisonInstant(referenceCityLocation(city, 6), "2026-11-17T12:00:00.000Z");
    assert.ok(computeSunHorizontal(referenceCityLocation(city, 6), instantIso).altitudeDeg < -18, `${cityId} at ${instantIso}`);
    if (live) assert.equal(instantIso, "2026-11-17T12:00:00.000Z");
    const counts = skySituations.map((situation) => computeSkyComparison({ city, limitingMagnitude: situation.limitingMagnitude, instantIso, stars }));
    for (let index = 1; index < counts.length; index += 1) assert.ok(counts[index].yours.visibleStars > counts[index - 1].yours.visibleStars);
    for (const result of counts) {
      assert.ok(result.darkest.visibleStars > result.yours.visibleStars);
      assert.ok(result.visibleShare > 0 && result.visibleShare < 1);
    }
    assert.ok(counts[0].darkest.visibleStars > 4000, `${cityId} darkest sky shows ${counts[0].darkest.visibleStars} stars`);
    assert.ok(counts[0].yours.visibleStars < 400, `${cityId} city centre shows ${counts[0].yours.visibleStars} stars`);
  }
});

test("default city follows the reader's time zone and falls back by language", () => {
  assert.equal(defaultReferenceCity("en", "Europe/Vienna").id, "vienna");
  assert.equal(defaultReferenceCity("de", "Asia/Kolkata").id, "berlin");
  assert.equal(defaultReferenceCity("en", null).id, "new-york");
  assert.equal(new Set(referenceCities.map((city) => city.id)).size, referenceCities.length);
});

const darkness = JSON.parse(readFileSync("data-config/scoring/darkness.json", "utf8"));
const brightnessConfig = JSON.parse(readFileSync("data-config/astronomy/city-sky-brightness.json", "utf8")) as CitySkyBrightnessConfig;
const curve = resolveExposureCurve(brightnessConfig, darkness);

test("situations sit on the estimate's glow and Bortle scale", () => {
  for (const situation of skySituations) {
    assert.equal(skyglowForLimitingMagnitude(situation.limitingMagnitude), situation.skyglow);
    assert.equal(bortleForLimitingMagnitude(situation.limitingMagnitude), situation.bortle);
  }
  assert.equal(bortleForLimitingMagnitude(darkestSky.limitingMagnitude), darkestSky.bortle);
});

test("exposure curve is anchored on the reviewed calibration and clamps at both ends", () => {
  assert.equal(curve.length, brightnessConfig.curve.length);
  assert.equal(limitingMagnitudeForExposure(0, curve), 6.5);
  assert.equal(limitingMagnitudeForExposure(50, curve), 4);
  assert.throws(() => limitingMagnitudeForExposure(-1, curve));
  assert.throws(() => limitingMagnitudeForExposure(1, [curve[1], curve[0]]));
});

test("every reviewed metropolitan centre lands in Bortle 7 to 9 and dark references stay dark", () => {
  const anchors = JSON.parse(readFileSync("data-config/calibration/darkness-anchors.json", "utf8")).anchors as { id: string; class: string }[];
  for (const anchor of anchors) {
    const snapshot = JSON.parse(readFileSync(`data-snapshots/black-marble/anchors/${anchor.id}.json`, "utf8")) as { alanExposure: number };
    const magnitude = limitingMagnitudeForExposure(snapshot.alanExposure, curve);
    if (anchor.class === "urban_control") assert.ok(magnitude <= 5.0 && magnitude >= 4.0, `${anchor.id}: ${magnitude}`);
    if (anchor.class === "dark_reference") assert.ok(magnitude >= 6.0, `${anchor.id}: ${magnitude}`);
  }
  const berlin = JSON.parse(readFileSync("data-snapshots/black-marble/anchors/berlin.json", "utf8")).alanExposure as number;
  const newYork = JSON.parse(readFileSync("data-snapshots/black-marble/anchors/new-york.json", "utf8")).alanExposure as number;
  assert.ok(limitingMagnitudeForExposure(berlin, curve) > limitingMagnitudeForExposure(newYork, curve));
});

// Crumey (2014), eq. 53, with the field factor that puts the 6.5 catalogue floor at a natural
// dark sky (21.83 mag/arcsec²). Other published conversions differ by a few tenths.
function crumeyLimitingMagnitude(zenithMag: number) {
  const luminance = 10.8e4 * 10 ** (-0.4 * zenithMag);
  const illuminance = 1.486 * (6.505e-4 * luminance ** 0.25 - 8.461e-4 * luminance ** 0.5) ** 2;
  return -2.5 * Math.log10(illuminance / 2.54e-6);
}

test("the estimate follows published clear-sky measurements at 65 stations", () => {
  const sites = JSON.parse(readFileSync("data-config/astronomy/sky-calibration-sites.json", "utf8")).sites as { id: string; year: number; zenithMag: number }[];
  const measured = JSON.parse(readFileSync("data-snapshots/black-marble/cities/calibration-sites.json", "utf8")).sites as { id: string; year: number; coverage: number; alanExposure: number }[];
  const byId = new Map(measured.map((item) => [item.id, item]));
  const points = sites.map((site) => {
    const item = byId.get(site.id)!;
    assert.equal(item.year, site.year, site.id);
    assert.ok(item.coverage >= brightnessConfig.minimumCoverage, site.id);
    return { exposure: item.alanExposure, zenithMag: site.zenithMag, estimate: limitingMagnitudeForExposure(item.alanExposure, curve) };
  });
  assert.equal(points.length, 65);
  const pairs = points.flatMap((a, index) => points.slice(index + 1).map((b) => ({ a, b }))).filter(({ a, b }) => Math.abs(a.zenithMag - b.zenithMag) > 0.5);
  const agreeing = pairs.filter(({ a, b }) => (a.zenithMag > b.zenithMag) === (a.exposure < b.exposure)).length;
  assert.ok(agreeing / pairs.length > 0.9, `only ${agreeing} of ${pairs.length} clearly different pairs are in the measured order`);
  const towns = points.filter((point) => point.exposure >= 0.5 && point.exposure < 2.5);
  const offset = towns.reduce((sum, point) => sum + point.estimate - crumeyLimitingMagnitude(point.zenithMag), 0) / towns.length;
  assert.ok(Math.abs(offset) < 0.25, `town estimate is ${offset.toFixed(2)} mag off`);
});

test("city sky build drops cities without a reliable measurement and keeps compact rows", () => {
  const cities = {
    version: 1 as const,
    source: { cities: { name: "GeoNames", url: "u", license: "CC BY 4.0" }, labels: { name: "Wikidata", url: "u", license: "CC0 1.0" } },
    cities: [
      { id: "munich", geonameId: 1, name: { en: "Munich", de: "München" }, country: "DE", lat: 48.1, lon: 11.6, timeZone: "Europe/Berlin", population: 1 },
      { id: "hamburg", geonameId: 2, name: { en: "Hamburg", de: "Hamburg" }, country: "DE", lat: 53.6, lon: 10, timeZone: "Europe/Berlin", population: 1 },
      { id: "nowhere", geonameId: 3, name: { en: "Nowhere", de: "Nowhere" }, country: "DE", lat: 50, lon: 10, timeZone: "Europe/Berlin", population: 1 },
    ],
  };
  const measurements = { version: 1 as const, source: "VNP46A4", collectionVersion: "2", radianceLayer: "x", year: 2025, cities: [
    { id: "munich", coverage: 1, alanExposure: 3.2 },
    { id: "hamburg", coverage: 0.4, alanExposure: 3.0 },
  ] };
  const { file, skipped } = buildCitySky({ cities, measurements, config: brightnessConfig, darkness });
  assert.deepEqual(skipped, ["hamburg", "nowhere"]);
  assert.equal(file.cities.length, 1);
  const [munich] = parseCitySkyRows(file.cities);
  assert.equal(munich.name.de, "München");
  assert.ok(munich.limitingMagnitude >= 4 && munich.limitingMagnitude <= 5);
  assert.equal(file.source.blackMarble.year, 2025);
});

test("city search ignores accents and ranks name starts and bigger cities first", () => {
  const cities = parseCitySkyRows([
    ["sao-paulo", "São Paulo", "", "BR", -23.5, -46.6, "America/Sao_Paulo", 4],
    ["munich", "Munich", "München", "DE", 48.1, 11.6, "Europe/Berlin", 4.6],
    ["new-munster", "Neumünster", "", "DE", 54.1, 10, "Europe/Berlin", 5.5],
    ["dusseldorf", "Düsseldorf", "", "DE", 51.2, 6.8, "Europe/Berlin", 4.7],
  ]);
  assert.deepEqual(searchCities(cities, "sao").map((city) => city.id), ["sao-paulo"]);
  assert.deepEqual(searchCities(cities, "mün").map((city) => city.id), ["munich", "new-munster"]);
  assert.deepEqual(searchCities(cities, "dusseld").map((city) => city.id), ["dusseldorf"]);
  assert.deepEqual(searchCities(cities, "  "), []);
});
