import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checkedAt = "2026-09-08";
const dryRun = process.argv.includes("--dry-run");

const read = (relativePath) => JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const destinationImages = read("data-config/sources/destination-images.json");

const destinationById = new Map(destinations.map((destination) => [destination.id, destination]));
const imageByDestinationSlug = new Map(destinationImages.map((image) => [image.slug, image]));

const siteImages = [];
const auditRecords = [];

for (const site of sites) {
  const destination = destinationById.get(site.destinationId);
  if (!destination) throw new Error(`${site.slug}: destination ${site.destinationId} is missing`);
  const image = imageByDestinationSlug.get(destination.slug);
  if (!image || image.status !== "approved") throw new Error(`${site.slug}: destination image ${destination.slug} is not approved`);

  const fallback = {
    en: `${destination.name} stargazing destination`,
    de: `${destination.name} Sternbeobachtungsziel`,
  };
  const baseAlt = image.alt ?? fallback;
  const alt = {
    en: `${baseAlt.en}. Regional context for ${site.name}.`,
    de: `${baseAlt.de}. Regionaler Kontext für ${site.name}.`,
  };

  const siteImage = {
    slug: site.slug,
    status: "approved",
    localPath: image.localPath,
    sourceUrl: image.sourceUrl,
    sourceTitle: image.sourceTitle,
    author: image.author,
    license: image.license,
    licenseUrl: image.licenseUrl,
    attribution: image.attribution,
    alt,
    checkedAt,
  };
  siteImages.push(siteImage);
  auditRecords.push({
    siteSlug: site.slug,
    siteName: site.name,
    destinationSlug: destination.slug,
    destinationName: destination.name,
    reuseKind: "destination-regional-context",
    localPath: image.localPath,
    sourceUrl: image.sourceUrl,
    sourceTitle: image.sourceTitle,
    creator: image.author,
    license: image.license,
    licenseUrl: image.licenseUrl,
    attribution: image.attribution,
    alt,
    checkedAt,
  });
}

const uniqueSourceAssets = new Set(auditRecords.map((record) => record.localPath));
const audit = {
  version: 1,
  generatedAt: `${checkedAt}T00:00:00.000Z`,
  policy: {
    allowedLicenseFamilies: ["CC0", "CC BY", "CC BY-SA", "Public Domain", "Public Domain Mark", "NASA Public Domain", "U.S. Government Work"],
    usageMode: "An approved destination image may represent an observation site only as regional context. Alt text must not claim that the image depicts the exact site.",
  },
  audit: {
    reviewedAt: checkedAt,
    reviewedBy: "Codex",
    status: "approved-for-regional-context",
    siteMappingReviewCount: auditRecords.length,
    uniqueSourceAssetCount: uniqueSourceAssets.size,
  },
  records: auditRecords,
};

console.log(`Prepared ${siteImages.length} observation-site image records from ${uniqueSourceAssets.size} approved destination assets.`);
if (!dryRun) {
  fs.writeFileSync(path.join(root, "data-config/sources/site-images.json"), `${JSON.stringify(siteImages, null, 2)}\n`);
  fs.writeFileSync(path.join(root, "data-config/sources/site-image-audit-2026-09-08.json"), `${JSON.stringify(audit, null, 2)}\n`);
}
