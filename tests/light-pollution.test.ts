import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { brightStars } from "../lib/astronomy/catalog";
import {
  computeSkyComparison, darkestSky, defaultReferenceCity, findReferenceCity, referenceCities, referenceCityLocation,
  selectComparisonInstant, skySituations,
} from "../lib/astronomy/light-pollution";
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
    const counts = skySituations.map((situation) => computeSkyComparison({ city, situation, instantIso, stars }));
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
