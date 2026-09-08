import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide } from "../../lib/data/types.js";
import { validateDestinationEditorialGuides } from "../../lib/editorial/destination-guides.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const guides = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
validateDestinationEditorialGuides(guides, destinations);

const destinationDirectory = publicPath("editorial/destinations");
const expectedFiles = new Set(["index.json", ...guides.map((guide) => `${guide.slug}.json`)]);
if (existsSync(destinationDirectory)) {
  for (const file of readdirSync(destinationDirectory)) {
    if (file.endsWith(".json") && !expectedFiles.has(file)) unlinkSync(resolve(destinationDirectory, file));
  }
}

writeJson(publicPath("editorial/destinations/index.json"), guides.map((guide) => ({
  destinationId: guide.destinationId,
  slug: guide.slug,
  seoTitle: guide.seoTitle,
  seoDescription: guide.seoDescription,
  lastReviewedAt: guide.lastReviewedAt,
})));
for (const guide of guides) writeJson(publicPath(`editorial/destinations/${guide.slug}.json`), guide);
console.log(`Built ${guides.length} source-backed destination editorial guides.`);
