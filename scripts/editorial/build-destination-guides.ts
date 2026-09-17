import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide } from "../../lib/data/types.js";
import { validateDestinationEditorialGuides } from "../../lib/editorial/destination-guides.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const guides = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
validateDestinationEditorialGuides(guides, destinations);
const activeDestinationIds = new Set(destinations.filter((destination) => destination.active).map((destination) => destination.id));
const publishedGuides = guides.filter((guide) => activeDestinationIds.has(guide.destinationId));

const destinationDirectory = publicPath("editorial/destinations");
const expectedFiles = new Set(["index.json", ...publishedGuides.map((guide) => `${guide.slug}.json`)]);
if (existsSync(destinationDirectory)) {
  for (const file of readdirSync(destinationDirectory)) {
    if (file.endsWith(".json") && !expectedFiles.has(file)) unlinkSync(resolve(destinationDirectory, file));
  }
}

writeJson(publicPath("editorial/destinations/index.json"), publishedGuides.map((guide) => ({
  destinationId: guide.destinationId,
  slug: guide.slug,
  seoTitle: guide.seoTitle,
  seoDescription: guide.seoDescription,
  lastReviewedAt: guide.lastReviewedAt,
})));
for (const guide of publishedGuides) writeJson(publicPath(`editorial/destinations/${guide.slug}.json`), guide);
console.log(`Built ${publishedGuides.length} active source-backed destination editorial guides (${guides.length} configured).`);
