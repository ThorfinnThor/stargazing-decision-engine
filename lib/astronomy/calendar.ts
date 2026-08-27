import { Body, Equator, Horizon, Illumination, Observer, SearchAltitude, SearchRiseSet } from "astronomy-engine";
import type { CalendarNight, ObservationSite } from "../data/types.js";
import type { CurvePoint } from "../scoring/types.js";
import { buildMilkyWayMetrics, galacticCenterAltitudeDeg, type MilkyWayConfig, validateMilkyWayConfig } from "./milky-way";

export interface CalendarConfig {
  version: number;
  sampleMinutes: number;
  astronomicalTwilightDeg: number;
  moonlessMoonAltitudeDeg: number;
  moonlessHoursCurve: CurvePoint[];
  astronomicalDarkHoursCurve: CurvePoint[];
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

interface Sample {
  date: Date;
  moonAltitudeDeg: number;
}

const localFormatterCache = new Map<string, Intl.DateTimeFormat>();

function formatter(timezone: string) {
  let value = localFormatterCache.get(timezone);
  if (!value) {
    value = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      calendar: "iso8601",
      numberingSystem: "latn",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    localFormatterCache.set(timezone, value);
  }
  return value;
}

function localParts(date: Date, timezone: string): LocalParts {
  const parts = Object.fromEntries(formatter(timezone).formatToParts(date).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function localDateOnly(date: Date, timezone: string) {
  const parts = localParts(date, timezone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localDateTimeToUtc(dateLocal: string, hour: number, timezone: string) {
  const [year, month, day] = dateLocal.split("-").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
  let guess = target;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const parts = localParts(new Date(guess), timezone);
    const displayedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    guess = target - (displayedAsUtc - guess);
  }
  return new Date(guess);
}

function addLocalDate(dateLocal: string, days: number) {
  const [year, month, day] = dateLocal.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

function localIso(date: Date, timezone: string) {
  const parts = localParts(date, timezone);
  const asLocalUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  const offsetMinutes = Math.round((asLocalUtc - date.getTime()) / 60000);
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}:${String(parts.second).padStart(2, "0")}${sign}${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function moonMetrics(date: Date, observer: Observer) {
  const equatorial = Equator(Body.Moon, date, observer, true, true);
  const altitude = Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
  const illumination = Illumination(Body.Moon, date);
  return {
    altitude,
    illumination: illumination.phase_fraction,
    phaseAngle: illumination.phase_angle,
  };
}

function sunAltitude(date: Date, observer: Observer) {
  const equatorial = Equator(Body.Sun, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
}

function scoreCurve(input: number, curve: CurvePoint[]) {
  if (input <= curve[0][0]) return curve[0][1];
  if (input >= curve[curve.length - 1][0]) return curve[curve.length - 1][1];
  for (let index = 1; index < curve.length; index += 1) {
    const [rightInput, rightScore] = curve[index];
    const [leftInput, leftScore] = curve[index - 1];
    if (input <= rightInput) {
      const fraction = (input - leftInput) / (rightInput - leftInput);
      return leftScore + fraction * (rightScore - leftScore);
    }
  }
  throw new Error("Calendar score interpolation failed");
}

export function calculateCalendarDarknessScore(moonlessHours: number, totalDarknessHours: number, config: CalendarConfig) {
  const moonlessScore = scoreCurve(moonlessHours, config.moonlessHoursCurve);
  const darkScore = scoreCurve(totalDarknessHours, config.astronomicalDarkHoursCurve);
  return 0.7 * moonlessScore + 0.3 * darkScore;
}

export function rankCalendarNights(nights: CalendarNight[]) {
  const ranked = [...nights].sort((left, right) =>
    right.calendarDarknessScore - left.calendarDarknessScore
    || (right.milkyWayOpportunityScore ?? -1) - (left.milkyWayOpportunityScore ?? -1)
    || left.dateLocal.localeCompare(right.dateLocal));
  const ranks = new Map(ranked.map((night, index) => [night.dateLocal, index + 1]));
  return nights.map((night) => ({ ...night, darknessRank: ranks.get(night.dateLocal) as number }));
}

function validateIncreasingUtility(curve: CurvePoint[], name: string) {
  if (curve.length < 2) throw new Error(`${name} requires at least two points`);
  for (let index = 0; index < curve.length; index += 1) {
    const [input, score] = curve[index];
    if (!Number.isFinite(input) || !Number.isFinite(score) || input < 0 || score < 0 || score > 100) throw new Error(`${name} contains an invalid point`);
    if (index > 0 && (input <= curve[index - 1][0] || score < curve[index - 1][1])) throw new Error(`${name} must increase monotonically`);
  }
}

export function validateCalendarConfig(config: CalendarConfig) {
  if (config.sampleMinutes !== 10) throw new Error("Calendar V1 requires a 10-minute sampling interval");
  if (config.astronomicalTwilightDeg !== -18) throw new Error("Calendar V1 astronomical twilight must be -18 degrees");
  if (config.moonlessMoonAltitudeDeg !== 0) throw new Error("Calendar V1 moonless altitude must be zero degrees");
  validateIncreasingUtility(config.moonlessHoursCurve, "Moonless-hours curve");
  validateIncreasingUtility(config.astronomicalDarkHoursCurve, "Astronomical-dark-hours curve");
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function eventWithin(event: Date | undefined, start: Date, end: Date) {
  return event && event >= start && event <= end ? event : null;
}

function exactDarknessWindow(start: Date, end: Date, observer: Observer, threshold: number) {
  const limitDays = (end.getTime() - start.getTime()) / 86_400_000 + 0.01;
  const dusk = eventWithin(SearchAltitude(Body.Sun, observer, -1, start, limitDays, threshold)?.date, start, end);
  const dawn = eventWithin(SearchAltitude(Body.Sun, observer, 1, start, limitDays, threshold)?.date, start, end);
  const hours = (left: Date, right: Date) => Math.max(0, (right.getTime() - left.getTime()) / 3_600_000);
  let darkHours: number;
  if (dusk && dawn) {
    darkHours = dusk < dawn ? hours(dusk, dawn) : hours(start, dawn) + hours(dusk, end);
  } else if (dusk) {
    darkHours = hours(dusk, end);
  } else if (dawn) {
    darkHours = hours(start, dawn);
  } else {
    darkHours = sunAltitude(new Date((start.getTime() + end.getTime()) / 2), observer) <= threshold ? hours(start, end) : 0;
  }
  return { dusk, dawn, darkHours: Math.min(24, darkHours) };
}

export function buildCalendarNight(options: {
  site: Pick<ObservationSite, "lat" | "lon" | "elevationM">;
  dateLocal: string;
  timezone: string;
  config: CalendarConfig;
  milkyWayConfig?: MilkyWayConfig;
}): CalendarNight {
  const { site, dateLocal, timezone, config, milkyWayConfig } = options;
  validateCalendarConfig(config);
  if (milkyWayConfig) validateMilkyWayConfig(milkyWayConfig);
  const observer = new Observer(site.lat, site.lon, site.elevationM ?? 0);
  const start = localDateTimeToUtc(dateLocal, 12, timezone);
  const end = localDateTimeToUtc(addLocalDate(dateLocal, 1), 12, timezone);
  const exactDarkness = exactDarknessWindow(start, end, observer, config.astronomicalTwilightDeg);
  const stepMs = config.sampleMinutes * 60_000;
  const edgeSamples: Sample[] = [];
  for (let date = new Date(start); date < end; date = new Date(Math.min(date.getTime() + stepMs, end.getTime()))) {
    const moon = moonMetrics(date, observer);
    edgeSamples.push({ date: new Date(date), moonAltitudeDeg: moon.altitude });
    if (date.getTime() + stepMs >= end.getTime()) break;
  }
  if (edgeSamples.at(-1)?.date.getTime() !== end.getTime()) {
    const moon = moonMetrics(end, observer);
    edgeSamples.push({ date: end, moonAltitudeDeg: moon.altitude });
  }

  let sampledDarkHours = 0;
  let moonlessHours = 0;
  let moonAboveDarkHours = 0;
  let moonMaxAltitude = -90;
  const milkyWayIntervals: Array<{ durationHours: number; astronomicalDark: boolean; moonless: boolean; galacticCenterAltitudeDeg: number }> = [];

  // The 10-minute raster is represented by midpoint samples; each midpoint owns one interval.
  for (let index = 0; index < edgeSamples.length - 1; index += 1) {
    const left = edgeSamples[index];
    const right = edgeSamples[index + 1];
    const durationHours = (right.date.getTime() - left.date.getTime()) / 3_600_000;
    const midpoint = new Date((left.date.getTime() + right.date.getTime()) / 2);
    const moon = moonMetrics(midpoint, observer);
    const sun = sunAltitude(midpoint, observer);
    const dark = sun <= config.astronomicalTwilightDeg;
    const galacticAltitude = milkyWayConfig ? galacticCenterAltitudeDeg(midpoint, observer, milkyWayConfig) : -90;
    if (milkyWayConfig) milkyWayIntervals.push({ durationHours, astronomicalDark: dark, moonless: dark && moon.altitude <= config.moonlessMoonAltitudeDeg, galacticCenterAltitudeDeg: galacticAltitude });
    if (dark) {
      sampledDarkHours += durationHours;
      moonMaxAltitude = Math.max(moonMaxAltitude, moon.altitude);
      if (moon.altitude <= config.moonlessMoonAltitudeDeg) {
        moonlessHours += durationHours;
      } else {
        moonAboveDarkHours += durationHours;
      }
    }
  }
  // Exact twilight can differ from midpoint bins by at most one sampling interval.
  // Preserve the lunar partition while preventing rounded sampled durations from exceeding exact darkness.
  if (sampledDarkHours > exactDarkness.darkHours && sampledDarkHours > 0) {
    const scale = exactDarkness.darkHours / sampledDarkHours;
    moonlessHours *= scale;
    moonAboveDarkHours *= scale;
  }

  const representative = new Date((start.getTime() + end.getTime()) / 2);
  const representativeMoon = moonMetrics(representative, observer);
  const limitDays = (end.getTime() - start.getTime()) / 86_400_000 + 0.01;
  const moonRise = eventWithin(SearchRiseSet(Body.Moon, observer, 1, start, limitDays)?.date, start, end);
  const moonSet = eventWithin(SearchRiseSet(Body.Moon, observer, -1, start, limitDays)?.date, start, end);
  const calendarDarknessScore = round(calculateCalendarDarknessScore(moonlessHours, exactDarkness.darkHours, config));
  const totalDarknessHours = round(exactDarkness.darkHours);
  const publicMoonlessHours = Math.min(totalDarknessHours, round(moonlessHours));
  const publicMoonAboveHours = Math.min(round(moonAboveDarkHours), Math.max(0, round(totalDarknessHours - publicMoonlessHours)));
  const milkyWayIntervalsForMetrics = sampledDarkHours > exactDarkness.darkHours && sampledDarkHours > 0
    ? milkyWayIntervals.map((interval) => interval.astronomicalDark ? { ...interval, durationHours: interval.durationHours * (exactDarkness.darkHours / sampledDarkHours) } : interval)
    : milkyWayIntervals;
  const milkyWayMetrics = milkyWayConfig ? buildMilkyWayMetrics({ intervals: milkyWayIntervalsForMetrics, config: milkyWayConfig }) : null;

  return {
    darknessRank: 1,
    dateLocal,
    timezone,
    astronomicalDusk: exactDarkness.dusk ? localIso(exactDarkness.dusk, timezone) : null,
    astronomicalDawn: exactDarkness.dawn ? localIso(exactDarkness.dawn, timezone) : null,
    moonIlluminationFraction: round(representativeMoon.illumination, 4),
    moonPhaseAngleDeg: round(representativeMoon.phaseAngle),
    moonRiseLocal: moonRise ? localIso(moonRise, timezone) : null,
    moonSetLocal: moonSet ? localIso(moonSet, timezone) : null,
    moonAltitudeMaxDeg: sampledDarkHours > 0 ? round(moonMaxAltitude) : null,
    moonAboveHorizonDarkHours: publicMoonAboveHours,
    moonBelowHorizonDarkHours: publicMoonlessHours,
    moonlessHours: publicMoonlessHours,
    totalDarknessHours,
    calendarDarknessScore,
    milkyWayUsefulHours: milkyWayMetrics?.usefulHours ?? 0,
    milkyWayStrongHours: milkyWayMetrics?.strongHours ?? 0,
    galacticCenterAltitudeMaxDeg: milkyWayMetrics?.maximumAltitudeDeg ?? null,
    milkyWayOpportunityScore: milkyWayMetrics?.opportunityScore ?? null,
  };
}

export { addLocalDate, localDateTimeToUtc, localIso, localDateOnly };
