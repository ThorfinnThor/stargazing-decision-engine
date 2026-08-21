import type { Era5SiteContext, Era5Thresholds } from "./types.js";

export interface Era5SourceConfig {
  dataset: string;
  climateNormal: { startDate: string; endDate: string };
  variables: string[];
  thresholds: Era5Thresholds;
  request: { dataFormat: "csv" | "netcdf"; retryMax: number; timeoutSeconds: number };
}

const shiftIsoDate = (iso: string, days: number) => {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export function buildEra5Request(site: Era5SiteContext, config: Era5SourceConfig) {
  // UTC buffer captures complete local noon-to-noon nights at the normal boundaries.
  const requestStart = shiftIsoDate(config.climateNormal.startDate, -1);
  const requestEnd = shiftIsoDate(config.climateNormal.endDate, 2);
  return {
    dataset: config.dataset,
    request: {
      variable: config.variables,
      location: { longitude: site.lon, latitude: site.lat },
      date: [`${requestStart}/${requestEnd}`],
      data_format: config.request.dataFormat,
    },
    climateNormal: config.climateNormal,
  } as const;
}
