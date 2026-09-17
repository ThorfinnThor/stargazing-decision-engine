import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const output = argument("--output", "docs/staged-destination-readiness.json");
const destinations = readJson("data-config/sources/destinations.json");
const sites = readJson("data-config/sources/observation-sites.json");
const guides = readJson("data-config/editorial/destination-guides.json");
const tours = readJson("data-config/editorial/location-tours.json");
const stayAreas = readJson("data-config/sources/stay-areas.json");
const destinationImages = readJson("data-config/sources/destination-images.json");
const siteImages = readJson("data-config/sources/site-images.json");
const sourceAudit = readJson("docs/staged-source-audit.json");
const factualReviews = readJson("data-config/sources/staged-factual-reviews.json");

const stagedDestinations = destinations.filter((destination) => destination.active === false);
const byDestination = (records) => new Map(records.map((record) => [record.destinationId, record]));
const guideByDestination = byDestination(guides);
const tourByDestination = byDestination(tours);
const stayAreasByDestination = new Map();
for (const area of stayAreas) {
  if (!stayAreasByDestination.has(area.destinationId)) stayAreasByDestination.set(area.destinationId, []);
  stayAreasByDestination.get(area.destinationId).push(area);
}
const destinationImageBySlug = new Map(destinationImages.map((image) => [image.slug, image]));
const siteImageBySlug = new Map(siteImages.map((image) => [image.slug, image]));
const sourceResultByUrl = new Map(sourceAudit.records.map((record) => [record.url, record]));
const factualReviewByDestination = new Map(factualReviews.records.map((record) => [record.destinationId, record]));

const snapshotKinds = ["climate", "black-marble", "dem", "scores"];
const snapshotState = (siteId) => Object.fromEntries(
  snapshotKinds.map((kind) => [kind, existsSync(resolve(root, `data-snapshots/${kind}/${siteId}.json`))]),
);

const records = stagedDestinations.map((destination) => {
  const destinationSites = sites.filter((site) => site.destinationId === destination.id);
  const guide = guideByDestination.get(destination.id);
  const tour = tourByDestination.get(destination.id);
  const areas = stayAreasByDestination.get(destination.id) ?? [];
  const sourceResults = (guide?.sources ?? []).map((source) => {
    const audit = sourceResultByUrl.get(source.url);
    return {
      id: source.id,
      url: source.url,
      classification: audit?.classification ?? "not-audited",
      status: audit?.status ?? null,
    };
  });
  const siteStates = destinationSites.map((site) => ({
    id: site.id,
    active: site.active,
    snapshots: snapshotState(site.id),
    imageStatus: siteImageBySlug.get(site.id)?.status ?? "missing",
  }));
  const missingSnapshots = siteStates.flatMap((site) => snapshotKinds
    .filter((kind) => !site.snapshots[kind])
    .map((kind) => `${site.id}:${kind}`));
  const sourceBreakages = sourceResults.filter((source) => ["missing", "http-error", "error", "not-audited"].includes(source.classification));
  const blockedSources = sourceResults.filter((source) => source.classification === "blocked");
  const destinationImageStatus = destinationImageBySlug.get(destination.id)?.status ?? "missing";
  const pendingSiteImages = siteStates.filter((site) => site.imageStatus !== "approved");
  const factualReview = factualReviewByDestination.get(destination.id);
  const factualReviewStatus = factualReview?.status ?? "required";
  const blockers = [];
  if (!guide) blockers.push("guide-missing");
  if (!tour) blockers.push("tour-missing");
  if (areas.length === 0) blockers.push("stay-area-missing");
  if (destinationSites.length !== 2) blockers.push("observation-site-count-invalid");
  if (missingSnapshots.length > 0) blockers.push("source-snapshots-missing");
  if (sourceBreakages.length > 0) blockers.push("source-reachability-broken");
  if (blockedSources.length > 0) blockers.push("source-access-manual-review-required");
  if (factualReviewStatus === "required") blockers.push("source-factual-review-required");
  if (factualReviewStatus === "changes-required") blockers.push("source-factual-changes-required");
  if (destinationImageStatus !== "approved") blockers.push("destination-image-license-pending");
  if (pendingSiteImages.length > 0) blockers.push("site-image-license-pending");

  return {
    destinationId: destination.id,
    name: destination.name,
    active: destination.active,
    editorial: {
      guide: Boolean(guide),
      tour: Boolean(tour),
      stayAreas: areas.length,
    },
    sources: {
      total: sourceResults.length,
      reachable: sourceResults.filter((source) => source.classification === "reachable").length,
      blocked: blockedSources.length,
      broken: sourceBreakages.length,
      factualReview: factualReviewStatus,
      factualReviewRecord: factualReview ?? null,
      records: sourceResults,
    },
    destinationImageStatus,
    sites: siteStates,
    missingSnapshots,
    activationBlockers: blockers,
    readyForActivation: blockers.length === 0,
  };
});

const report = {
  version: 1,
  generatedAt: new Date().toISOString(),
  method: "Offline activation-readiness inventory. Snapshot presence and source reachability do not replace factual source review or image-license verification.",
  summary: {
    destinations: records.length,
    sites: records.reduce((sum, record) => sum + record.sites.length, 0),
    withCompleteSnapshots: records.filter((record) => record.missingSnapshots.length === 0).length,
    withCleanSourceReachability: records.filter((record) => record.sources.broken === 0).length,
    withBlockedSources: records.filter((record) => record.sources.blocked > 0).length,
    withApprovedDestinationImage: records.filter((record) => record.destinationImageStatus === "approved").length,
    withAllSiteImagesApproved: records.filter((record) => record.sites.every((site) => site.imageStatus === "approved")).length,
    requiringFactualSourceReview: records.filter((record) => record.sources.factualReview === "required").length,
    requiringFactualChanges: records.filter((record) => record.sources.factualReview === "changes-required").length,
    withVerifiedFactualReview: records.filter((record) => record.sources.factualReview === "verified").length,
    readyForActivation: records.filter((record) => record.readyForActivation).length,
  },
  records,
};

const outputPath = resolve(root, output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Audited activation readiness for ${records.length} staged destination(s) and ${report.summary.sites} site(s).`);
console.log(`Complete snapshots=${report.summary.withCompleteSnapshots}, clean source reachability=${report.summary.withCleanSourceReachability}, ready=${report.summary.readyForActivation}.`);
console.log(`Wrote ${output}.`);
