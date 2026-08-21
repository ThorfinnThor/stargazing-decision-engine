import { resolve } from "node:path";

import { buildImageManifest } from "../../lib/images/images.js";
import type { Destination, ImageAssetConfig, ImageManifest, ObservationSite } from "../../lib/data/types.js";
import { generatedPath, publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

interface SeedData { destinations: Destination[]; sites: ObservationSite[] }
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const destinationImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/destination-images.json"));
const siteImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/site-images.json"));
const expected = buildImageManifest({ destinations: seed.destinations, sites: seed.sites, destinationImages, siteImages, generatedAt: "2026-08-20T00:00:00.000Z", publicRoot: root });
const actual = readJson<ImageManifest>(resolve(publicDataDir, "images/manifest.json"));
const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/image-manifest.json");
const errors: string[] = [];
if (!validate?.(actual)) errors.push(JSON.stringify(validate?.errors ?? "image manifest schema missing"));
if (JSON.stringify({ ...actual, generatedAt: expected.generatedAt }) !== JSON.stringify(expected)) errors.push("published image manifest is not reproducible from config");
if (errors.length > 0) { for (const error of errors) console.error(error); process.exitCode = 1; } else console.log(`Validated ${actual.destinations.length + actual.sites.length} image manifest records; pending assets remain non-published placeholders.`);
