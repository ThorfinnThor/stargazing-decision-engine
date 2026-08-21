import { resolve } from "node:path";

import { buildImageManifest } from "../../lib/images/images.js";
import type { Destination, ImageAssetConfig, ObservationSite } from "../../lib/data/types.js";
import { generatedPath, publicDataDir, publicPath, readJson, root, seedGeneratedAt, writeJson } from "../pipeline/io.js";

interface SeedData { destinations: Destination[]; sites: ObservationSite[] }
const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const destinationImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/destination-images.json"));
const siteImages = readJson<ImageAssetConfig[]>(resolve(root, "data-config/sources/site-images.json"));
const manifest = buildImageManifest({ destinations: seed.destinations, sites: seed.sites, destinationImages, siteImages, generatedAt: seedGeneratedAt, publicRoot: root });
writeJson(publicPath("images/manifest.json"), manifest);
console.log(`Built image manifest: ${manifest.destinations.length} destination assets and ${manifest.sites.length} site assets (${manifest.destinations.filter((asset) => asset.status === "approved").length + manifest.sites.filter((asset) => asset.status === "approved").length} approved).`);
