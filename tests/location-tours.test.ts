import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { Destination, DestinationEditorialGuide, LocationTour, ObservationSite } from "../lib/data/types.js";
import { locationTourWordCount, validateLocationTours } from "../lib/editorial/location-tours.js";
import { buildLocationTourStructuredData } from "../lib/seo/structured-data.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const tours = read<LocationTour[]>("data-config/editorial/location-tours.json");

test("the first twenty location tours are bilingual, sourced, and structurally varied", () => {
  assert.doesNotThrow(() => validateLocationTours({
    tours,
    destinations: read<Destination[]>("data-config/sources/destinations.json"),
    sites: read<ObservationSite[]>("data-config/sources/observation-sites.json"),
    guides: read<DestinationEditorialGuide[]>("data-config/editorial/destination-guides.json"),
  }));
  assert.equal(tours.length, 20);
  assert.ok(tours.every((tour) => locationTourWordCount(tour, "en") >= 300 && locationTourWordCount(tour, "de") >= 300));
  assert.equal(new Set(tours.map((tour) => tour.standfirst.en)).size, tours.length);
  assert.ok(tours.every((tour) => new Set(tour.blocks.map((block) => block.kind)).size >= 3));
  assert.deepEqual(
    new Set(tours.slice(-10).map((tour) => tour.destinationId)),
    new Set(["tenerife", "galloway", "atacama", "big-bend", "aoraki-mackenzie", "namibrand", "jasper", "death-valley", "mauna-kea", "great-basin"]),
  );
});

test("location-tour structured data exposes the destination and every declared source", () => {
  const tour = tours[0];
  const destinations = read<Destination[]>("data-config/sources/destinations.json");
  const guides = read<DestinationEditorialGuide[]>("data-config/editorial/destination-guides.json");
  const destination = destinations.find((item) => item.id === tour.destinationId);
  const guide = guides.find((item) => item.destinationId === tour.destinationId);
  assert.ok(destination && guide);
  const data = buildLocationTourStructuredData({ destination, tour, locale: "en", url: `https://stargazingindex.com/en/stargazing-tours/${tour.slug}/`, sources: guide.sources });
  const article = data["@graph"][0];
  assert.deepEqual(article.citation, guide.sources.filter((source) => tour.sourceIds.includes(source.id)).map((source) => source.url));
  assert.equal((article.about as { name: string }).name, destination.name);
});
