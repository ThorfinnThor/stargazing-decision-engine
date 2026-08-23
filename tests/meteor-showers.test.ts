import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { CalendarConfig } from "../lib/astronomy/calendar.js";
import {
  buildMeteorShowerEvents,
  localPeakNightDate,
  validateMeteorShowerConfig,
  validateMeteorShowerScoringConfig,
  type MeteorShowerConfig,
  type MeteorShowerScoringConfig,
} from "../lib/astronomy/meteor-showers.js";
import type { Destination, MonthlySiteScore, ObservationSite } from "../lib/data/types.js";
import { isTravelEligibleSite } from "../lib/access/travel.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const config = read<MeteorShowerConfig>("data-config/astronomy/meteor-showers/2027.json");
const scoringConfig = read<MeteorShowerScoringConfig>("data-config/astronomy/meteor-scoring.json");
const calendarConfig = read<CalendarConfig>("data-config/astronomy/calendar-config.json");
const destinations = read<Destination[]>("data-config/sources/destinations.json");
const sites = read<ObservationSite[]>("data-config/sources/observation-sites.json");

function scoresForSites() {
  return sites.flatMap((site) => Array.from({ length: 12 }, (_, index) => ({
    siteId: site.id,
    month: (index + 1) as MonthlySiteScore["month"],
    skyQuality: 72,
    tripComfort: 70,
    stargazingTrip: 71,
    clearSkyScore: 72,
    darknessScore: 70,
    dewScore: 68,
    elevationScore: 65,
    temperatureComfortScore: 70,
    windComfortScore: 70,
    rainComfortScore: 70,
    accessScore: site.accessScore,
    confidenceScore: 35,
    confidenceLevel: "low",
    reasons: ["Synthetic test score"],
    caveats: ["Synthetic test input"],
  } satisfies MonthlySiteScore)));
}

test("2027 IMO meteor config validates without inventing date-only peak hours", () => {
  validateMeteorShowerConfig(config);
  validateMeteorShowerScoringConfig(scoringConfig);
  const dateOnly = config.showers.find((shower) => shower.slug === "southern-delta-aquariids");
  assert.ok(dateOnly);
  assert.equal(dateOnly.peakUtc, null);
  assert.equal(dateOnly.peakDate, "2027-07-31");
  assert.equal(config.showers.find((shower) => shower.slug === "perseids")?.peakUtc, null);
  assert.equal(config.radiantFrame, "J2000");
});

test("meteor events combine climate, Moon, and radiant components into bounded static scores", () => {
  const events = buildMeteorShowerEvents({ config, scoringConfig, calendarConfig, destinations, sites, scores: scoresForSites() });
  assert.equal(events.length, 11);
  for (const event of events) {
    assert.ok(event.topSites.length > 0);
    assert.ok(event.topDestinations.length > 0);
    assert.ok(event.viewingScore !== null && event.viewingScore >= 0 && event.viewingScore <= 100);
    assert.equal(event.indexable, false);
    assert.equal(event.confidenceLevel, "low");
    assert.ok(event.caveats.some((caveat) => /not a forecast/i.test(caveat)));
    assert.ok(event.caveats.some((caveat) => /verified public night access/i.test(caveat)));
    for (const row of [...event.topSites, ...event.topDestinations]) {
      const site = sites.find((candidate) => candidate.id === row.siteId);
      assert.ok(site);
      assert.notEqual(site.publicAccess, "no");
      assert.notEqual(site.publicAccess, "unknown");
      if (site.publicAccess === "limited") assert.ok(site.notesSourceUrl);
    }
    const expected = 0.5 * (event.climateScore ?? 0) + 0.3 * (event.moonScore ?? 0) + 0.2 * (event.radiantScore ?? 0);
    assert.ok(Math.abs(expected - (event.viewingScore ?? 0)) < 1);
  }
});

test("exact UTC peaks map to the noon-to-noon local observing night", () => {
  const quadrantids = config.showers.find((shower) => shower.slug === "quadrantids");
  assert.ok(quadrantids);
  assert.equal(localPeakNightDate(quadrantids, "Europe/Berlin"), "2027-01-03");
  assert.equal(localPeakNightDate(quadrantids, "America/Chicago"), "2027-01-03");
  assert.equal(localPeakNightDate(quadrantids, "Pacific/Auckland"), "2027-01-04");
});

test("meteor radiant and Moon metrics preserve local observing-night identity", () => {
  const event = buildMeteorShowerEvents({ config, scoringConfig, calendarConfig, destinations, sites, scores: scoresForSites() }).find((item) => item.slug === "eta-aquariids");
  assert.ok(event);
  assert.equal(event.peakDate, "2027-05-06");
  assert.ok(event.moonConditions.dateLocal);
  assert.ok(event.moonConditions.moonlessHours !== null && event.moonConditions.moonlessHours <= (event.moonConditions.totalDarknessHours ?? 0) + 0.02);
  assert.ok(event.topSites[0].radiantConditions.darkRadiantHours >= 0);
});

test("destination ranking retains the best site when a destination has multiple sites", () => {
  const original = sites.find(isTravelEligibleSite);
  assert.ok(original);
  const lowerQualitySite: ObservationSite = { ...original, id: `${original.id}-lower`, slug: `${original.slug}-lower`, name: `${original.name} lower` };
  const scores = scoresForSites().map((score) => score.siteId === original.id ? { ...score, skyQuality: 95 } : score);
  scores.push(...Array.from({ length: 12 }, (_, index) => ({
    ...scores.find((score) => score.siteId === original.id && score.month === index + 1)!,
    siteId: lowerQualitySite.id,
    skyQuality: 1,
  })));
  const event = buildMeteorShowerEvents({
    config,
    scoringConfig,
    calendarConfig,
    destinations,
    sites: [...sites, lowerQualitySite],
    scores,
  })[0];
  const destinationRow = event.topDestinations.find((item) => item.destinationId === original.destinationId);
  assert.ok(destinationRow);
  assert.equal(destinationRow.siteId, original.id);
});

test("meteor config rejects a peak timestamp that disagrees with its cited date", () => {
  assert.throws(() => validateMeteorShowerConfig({
    ...config,
    showers: [{ ...config.showers[0], peakUtc: "2027-01-05T03:25:00Z" }],
  }), /peak UTC/i);
});
