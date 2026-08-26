import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { publicDataDir, readJson, root } from "../pipeline/io.js";

interface Manifest {
  counts?: Record<string, number>;
  sourceVersions?: Record<string, string>;
}

interface ImageManifest {
  destinations: Array<{ status: string }>;
  sites: Array<{ status: string }>;
}

const errors: string[] = [];
const manifestPath = resolve(publicDataDir, "manifest.json");
if (!existsSync(manifestPath)) errors.push("public dataset manifest is missing");
else {
  const manifest = readJson<Manifest>(manifestPath);
  for (const key of ["destinations", "observationSites", "calendarFiles", "meteorShowerFiles", "shortTripFiles"]) {
    if (!Number.isInteger(manifest.counts?.[key]) || (manifest.counts?.[key] ?? 0) < 1) errors.push(`manifest count ${key} must be positive`);
  }
  for (const key of ["dataset", "calendar", "meteorShowers", "shortTrips"]) {
    if (!manifest.sourceVersions?.[key]) errors.push(`manifest sourceVersions.${key} is missing`);
  }
}

function countJsonFiles(directory: string): number {
  if (!existsSync(directory)) return 0;
  return readdirSync(directory).reduce((count, entry) => {
    const path = resolve(directory, entry);
    return statSync(path).isDirectory() ? count + countJsonFiles(path) : count + (entry.endsWith(".json") ? 1 : 0);
  }, 0);
}

const calendarCount = countJsonFiles(resolve(publicDataDir, "calendar"));
if (calendarCount < 1) errors.push("no static calendar files found");
if (existsSync(manifestPath)) {
  const manifest = readJson<Manifest>(manifestPath);
  if (manifest.counts?.calendarFiles !== calendarCount) errors.push(`manifest calendarFiles=${manifest.counts?.calendarFiles ?? "missing"} does not match ${calendarCount} published calendar files`);
  const imageManifestPath = resolve(publicDataDir, "images/manifest.json");
  if (existsSync(imageManifestPath)) {
    const images = readJson<ImageManifest>(imageManifestPath);
    const allImages = [...images.destinations, ...images.sites];
    const approvedImages = allImages.filter((image) => image.status === "approved").length;
    if (manifest.counts?.imageAssets !== allImages.length) errors.push(`manifest imageAssets=${manifest.counts?.imageAssets ?? "missing"} does not match ${allImages.length} image records`);
    if (manifest.counts?.approvedImageAssets !== approvedImages) errors.push(`manifest approvedImageAssets=${manifest.counts?.approvedImageAssets ?? "missing"} does not match ${approvedImages} approved images`);
  }
}
const requiredDataFiles = [
  "destinations/index.json",
  "sites/index.json",
  "search/destination-index.json",
  "events/meteor-showers/2027/perseids.json",
  "short-trips/amsterdam.json",
  "seo/registry.json",
  "gear/categories.json",
  "images/manifest.json",
];
for (const relativePath of requiredDataFiles) {
  if (!existsSync(resolve(publicDataDir, relativePath))) errors.push(`required static file is missing: ${relativePath}`);
}
if (!existsSync(resolve(root, "public/go/manifest.json"))) errors.push("required static file is missing: public/go/manifest.json");
if (!existsSync(resolve(root, "public/_headers"))) errors.push("required Cloudflare static headers file is missing: public/_headers");
const redirectsPath = resolve(root, "public/_redirects");
if (!existsSync(redirectsPath) || !/^\/\s+\/en\/\s+301\s*$/m.test(readFileSync(redirectsPath, "utf8"))) {
  errors.push("Cloudflare root redirect to the canonical English homepage is missing");
}

for (const relativePath of ["out/sitemap.xml", "out/robots.txt"]) {
  const path = resolve(root, relativePath);
  if (!existsSync(path) || readFileSync(path, "utf8").trim().length === 0) errors.push(`built artifact is missing or empty: ${relativePath}`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Health check passed (${calendarCount} calendar files, required static artifacts present).`);
}
