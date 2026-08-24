import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { buildImageManifest } from "../../lib/images/images.js";
import type { Destination, ImageAssetConfig, ImageManifest, ObservationSite } from "../../lib/data/types.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

interface SeedData { destinations: Destination[]; sites: ObservationSite[] }
interface P3Candidate {
  destinationSlug: string;
  sourceTitle: string;
  sourceUrl: string;
  creator: string;
  licenseFamily: string;
  licenseUrl: string;
  attribution: string;
}
interface P3Register { audit: { reviewedAt: string }; candidates: P3Candidate[] }
const normalize = <T extends { id: string; slug: string }>(items: T[]) => [...items]
  .sort((left, right) => left.id.localeCompare(right.id))
  .map((item) => ({ ...item, slug: item.slug.trim().toLowerCase() }));
const seed: SeedData = {
  destinations: normalize(readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"))),
  sites: normalize(readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"))),
};
const destinationImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/destination-images.json"));
const siteImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/site-images.json"));
const p3 = readJson<P3Register>(resolve(root, "data-config/sources/p3-image-candidates.json"));
const expected = buildImageManifest({ destinations: seed.destinations, sites: seed.sites, destinationImages, siteImages, generatedAt: "2026-08-20T00:00:00.000Z", publicRoot: root });
const actual = readJson<ImageManifest>(resolve(publicDataDir, "images/manifest.json"));
const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/image-manifest.json");
const errors: string[] = [];
if (!validate?.(actual)) errors.push(JSON.stringify(validate?.errors ?? "image manifest schema missing"));
if (JSON.stringify({ ...actual, generatedAt: expected.generatedAt }) !== JSON.stringify(expected)) errors.push("published image manifest is not reproducible from config");
for (const candidate of p3.candidates) {
  const production = destinationImages.find((image) => image.slug === candidate.destinationSlug);
  if (production?.status === "pending") continue;
  const expectedFields = {
    status: "approved",
    localPath: `/images/destinations/${candidate.destinationSlug}.webp`,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.sourceTitle,
    author: candidate.creator,
    license: candidate.licenseFamily,
    licenseUrl: candidate.licenseUrl,
    attribution: candidate.attribution,
    checkedAt: p3.audit.reviewedAt,
  };
  if (!production || production.status !== "approved" || Object.entries(expectedFields).some(([key, value]) => production[key as keyof ImageAssetConfig] !== value)) {
    errors.push(`${candidate.destinationSlug}: production config does not match the Sol-audited candidate`);
    continue;
  }
  const imagePath = resolve(root, "public", production.localPath!.replace(/^\//, ""));
  const header = readFileSync(imagePath).subarray(0, 12);
  if (header.subarray(0, 4).toString("ascii") !== "RIFF" || header.subarray(8, 12).toString("ascii") !== "WEBP") {
    errors.push(`${candidate.destinationSlug}: approved local asset is not a WebP file`);
  }
  const bytes = statSync(imagePath).size;
  if (bytes < 10_000 || bytes > 1_000_000) errors.push(`${candidate.destinationSlug}: approved WebP size is outside the 10 KB–1 MB delivery guardrail`);
}
if (errors.length > 0) { for (const error of errors) console.error(error); process.exitCode = 1; } else console.log(`Validated ${actual.destinations.length + actual.sites.length} image manifest records; pending assets remain non-published placeholders.`);
