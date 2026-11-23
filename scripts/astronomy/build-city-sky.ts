import { existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { limitingMagnitudeForExposure, type CitySkyFile, type CitySkyRow, type ExposureMagnitudePoint } from "../../lib/astronomy/light-pollution.js";
import type { DarknessDistribution } from "../../lib/darkness/calibration/types.js";
import { publicPath, readJson, root } from "../pipeline/io.js";

export type ComparisonCitiesFile = {
  version: 1;
  source: { cities: { name: string; url: string; license: string }; labels: { name: string; url: string; license: string } };
  cities: { id: string; geonameId: number; name: { en: string; de: string }; country: string; lat: number; lon: number; timeZone: string; population: number }[];
};
export type CityMeasurementsFile = {
  version: 1; source: string; collectionVersion: string; radianceLayer: string; year: number;
  cities: { id: string; coverage: number; alanExposure: number | null }[];
};
export type CitySkyBrightnessConfig = {
  version: 1; method: string; minimumCoverage: number;
  curve: { distribution: "dark_reference" | "mid_reference" | "urban_control"; statistic: keyof DarknessDistribution; limitingMagnitude: number }[];
};
type DarknessFile = { calibratedAt: string; distributions: Record<string, DarknessDistribution> };

export const citySkyOutputPath = publicPath("astronomy/city-sky.json");
export const cityMeasurementsPath = resolve(root, "data-snapshots/black-marble/cities/measurements.json");

export function resolveExposureCurve(config: CitySkyBrightnessConfig, darkness: DarknessFile): ExposureMagnitudePoint[] {
  return config.curve.map((point) => {
    const value = darkness.distributions[point.distribution]?.[point.statistic];
    if (typeof value !== "number") throw new Error(`Missing calibration statistic ${point.distribution}.${point.statistic}`);
    return { alanExposure: value, limitingMagnitude: point.limitingMagnitude };
  });
}

export function buildCitySky(input: { cities: ComparisonCitiesFile; measurements: CityMeasurementsFile; config: CitySkyBrightnessConfig; darkness: DarknessFile }) {
  const curve = resolveExposureCurve(input.config, input.darkness);
  const byId = new Map(input.measurements.cities.map((item) => [item.id, item]));
  const rows: CitySkyRow[] = [];
  const skipped: string[] = [];
  for (const city of input.cities.cities) {
    const measurement = byId.get(city.id);
    if (!measurement || measurement.alanExposure === null || measurement.coverage < input.config.minimumCoverage) {
      skipped.push(city.id);
      continue;
    }
    const limitingMagnitude = Math.round(limitingMagnitudeForExposure(measurement.alanExposure, curve) * 10) / 10;
    rows.push([city.id, city.name.en, city.name.de === city.name.en ? "" : city.name.de, city.country, city.lat, city.lon, city.timeZone, limitingMagnitude]);
  }
  const file: CitySkyFile = {
    version: 1,
    source: {
      blackMarble: { product: input.measurements.source, collectionVersion: input.measurements.collectionVersion, year: input.measurements.year, radianceLayer: input.measurements.radianceLayer },
      cities: input.cities.source.cities,
      labels: input.cities.source.labels,
      method: input.config.method,
      calibratedAt: input.darkness.calibratedAt,
    },
    cities: rows,
  };
  return { file, skipped };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(cityMeasurementsPath)) {
    console.log("No city Black Marble measurements yet; city-sky.json not written (the page falls back to reference cities).");
  } else {
    const { file, skipped } = buildCitySky({
      cities: readJson<ComparisonCitiesFile>(resolve(root, "data-config/astronomy/comparison-cities.json")),
      measurements: readJson<CityMeasurementsFile>(cityMeasurementsPath),
      config: readJson<CitySkyBrightnessConfig>(resolve(root, "data-config/astronomy/city-sky-brightness.json")),
      darkness: readJson<DarknessFile>(resolve(root, "data-config/scoring/darkness.json")),
    });
    // Compact on purpose: this file is fetched by the browser.
    writeFileSync(citySkyOutputPath, `${JSON.stringify(file)}\n`);
    console.log(`Wrote ${file.cities.length} city sky estimates; skipped ${skipped.length}${skipped.length ? ` (${skipped.slice(0, 20).join(", ")}${skipped.length > 20 ? ", …" : ""})` : ""}.`);
  }
}
