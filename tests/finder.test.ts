import assert from "node:assert/strict";
import test from "node:test";

import type { FinderDestination, FinderMonth, MonthNumber, PublicAccess } from "../lib/data/types.js";
import { analyzeDestinations, findDestinations, type FinderPreferences } from "../lib/finder/finder.js";

function month(month: MonthNumber, options: Partial<FinderMonth> = {}): FinderMonth {
  return {
    month,
    stargazingTrip: 80,
    skyQuality: 80,
    tripComfort: 80,
    clearSkyScore: 80,
    darknessScore: 80,
    temperatureComfortScore: 80,
    nightTempMeanC: 14,
    dewRiskProbability: 0.1,
    confidenceScore: 90,
    confidenceLevel: "high",
    ...options,
  };
}

function destination(id: string, publicAccess: PublicAccess, continent = "europe", monthly = [month(1), month(2)]): FinderDestination {
  return { id, slug: id, name: id, countryCode: "DE", countryName: "Germany", continent, tags: [], bestSiteId: `${id}-site`, bestSiteName: `${id} site`, publicAccess, monthly };
}

const defaults: FinderPreferences = { month: "all", region: "all", temperature: "any", priority: "balanced", access: "reviewed" };

test("finder excludes closed and unknown sites and keeps reviewed booking-only access explicit", () => {
  const results = findDestinations([
    destination("public", "yes"),
    destination("limited", "limited"),
    destination("unknown", "unknown"),
    destination("closed", "no"),
  ], defaults);
  assert.deepEqual(results.map((result) => result.destination.id), ["limited", "public"]);
  assert.deepEqual(findDestinations([destination("public", "yes"), destination("limited", "limited")], { ...defaults, access: "public" }).map((result) => result.destination.id), ["public"]);
});

test("finder applies region and month filters without changing the published trip score", () => {
  const europe = destination("europe", "yes", "europe", [month(1, { stargazingTrip: 95 }), month(2, { stargazingTrip: 40 })]);
  const asia = destination("asia", "yes", "asia", [month(1, { stargazingTrip: 70 }), month(2, { stargazingTrip: 99 })]);
  const results = findDestinations([europe, asia], { ...defaults, month: 2, region: "europe" });
  assert.equal(results.length, 1);
  assert.equal(results[0].destination.id, "europe");
  assert.equal(results[0].month.stargazingTrip, 40);
  assert.equal(europe.monthly[1].stargazingTrip, 40);
});

test("temperature preference changes match order while confidence remains part of the score", () => {
  const cold = destination("cold", "yes", "europe", [month(1, { nightTempMeanC: 0, confidenceScore: 90 })]);
  const warm = destination("warm", "yes", "europe", [month(1, { nightTempMeanC: 21, confidenceScore: 90 })]);
  assert.equal(findDestinations([warm, cold], { ...defaults, temperature: "cold" })[0].destination.id, "cold");
  assert.equal(findDestinations([warm, cold], { ...defaults, temperature: "warm" })[0].destination.id, "warm");
});

test("low-confidence months cannot enter finder recommendations", () => {
  const low = destination("low", "yes", "europe", [month(1, { confidenceLevel: "low", confidenceScore: 40 })]);
  const analysis = analyzeDestinations([low], defaults);
  assert.deepEqual(analysis.matches, []);
  assert.deepEqual(analysis.exclusions, { lowConfidence: 1, noData: 0, noUsableWindow: 0 });
});

test("months without a usable stargazing window cannot be rescued by a component priority", () => {
  const polarSummer = destination("polar-summer", "yes", "europe", [month(7, {
    stargazingTrip: 0,
    skyQuality: 0,
    tripComfort: 0,
    darknessScore: 90,
    confidenceLevel: "high",
  })]);
  assert.deepEqual(findDestinations([polarSummer], { ...defaults, month: 7, priority: "darkness" }), []);
  assert.deepEqual(analyzeDestinations([polarSummer], { ...defaults, month: 7, priority: "darkness" }).exclusions, {
    lowConfidence: 0,
    noData: 0,
    noUsableWindow: 1,
  });
});

test("finder distinguishes missing month data from confidence and observing-window exclusions", () => {
  const januaryOnly = destination("january", "yes", "europe", [month(1)]);
  assert.deepEqual(analyzeDestinations([januaryOnly], { ...defaults, month: 2 }).exclusions, {
    lowConfidence: 0,
    noData: 1,
    noUsableWindow: 0,
  });
});
