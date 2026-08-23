import { Body, Equator, Horizon, Observer } from "astronomy-engine";

import type {
  ConfidenceLevel,
  Destination,
  MeteorShowerEvent,
  MeteorShowerViewingRow,
  MonthNumber,
  MonthlySiteScore,
  ObservationSite,
} from "../data/types.js";
import { addLocalDate, buildCalendarNight, localDateOnly, localDateTimeToUtc, type CalendarConfig } from "./calendar.js";
import { j2000AltitudeDeg } from "./milky-way.js";
import { isTravelEligibleSite } from "../access/travel.js";

export interface MeteorShowerDefinition {
  id: string;
  slug: string;
  iauCode: string;
  name: { en: string; de: string };
  activeStart: string;
  activeEnd: string;
  peakDate: string;
  peakUtc: string | null;
  radiantRaDeg: number;
  radiantDecDeg: number;
  referenceZhr: number | null;
  notes: string[];
}

export interface MeteorShowerConfig {
  year: number;
  source: string;
  sourceName: string;
  verifiedAt: string;
  radiantFrame: "J2000";
  showers: MeteorShowerDefinition[];
}

export interface MeteorShowerScoringConfig {
  version: number;
  sampleMinutes: number;
  astronomicalTwilightDeg: number;
  minimumRadiantAltitudeDeg: number;
  weights: { climate: number; moon: number; radiant: number };
  moonWeights: { moonlessFraction: number; illumination: number };
  radiantWeights: { duration: number; altitude: number };
  durationCurve: Array<[number, number]>;
  altitudeCurve: Array<[number, number]>;
}

interface RadiantMetrics {
  maximumAltitudeDeg: number | null;
  darkRadiantHours: number;
  score: number;
}

interface SiteResult {
  site: ObservationSite;
  destination: Destination;
  climateScore: number | null;
  climateConfidenceLevel: ConfidenceLevel;
  moonScore: number;
  radiant: RadiantMetrics;
  dateLocal: string;
  night: ReturnType<typeof buildCalendarNight>;
  viewingScore: number;
  caveats: string[];
}

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function scoreCurve(input: number, curve: Array<[number, number]>) {
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
  throw new Error("Meteor score interpolation failed");
}

function validateCurve(curve: Array<[number, number]>, name: string) {
  if (curve.length < 2) throw new Error(`${name} requires at least two points`);
  for (let index = 0; index < curve.length; index += 1) {
    const [input, score] = curve[index];
    if (!Number.isFinite(input) || !Number.isFinite(score) || input < 0 || score < 0 || score > 100) throw new Error(`${name} contains an invalid point`);
    if (index > 0 && (input <= curve[index - 1][0] || score < curve[index - 1][1])) throw new Error(`${name} must be increasing`);
  }
}

export function validateMeteorShowerScoringConfig(config: MeteorShowerScoringConfig) {
  if (config.version !== 1 || config.sampleMinutes !== 10 || config.astronomicalTwilightDeg !== -18) throw new Error("Meteor V1 requires version 1, ten-minute sampling, and -18 degree astronomical twilight");
  if (config.minimumRadiantAltitudeDeg < 0 || config.minimumRadiantAltitudeDeg > 90) throw new Error("Meteor radiant altitude threshold is invalid");
  const weightSum = config.weights.climate + config.weights.moon + config.weights.radiant;
  if ([config.weights.climate, config.weights.moon, config.weights.radiant].some((value) => value < 0 || !Number.isFinite(value)) || Math.abs(weightSum - 1) > 1e-9) throw new Error("Meteor score weights must be non-negative and sum to one");
  const moonWeightSum = config.moonWeights.moonlessFraction + config.moonWeights.illumination;
  if ([config.moonWeights.moonlessFraction, config.moonWeights.illumination].some((value) => value < 0 || !Number.isFinite(value)) || Math.abs(moonWeightSum - 1) > 1e-9) throw new Error("Meteor Moon weights must be non-negative and sum to one");
  const radiantWeightSum = config.radiantWeights.duration + config.radiantWeights.altitude;
  if ([config.radiantWeights.duration, config.radiantWeights.altitude].some((value) => value < 0 || !Number.isFinite(value)) || Math.abs(radiantWeightSum - 1) > 1e-9) throw new Error("Meteor radiant weights must be non-negative and sum to one");
  validateCurve(config.durationCurve, "Meteor duration curve");
  validateCurve(config.altitudeCurve, "Meteor altitude curve");
}

export function validateMeteorShowerConfig(config: MeteorShowerConfig) {
  if (!Number.isInteger(config.year) || config.year < 1900) throw new Error("Meteor shower config year is invalid");
  if (!config.source.startsWith("https://") || !config.sourceName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(config.verifiedAt)) throw new Error("Meteor shower source provenance is invalid");
  if (config.radiantFrame !== "J2000") throw new Error("Meteor shower radiant frame must be J2000");
  if (config.showers.length === 0) throw new Error("Meteor shower config must contain at least one shower");
  const slugs = new Set<string>();
  for (const shower of config.showers) {
    if (slugs.has(shower.slug)) throw new Error(`Duplicate meteor shower slug: ${shower.slug}`);
    slugs.add(shower.slug);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(shower.activeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(shower.activeEnd) || !/^\d{4}-\d{2}-\d{2}$/.test(shower.peakDate)) throw new Error(`${shower.slug}: invalid source date`);
    if (shower.activeStart > shower.peakDate || shower.peakDate > shower.activeEnd) throw new Error(`${shower.slug}: peak date is outside active period`);
    if (shower.peakUtc && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(shower.peakUtc) || !shower.peakUtc.startsWith(shower.peakDate))) throw new Error(`${shower.slug}: peak UTC must be an ISO timestamp on peak date`);
    if (!Number.isFinite(shower.radiantRaDeg) || shower.radiantRaDeg < 0 || shower.radiantRaDeg >= 360 || !Number.isFinite(shower.radiantDecDeg) || shower.radiantDecDeg < -90 || shower.radiantDecDeg > 90) throw new Error(`${shower.slug}: radiant coordinates are invalid`);
    if (shower.referenceZhr !== null && (!Number.isFinite(shower.referenceZhr) || shower.referenceZhr < 0)) throw new Error(`${shower.slug}: reference ZHR is invalid`);
    if (shower.notes.length === 0) throw new Error(`${shower.slug}: source notes are required`);
  }
}

function sunAltitudeDeg(date: Date, observer: Observer) {
  const equatorial = Equator(Body.Sun, date, observer, true, true);
  return Horizon(date, observer, equatorial.ra, equatorial.dec).altitude;
}

export function localPeakNightDate(shower: MeteorShowerDefinition, timezone: string) {
  if (!shower.peakUtc) return shower.peakDate;
  const peak = new Date(shower.peakUtc);
  const localDate = localDateOnly(peak, timezone);
  const localNoon = localDateTimeToUtc(localDate, 12, timezone);
  return peak < localNoon ? addLocalDate(localDate, -1) : localDate;
}

export function calculateMeteorMoonScore(
  moonlessHours: number,
  totalDarknessHours: number,
  moonIlluminationFraction: number | null,
  config: MeteorShowerScoringConfig,
) {
  if (totalDarknessHours <= 0) return 0;
  const moonlessFraction = clamp(moonlessHours / totalDarknessHours, 0, 1);
  const illuminationUtility = moonIlluminationFraction === null ? 0 : clamp(1 - moonIlluminationFraction, 0, 1);
  return round(100 * (
    config.moonWeights.moonlessFraction * moonlessFraction
    + config.moonWeights.illumination * illuminationUtility
  ));
}

export function calculateMeteorRadiantScore(
  darkRadiantHours: number,
  maximumAltitudeDeg: number | null,
  config: MeteorShowerScoringConfig,
) {
  if (maximumAltitudeDeg === null) return 0;
  const durationScore = scoreCurve(darkRadiantHours, config.durationCurve);
  const altitudeScore = scoreCurve(maximumAltitudeDeg, config.altitudeCurve);
  return round(config.radiantWeights.duration * durationScore + config.radiantWeights.altitude * altitudeScore);
}

export function calculateMeteorViewingScore(
  climateScore: number | null,
  moonScore: number,
  radiantScore: number,
  config: MeteorShowerScoringConfig,
) {
  return round(
    config.weights.climate * (climateScore ?? 0)
    + config.weights.moon * moonScore
    + config.weights.radiant * radiantScore,
  );
}

function buildRadiantMetrics(options: {
  site: ObservationSite;
  dateLocal: string;
  timezone: string;
  shower: MeteorShowerDefinition;
  calendarConfig: CalendarConfig;
  scoringConfig: MeteorShowerScoringConfig;
}): RadiantMetrics {
  const { site, dateLocal, timezone, shower, calendarConfig, scoringConfig } = options;
  const observer = new Observer(site.lat, site.lon, site.elevationM ?? 0);
  const start = localDateTimeToUtc(dateLocal, 12, timezone);
  const nextDate = new Date(Date.UTC(Number(dateLocal.slice(0, 4)), Number(dateLocal.slice(5, 7)) - 1, Number(dateLocal.slice(8, 10)) + 1));
  const nextDateLocal = `${nextDate.getUTCFullYear()}-${String(nextDate.getUTCMonth() + 1).padStart(2, "0")}-${String(nextDate.getUTCDate()).padStart(2, "0")}`;
  const end = localDateTimeToUtc(nextDateLocal, 12, timezone);
  const stepMs = scoringConfig.sampleMinutes * 60_000;
  let darkRadiantHours = 0;
  let maximumAltitudeDeg = -90;
  let hasDark = false;
  for (let left = start; left < end; left = new Date(Math.min(left.getTime() + stepMs, end.getTime()))) {
    const right = new Date(Math.min(left.getTime() + stepMs, end.getTime()));
    if (right <= left) break;
    const midpoint = new Date((left.getTime() + right.getTime()) / 2);
    const durationHours = (right.getTime() - left.getTime()) / 3_600_000;
    if (sunAltitudeDeg(midpoint, observer) <= calendarConfig.astronomicalTwilightDeg) {
      hasDark = true;
      const altitude = j2000AltitudeDeg(midpoint, observer, shower.radiantRaDeg / 15, shower.radiantDecDeg);
      maximumAltitudeDeg = Math.max(maximumAltitudeDeg, altitude);
      if (altitude >= scoringConfig.minimumRadiantAltitudeDeg) darkRadiantHours += durationHours;
    }
  }
  if (!hasDark) return { maximumAltitudeDeg: null, darkRadiantHours: 0, score: 0 };
  const roundedMaximumAltitudeDeg = round(maximumAltitudeDeg);
  const roundedDarkRadiantHours = round(darkRadiantHours);
  return {
    maximumAltitudeDeg: roundedMaximumAltitudeDeg,
    darkRadiantHours: roundedDarkRadiantHours,
    score: calculateMeteorRadiantScore(roundedDarkRadiantHours, roundedMaximumAltitudeDeg, scoringConfig),
  };
}

function buildSiteResult(options: {
  shower: MeteorShowerDefinition;
  site: ObservationSite;
  destination: Destination;
  scores: MonthlySiteScore[];
  calendarConfig: CalendarConfig;
  scoringConfig: MeteorShowerScoringConfig;
}): SiteResult {
  const { shower, site, destination, scores, calendarConfig, scoringConfig } = options;
  const dateLocal = localPeakNightDate(shower, destination.timezone);
  const night = buildCalendarNight({ site, dateLocal, timezone: destination.timezone, config: calendarConfig });
  const score = scores.find((item) => item.siteId === site.id && item.month === Number(shower.peakDate.slice(5, 7)));
  const climateScore = score?.skyQuality ?? null;
  const moonScore = calculateMeteorMoonScore(night.moonlessHours, night.totalDarknessHours, night.moonIlluminationFraction, scoringConfig);
  const radiant = buildRadiantMetrics({ site, dateLocal, timezone: destination.timezone, shower, calendarConfig, scoringConfig });
  const caveats = ["Viewing score is not a forecast of meteor counts or ZHR.", "Climate component uses monthly historical sky-quality climatology for the event month."];
  if (climateScore === null) caveats.push("Historical sky-quality climatology is unavailable for this site.");
  return {
    site,
    destination,
    climateScore,
    climateConfidenceLevel: score?.confidenceLevel ?? "low",
    moonScore,
    radiant,
    dateLocal,
    night,
    viewingScore: calculateMeteorViewingScore(climateScore, moonScore, radiant.score, scoringConfig),
    caveats,
  };
}

function row(result: SiteResult, rank: number): MeteorShowerViewingRow {
  return {
    rank,
    destinationId: result.destination.id,
    destinationSlug: result.destination.slug,
    destinationName: result.destination.name,
    siteId: result.site.id,
    siteSlug: result.site.slug,
    siteName: result.site.name,
    climateScore: result.climateScore,
    moonScore: result.moonScore,
    radiantScore: result.radiant.score,
    viewingScore: result.viewingScore,
    moonConditions: {
      dateLocal: result.dateLocal,
      timezone: result.destination.timezone,
      moonIlluminationFraction: result.night.moonIlluminationFraction,
      moonlessHours: result.night.moonlessHours,
      totalDarknessHours: result.night.totalDarknessHours,
    },
    radiantConditions: {
      maximumAltitudeDeg: result.radiant.maximumAltitudeDeg,
      darkRadiantHours: result.radiant.darkRadiantHours,
    },
    caveats: result.caveats,
  };
}

export function buildMeteorShowerEvents(options: {
  config: MeteorShowerConfig;
  scoringConfig: MeteorShowerScoringConfig;
  calendarConfig: CalendarConfig;
  destinations: Destination[];
  sites: ObservationSite[];
  scores: MonthlySiteScore[];
}): MeteorShowerEvent[] {
  validateMeteorShowerConfig(options.config);
  validateMeteorShowerScoringConfig(options.scoringConfig);
  const activeDestinations = options.destinations.filter((destination) => destination.active);
  const activeSites = options.sites.filter(isTravelEligibleSite);
  if (activeSites.length === 0) throw new Error("No travel-eligible observation sites available for meteor rankings");
  return options.config.showers.map((shower) => {
    const eventMonth = Number(shower.peakDate.slice(5, 7));
    const results = activeSites.flatMap((site) => {
      const destination = activeDestinations.find((item) => item.id === site.destinationId);
      const climate = options.scores.find((score) => score.siteId === site.id && score.month === eventMonth);
      return destination && climate && climate.confidenceLevel !== "low"
        ? [buildSiteResult({ shower, site, destination, scores: options.scores, calendarConfig: options.calendarConfig, scoringConfig: options.scoringConfig })]
        : [];
    });
    if (results.length === 0) throw new Error(`${shower.slug}: no active observation sites available`);
    results.sort((left, right) => right.viewingScore - left.viewingScore || right.radiant.score - left.radiant.score || left.site.id.localeCompare(right.site.id));
    const topSites = results.slice(0, 5).map((result, index) => row(result, index + 1));
    const bestByDestination = new Map<string, SiteResult>();
    for (const result of results) {
      if (!bestByDestination.has(result.destination.id)) bestByDestination.set(result.destination.id, result);
    }
    const destinationBest = [...bestByDestination.values()]
      .sort((left, right) => right.viewingScore - left.viewingScore || left.destination.id.localeCompare(right.destination.id));
    const topDestinations = destinationBest.slice(0, 5).map((result, index) => row(result, index + 1));
    const best = results[0];
    const confidenceLevel: ConfidenceLevel = best.climateConfidenceLevel;
    const caveats = [...new Set([
      ...shower.notes,
      ...best.caveats,
      "Rankings exclude sites without verified public night access.",
      "Rankings exclude low-confidence climate rows.",
      ...(confidenceLevel === "low" ? ["Low-confidence climate inputs keep this event out of unqualified SEO rankings."] : []),
    ])];
    return {
      id: shower.id,
      slug: shower.slug,
      iauCode: shower.iauCode,
      name: shower.name,
      year: options.config.year,
      peakDate: shower.peakDate,
      peakUtc: shower.peakUtc,
      activeStart: shower.activeStart,
      activeEnd: shower.activeEnd,
      radiantFrame: options.config.radiantFrame,
      radiantRaDeg: shower.radiantRaDeg,
      radiantDecDeg: shower.radiantDecDeg,
      referenceZhr: shower.referenceZhr,
      source: options.config.sourceName,
      sourceUrl: options.config.source,
      sourceYear: options.config.year,
      verifiedAt: options.config.verifiedAt,
      climateContext: { month: Number(shower.peakDate.slice(5, 7)) as MonthNumber, metric: "monthly_site_sky_quality", source: "Monthly historical site-score climatology" },
      moonConditions: {
        bestSiteId: best.site.id,
        dateLocal: best.dateLocal,
        timezone: best.destination.timezone,
        moonIlluminationFraction: best.night.moonIlluminationFraction,
        moonlessHours: best.night.moonlessHours,
        totalDarknessHours: best.night.totalDarknessHours,
      },
      topDestinations,
      topSites,
      climateScore: best.climateScore,
      moonScore: best.moonScore,
      radiantScore: best.radiant.score,
      viewingScore: best.viewingScore,
      confidenceLevel,
      indexable: confidenceLevel !== "low",
      caveats,
    } satisfies MeteorShowerEvent;
  });
}
