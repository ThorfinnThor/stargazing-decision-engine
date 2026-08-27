import { Body, Equator, Horizon, Illumination, Observer, SearchAltitude, SearchRiseSet } from "astronomy-engine";

import { addLocalDate, localDateOnly, localDateTimeToUtc } from "./calendar";
import { assertValidInstant, assertValidSkyLocation } from "./validation";
import type {
  NightPlan,
  NightPlanEvent,
  NightPlanEventKind,
  NightPlanMode,
  NightPlanStatus,
  NightSample,
  NightTimelineSegment,
  RecommendationReasonCode,
  RecommendationQuality,
  RecommendedWindow,
  SkyLocation,
} from "./types";
import rawConfig from "../../data-config/astronomy/night-planner.json";

export type NightPlannerConfig = {
  version: 1;
  sampleMinutes: 10;
  astronomicalTwilightDeg: -18;
  minimumRecommendedWindowMinutes: number;
  nearPeakTolerancePoints: number;
  mergeGapMinutes: number;
  moonPenaltyMax: number;
  moonIlluminationExponent: number;
  moonFullPenaltyAltitudeDeg: number;
  qualityBands: { excellent: number; good: number; fair: number };
};

export const nightPlannerConfig = rawConfig as NightPlannerConfig;

const reasonPriority: RecommendationReasonCode[] = [
  "astronomical-darkness",
  "starts-after-moonset",
  "ends-before-moonrise",
  "moon-below-horizon",
  "thin-moon",
  "moon-low",
  "bright-moon-remains",
  "short-darkness-window",
  "best-remaining-window",
];

const minutes = (start: number, end: number) => Math.max(0, (end - start) / 60_000);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function assertNightPlannerConfig(config: NightPlannerConfig) {
  if (config.version !== 1) throw new Error("Night planner config version must be 1");
  if (config.sampleMinutes !== 10) throw new Error("Night planner requires a 10-minute sampling interval");
  if (config.astronomicalTwilightDeg !== -18) throw new Error("Night planner astronomical twilight must be -18 degrees");
  if (config.minimumRecommendedWindowMinutes < 30 || config.minimumRecommendedWindowMinutes % config.sampleMinutes !== 0) throw new Error("Night planner minimum window must be at least 30 minutes and divisible by sampleMinutes");
  if (config.nearPeakTolerancePoints < 0) throw new Error("Night planner near-peak tolerance cannot be negative");
  if (config.mergeGapMinutes < 0) throw new Error("Night planner merge gap cannot be negative");
  if (config.moonPenaltyMax < 0 || config.moonPenaltyMax > 1) throw new Error("Night planner moon penalty must be between 0 and 1");
  if (config.moonIlluminationExponent <= 0) throw new Error("Night planner moon illumination exponent must be positive");
  if (config.moonFullPenaltyAltitudeDeg <= 0 || config.moonFullPenaltyAltitudeDeg > 90) throw new Error("Night planner moon penalty altitude must be in (0, 90]");
  const { excellent, good, fair } = config.qualityBands;
  if (![excellent, good, fair].every((value) => Number.isFinite(value) && value >= 0 && value <= 100) || !(excellent > good && good > fair)) throw new Error("Night planner quality bands must be strictly descending within 0-100");
}

export function validateNightPlannerConfig(config: NightPlannerConfig) {
  assertNightPlannerConfig(config);
  return true;
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function calculateAstronomicalScore(input: {
  astronomicalDark: boolean;
  moonAltitudeDeg: number;
  moonIlluminationFraction: number;
  config?: NightPlannerConfig;
}) {
  const config = input.config ?? nightPlannerConfig;
  if (!input.astronomicalDark) return null;
  const moonAltitudeFactor = input.moonAltitudeDeg <= 0
    ? 0
    : smoothstep(0, config.moonFullPenaltyAltitudeDeg, input.moonAltitudeDeg);
  const moonBrightnessFactor = Math.pow(clamp(input.moonIlluminationFraction, 0, 1), config.moonIlluminationExponent);
  const moonPenalty = config.moonPenaltyMax * moonBrightnessFactor * moonAltitudeFactor;
  return Math.round(100 * clamp(1 - moonPenalty, 0, 1));
}

type NightEvents = {
  sunset?: Date;
  astronomicalDusk?: Date;
  moonrise?: Date;
  moonset?: Date;
  astronomicalDawn?: Date;
  sunrise?: Date;
};

function eventWithin(event: Date | undefined, start: Date, end: Date) {
  return event && event >= start && event <= end ? event : undefined;
}

function searchEvent(body: Body, observer: Observer, direction: 1 | -1, start: Date, end: Date) {
  const limitDays = (end.getTime() - start.getTime()) / 86_400_000 + 0.01;
  return eventWithin(SearchRiseSet(body, observer, direction, start, limitDays)?.date, start, end);
}

function searchAltitude(observer: Observer, direction: 1 | -1, start: Date, end: Date, altitudeDeg: number) {
  const limitDays = (end.getTime() - start.getTime()) / 86_400_000 + 0.01;
  return eventWithin(SearchAltitude(Body.Sun, observer, direction, start, limitDays, altitudeDeg)?.date, start, end);
}

function buildEvents(location: SkyLocation, start: Date, end: Date, config: NightPlannerConfig): NightEvents {
  const observer = new Observer(location.lat, location.lon, location.elevationM ?? 0);
  return {
    sunset: searchEvent(Body.Sun, observer, -1, start, end),
    astronomicalDusk: searchAltitude(observer, -1, start, end, config.astronomicalTwilightDeg),
    moonrise: searchEvent(Body.Moon, observer, 1, start, end),
    moonset: searchEvent(Body.Moon, observer, -1, start, end),
    astronomicalDawn: searchAltitude(observer, 1, start, end, config.astronomicalTwilightDeg),
    sunrise: searchEvent(Body.Sun, observer, 1, start, end),
  };
}

function eventList(events: NightEvents): NightPlanEvent[] {
  const ordered: NightPlanEventKind[] = ["sunset", "astronomical-dusk", "moonrise", "moonset", "astronomical-dawn", "sunrise"];
  const mapping: Record<NightPlanEventKind, keyof NightEvents> = {
    sunset: "sunset",
    "astronomical-dusk": "astronomicalDusk",
    moonrise: "moonrise",
    moonset: "moonset",
    "astronomical-dawn": "astronomicalDawn",
    sunrise: "sunrise",
  };
  return ordered
    .flatMap((kind) => events[mapping[kind]] ? [{ kind, instantIso: events[mapping[kind]]!.toISOString() }] : [])
    .sort((left, right) => Date.parse(left.instantIso) - Date.parse(right.instantIso) || left.kind.localeCompare(right.kind));
}

function moonMetrics(date: Date, observer: Observer) {
  const equatorial = Equator(Body.Moon, date, observer, true, true);
  const altitude = Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
  return { altitude, illumination: Illumination(Body.Moon, date).phase_fraction };
}

function sunAltitude(date: Date, observer: Observer) {
  const equatorial = Equator(Body.Sun, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
}

function buildSamples(location: SkyLocation, start: Date, end: Date, config: NightPlannerConfig): NightSample[] {
  const observer = new Observer(location.lat, location.lon, location.elevationM ?? 0);
  const samples: NightSample[] = [];
  const stepMs = config.sampleMinutes * 60_000;
  for (let leftMs = start.getTime(); leftMs < end.getTime(); leftMs += stepMs) {
    const rightMs = Math.min(leftMs + stepMs, end.getTime());
    const midpoint = new Date((leftMs + rightMs) / 2);
    const sunAltitudeDeg = sunAltitude(midpoint, observer);
    const moon = moonMetrics(midpoint, observer);
    const astronomicalDark = sunAltitudeDeg <= config.astronomicalTwilightDeg;
    samples.push({
      startIso: new Date(leftMs).toISOString(),
      endIso: new Date(rightMs).toISOString(),
      midpointIso: midpoint.toISOString(),
      sunAltitudeDeg,
      moonAltitudeDeg: moon.altitude,
      moonIlluminationFraction: moon.illumination,
      astronomicalDark,
      moonAboveHorizon: moon.altitude > 0,
      astronomicalScore: calculateAstronomicalScore({ astronomicalDark, moonAltitudeDeg: moon.altitude, moonIlluminationFraction: moon.illumination, config }),
    });
  }
  return samples;
}

function mergeIntervals(intervals: Array<{ startMs: number; endMs: number }>, mergeGapMinutes = 0) {
  const merged: Array<{ startMs: number; endMs: number }> = [];
  for (const interval of intervals.sort((left, right) => left.startMs - right.startMs)) {
    const previous = merged.at(-1);
    if (previous && interval.startMs - previous.endMs <= mergeGapMinutes * 60_000) previous.endMs = Math.max(previous.endMs, interval.endMs);
    else merged.push({ ...interval });
  }
  return merged;
}

function darkRuns(samples: NightSample[]) {
  return mergeIntervals(samples.filter((sample) => sample.astronomicalScore !== null).map((sample) => ({ startMs: Date.parse(sample.startIso), endMs: Date.parse(sample.endIso) })));
}

function scoreQuality(score: number, config: NightPlannerConfig): RecommendationQuality {
  if (score >= config.qualityBands.excellent) return "excellent";
  if (score >= config.qualityBands.good) return "good";
  if (score >= config.qualityBands.fair) return "fair";
  return "limited";
}

function candidateFromSamples(samples: NightSample[], isRemainingNightRecommendation: boolean, config: NightPlannerConfig): RecommendedWindow | null {
  const scored = samples.filter((sample) => sample.astronomicalScore !== null);
  if (scored.length === 0) return null;
  const maxScore = Math.max(...scored.map((sample) => sample.astronomicalScore!));
  const threshold = maxScore - config.nearPeakTolerancePoints;
  const nearPeak = scored.filter((sample) => sample.astronomicalScore! >= threshold);
  const groups: NightSample[][] = [];
  for (const sample of nearPeak) {
    const previous = groups.at(-1)?.at(-1);
    if (previous && Date.parse(sample.startIso) - Date.parse(previous.endIso) <= config.mergeGapMinutes * 60_000) groups.at(-1)!.push(sample);
    else groups.push([sample]);
  }
  const makeWindow = (group: NightSample[], short = false): RecommendedWindow => {
    const startMs = Date.parse(group[0].startIso);
    const endMs = Date.parse(group.at(-1)!.endIso);
    const averageScore = round(group.reduce((sum, sample) => sum + (sample.astronomicalScore ?? 0), 0) / group.length);
    const peakScore = Math.max(...group.map((sample) => sample.astronomicalScore ?? 0));
    return { startIso: new Date(startMs).toISOString(), endIso: new Date(endMs).toISOString(), durationMinutes: round(minutes(startMs, endMs)), averageScore, peakScore, quality: scoreQuality(averageScore, config), reasonCodes: short ? ["astronomical-darkness", "short-darkness-window"] : ["astronomical-darkness"], isRemainingNightRecommendation };
  };
  const eligible = groups.filter((group) => minutes(Date.parse(group[0].startIso), Date.parse(group.at(-1)!.endIso)) >= config.minimumRecommendedWindowMinutes);
  if (eligible.length > 0) {
    const ranked = eligible.map((group) => makeWindow(group)).sort((left, right) => right.averageScore - left.averageScore || right.durationMinutes - left.durationMinutes || right.peakScore - left.peakScore || left.startIso.localeCompare(right.startIso));
    return ranked[0];
  }
  const best = [...scored].sort((left, right) => right.astronomicalScore! - left.astronomicalScore! || left.startIso.localeCompare(right.startIso))[0];
  const regions = darkRuns(samples);
  const bestMs = Date.parse(best.midpointIso);
  const region = regions.find((item) => bestMs >= item.startMs && bestMs <= item.endMs) ?? { startMs: Date.parse(best.startIso), endMs: Date.parse(best.endIso) };
  const targetMs = Math.min(config.minimumRecommendedWindowMinutes * 60_000, region.endMs - region.startMs);
  let startMs = clamp(bestMs - targetMs / 2, region.startMs, region.endMs - targetMs);
  startMs = Math.max(region.startMs, Math.min(startMs, region.endMs - targetMs));
  const endMs = startMs + targetMs;
  const expanded = samples.filter((sample) => Date.parse(sample.endIso) > startMs && Date.parse(sample.startIso) < endMs);
  const window = makeWindow(expanded.length ? expanded : [best], targetMs < config.minimumRecommendedWindowMinutes * 60_000);
  window.startIso = new Date(startMs).toISOString();
  window.endIso = new Date(endMs).toISOString();
  window.durationMinutes = round(minutes(startMs, endMs));
  window.reasonCodes = ["astronomical-darkness", ...(window.durationMinutes < config.minimumRecommendedWindowMinutes ? ["short-darkness-window" as const] : [])];
  return window;
}

function withReasonCodes(window: RecommendedWindow, samples: NightSample[], events: NightEvents, config: NightPlannerConfig) {
  const startMs = Date.parse(window.startIso);
  const endMs = Date.parse(window.endIso);
  const overlapping = samples.filter((sample) => Date.parse(sample.endIso) > startMs && Date.parse(sample.startIso) < endMs);
  const reasons = new Set<RecommendationReasonCode>(window.reasonCodes);
  reasons.add("astronomical-darkness");
  if (events.moonset && events.moonset.getTime() <= startMs) reasons.add("starts-after-moonset");
  if (events.moonrise && events.moonrise.getTime() >= endMs) reasons.add("ends-before-moonrise");
  if (overlapping.length > 0 && overlapping.every((sample) => !sample.moonAboveHorizon)) reasons.add("moon-below-horizon");
  const illumination = overlapping.length > 0 ? overlapping.reduce((sum, sample) => sum + sample.moonIlluminationFraction, 0) / overlapping.length : 0;
  const maximumMoonAltitude = overlapping.length > 0 ? Math.max(...overlapping.map((sample) => sample.moonAltitudeDeg)) : 0;
  if (illumination <= 0.25) reasons.add("thin-moon");
  if (maximumMoonAltitude > 0 && maximumMoonAltitude <= 20) reasons.add("moon-low");
  if (illumination > 0.5 && overlapping.some((sample) => sample.moonAboveHorizon)) reasons.add("bright-moon-remains");
  if (window.durationMinutes < config.minimumRecommendedWindowMinutes) reasons.add("short-darkness-window");
  return { ...window, reasonCodes: reasonPriority.filter((reason) => reasons.has(reason)) };
}

function refineWindow(window: RecommendedWindow, events: NightEvents, config: NightPlannerConfig) {
  const rasterMs = config.sampleMinutes * 60_000;
  let startMs = Date.parse(window.startIso);
  let endMs = Date.parse(window.endIso);
  for (const candidate of [events.moonset, events.astronomicalDusk]) {
    if (candidate && candidate.getTime() <= startMs && startMs - candidate.getTime() <= rasterMs) startMs = candidate.getTime();
  }
  for (const candidate of [events.moonrise, events.astronomicalDawn]) {
    if (candidate && candidate.getTime() >= endMs && candidate.getTime() - endMs <= rasterMs) endMs = candidate.getTime();
  }
  if (endMs <= startMs) return window;
  return { ...window, startIso: new Date(startMs).toISOString(), endIso: new Date(endMs).toISOString(), durationMinutes: round(minutes(startMs, endMs)) };
}

function timelineRatio(instantIso: string, startIso: string, endIso: string) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  return clamp((Date.parse(instantIso) - start) / Math.max(1, end - start), 0, 1);
}

function segment(kind: NightTimelineSegment["kind"], startMs: number, endMs: number, timelineStartIso: string, timelineEndIso: string): NightTimelineSegment | null {
  if (endMs <= startMs) return null;
  const startIso = new Date(startMs).toISOString();
  const endIso = new Date(endMs).toISOString();
  return { kind, startIso, endIso, startRatio: timelineRatio(startIso, timelineStartIso, timelineEndIso), endRatio: timelineRatio(endIso, timelineStartIso, timelineEndIso) };
}

function buildTimelineSegments(samples: NightSample[], events: NightEvents, displayedRecommendation: RecommendedWindow | null, timelineStartIso: string, timelineEndIso: string) {
  const startMs = Date.parse(timelineStartIso);
  const endMs = Date.parse(timelineEndIso);
  const dark = mergeIntervals(samples.filter((sample) => sample.astronomicalDark).map((sample) => ({ startMs: Math.max(startMs, Date.parse(sample.startIso)), endMs: Math.min(endMs, Date.parse(sample.endIso)) })));
  const result: NightTimelineSegment[] = [];
  let cursor = startMs;
  for (const interval of dark) {
    if (interval.startMs > cursor) result.push(segment("twilight", cursor, interval.startMs, timelineStartIso, timelineEndIso)!);
    result.push(segment("astronomical-darkness", interval.startMs, interval.endMs, timelineStartIso, timelineEndIso)!);
    cursor = Math.max(cursor, interval.endMs);
  }
  if (cursor < endMs) result.push(segment("twilight", cursor, endMs, timelineStartIso, timelineEndIso)!);
  for (const kind of ["moon-above", "moon-below"] as const) {
    const intervals = mergeIntervals(samples.filter((sample) => (kind === "moon-above" ? sample.moonAboveHorizon : !sample.moonAboveHorizon)).map((sample) => ({ startMs: Math.max(startMs, Date.parse(sample.startIso)), endMs: Math.min(endMs, Date.parse(sample.endIso)) })));
    for (const interval of intervals) result.push(segment(kind, interval.startMs, interval.endMs, timelineStartIso, timelineEndIso)!);
  }
  if (displayedRecommendation) result.push(segment("recommended", Date.parse(displayedRecommendation.startIso), Date.parse(displayedRecommendation.endIso), timelineStartIso, timelineEndIso)!);
  return result.filter(Boolean).sort((left, right) => left.startRatio - right.startRatio || left.kind.localeCompare(right.kind));
}

function localHour(instantIso: string, timeZone: string) {
  return Number(new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", hourCycle: "h23" }).format(new Date(instantIso)));
}

function nightWindow(location: SkyLocation, dateLocal: string, config: NightPlannerConfig) {
  const start = localDateTimeToUtc(dateLocal, 12, location.timeZone);
  const end = localDateTimeToUtc(addLocalDate(dateLocal, 1), 12, location.timeZone);
  return { start, end, events: buildEvents(location, start, end, config) };
}

function containsInstant(window: { start: Date; end: Date; events: NightEvents }, instantMs: number) {
  if (!window.events.sunset && !window.events.astronomicalDusk && !window.events.sunrise && !window.events.astronomicalDawn) return false;
  const start = window.events.sunset?.getTime() ?? window.events.astronomicalDusk?.getTime() ?? window.start.getTime();
  const end = window.events.sunrise?.getTime() ?? window.events.astronomicalDawn?.getTime() ?? window.end.getTime();
  return instantMs >= start && instantMs <= end;
}

export function resolveTonightNightDate(input: { location: SkyLocation; nowIso: string; config?: NightPlannerConfig }) {
  const config = input.config ?? nightPlannerConfig;
  assertNightPlannerConfig(config);
  assertValidSkyLocation(input.location);
  const now = assertValidInstant(input.nowIso);
  const current = localDateOnly(now, input.location.timeZone);
  const previous = addLocalDate(current, -1);
  const previousWindow = nightWindow(input.location, previous, config);
  if (containsInstant(previousWindow, now.getTime())) return previous;
  if (!previousWindow.events.sunset && !previousWindow.events.sunrise && localHour(input.nowIso, input.location.timeZone) < 6) return previous;
  return current;
}

function selectRemainingRecommendation(samples: NightSample[], nowMs: number, config: NightPlannerConfig) {
  const remaining = samples.filter((sample) => sample.astronomicalScore !== null && Date.parse(sample.endIso) > nowMs).map((sample) => Date.parse(sample.startIso) < nowMs ? { ...sample, startIso: new Date(nowMs).toISOString() } : sample);
  return candidateFromSamples(remaining, true, config);
}

export function buildNightPlan(input: { location: SkyLocation; mode: NightPlanMode; instantIso: string; nowIso?: string; config?: NightPlannerConfig }): NightPlan {
  const config = input.config ?? nightPlannerConfig;
  assertNightPlannerConfig(config);
  assertValidSkyLocation(input.location);
  assertValidInstant(input.instantIso);
  const nowIso = input.nowIso ?? input.instantIso;
  const now = assertValidInstant(nowIso);
  const nightDateLocal = resolveTonightNightDate({ location: input.location, nowIso: input.mode === "night-preview" ? input.instantIso : nowIso, config });
  const window = nightWindow(input.location, nightDateLocal, config);
  const samples = buildSamples(input.location, window.start, window.end, config);
  const events = eventList(window.events);
  const full = candidateFromSamples(samples, false, config);
  const fullWithReasons = full ? withReasonCodes(refineWindow(full, window.events, config), samples, window.events, config) : null;
  let status: NightPlanStatus = fullWithReasons ? "ready" : "no-astronomical-night";
  let displayed = fullWithReasons;
  if (input.mode === "live-night" && fullWithReasons) {
    const nowMs = now.getTime();
    if (nowMs > Date.parse(fullWithReasons.endIso)) {
      const remaining = selectRemainingRecommendation(samples, nowMs, config);
      if (remaining) displayed = withReasonCodes(refineWindow(remaining, window.events, config), samples, window.events, config);
      else if (nowMs >= Date.parse((window.events.sunrise?.toISOString() ?? window.events.astronomicalDawn?.toISOString() ?? window.end.toISOString()))) {
        displayed = null;
        status = "night-finished";
      }
    }
  }
  const firstDark = samples.find((sample) => sample.astronomicalDark);
  const lastDark = [...samples].reverse().find((sample) => sample.astronomicalDark);
  const timelineStart = window.events.sunset ?? (window.events.astronomicalDusk ? new Date(window.events.astronomicalDusk.getTime() - 60 * 60_000) : firstDark ? new Date(Date.parse(firstDark.startIso)) : window.start);
  const timelineEnd = window.events.sunrise ?? (window.events.astronomicalDawn ? new Date(window.events.astronomicalDawn.getTime() + 60 * 60_000) : lastDark ? new Date(Date.parse(lastDark.endIso)) : window.end);
  const timelineStartIso = new Date(clamp(timelineStart.getTime(), window.start.getTime(), window.end.getTime())).toISOString();
  const timelineEndIso = new Date(clamp(timelineEnd.getTime(), window.start.getTime(), window.end.getTime())).toISOString();
  const darkMinutes = samples.filter((sample) => sample.astronomicalDark).reduce((sum, sample) => sum + minutes(Date.parse(sample.startIso), Date.parse(sample.endIso)), 0);
  const moonBelowMinutes = samples.filter((sample) => sample.astronomicalDark && !sample.moonAboveHorizon).reduce((sum, sample) => sum + minutes(Date.parse(sample.startIso), Date.parse(sample.endIso)), 0);
  const midpoint = new Date((window.start.getTime() + window.end.getTime()) / 2);
  const midpointMoon = moonMetrics(midpoint, new Observer(input.location.lat, input.location.lon, input.location.elevationM ?? 0));
  return {
    version: 1,
    locationId: input.location.id,
    siteId: input.location.siteId,
    timeZone: input.location.timeZone,
    mode: input.mode,
    nightDateLocal,
    calculationStartIso: window.start.toISOString(),
    calculationEndIso: window.end.toISOString(),
    timelineStartIso,
    timelineEndIso,
    status,
    events,
    samples,
    fullNightRecommendation: fullWithReasons,
    displayedRecommendation: displayed,
    timelineSegments: buildTimelineSegments(samples, window.events, displayed, timelineStartIso, timelineEndIso),
    astronomicalDarkMinutes: round(darkMinutes),
    moonBelowHorizonDarkMinutes: round(moonBelowMinutes),
    moonIlluminationFractionAtNightMidpoint: Number.isFinite(midpointMoon.illumination) ? round(midpointMoon.illumination, 4) : null,
  };
}

export { timelineRatio };
