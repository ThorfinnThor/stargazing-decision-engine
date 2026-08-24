import { existsSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, ImageAssetConfig, ImageManifest, ObservationSite, PublicImageAsset } from "../data/types.js";

/** Explicitly free-to-use image licenses; NC/ND and unclear terms are rejected. */
export const allowedImageLicenses = [
  "CC0",
  "CC BY",
  "CC BY-SA",
  "Public Domain",
  "Public Domain Mark",
  "NASA Public Domain",
  "U.S. Government Work",
] as const;

function checkedDate(value: string | undefined, label: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label}: checkedAt must be an ISO date`);
  return value;
}

function normalizeAsset(asset: ImageAssetConfig, label: string, fallbackAlt: { en: string; de: string }): PublicImageAsset {
  if (asset.status === "pending") {
    if (!asset.overrideReason?.trim()) throw new Error(`${label}: pending image requires overrideReason`);
    return { slug: asset.slug, status: "pending", localPath: null, sourceUrl: null, sourceTitle: null, author: null, license: null, licenseUrl: null, attribution: null, alt: asset.alt ?? fallbackAlt, checkedAt: checkedDate(asset.checkedAt ?? "2026-08-21", label), overrideReason: asset.overrideReason };
  }
  if (!asset.localPath?.startsWith("/images/") || !asset.localPath.endsWith(".webp")) throw new Error(`${label}: approved image must be a self-hosted WebP under /images/`);
  if (!asset.sourceUrl?.startsWith("https://") || !asset.sourceTitle?.trim() || !asset.author?.trim() || !asset.license || !allowedImageLicenses.includes(asset.license as typeof allowedImageLicenses[number]) || !asset.licenseUrl?.startsWith("https://") || !asset.attribution?.trim()) throw new Error(`${label}: approved image provenance is incomplete`);
  return { slug: asset.slug, status: "approved", localPath: asset.localPath, sourceUrl: asset.sourceUrl, sourceTitle: asset.sourceTitle, author: asset.author, license: asset.license, licenseUrl: asset.licenseUrl, attribution: asset.attribution, alt: asset.alt ?? fallbackAlt, checkedAt: checkedDate(asset.checkedAt, label), overrideReason: null };
}

function validateCoverage<T extends { slug: string }>(items: T[], configs: ImageAssetConfig[], kind: string) {
  const expected = new Set(items.map((item) => item.slug));
  const actual = new Set(configs.map((item) => item.slug));
  if (actual.size !== configs.length || configs.some((item) => !expected.has(item.slug)) || actual.size !== expected.size) throw new Error(`${kind} image config must cover each active target exactly once`);
}

export function buildImageManifest(options: { destinations: Destination[]; sites: ObservationSite[]; destinationImages: ImageAssetConfig[]; siteImages: ImageAssetConfig[]; generatedAt: string; publicRoot: string }): ImageManifest {
  const destinations = options.destinations.filter((item) => item.active);
  const sites = options.sites.filter((item) => item.active);
  validateCoverage(destinations, options.destinationImages, "Destination");
  validateCoverage(sites, options.siteImages, "Site");
  const destinationAssets = destinations.map((destination) => normalizeAsset(options.destinationImages.find((asset) => asset.slug === destination.slug)!, `destination:${destination.slug}`, { en: `${destination.name} stargazing destination`, de: `${destination.name} Sternbeobachtungsziel` }));
  const siteAssets = sites.map((site) => normalizeAsset(options.siteImages.find((asset) => asset.slug === site.slug)!, `site:${site.slug}`, { en: `${site.name} observing site`, de: `${site.name} Beobachtungsort` }));
  for (const asset of [...destinationAssets, ...siteAssets]) if (asset.status === "approved" && !existsSync(resolve(options.publicRoot, asset.localPath!.replace(/^\//, "")))) throw new Error(`${asset.slug}: local image file is missing`);
  return { version: 1, generatedAt: options.generatedAt, policy: { allowedLicenses: [...allowedImageLicenses], requiredFormat: "webp", hosting: "self" }, destinations: destinationAssets, sites: siteAssets };
}
