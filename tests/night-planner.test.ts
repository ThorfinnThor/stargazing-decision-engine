import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { buildCalendarNight } from "../lib/astronomy/calendar.js";
import {
  buildNightPlan,
  calculateAstronomicalScore,
  nightPlannerConfig,
  resolveTonightNightDate,
  shouldRefreshLiveNightPlan,
  validateNightPlannerConfig,
} from "../lib/astronomy/night-planner.js";
import { formatLocalClockTime, hasTimeZoneOffsetTransition } from "../lib/astronomy/time.js";
import type { SkyLocation } from "../lib/astronomy/types.js";

const calendarConfig = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/astronomy/calendar-config.json"), "utf8"));

const westhavelland: SkyLocation = {
  id: "westhavelland:core",
  destinationId: "westhavelland",
  destinationSlug: "westhavelland",
  destinationName: "Westhavelland",
  siteId: "westhavelland-core",
  siteName: "Westhavelland Core",
  label: "Westhavelland Core · Westhavelland",
  lat: 52.72,
  lon: 12.28,
  elevationM: 45,
  timeZone: "Europe/Berlin",
};

const tromsø: SkyLocation = {
  ...westhavelland,
  id: "tromso:site",
  destinationId: "tromso",
  destinationSlug: "tromso",
  destinationName: "Tromsø",
  siteId: "tromso-site",
  lat: 69.6492,
  lon: 18.9553,
  timeZone: "Europe/Oslo",
};

test("night planner configuration follows the fixed V1 contract", () => {
  assert.equal(validateNightPlannerConfig(nightPlannerConfig), true);
  assert.throws(() => validateNightPlannerConfig({ ...nightPlannerConfig, sampleMinutes: 5 } as never), /10-minute/i);
  assert.throws(() => validateNightPlannerConfig({ ...nightPlannerConfig, qualityBands: { excellent: 80, good: 90, fair: 50 } } as never), /strictly descending/i);
});

test("astronomical score is null outside darkness and monotonic for Moon light", () => {
  assert.equal(calculateAstronomicalScore({ astronomicalDark: false, moonAltitudeDeg: 50, moonIlluminationFraction: 1 }), null);
  assert.equal(calculateAstronomicalScore({ astronomicalDark: true, moonAltitudeDeg: -1, moonIlluminationFraction: 1 }), 100);
  const low = calculateAstronomicalScore({ astronomicalDark: true, moonAltitudeDeg: 10, moonIlluminationFraction: 1 });
  const high = calculateAstronomicalScore({ astronomicalDark: true, moonAltitudeDeg: 45, moonIlluminationFraction: 1 });
  assert.ok(low !== null && high !== null && low > high);
  assert.ok((calculateAstronomicalScore({ astronomicalDark: true, moonAltitudeDeg: 45, moonIlluminationFraction: 0 }) ?? -1) >= 99);
});

test("night-date resolution chooses the running night before dawn and the coming night during the day", () => {
  assert.equal(resolveTonightNightDate({ location: westhavelland, nowIso: "2027-01-01T00:30:00.000Z" }), "2026-12-31");
  assert.equal(resolveTonightNightDate({ location: westhavelland, nowIso: "2027-01-01T09:00:00.000Z" }), "2027-01-01");
  assert.equal(resolveTonightNightDate({ location: westhavelland, nowIso: "2027-01-01T19:00:00.000Z" }), "2027-01-01");
});

test("night preview produces one synchronized plan with events, samples, scores and bounded timeline", () => {
  const plan = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-01-01T00:30:00.000Z" });
  assert.equal(plan.mode, "night-preview");
  assert.equal(plan.status, "ready");
  assert.equal(plan.locationId, westhavelland.id);
  assert.ok(plan.samples.length >= 140 && plan.samples.length <= 150);
  assert.ok(plan.events.some((event) => event.kind === "astronomical-dusk"));
  assert.ok(plan.events.some((event) => event.kind === "astronomical-dawn"));
  assert.ok(plan.displayedRecommendation);
  assert.deepEqual(plan.displayedRecommendation, plan.fullNightRecommendation);
  assert.ok(plan.timelineSegments.every((segment) => segment.startRatio >= 0 && segment.endRatio <= 1 && segment.startRatio <= segment.endRatio));
  assert.ok(plan.timelineSegments.some((segment) => segment.kind === "recommended"));
  assert.ok(plan.astronomicalDarkMinutes > 0);
});

test("live plan keeps the full recommendation before its window and labels a later remaining window", () => {
  const preview = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-01-01T00:30:00.000Z" });
  assert.ok(preview.fullNightRecommendation);
  const before = buildNightPlan({ location: westhavelland, mode: "live-night", instantIso: "2027-01-01T00:30:00.000Z", nowIso: "2026-12-31T16:00:00.000Z" });
  assert.equal(before.status, "ready");
  assert.equal(before.displayedRecommendation?.isRemainingNightRecommendation, false);
  const after = buildNightPlan({ location: westhavelland, mode: "live-night", instantIso: "2027-01-01T04:00:00.000Z", nowIso: "2027-01-01T04:00:00.000Z" });
  assert.equal(after.status, "ready");
  assert.equal(after.displayedRecommendation?.isRemainingNightRecommendation, true);
  assert.ok(after.displayedRecommendation?.reasonCodes.includes("best-remaining-window"));
});

test("live plan finishes at astronomical dawn rather than retaining a past recommendation until sunrise", () => {
  const afterDawn = buildNightPlan({ location: westhavelland, mode: "live-night", instantIso: "2027-01-01T06:00:00.000Z", nowIso: "2027-01-01T06:00:00.000Z" });
  assert.equal(afterDawn.status, "night-finished");
  assert.equal(afterDawn.displayedRecommendation, null);
  assert.ok(afterDawn.timelineSegments.every((segment) => segment.kind !== "recommended"));
});

test("live-plan refresh predicate advances only at recommendation and night boundaries", () => {
  const before = buildNightPlan({ location: westhavelland, mode: "live-night", instantIso: "2026-12-31T16:00:00.000Z", nowIso: "2026-12-31T16:00:00.000Z" });
  assert.equal(shouldRefreshLiveNightPlan({ plan: before, location: westhavelland, nowIso: "2026-12-31T16:01:00.000Z" }), false);
  assert.equal(shouldRefreshLiveNightPlan({ plan: before, location: westhavelland, nowIso: "2027-01-01T04:00:00.000Z" }), true);
  const remaining = buildNightPlan({ location: westhavelland, mode: "live-night", instantIso: "2027-01-01T04:00:00.000Z", nowIso: "2027-01-01T04:00:00.000Z" });
  assert.equal(shouldRefreshLiveNightPlan({ plan: remaining, location: westhavelland, nowIso: "2027-01-01T04:01:00.000Z" }), false);
});

test("polar summer returns no astronomical night without inventing a dark recommendation", () => {
  const plan = buildNightPlan({ location: tromsø, mode: "night-preview", instantIso: "2027-06-15T11:00:00.000Z" });
  assert.equal(plan.status, "no-astronomical-night");
  assert.equal(plan.fullNightRecommendation, null);
  assert.equal(plan.displayedRecommendation, null);
  assert.equal(plan.astronomicalDarkMinutes, 0);
  assert.equal(plan.polarNight, false);
  assert.ok(plan.timelineSegments.every((segment) => segment.kind !== "recommended"));
});

test("polar winter is explicitly classified when darkness exists without sunset or sunrise", () => {
  const plan = buildNightPlan({ location: tromsø, mode: "night-preview", instantIso: "2027-01-01T12:00:00.000Z" });
  assert.equal(plan.status, "ready");
  assert.equal(plan.polarNight, true);
  assert.ok(plan.astronomicalDarkMinutes > 0);
  assert.ok(plan.events.every((event) => event.kind !== "sunset" && event.kind !== "sunrise"));
});

test("site and hemisphere changes produce different event timing and plans", () => {
  const south = { ...westhavelland, id: "namib:site", siteId: "namib-site", lat: -24.95, lon: 15.89, timeZone: "Africa/Windhoek" };
  const north = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-07-01T00:00:00.000Z" });
  const southern = buildNightPlan({ location: south, mode: "night-preview", instantIso: "2027-07-01T00:00:00.000Z" });
  assert.notEqual(north.timeZone, southern.timeZone);
  assert.notDeepEqual(north.events, southern.events);
  assert.notEqual(north.displayedRecommendation?.startIso, southern.displayedRecommendation?.startIso);
});

test("DST nights retain local-date identity and allow 23/25-hour sample counts", () => {
  const spring = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-03-28T00:00:00.000Z" });
  const autumn = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-10-31T00:00:00.000Z" });
  assert.equal(spring.nightDateLocal, "2027-03-27");
  assert.equal(autumn.nightDateLocal, "2027-10-30");
  assert.equal(spring.samples.length, 138);
  assert.equal(autumn.samples.length, 150);
  assert.notEqual(spring.calculationStartIso, autumn.calculationStartIso);
});

test("DST fallback clock times include distinct UTC offsets when local times repeat", () => {
  const firstLocal0230 = "2027-10-31T00:30:00.000Z";
  const secondLocal0230 = "2027-10-31T01:30:00.000Z";
  assert.equal(hasTimeZoneOffsetTransition("Europe/Berlin", "2027-10-30T18:00:00.000Z", "2027-10-31T06:00:00.000Z"), true);
  const firstLabel = formatLocalClockTime("de", "Europe/Berlin", firstLocal0230, true);
  const secondLabel = formatLocalClockTime("de", "Europe/Berlin", secondLocal0230, true);
  assert.match(firstLabel, /^02:30/);
  assert.match(secondLabel, /^02:30/);
  assert.notEqual(firstLabel, secondLabel);
});

test("night planner dark-minute totals cross-check existing calendar sampling within one interval", () => {
  const plan = buildNightPlan({ location: westhavelland, mode: "night-preview", instantIso: "2027-01-01T00:30:00.000Z" });
  const calendar = buildCalendarNight({ site: westhavelland, dateLocal: plan.nightDateLocal, timezone: westhavelland.timeZone, config: calendarConfig });
  assert.ok(Math.abs(plan.astronomicalDarkMinutes / 60 - calendar.totalDarknessHours) <= 1 / 6 + 0.01);
  assert.ok(Math.abs(plan.moonBelowHorizonDarkMinutes / 60 - calendar.moonlessHours) <= 1 / 6 + 0.01);
});
