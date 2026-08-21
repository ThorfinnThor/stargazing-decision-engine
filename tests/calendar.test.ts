import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { EquatorFromVector, Horizon, Observer, RotateVector, Rotation_EQJ_EQD, Spherical, VectorFromSphere } from "astronomy-engine";
import { buildCalendarNight, rankCalendarNights } from "../lib/astronomy/calendar.js";
import type { CalendarConfig } from "../lib/astronomy/calendar.js";
import type { MilkyWayConfig } from "../lib/astronomy/milky-way.js";
import { buildMilkyWayMetrics, galacticCenterAltitudeDeg, validateMilkyWayConfig } from "../lib/astronomy/milky-way.js";
import type { CalendarFile } from "../lib/data/types.js";
import { validateCalendarFile } from "../scripts/validate/validate-calendar-files.js";

const config = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/astronomy/calendar-config.json"), "utf8")) as CalendarConfig;
const milkyWayConfig = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/astronomy/milky-way.json"), "utf8")) as MilkyWayConfig;
const islandSite = { lat: 28.27, lon: -16.64, elevationM: 2390 };

test("calendar night uses ten-minute deterministic lunar sampling and bounded scores", () => {
  const night = buildCalendarNight({ site: islandSite, dateLocal: "2027-10-03", timezone: "Atlantic/Canary", config });
  assert.equal(night.dateLocal, "2027-10-03");
  assert.ok(night.totalDarknessHours > 0 && night.totalDarknessHours < 24);
  assert.ok(night.moonlessHours >= 0 && night.moonlessHours <= night.totalDarknessHours);
  assert.ok(night.moonBelowHorizonDarkHours + night.moonAboveHorizonDarkHours <= night.totalDarknessHours + 0.01);
  assert.ok((night.moonIlluminationFraction ?? 0) >= 0 && (night.moonIlluminationFraction ?? 1) <= 1);
  assert.ok((night.moonPhaseAngleDeg ?? 0) >= 0 && (night.moonPhaseAngleDeg ?? 181) <= 180);
  assert.ok(night.calendarDarknessScore >= 0 && night.calendarDarknessScore <= 100);
  assert.ok(night.astronomicalDusk?.includes("T"));
});

test("high-latitude summer with no astronomical night produces no artificial darkness", () => {
  const night = buildCalendarNight({
    site: { lat: 69.6492, lon: 18.9553, elevationM: 0 },
    dateLocal: "2027-06-15",
    timezone: "Europe/Oslo",
    config,
  });
  assert.equal(night.totalDarknessHours, 0);
  assert.equal(night.moonlessHours, 0);
  assert.equal(night.astronomicalDusk, null);
  assert.equal(night.astronomicalDawn, null);
  assert.equal(night.calendarDarknessScore, 0);
  assert.equal(night.moonAltitudeMaxDeg, null);
});

test("local-night identity and DST offsets remain attached to the local evening date", () => {
  const night = buildCalendarNight({ site: { lat: 52.52, lon: 13.405, elevationM: 40 }, dateLocal: "2027-10-30", timezone: "Europe/Berlin", config });
  assert.equal(night.dateLocal, "2027-10-30");
  assert.ok(night.astronomicalDusk?.endsWith("+02:00"));
  assert.ok(night.astronomicalDawn?.endsWith("+01:00"));
});

test("invalid sampling configuration fails instead of silently changing semantics", () => {
  assert.throws(
    () => buildCalendarNight({ site: islandSite, dateLocal: "2027-10-03", timezone: "Atlantic/Canary", config: { ...config, sampleMinutes: 7 } }),
    /10-minute sampling/i,
  );
});

test("calendar ranking uses darkness, optional Milky Way score, then local date", () => {
  const base = buildCalendarNight({ site: islandSite, dateLocal: "2027-10-03", timezone: "Atlantic/Canary", config });
  const ranked = rankCalendarNights([
    { ...base, dateLocal: "2027-10-03", calendarDarknessScore: 80, milkyWayOpportunityScore: 20 },
    { ...base, dateLocal: "2027-10-01", calendarDarknessScore: 90, milkyWayOpportunityScore: null },
    { ...base, dateLocal: "2027-10-02", calendarDarknessScore: 80, milkyWayOpportunityScore: 30 },
  ]);
  assert.deepEqual(Object.fromEntries(ranked.map((night) => [night.dateLocal, night.darknessRank])), {
    "2027-10-03": 3,
    "2027-10-01": 1,
    "2027-10-02": 2,
  });
});

test("Milky Way opportunity is a separate Moonless overlap metric", () => {
  const night = buildCalendarNight({
    site: { lat: -23, lon: -67.75, elevationM: 2400 },
    dateLocal: "2027-07-04",
    timezone: "America/Santiago",
    config,
    milkyWayConfig,
  });
  assert.ok(night.milkyWayOpportunityScore !== null);
  assert.ok(night.milkyWayUsefulHours <= night.moonlessHours + 0.02);
  assert.ok(night.milkyWayStrongHours <= night.milkyWayUsefulHours + 0.02);
  assert.ok((night.galacticCenterAltitudeMaxDeg ?? -91) <= 90);
  assert.ok((night.galacticCenterAltitudeMaxDeg ?? -91) > 20);
});

test("Milky Way core below the horizon yields no useful overlap at high latitude", () => {
  const night = buildCalendarNight({
    site: { lat: 69.6492, lon: 18.9553, elevationM: 20 },
    dateLocal: "2027-12-21",
    timezone: "Europe/Oslo",
    config,
    milkyWayConfig,
  });
  assert.equal(night.milkyWayUsefulHours, 0);
  assert.equal(night.milkyWayStrongHours, 0);
  assert.ok((night.galacticCenterAltitudeMaxDeg ?? 1) < 0);
});

test("Milky Way metrics fail closed for no darkness and preserve monotonic utilities", () => {
  const empty = buildMilkyWayMetrics({ config: milkyWayConfig, intervals: [{ durationHours: 10, astronomicalDark: false, moonless: false, galacticCenterAltitudeDeg: 80 }] });
  assert.deepEqual(empty, { usefulHours: 0, strongHours: 0, maximumAltitudeDeg: null, opportunityScore: 0 });
  const synthetic = buildMilkyWayMetrics({ config: milkyWayConfig, intervals: [
    { durationHours: 1, astronomicalDark: true, moonless: true, galacticCenterAltitudeDeg: 25 },
    { durationHours: 1, astronomicalDark: true, moonless: true, galacticCenterAltitudeDeg: 35 },
    { durationHours: 1, astronomicalDark: true, moonless: false, galacticCenterAltitudeDeg: 80 },
  ] });
  assert.equal(synthetic.usefulHours, 2);
  assert.equal(synthetic.strongHours, 1);
  assert.equal(synthetic.maximumAltitudeDeg, 80);
  assert.equal(synthetic.opportunityScore, 79);
  assert.throws(() => buildMilkyWayMetrics({ config: milkyWayConfig, intervals: [
    { durationHours: -1, astronomicalDark: true, moonless: true, galacticCenterAltitudeDeg: 25 },
  ] }), /duration/i);
  assert.throws(() => buildMilkyWayMetrics({ config: milkyWayConfig, intervals: [
    { durationHours: 1, astronomicalDark: true, moonless: true, galacticCenterAltitudeDeg: 91 },
  ] }), /physical bounds/i);
});

test("Milky Way coordinate configuration requires provenance and J2000 bounds", () => {
  validateMilkyWayConfig(milkyWayConfig);
  assert.throws(() => validateMilkyWayConfig({ ...milkyWayConfig, raHours: 24 }), /right ascension/i);
  assert.throws(() => validateMilkyWayConfig({ ...milkyWayConfig, referenceSource: "" }), /provenance/i);
  assert.throws(() => validateMilkyWayConfig({ ...milkyWayConfig, referenceSource: "NASA paper" }), /HTTPS URL/i);
});

test("Galactic Center J2000 coordinate is precessed to equator-of-date before horizon conversion", () => {
  const date = new Date("2050-07-01T00:00:00.000Z");
  const observer = new Observer(28.27, -16.64, 2390);
  const eqj = VectorFromSphere(new Spherical(milkyWayConfig.decDeg, milkyWayConfig.raHours * 15, 1), date);
  const eqd = EquatorFromVector(RotateVector(Rotation_EQJ_EQD(date), eqj));
  const expected = Horizon(date, observer, eqd.ra, eqd.dec).altitude;
  const actual = galacticCenterAltitudeDeg(date, observer, milkyWayConfig);
  const invalidJ2000Shortcut = Horizon(date, observer, milkyWayConfig.raHours, milkyWayConfig.decDeg).altitude;
  assert.ok(Math.abs(actual - expected) < 1e-10);
  assert.ok(Math.abs(actual - invalidJ2000Shortcut) > 0.05);
});

test("committed Galactic Center decimals reproduce the cited sexagesimal J2000 coordinate", () => {
  const citedRaHours = 17 + 45 / 60 + 40.03845 / 3600;
  const citedDecDeg = -(29 + 28.0701 / 3600);
  assert.ok(Math.abs(milkyWayConfig.raHours - citedRaHours) < 1e-8);
  assert.ok(Math.abs(milkyWayConfig.decDeg - citedDecDeg) < 1e-8);
});

test("USNO primary-phase anchors produce near-new and near-full illumination", () => {
  // USNO primary phases: new Moon 2027-01-07 20:24 UTC; full Moon 2027-01-22 12:17 UTC.
  const newMoonNight = buildCalendarNight({ site: { lat: 0, lon: 0, elevationM: 0 }, dateLocal: "2027-01-07", timezone: "UTC", config });
  const fullMoonNight = buildCalendarNight({ site: { lat: 0, lon: 0, elevationM: 0 }, dateLocal: "2027-01-22", timezone: "UTC", config });
  assert.ok((newMoonNight.moonIlluminationFraction ?? 1) < 0.01);
  assert.ok((fullMoonNight.moonIlluminationFraction ?? 0) > 0.99);
  assert.ok(newMoonNight.moonlessHours > fullMoonNight.moonlessHours);
});

test("calendar validator rejects impossible lunar partitions", () => {
  const invalid = {
    destinationId: "fixture",
    siteId: "fixture-site",
    bestSiteId: "fixture-site",
    year: 2027,
    month: 10 as CalendarFile["month"],
    algorithmVersion: "astronomy-calendar-1.0.0",
    astronomyEngineVersion: "2.1.19",
    generatedAt: "2027-01-01T00:00:00.000Z",
    nights: [{
      darknessRank: 1,
      dateLocal: "2027-10-03",
      timezone: "UTC",
      astronomicalDusk: null,
      astronomicalDawn: null,
      moonIlluminationFraction: 0,
      moonPhaseAngleDeg: 0,
      moonRiseLocal: null,
      moonSetLocal: null,
      moonAltitudeMaxDeg: null,
      moonAboveHorizonDarkHours: 1,
      moonBelowHorizonDarkHours: 1,
      moonlessHours: 2,
      totalDarknessHours: 1,
      calendarDarknessScore: 50,
      milkyWayUsefulHours: 0,
      milkyWayStrongHours: 0,
      galacticCenterAltitudeMaxDeg: null,
      milkyWayOpportunityScore: null,
    }],
  };
  assert.ok(validateCalendarFile(invalid).some((error) => /exceed|partition/i.test(error)));
});
