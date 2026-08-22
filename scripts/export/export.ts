import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { Era5ClimateSnapshot } from "../../lib/climate/era5/types.js";
import type { BlackMarbleSnapshot } from "../../lib/darkness/black-marble/types.js";
import type { CalendarFile, Destination, DestinationMonthlySummary, DarknessMetrics, GearCategory, GearGuide, GearProductMetadata, MeteorShowerEvent, MonthlySiteClimate, MonthlySiteScore, ObservationSite, OriginCity, ShortTripFile, SiteScoreSnapshot, StayArea } from "../../lib/data/types.js";
import { generatedDir, generatedPath, publicPath, readJson, root, seedGeneratedAt, writeJson } from "../pipeline/io.js";

interface SeedData {
  seed: true;
  generatedAt: string;
  destinations: Destination[];
  sites: ObservationSite[];
  stayAreas: StayArea[];
  origins: OriginCity[];
}

interface ScoredData {
  seed: true;
  generatedAt: string;
  climate: MonthlySiteClimate[];
  darkness: DarknessMetrics[];
  scores: MonthlySiteScore[];
}

interface CalendarOutput {
  seed: true;
  generatedAt: string;
  files: Record<string, CalendarFile>;
}

interface MeteorOutput {
  seed: true;
  generatedAt: string;
  events: MeteorShowerEvent[];
}

interface ShortTripOutput extends ShortTripFile {}

const seed = readJson<SeedData>(generatedPath("seed.normalized.json"));
const scored = readJson<ScoredData>(generatedPath("seed.scored.json"));
const calendar = readJson<CalendarOutput>(generatedPath("seed.calendar.json"));
const meteorOutputs = readdirSync(generatedDir)
  .filter((file) => /^meteor-showers-\d{4}\.json$/.test(file))
  .map((file) => readJson<MeteorOutput>(generatedPath(file)));
if (meteorOutputs.length === 0) throw new Error("No generated meteor-shower event file found");
const shortTripOutputs = readdirSync(generatedDir)
  .filter((file) => /^short-trips-[a-z0-9-]+\.json$/.test(file))
  .map((file) => readJson<ShortTripOutput>(generatedPath(file)));
if (shortTripOutputs.length === 0) throw new Error("No generated short-trip file found");
const gearCategories = readJson<GearCategory[]>(resolve(process.cwd(), "data-config/gear/categories.json"));
const gearGuides = readJson<GearGuide[]>(resolve(process.cwd(), "data-config/gear/guides.json"));
const gearProducts = readJson<GearProductMetadata[]>(resolve(process.cwd(), "data-config/gear/products.json"));
const destinationImages = readJson<Array<{ status: string }>>(resolve(process.cwd(), "data-config/sources/destination-images.json"));
const siteImages = readJson<Array<{ status: string }>>(resolve(process.cwd(), "data-config/sources/site-images.json"));
const realScoreDirectory = resolve(root, "data-snapshots/scores");
const realScoreSnapshots = new Map<string, SiteScoreSnapshot>(
  existsSync(realScoreDirectory)
    ? readdirSync(realScoreDirectory)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const snapshot = readJson<SiteScoreSnapshot>(resolve(realScoreDirectory, file));
        return [snapshot.siteId, snapshot];
      })
    : [],
);
for (const siteId of realScoreSnapshots.keys()) {
  if (!seed.sites.some((site) => site.id === siteId)) throw new Error(`Real score snapshot does not match an active site: ${siteId}`);
}

function realClimate(siteId: string): MonthlySiteClimate[] {
  const snapshot = readJson<Era5ClimateSnapshot>(resolve(root, "data-snapshots/climate", `${siteId}.json`));
  return snapshot.months.map((month) => {
    const astronomicalHours = month.nightCount === 0 ? 0 : month.astronomicalHourCount / month.nightCount;
    return {
      siteId,
      month: month.month,
      astronomicalHours,
      clearHourProbability: month.clearHourProbability,
      goodHourProbability: month.goodHourProbability,
      overcastHourProbability: month.overcastHourProbability,
      clearNightProbability: month.clearNightProbability,
      wetNightHourProbability: month.wetNightHourProbability,
      dewRiskProbability: month.dewRiskProbability,
      nightTempMeanC: month.nightTempMeanC,
      nightTempP10C: month.nightTempP10C,
      nightTempP90C: month.nightTempP90C,
      nightWindMeanKmh: month.nightWindMeanKmh,
      highWindHourProbability: month.highWindHourProbability,
      daylightOppositeNightHoursMean: 24 - astronomicalHours,
      dataCompleteness: month.dataCompleteness,
    };
  });
}

function realDarkness(siteId: string, scores: MonthlySiteScore[]): DarknessMetrics {
  const snapshot = readJson<BlackMarbleSnapshot>(resolve(root, "data-snapshots/black-marble", `${siteId}.json`));
  const darknessScore = scores[0]?.darknessScore ?? null;
  if (scores.some((score) => score.darknessScore !== darknessScore)) throw new Error(`${siteId}: monthly darkness scores must be stable`);
  return {
    siteId,
    blackMarbleYears: snapshot.blackMarbleYears,
    radiance0to2: snapshot.radiance0to2,
    radiance2to10: snapshot.radiance2to10,
    radiance10to30: snapshot.radiance10to30,
    radiance30to75: snapshot.radiance30to75,
    alanExposure: snapshot.alanExposure,
    darknessScore,
    coverage: snapshot.coverage,
  };
}

function scoreSource(destination: Destination) {
  const destinationSites = destination.observationSiteIds
    .map((siteId) => seed.sites.find((site) => site.id === siteId))
    .filter((site): site is ObservationSite => Boolean(site));
  const realSite = destinationSites.find((site) => realScoreSnapshots.has(site.id));
  const site = realSite ?? destinationSites[0];
  if (!site) throw new Error(`No observation site configured for ${destination.id}`);
  const real = realScoreSnapshots.get(site.id);
  const scores = real?.months ?? scored.scores.filter((item) => item.siteId === site.id);
  if (scores.length !== 12) throw new Error(`${site.id}: published score source must contain 12 months`);
  return { site, scores, real };
}

writeJson(publicPath("destinations/index.json"), seed.destinations);
writeJson(publicPath("sites/index.json"), seed.sites);
writeJson(publicPath("search/destination-index.json"), seed.destinations.map(({ id, slug, name, countryCode, tags }) => ({ id, slug, name, countryCode, tags })));

for (const destination of seed.destinations) {
  writeJson(publicPath(`destinations/${destination.countryCode.toLowerCase()}/${destination.slug}.json`), destination);
  const { site, scores: destinationScores, real } = scoreSource(destination);
  writeJson(publicPath(`monthly/destinations/${destination.slug}.json`), {
    destinationId: destination.id,
    siteId: site.id,
    dataStatus: real ? "real" : "seed",
    algorithmVersion: real?.algorithmVersion ?? "seed-fixture-0.1.0",
    generatedAt: real?.generatedAt ?? seedGeneratedAt,
    months: destinationScores.map((item) => ({ month: item.month, score: item.stargazingTrip, confidenceLevel: item.confidenceLevel })),
  } satisfies DestinationMonthlySummary);
}

for (const site of seed.sites) {
  const destination = seed.destinations.find((item) => item.id === site.destinationId);
  if (!destination) throw new Error(`Missing destination for ${site.id}`);
  const real = realScoreSnapshots.get(site.id);
  const scores = real?.months ?? scored.scores.filter((item) => item.siteId === site.id);
  const climate = real ? realClimate(site.id) : scored.climate.filter((item) => item.siteId === site.id);
  const darkness = real ? realDarkness(site.id, scores) : scored.darkness.find((item) => item.siteId === site.id);
  writeJson(publicPath(`sites/${destination.countryCode.toLowerCase()}/${site.slug}.json`), site);
  writeJson(publicPath(`monthly/sites/${site.slug}.json`), {
    siteId: site.id,
    dataStatus: real ? "real" : "seed",
    algorithmVersion: real?.algorithmVersion ?? "seed-fixture-0.1.0",
    generatedAt: real?.generatedAt ?? seedGeneratedAt,
    climate,
    darkness,
    scores,
  });
}

for (const [key, file] of Object.entries(calendar.files)) {
  writeJson(publicPath(`calendar/${key}.json`), file);
}

for (const meteor of meteorOutputs) {
  for (const event of meteor.events) {
    writeJson(publicPath(`events/meteor-showers/${event.year}/${event.slug}.json`), event);
  }
}

for (const shortTrip of shortTripOutputs) {
  writeJson(publicPath(`short-trips/${shortTrip.originSlug}.json`), shortTrip);
}

const realScores = [...realScoreSnapshots.values()];
const realScoreSiteCount = realScores.length;
const latestRealGeneratedAt = realScores.map((snapshot) => snapshot.generatedAt).sort().at(-1);
const generatedAt = latestRealGeneratedAt && latestRealGeneratedAt > seedGeneratedAt ? latestRealGeneratedAt : seedGeneratedAt;
const datasetDate = generatedAt.slice(0, 10);
const datasetStatus = realScoreSiteCount === 0 ? "seed" : realScoreSiteCount === seed.sites.length ? "real" : "mixed";
const blackMarbleSnapshots = realScores.map((snapshot) => readJson<BlackMarbleSnapshot>(resolve(root, "data-snapshots/black-marble", `${snapshot.siteId}.json`)));
const blackMarbleYears = [...new Set(blackMarbleSnapshots.flatMap((snapshot) => snapshot.blackMarbleYears))].sort();

writeJson(publicPath("manifest.json"), {
  datasetVersion: datasetStatus === "seed" ? "seed-2026-08-20.1" : `${datasetStatus}-${datasetDate}.1`,
  schemaVersion: 1,
  algorithmVersion: datasetStatus === "seed" ? "seed-fixture-0.1.0" : "site-score-1.0.0+seed-fixture-0.1.0",
  generatedAt,
  climateNormal: { startYear: 1991, endYear: 2020 },
  blackMarble: realScoreSiteCount === 0
    ? { product: "synthetic-seed-fixture", collection: 1, years: [] }
    : { product: "VNP46A4", collection: 2, years: blackMarbleYears },
  sourceVersions: { dataset: datasetStatus === "seed" ? "synthetic-seed-fixture" : "reviewed-real-snapshots-with-seed-fallback", siteScores: realScoreSiteCount === 0 ? "none" : "site-score-1.0.0", calendar: "synthetic-seed-calendar", meteorShowers: "imo-2027", shortTrips: "haversine-v1", gear: "editorial-2026-08-21", images: "attribution-manifest-2026-08-21" },
  counts: {
    destinations: seed.destinations.length,
    observationSites: seed.sites.length,
    stayAreas: seed.stayAreas.length,
    originCities: seed.origins.length,
    siteClimateRows: scored.climate.length,
    siteScoreRows: scored.scores.length,
    realScoreSites: realScoreSiteCount,
    seedScoreSites: seed.sites.length - realScoreSiteCount,
    realSiteScoreRows: realScores.reduce((sum, snapshot) => sum + snapshot.months.length, 0),
    calendarFiles: Object.keys(calendar.files).length,
    meteorShowerFiles: meteorOutputs.reduce((sum, meteor) => sum + meteor.events.length, 0),
    shortTripFiles: shortTripOutputs.length,
    gearCategories: gearCategories.length,
    gearGuides: gearGuides.length,
    gearProducts: gearProducts.length,
    imageAssets: destinationImages.length + siteImages.length,
    approvedImageAssets: [...destinationImages, ...siteImages].filter((asset) => asset.status === "approved").length,
  },
  snapshotHashes: {},
  fileChecksums: {},
});

console.log(`Exported static JSON for ${seed.destinations.length} destinations (${realScoreSiteCount} real, ${seed.sites.length - realScoreSiteCount} seed).`);
