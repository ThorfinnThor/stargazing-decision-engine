import { existsSync, readFileSync, statSync } from "node:fs";
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
interface DestinationImageAuditCandidate extends P3Candidate {
  originalWidth: number;
  originalHeight: number;
  alt: { en: string; de: string };
  reviewedAt: string;
  reviewStatus: string;
}
interface DestinationImageAudit {
  audit: { reviewedAt: string; status: string; visualReviewCount: number; metadataVerificationCount: number };
  policy: { minimumOriginalWidth: number; minimumOriginalHeight: number };
  candidates: DestinationImageAuditCandidate[];
}
interface SiteImageAuditRecord {
  siteSlug: string;
  destinationSlug: string;
  reuseKind: string;
  localPath: string;
  sourceUrl: string;
  sourceTitle: string;
  creator: string;
  license: string;
  licenseUrl: string;
  attribution: string;
  alt: { en: string; de: string };
  checkedAt: string;
}
interface SiteImageAudit {
  audit: { reviewedAt: string; status: string; siteMappingReviewCount: number; uniqueSourceAssetCount: number };
  records: SiteImageAuditRecord[];
}
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
const destinationImageAuditPath = resolve(root, "data-config/sources/destination-image-audit-2026-09-08.json");
const destinationImageAudit = existsSync(destinationImageAuditPath)
  ? readJson<DestinationImageAudit>(destinationImageAuditPath)
  : undefined;
const siteImageAuditPath = resolve(root, "data-config/sources/site-image-audit-2026-09-08.json");
const siteImageAudit = existsSync(siteImageAuditPath)
  ? readJson<SiteImageAudit>(siteImageAuditPath)
  : undefined;
const expected = buildImageManifest({ destinations: seed.destinations, sites: seed.sites, destinationImages, siteImages, generatedAt: "2026-08-20T00:00:00.000Z", publicRoot: root });
const actual = readJson<ImageManifest>(resolve(publicDataDir, "images/manifest.json"));
const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/image-manifest.json");
const errors: string[] = [];
if (!validate?.(actual)) errors.push(JSON.stringify(validate?.errors ?? "image manifest schema missing"));
if (JSON.stringify({ ...actual, generatedAt: expected.generatedAt }) !== JSON.stringify(expected)) errors.push("published image manifest is not reproducible from config");
if (siteImages.some((image) => image.status === "approved") && !siteImageAudit) errors.push("approved site images require a site image audit");
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
if (destinationImageAudit) {
  if (destinationImageAudit.audit.status !== "approved-for-publication") errors.push("destination image audit is not approved for publication");
  if (destinationImageAudit.audit.visualReviewCount !== destinationImageAudit.candidates.length
    || destinationImageAudit.audit.metadataVerificationCount !== destinationImageAudit.candidates.length) {
    errors.push("destination image audit counts do not cover every candidate");
  }
  for (const candidate of destinationImageAudit.candidates) {
    if (candidate.reviewStatus !== "approved-after-metadata-and-visual-review") errors.push(`${candidate.destinationSlug}: image audit approval is missing`);
    if (candidate.originalWidth < destinationImageAudit.policy.minimumOriginalWidth
      || candidate.originalHeight < destinationImageAudit.policy.minimumOriginalHeight) {
      errors.push(`${candidate.destinationSlug}: audited source image is below the resolution floor`);
    }
    const production = destinationImages.find((image) => image.slug === candidate.destinationSlug);
    const expectedFields = {
      status: "approved",
      localPath: `/images/destinations/${candidate.destinationSlug}.webp`,
      sourceUrl: candidate.sourceUrl,
      sourceTitle: candidate.sourceTitle,
      author: candidate.creator,
      license: candidate.licenseFamily,
      licenseUrl: candidate.licenseUrl,
      attribution: candidate.attribution,
      alt: candidate.alt,
      checkedAt: candidate.reviewedAt,
    };
    if (!production || production.status !== "approved"
      || Object.entries(expectedFields).some(([key, value]) => JSON.stringify(production[key as keyof ImageAssetConfig]) !== JSON.stringify(value))) {
      errors.push(`${candidate.destinationSlug}: production config does not match the 2026-09-08 image audit`);
    }
  }
}
if (siteImageAudit) {
  if (siteImageAudit.audit.status !== "approved-for-regional-context") errors.push("site image audit is not approved for regional context");
  if (siteImageAudit.audit.siteMappingReviewCount !== siteImageAudit.records.length
    || siteImageAudit.audit.uniqueSourceAssetCount !== new Set(siteImageAudit.records.map((record) => record.localPath)).size) {
    errors.push("site image audit counts do not match its records");
  }
  if (siteImageAudit.records.length !== seed.sites.length
    || new Set(siteImageAudit.records.map((record) => record.siteSlug)).size !== seed.sites.length) {
    errors.push("site image audit does not cover every observation site exactly once");
  }
  for (const record of siteImageAudit.records) {
    if (record.reuseKind !== "destination-regional-context") errors.push(`${record.siteSlug}: unsupported site image reuse kind`);
    const site = seed.sites.find((candidate) => candidate.slug === record.siteSlug);
    const destination = site ? seed.destinations.find((candidate) => candidate.id === site.destinationId) : undefined;
    const destinationImage = destination ? destinationImages.find((candidate) => candidate.slug === destination.slug) : undefined;
    const production = siteImages.find((candidate) => candidate.slug === record.siteSlug);
    if (!site || !destination || !destinationImage || destinationImage.status !== "approved") {
      errors.push(`${record.siteSlug}: audited site image has no approved parent destination image`);
      continue;
    }
    if (record.destinationSlug !== destination.slug || record.localPath !== destinationImage.localPath
      || record.sourceUrl !== destinationImage.sourceUrl || record.sourceTitle !== destinationImage.sourceTitle
      || record.creator !== destinationImage.author || record.license !== destinationImage.license
      || record.licenseUrl !== destinationImage.licenseUrl || record.attribution !== destinationImage.attribution
      || record.checkedAt !== siteImageAudit.audit.reviewedAt) {
      errors.push(`${record.siteSlug}: site image audit does not match its parent destination image`);
    }
    const expectedFields = {
      status: "approved",
      localPath: record.localPath,
      sourceUrl: record.sourceUrl,
      sourceTitle: record.sourceTitle,
      author: record.creator,
      license: record.license,
      licenseUrl: record.licenseUrl,
      attribution: record.attribution,
      alt: record.alt,
      checkedAt: record.checkedAt,
    };
    if (!production || production.status !== "approved"
      || Object.entries(expectedFields).some(([key, value]) => JSON.stringify(production[key as keyof ImageAssetConfig]) !== JSON.stringify(value))) {
      errors.push(`${record.siteSlug}: production site image does not match the site image audit`);
    }
    if (!record.alt.en.includes(site.name) || !record.alt.de.includes(site.name)) {
      errors.push(`${record.siteSlug}: regional-context alt text does not name the observation site`);
    }
  }
}
for (const image of destinationImages.filter((candidate) => candidate.status === "approved")) {
  const imagePath = resolve(root, "public", image.localPath!.replace(/^\//, ""));
  const header = readFileSync(imagePath).subarray(0, 12);
  if (header.subarray(0, 4).toString("ascii") !== "RIFF" || header.subarray(8, 12).toString("ascii") !== "WEBP") {
    errors.push(`${image.slug}: approved local asset is not a WebP file`);
  }
  const bytes = statSync(imagePath).size;
  if (bytes < 10_000 || bytes > 1_000_000) errors.push(`${image.slug}: approved WebP size is outside the 10 KB–1 MB delivery guardrail`);
}
if (errors.length > 0) { for (const error of errors) console.error(error); process.exitCode = 1; } else console.log(`Validated ${actual.destinations.length + actual.sites.length} image manifest records; ${actual.destinations.filter((image) => image.status === "approved").length} destination and ${actual.sites.filter((image) => image.status === "approved").length} site records are approved.`);
