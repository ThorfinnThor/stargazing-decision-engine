import { haversineKm } from "../../climate/era5/distance.js";
import type {
  BlackMarbleConfig,
  BlackMarbleExtractedYear,
  BlackMarblePixel,
  BlackMarbleRingConfig,
  BlackMarbleYearRingMetric,
} from "./types.js";

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function ringForDistance(distanceKm: number, rings: BlackMarbleRingConfig[]) {
  return rings.find((ring) =>
    distanceKm >= ring.minKm && (ring.upperInclusive ? distanceKm <= ring.maxKm : distanceKm < ring.maxKm));
}

export function summarizeBlackMarbleYear(
  input: BlackMarbleExtractedYear,
  site: { lat: number; lon: number },
  config: BlackMarbleConfig,
  distanceCalculator: (pixel: BlackMarblePixel) => number = (pixel) =>
    haversineKm(site.lat, site.lon, pixel.lat, pixel.lon),
) {
  const buckets = new Map(config.rings.map((ring) => [ring.id, { total: 0, values: [] as number[] }]));
  const accepted = new Set(config.layer.acceptedQualityValues);

  for (const pixel of input.pixels) {
    const ring = ringForDistance(distanceCalculator(pixel), config.rings);
    if (!ring) continue;
    const bucket = buckets.get(ring.id);
    if (!bucket) throw new Error(`Unknown Black Marble ring: ${ring.id}`);
    bucket.total += 1;
    if (pixel.radiance !== null && Number.isFinite(pixel.radiance) && pixel.radiance >= 0 && accepted.has(pixel.quality)) {
      bucket.values.push(pixel.radiance);
    }
  }

  return config.rings.map((ring): BlackMarbleYearRingMetric & { ringId: BlackMarbleRingConfig["id"] } => {
    const bucket = buckets.get(ring.id)!;
    const radiance = bucket.values.length === 0
      ? null
      : ring.statistic === "median" ? median(bucket.values) : mean(bucket.values);
    return {
      ringId: ring.id,
      year: input.year,
      radiance,
      coverage: bucket.total === 0 ? 0 : bucket.values.length / bucket.total,
      validPixelCount: bucket.values.length,
      totalPixelCount: bucket.total,
    };
  });
}

export function robustMedian(values: number[]) {
  if (values.length === 0) return null;
  return median(values);
}
