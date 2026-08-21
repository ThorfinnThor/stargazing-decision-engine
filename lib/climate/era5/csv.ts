import { parse } from "csv-parse/sync";

import { normalizeUtcTimestamp } from "./time.js";
import type { Era5RawHour } from "./types.js";

type CsvRow = Record<string, string>;
type PartialHour = Partial<Era5RawHour> & Pick<Era5RawHour, "validTimeUtc">;

const aliases = {
  time: ["valid_time", "time", "date"],
  latitude: ["latitude", "lat"],
  longitude: ["longitude", "lon"],
  totalCloudCover: ["total_cloud_cover", "tcc"],
  temperatureK: ["2m_temperature", "t2m"],
  dewpointTemperatureK: ["2m_dewpoint_temperature", "d2m"],
  u10Ms: ["10m_u_component_of_wind", "u10"],
  v10Ms: ["10m_v_component_of_wind", "v10"],
  totalPrecipitationM: ["total_precipitation", "tp"],
} as const;

function pick(row: CsvRow, names: readonly string[]) {
  for (const name of names) if (row[name] !== undefined && row[name] !== "") return row[name];
  return undefined;
}

function numeric(value: string | undefined, label: string) {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid ${label}: ${value}`);
  return parsed;
}

function mergeNumber(target: PartialHour, key: keyof Era5RawHour, value: number | undefined) {
  if (value === undefined) return;
  const existing = target[key];
  if (typeof existing === "number" && Math.abs(existing - value) > 1e-9) {
    throw new Error(`Conflicting ERA5 ${key} value at ${target.validTimeUtc}`);
  }
  (target as Record<string, unknown>)[key] = value;
}

export function parseEra5Csv(contents: string[]) {
  const hours = new Map<string, PartialHour>();
  for (const content of contents) {
    const rows = parse(content, { columns: true, skip_empty_lines: true, trim: true }) as CsvRow[];
    for (const row of rows) {
      const rawTime = pick(row, aliases.time);
      if (!rawTime) throw new Error("ERA5 CSV row has no valid_time column");
      const validTimeUtc = normalizeUtcTimestamp(rawTime);
      const hour = hours.get(validTimeUtc) ?? { validTimeUtc };
      mergeNumber(hour, "gridLat", numeric(pick(row, aliases.latitude), "latitude"));
      mergeNumber(hour, "gridLon", numeric(pick(row, aliases.longitude), "longitude"));
      mergeNumber(hour, "totalCloudCover", numeric(pick(row, aliases.totalCloudCover), "total cloud cover"));
      mergeNumber(hour, "temperatureK", numeric(pick(row, aliases.temperatureK), "temperature"));
      mergeNumber(hour, "dewpointTemperatureK", numeric(pick(row, aliases.dewpointTemperatureK), "dewpoint"));
      mergeNumber(hour, "u10Ms", numeric(pick(row, aliases.u10Ms), "u10"));
      mergeNumber(hour, "v10Ms", numeric(pick(row, aliases.v10Ms), "v10"));
      mergeNumber(hour, "totalPrecipitationM", numeric(pick(row, aliases.totalPrecipitationM), "total precipitation"));
      hours.set(validTimeUtc, hour);
    }
  }

  const required: Array<keyof Era5RawHour> = [
    "gridLat", "gridLon", "totalCloudCover", "temperatureK", "dewpointTemperatureK", "u10Ms", "v10Ms", "totalPrecipitationM",
  ];
  return [...hours.values()].map((hour) => {
    const missing = required.filter((key) => hour[key] === undefined);
    if (missing.length > 0) throw new Error(`ERA5 timestamp ${hour.validTimeUtc} is missing ${missing.join(", ")}`);
    return hour as Era5RawHour;
  }).sort((a, b) => a.validTimeUtc.localeCompare(b.validTimeUtc));
}
