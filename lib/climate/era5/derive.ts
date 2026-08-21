import { sunAltitudeDeg } from "./astronomy.js";
import { localNightDate } from "./time.js";
import type { Era5DerivedHour, Era5RawHour, Era5SiteContext, Era5Thresholds } from "./types.js";

type SunAltitudeCalculator = (date: Date, lat: number, lon: number, elevationM: number) => number;

function assertRange(value: number, min: number, max: number, label: string) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be within ${min}..${max}; received ${value}`);
  }
}

export function deriveEra5Hour(
  raw: Era5RawHour,
  site: Era5SiteContext,
  thresholds: Era5Thresholds,
  altitudeCalculator: SunAltitudeCalculator = sunAltitudeDeg,
): Era5DerivedHour {
  assertRange(raw.totalCloudCover, 0, 1, "total cloud cover");
  assertRange(raw.temperatureK, 150, 350, "2m temperature K");
  assertRange(raw.dewpointTemperatureK, 150, 350, "2m dewpoint K");
  assertRange(raw.totalPrecipitationM, 0, 10, "total precipitation m");
  const date = new Date(raw.validTimeUtc);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid validTimeUtc: ${raw.validTimeUtc}`);

  const tempC = raw.temperatureK - 273.15;
  const dewC = raw.dewpointTemperatureK - 273.15;
  const dewpointDepressionC = tempC - dewC;
  const windMs = Math.hypot(raw.u10Ms, raw.v10Ms);
  const windKmh = windMs * 3.6;
  // Time-series tp is the one-hour accumulation ending at validTimeUtc, in metres.
  const precipitationMm = raw.totalPrecipitationM * 1000;
  const sunAltitude = altitudeCalculator(date, site.lat, site.lon, site.elevationM ?? 0);

  return {
    ...raw,
    sunAltitudeDeg: sunAltitude,
    astronomicalNight: sunAltitude <= thresholds.astronomicalNightSunAltitudeDeg,
    nightDate: localNightDate(date, site.timezone),
    tempC,
    dewC,
    dewpointDepressionC,
    windMs,
    windKmh,
    precipitationMm,
    clearHour: raw.totalCloudCover <= thresholds.clearCloudCoverMax,
    goodHour: raw.totalCloudCover <= thresholds.goodCloudCoverMax,
    overcastHour: raw.totalCloudCover >= thresholds.overcastCloudCoverMin,
    wetHour: precipitationMm >= thresholds.wetPrecipitationMmPerHourMin,
    dewRiskHour: dewpointDepressionC <= thresholds.dewRiskDepressionCMax,
    highWindHour: windKmh >= thresholds.highWindKmhMin,
  };
}
