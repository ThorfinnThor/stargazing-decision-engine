import type { MonthNumber } from "../../data/types.js";

export interface Era5Thresholds {
  astronomicalNightSunAltitudeDeg: number;
  clearCloudCoverMax: number;
  goodCloudCoverMax: number;
  overcastCloudCoverMin: number;
  wetPrecipitationMmPerHourMin: number;
  dewRiskDepressionCMax: number;
  highWindKmhMin: number;
  clearSequenceHoursMin: number;
}

export interface Era5RawHour {
  validTimeUtc: string;
  gridLat: number;
  gridLon: number;
  totalCloudCover: number;
  temperatureK: number;
  dewpointTemperatureK: number;
  u10Ms: number;
  v10Ms: number;
  /** ERA5 hourly time-series accumulation for the hour ending at validTimeUtc, in metres. */
  totalPrecipitationM: number;
}

export interface Era5SiteContext {
  siteId: string;
  timezone: string;
  lat: number;
  lon: number;
  elevationM: number | null;
}

export interface Era5DerivedHour extends Era5RawHour {
  sunAltitudeDeg: number;
  astronomicalNight: boolean;
  nightDate: string;
  tempC: number;
  dewC: number;
  dewpointDepressionC: number;
  windMs: number;
  windKmh: number;
  precipitationMm: number;
  clearHour: boolean;
  goodHour: boolean;
  overcastHour: boolean;
  wetHour: boolean;
  dewRiskHour: boolean;
  highWindHour: boolean;
}

export interface Era5MonthlyAggregate {
  month: MonthNumber;
  astronomicalHourCount: number;
  nightCount: number;
  clearHourProbability: number | null;
  goodHourProbability: number | null;
  overcastHourProbability: number | null;
  clearNightProbability: number | null;
  goodNightProbability: number | null;
  wetNightHourProbability: number | null;
  dewRiskProbability: number | null;
  nightTempMeanC: number | null;
  nightTempP10C: number | null;
  nightTempP90C: number | null;
  nightWindMeanKmh: number | null;
  highWindHourProbability: number | null;
  dataCompleteness: number;
  sampleYearCount: number;
}

export interface Era5ClimateSnapshot {
  siteId: string;
  source: "era5-single-levels-timeseries";
  climateNormal: {
    startYear: 1991;
    endYear: 2020;
  };
  requestedPoint: [number, number];
  gridPoint: [number, number];
  gridDistanceKm: number;
  retrievedAt: string;
  precipitationConvention: "hourly-accumulation-ending-at-valid-time-metres-to-mm";
  months: Era5MonthlyAggregate[];
}
