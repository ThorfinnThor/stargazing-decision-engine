import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { destinationGuideWordCount, validateDestinationEditorialGuides } from "../lib/editorial/destination-guides.js";
import { buildDestinationEditorialStructuredData } from "../lib/seo/structured-data.js";
import type { Destination, DestinationEditorialGuide } from "../lib/data/types.js";

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const guides = read<DestinationEditorialGuide[]>("data-config/editorial/destination-guides.json");
const seed = read<{ destinations: Destination[] }>("generated/intermediate/seed.normalized.json");

test("destination editorial guides meet bilingual depth, uniqueness, and source coverage gates", () => {
  assert.doesNotThrow(() => validateDestinationEditorialGuides(guides, seed.destinations));
  assert.equal(guides.length, 10);
  assert.ok(guides.every((guide) => destinationGuideWordCount(guide, "en") >= 650));
  assert.ok(guides.every((guide) => destinationGuideWordCount(guide, "de") >= 650));
  assert.ok(guides.every((guide) => guide.sections.length >= 3 && guide.tour.steps.length >= 4 && guide.sources.length >= 3));
});

test("each destination guide has its own sourced route rather than a shared template", () => {
  const tourTitles = guides.flatMap((guide) => [guide.tour.title.en, guide.tour.title.de]);
  assert.equal(new Set(tourTitles).size, tourTitles.length);
  const allSourceUrls = guides.flatMap((guide) => guide.sources.map((source) => source.url));
  assert.ok(new Set(allSourceUrls).size >= guides.length * 2);
});

test("destination editorial structured data links the guide, FAQ, and cited primary sources", () => {
  const guide = guides[0];
  const destination = seed.destinations.find((candidate) => candidate.id === guide.destinationId);
  assert.ok(destination);
  const value = buildDestinationEditorialStructuredData({ destination, guide, locale: "en", url: `https://stargazingindex.com/en/stargazing-destinations/${guide.slug}/` });
  const article = value["@graph"].find((item) => item["@type"] === "Article");
  const faq = value["@graph"].find((item) => item["@type"] === "FAQPage");
  assert.deepEqual(article?.citation, guide.sources.map((source) => source.url));
  assert.equal((faq?.mainEntity as unknown[]).length, guide.faq.length);
});
