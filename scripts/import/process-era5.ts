import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { parseEra5Csv } from "../../lib/climate/era5/csv.js";
import { buildEra5Snapshot } from "../../lib/climate/era5/snapshot.js";
import type { Era5SourceConfig } from "../../lib/climate/era5/request.js";
import type { ObservationSite } from "../../lib/data/types.js";
import { readJson, root, writeJson } from "../pipeline/io.js";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function csvFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = resolve(directory, entry);
    if (statSync(fullPath).isDirectory()) return csvFiles(fullPath);
    return entry.toLowerCase().endsWith(".csv") ? [fullPath] : [];
  });
}

const siteSlug = argument("--site");
if (!siteSlug) throw new Error("Usage: pnpm data:era5:process -- --site <site-slug>");

const config = readJson<Era5SourceConfig>(resolve(root, "data-config/sources/era5.json"));
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const site = sites.find((item) => item.slug === siteSlug);
if (!site) throw new Error(`Unknown site slug: ${siteSlug}`);

const rawDirectory = resolve(root, "raw-downloads/era5", siteSlug);
const files = csvFiles(rawDirectory);
if (files.length === 0) throw new Error(`No cached ERA5 CSV files found for ${siteSlug}`);
const rows = parseEra5Csv(files.map((file) => readFileSync(file, "utf8")));

const metadataPath = resolve(rawDirectory, "metadata.json");
const metadata = readJson<{ retrievedAt: string }>(metadataPath);
const snapshot = buildEra5Snapshot({
  rows,
  site: {
    siteId: site.id,
    timezone: resolveTimezone(site.destinationId),
    lat: site.lat,
    lon: site.lon,
    elevationM: site.elevationM,
  },
  thresholds: config.thresholds,
  retrievedAt: metadata.retrievedAt,
});

writeJson(resolve(root, "data-snapshots/climate", `${site.slug}.json`), snapshot);
console.log(`Processed ERA5 snapshot for ${site.slug}: ${rows.length} hourly rows.`);

function resolveTimezone(destinationId: string) {
  const destinations = readJson<Array<{ id: string; timezone: string }>>(resolve(root, "data-config/sources/destinations.json"));
  const destination = destinations.find((item) => item.id === destinationId);
  if (!destination) throw new Error(`No destination timezone for ${destinationId}`);
  return destination.timezone;
}
