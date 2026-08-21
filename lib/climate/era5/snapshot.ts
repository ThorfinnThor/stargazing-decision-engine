import { aggregateEra5Months, computeExpectedAstronomicalHours } from "./aggregate.js";
import { deriveEra5Hour } from "./derive.js";
import { haversineKm } from "./distance.js";
import type { Era5ClimateSnapshot, Era5RawHour, Era5SiteContext, Era5Thresholds } from "./types.js";

export function buildEra5Snapshot(options: {
  rows: Era5RawHour[];
  site: Era5SiteContext;
  thresholds: Era5Thresholds;
  retrievedAt: string;
  expectedAstronomicalHours?: ReadonlyMap<number, number>;
}) : Era5ClimateSnapshot {
  const { rows, site, thresholds, retrievedAt } = options;
  if (rows.length === 0) throw new Error(`ERA5 input is empty for ${site.siteId}`);
  const gridLat = rows[0].gridLat;
  const gridLon = rows[0].gridLon;
  if (rows.some((row) => Math.abs(row.gridLat - gridLat) > 1e-9 || Math.abs(row.gridLon - gridLon) > 1e-9)) {
    throw new Error(`ERA5 input mixes grid points for ${site.siteId}`);
  }
  const derived = rows.map((row) => deriveEra5Hour(row, site, thresholds));
  const expected = options.expectedAstronomicalHours ?? computeExpectedAstronomicalHours(site, thresholds);
  return {
    siteId: site.siteId,
    source: "era5-single-levels-timeseries",
    climateNormal: { startYear: 1991, endYear: 2020 },
    requestedPoint: [site.lat, site.lon],
    gridPoint: [gridLat, gridLon],
    gridDistanceKm: Math.round(haversineKm(site.lat, site.lon, gridLat, gridLon) * 1000) / 1000,
    retrievedAt,
    precipitationConvention: "hourly-accumulation-ending-at-valid-time-metres-to-mm",
    months: aggregateEra5Months(derived, thresholds, expected),
  };
}
