import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide, LocationTour, ObservationSite } from "../../lib/data/types.js";
import { locationTourWordCount, validateLocationTours } from "../../lib/editorial/location-tours.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const guides = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
const tours = readJson<LocationTour[]>(resolve(root, "data-config/editorial/location-tours.json"));
const factualReviews = readJson<Array<{ destinationId: string; publicationDecision?: { mode?: string } }> | { records: Array<{ destinationId: string; publicationDecision?: { mode?: string } }> }>(resolve(root, "data-config/sources/staged-factual-reviews.json"));
validateLocationTours({ tours, destinations, sites, guides });
const activeDestinationIds = new Set(destinations.filter((destination) => destination.active).map((destination) => destination.id));
const reviewRecords = Array.isArray(factualReviews) ? factualReviews : factualReviews.records;
const transparentAccessDestinationIds = new Set(reviewRecords
  .filter((record) => record.publicationDecision?.mode === "transparent-unverified-access")
  .map((record) => record.destinationId));
const publishedTours = tours.filter((tour) => activeDestinationIds.has(tour.destinationId) && !transparentAccessDestinationIds.has(tour.destinationId));

const tourDirectory = publicPath("editorial/location-tours");
const expectedFiles = new Set(["index.json", ...publishedTours.map((tour) => `${tour.slug}.json`)]);
if (existsSync(tourDirectory)) {
  for (const file of readdirSync(tourDirectory)) {
    if (file.endsWith(".json") && !expectedFiles.has(file)) unlinkSync(resolve(tourDirectory, file));
  }
}

writeJson(publicPath("editorial/location-tours/index.json"), publishedTours);
for (const tour of publishedTours) writeJson(publicPath(`editorial/location-tours/${tour.slug}.json`), tour);
console.log(`Built ${publishedTours.length} active location tours (${tours.length} configured, ${publishedTours.reduce((sum, tour) => sum + locationTourWordCount(tour, "en") + locationTourWordCount(tour, "de"), 0)} bilingual words).`);
