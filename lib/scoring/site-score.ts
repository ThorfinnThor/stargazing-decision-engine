import type { Era5ClimateSnapshot, Era5MonthlyAggregate } from "../climate/era5/types.js";
import type { ConfidenceLevel, MonthlySiteScore, ObservationSite } from "../data/types.js";
import type { BlackMarbleSnapshot } from "../darkness/black-marble/types.js";
import type { DemSnapshot } from "../elevation/dem/types.js";
import { assertCurve, piecewiseScore } from "./piecewise.js";
import type { ScoreWeights, SiteScoreConfig } from "./types.js";

const roundPublic = (value: number) => Math.round(Math.min(100, Math.max(0, value)));

function weighted(values: Array<[number, number]>) {
  return values.reduce((sum, [value, weight]) => sum + value * weight, 0);
}

function assertWeightGroup(group: Record<string, number>, name: string) {
  const sum = Object.values(group).reduce((total, value) => total + value, 0);
  if (Object.values(group).some((value) => !Number.isFinite(value) || value < 0) || Math.abs(sum - 1) > 1e-9) {
    throw new Error(`${name} weights must be non-negative and sum to one`);
  }
}

function assertScoreDirection(curve: readonly (readonly [number, number])[], direction: "increasing" | "decreasing", name: string) {
  for (let index = 1; index < curve.length; index += 1) {
    const previous = curve[index - 1][1];
    const current = curve[index][1];
    if ((direction === "increasing" && current < previous) || (direction === "decreasing" && current > previous)) {
      throw new Error(`${name} scores must be ${direction}`);
    }
  }
}

export function validateScoreWeights(weights: ScoreWeights) {
  assertWeightGroup(weights.skyQuality, "skyQuality");
  assertWeightGroup(weights.tripComfort, "tripComfort");
  assertWeightGroup(weights.stargazingTrip, "stargazingTrip");
  assertWeightGroup(weights.confidence, "confidence");
}

export function validateSiteScoreConfig(config: SiteScoreConfig) {
  validateScoreWeights(config.weights);
  assertWeightGroup({ clearNight: config.cloud.clearNightWeight, clearHour: config.cloud.clearHourWeight }, "cloud");
  assertWeightGroup({ meanWind: config.wind.meanWindWeight, highWind: config.wind.highWindProbabilityWeight }, "wind");
  assertCurve(config.cloud.clearNightCurve, "clear-night curve");
  assertCurve(config.cloud.clearHourCurve, "clear-hour curve");
  assertCurve(config.dew.curve, "dew curve");
  assertCurve(config.elevation.curve, "elevation curve");
  assertCurve(config.temperature.curve, "temperature curve");
  assertCurve(config.wind.meanWindCurve, "mean-wind curve");
  assertCurve(config.wind.highWindProbabilityCurve, "high-wind curve");
  assertCurve(config.rain.curve, "rain curve");
  assertCurve(config.confidence.era5GridDistanceCurveKm, "grid-distance curve");
  assertScoreDirection(config.cloud.clearNightCurve, "increasing", "clear-night curve");
  assertScoreDirection(config.cloud.clearHourCurve, "increasing", "clear-hour curve");
  assertScoreDirection(config.dew.curve, "decreasing", "dew curve");
  assertScoreDirection(config.elevation.curve, "increasing", "elevation curve");
  assertScoreDirection(config.wind.meanWindCurve, "decreasing", "mean-wind curve");
  assertScoreDirection(config.wind.highWindProbabilityCurve, "decreasing", "high-wind curve");
  assertScoreDirection(config.rain.curve, "decreasing", "rain curve");
  assertScoreDirection(config.confidence.era5GridDistanceCurveKm, "decreasing", "grid-distance curve");
  if (!(config.confidence.levels.highMinimum > config.confidence.levels.moderateMinimum)
    || config.confidence.levels.highMinimum > 100 || config.confidence.levels.moderateMinimum < 0) {
    throw new Error("Confidence level thresholds are invalid");
  }
  if (config.confidence.version !== 2
    || !Number.isFinite(config.confidence.era5OrographyReviewElevationM)
    || config.confidence.era5OrographyReviewElevationM <= 0
    || !Number.isFinite(config.confidence.era5OrographyConfidenceCap)
    || config.confidence.era5OrographyConfidenceCap < config.confidence.levels.moderateMinimum
    || config.confidence.era5OrographyConfidenceCap >= config.confidence.levels.highMinimum) {
    throw new Error("ERA5 orography confidence guard is invalid");
  }
}

function required(value: number | null, name: string, siteId: string, month: number) {
  if (value === null || !Number.isFinite(value)) throw new Error(`${siteId} month ${month}: missing ${name}`);
  return value;
}

function metadataCompleteness(site: ObservationSite) {
  let score = 0;
  if (site.accessScore !== null) score += 50;
  if (site.publicAccess !== "unknown") score += 25;
  if (site.notesSourceUrl?.trim()) score += 25;
  return score;
}

function confidenceLevel(score: number, config: SiteScoreConfig): ConfidenceLevel {
  if (score >= config.confidence.levels.highMinimum) return "high";
  if (score >= config.confidence.levels.moderateMinimum) return "moderate";
  return "low";
}

function calculateConfidence(options: {
  month: Era5MonthlyAggregate;
  climate: Era5ClimateSnapshot;
  darkness: BlackMarbleSnapshot;
  dem: DemSnapshot | null;
  site: ObservationSite;
  config: SiteScoreConfig;
}) {
  const { month, climate, darkness, dem, site, config } = options;
  const components = {
    era5Completeness: month.dataCompleteness * 100,
    blackMarbleCoverage: darkness.coverage * 100,
    blackMarbleBaseline: Math.min(1, darkness.blackMarbleYears.length / 3) * 100,
    era5GridDistance: piecewiseScore(climate.gridDistanceKm, config.confidence.era5GridDistanceCurveKm),
    demAvailability: dem?.elevationM === null || !dem ? 0 : dem.coverage * 100,
    siteMetadata: metadataCompleteness(site),
  };
  const rawConfidence = weighted(
    Object.entries(components).map(([key, value]) => [value, config.weights.confidence[key as keyof typeof components]]),
  );
  const darknessAdjusted = darkness.coverageOverrideUsed
    ? Math.min(rawConfidence, config.confidence.levels.highMinimum - 1)
    : rawConfidence;
  const effectiveElevationM = dem?.elevationM ?? site.elevationM;
  return effectiveElevationM !== null && effectiveElevationM >= config.confidence.era5OrographyReviewElevationM
    ? Math.min(darknessAdjusted, config.confidence.era5OrographyConfidenceCap)
    : darknessAdjusted;
}

function hasEra5OrographyCaveat(site: ObservationSite, dem: DemSnapshot | null, config: SiteScoreConfig) {
  const effectiveElevationM = dem?.elevationM ?? site.elevationM;
  return effectiveElevationM !== null && effectiveElevationM >= config.confidence.era5OrographyReviewElevationM;
}

const ERA5_OROGRAPHY_CAVEAT = "High-elevation temperature and wind come from the coarse ERA5 grid and are not a summit forecast; confidence is capped at moderate";

function zeroAstronomicalNightScore(options: {
  site: ObservationSite;
  month: Era5MonthlyAggregate;
  climate: Era5ClimateSnapshot;
  darkness: BlackMarbleSnapshot;
  dem: DemSnapshot | null;
  config: SiteScoreConfig;
}): MonthlySiteScore {
  const confidence = calculateConfidence(options);
  const caveats = ["Stargazing score is forced to zero when ERA5 contains no astronomical-night hours"];
  if (hasEra5OrographyCaveat(options.site, options.dem, options.config)) caveats.push(ERA5_OROGRAPHY_CAVEAT);
  if (confidenceLevel(roundPublic(confidence), options.config) === "low") caveats.push("Low-confidence score must be excluded from unqualified top rankings");
  return {
    siteId: options.site.id,
    month: options.month.month,
    skyQuality: 0,
    tripComfort: 0,
    stargazingTrip: 0,
    clearSkyScore: 0,
    darknessScore: roundPublic(options.darkness.darknessScore ?? 0),
    dewScore: 0,
    elevationScore: 0,
    temperatureComfortScore: 0,
    windComfortScore: 0,
    rainComfortScore: 0,
    accessScore: options.site.accessScore,
    confidenceScore: roundPublic(confidence),
    confidenceLevel: confidenceLevel(roundPublic(confidence), options.config),
    reasons: ["No usable astronomical night in this climate-normal month"],
    caveats,
  };
}

export function scoreSiteMonth(options: {
  site: ObservationSite;
  month: Era5MonthlyAggregate;
  climate: Era5ClimateSnapshot;
  darkness: BlackMarbleSnapshot;
  dem: DemSnapshot | null;
  config: SiteScoreConfig;
}): MonthlySiteScore {
  const { site, month, climate, darkness, dem, config } = options;
  validateSiteScoreConfig(config);
  if (climate.siteId !== site.id || darkness.siteId !== site.id || (dem && dem.siteId !== site.id)) {
    throw new Error(`Snapshot identity mismatch for ${site.id}`);
  }
  if (climate.requestedPoint[0] !== site.lat || climate.requestedPoint[1] !== site.lon) {
    throw new Error(`ERA5 requested point mismatch for ${site.id}`);
  }
  if (dem && (dem.requestedPoint[0] !== site.lat || dem.requestedPoint[1] !== site.lon)) {
    throw new Error(`DEM requested point mismatch for ${site.id}`);
  }
  if (darkness.darknessScore === null) throw new Error(`${site.id}: calibrated darkness score is required`);
  if (month.astronomicalHourCount === 0) return zeroAstronomicalNightScore(options);

  const clearNightProbability = required(month.clearNightProbability, "clear-night probability", site.id, month.month);
  const clearHourProbability = required(month.clearHourProbability, "clear-hour probability", site.id, month.month);
  const dewRiskProbability = required(month.dewRiskProbability, "dew-risk probability", site.id, month.month);
  const nightTempMeanC = required(month.nightTempMeanC, "night temperature", site.id, month.month);
  const nightWindMeanKmh = required(month.nightWindMeanKmh, "night wind", site.id, month.month);
  const highWindHourProbability = required(month.highWindHourProbability, "high-wind probability", site.id, month.month);
  const wetNightHourProbability = required(month.wetNightHourProbability, "wet-night-hour probability", site.id, month.month);

  const clearNightScore = piecewiseScore(clearNightProbability, config.cloud.clearNightCurve);
  const clearHourScore = piecewiseScore(clearHourProbability, config.cloud.clearHourCurve);
  const clearSkyScore = weighted([
    [clearNightScore, config.cloud.clearNightWeight],
    [clearHourScore, config.cloud.clearHourWeight],
  ]);
  const dewScore = piecewiseScore(dewRiskProbability, config.dew.curve);
  const elevation = dem?.elevationM ?? site.elevationM;
  const elevationScore = elevation === null ? 0 : piecewiseScore(elevation, config.elevation.curve);
  const temperatureComfortScore = piecewiseScore(nightTempMeanC, config.temperature.curve);
  const meanWindUtility = piecewiseScore(nightWindMeanKmh, config.wind.meanWindCurve);
  const highWindUtility = piecewiseScore(highWindHourProbability, config.wind.highWindProbabilityCurve);
  const windComfortScore = weighted([
    [meanWindUtility, config.wind.meanWindWeight],
    [highWindUtility, config.wind.highWindProbabilityWeight],
  ]);
  const rainComfortScore = piecewiseScore(wetNightHourProbability, config.rain.curve);
  const skyQuality = weighted([
    [clearSkyScore, config.weights.skyQuality.clearSky],
    [darkness.darknessScore, config.weights.skyQuality.darkness],
    [dewScore, config.weights.skyQuality.dew],
    [elevationScore, config.weights.skyQuality.elevation],
  ]);

  const comfortValues: Array<[number, number]> = [
    [temperatureComfortScore, config.weights.tripComfort.temperature],
    [windComfortScore, config.weights.tripComfort.wind],
    [rainComfortScore, config.weights.tripComfort.rain],
  ];
  if (site.accessScore !== null) comfortValues.push([site.accessScore, config.weights.tripComfort.access]);
  const usedComfortWeight = comfortValues.reduce((sum, [, weight]) => sum + weight, 0);
  const tripComfort = weighted(comfortValues) / usedComfortWeight;
  const stargazingTrip = weighted([
    [skyQuality, config.weights.stargazingTrip.skyQuality],
    [tripComfort, config.weights.stargazingTrip.tripComfort],
  ]);
  const confidence = calculateConfidence(options);
  const level = confidenceLevel(roundPublic(confidence), config);
  const reasons = [
    `Clear-sky climatology score: ${roundPublic(clearSkyScore)}`,
    `Calibrated darkness score: ${roundPublic(darkness.darknessScore)}`,
  ];
  const caveats = ["Temperature comfort uses the monthly astronomical-night mean, not hourly utility"];
  if (hasEra5OrographyCaveat(site, dem, config)) caveats.push(ERA5_OROGRAPHY_CAVEAT);
  if (!dem || dem.elevationM === null) caveats.push(elevation === null ? "Elevation unavailable; conservative zero elevation score used" : "Curated elevation fallback used; DEM confidence is zero");
  if (darkness.coverageOverrideUsed) {
    caveats.push(`Reviewed Black Marble coverage override used (${Math.round(darkness.coverage * 100)}% good-quality coverage); confidence is reduced`);
  }
  if (site.accessScore === null) caveats.push("Access is unknown; trip-comfort climate weights were renormalized");
  if (level === "low") caveats.push("Low-confidence score must be excluded from unqualified top rankings");

  return {
    siteId: site.id,
    month: month.month,
    skyQuality: roundPublic(skyQuality),
    tripComfort: roundPublic(tripComfort),
    stargazingTrip: roundPublic(stargazingTrip),
    clearSkyScore: roundPublic(clearSkyScore),
    darknessScore: roundPublic(darkness.darknessScore),
    dewScore: roundPublic(dewScore),
    elevationScore: roundPublic(elevationScore),
    temperatureComfortScore: roundPublic(temperatureComfortScore),
    windComfortScore: roundPublic(windComfortScore),
    rainComfortScore: roundPublic(rainComfortScore),
    accessScore: site.accessScore,
    confidenceScore: roundPublic(confidence),
    confidenceLevel: level,
    reasons,
    caveats,
  };
}

export function scoreSite(options: {
  site: ObservationSite;
  climate: Era5ClimateSnapshot;
  darkness: BlackMarbleSnapshot;
  dem: DemSnapshot | null;
  config: SiteScoreConfig;
}) {
  if (options.climate.months.length !== 12 || new Set(options.climate.months.map((month) => month.month)).size !== 12) {
    throw new Error(`${options.site.id}: climate snapshot must contain 12 unique months`);
  }
  return [...options.climate.months]
    .sort((left, right) => left.month - right.month)
    .map((month) => scoreSiteMonth({ ...options, month }));
}
