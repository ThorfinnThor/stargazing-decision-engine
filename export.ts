import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { CalendarFile, Destination, DarknessMetrics, GearCategory, GearGuide, GearProductMetadata, MeteorShowerEvent, MonthlySiteClimate, MonthlySiteScore, ObservationSite, OriginCity, ShortTripFile, StayArea } from "../../lib/data/types.js";
import { generatedDir, generatedPath, publicPath, readJson, seedGeneratedAt, writeJson } from "../pipeline/io.js";

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

writeJson(publicPath("destinations/index.json"), seed.destinations);
writeJson(publicPath("sites/index.json"), seed.sites);
writeJson(publicPath("search/destination-index.json"), seed.destinations.map(({ id, slug, name, countryCode, tags }) => ({ id, slug, name, countryCode, tags })));

for (const destination of seed.destinations) {
  writeJson(publicPath(`destinations/${destination.countryCode.toLowerCase()}/${destination.slug}.json`), destination);
  const site = seed.sites.find((item) => item.destinationId === destination.id);
  const destinationScores = site ? scored.scores.filter((item) => item.siteId === site.id) : [];
  writeJson(publicPath(`monthly/destinations/${destination.slug}.json`), {
    destinationId: destination.id,
    months: destinationScores.map((item) => ({ month: item.month, score: item.stargazingTrip, confidenceLevel: item.confidenceLevel })),
  });
}

for (const site of seed.sites) {
  const destination = seed.destinations.find((item) => item.id === site.destinationId);
  if (!destination) throw new Error(`Missing destination for ${site.id}`);
  const climate = scored.climate.filter((item) => item.siteId === site.id);
  const darkness = scored.darkness.find((item) => item.siteId === site.id);
  const scores = scored.scores.filter((item) => item.siteId === site.id);
  writeJson(publicPath(`sites/${destination.countryCode.toLowerCase()}/${site.slug}.json`), site);
  writeJson(publicPath(`monthly/sites/${site.slug}.json`), { siteId: site.id, climate, darkness, scores });
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

writeJson(publicPath("manifest.json"), {
  datasetVersion: "seed-2026-08-20.1",
  schemaVersion: 1,
  algorithmVersion: "seed-fixture-0.1.0",
  generatedAt: seedGeneratedAt,
  climateNormal: { startYear: 1991, endYear: 2020 },
  blackMarble: { product: "synthetic-seed-fixture", collection: 1, years: [] },
  sourceVersions: { dataset: "synthetic-seed-fixture", calendar: "synthetic-seed-calendar", meteorShowers: "imo-2027", shortTrips: "haversine-v1", gear: "editorial-2026-08-21", images: "attribution-manifest-2026-08-21" },
  counts: {
    destinations: seed.destinations.length,
    observationSites: seed.sites.length,
    stayAreas: seed.stayAreas.length,
    originCities: seed.origins.length,
    siteClimateRows: scored.climate.length,
    siteScoreRows: scored.scores.length,
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

console.log(`Exported seed JSON for ${seed.destinations.length} destinations.`);
