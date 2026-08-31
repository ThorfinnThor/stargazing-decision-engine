import assert from "node:assert/strict";
import test from "node:test";

import { evaluateIndexability } from "../lib/seo/indexability.js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { buildGearGuideStructuredData, buildWebPageStructuredData } from "../lib/seo/structured-data.js";
import type { GearGuide } from "../lib/data/types.js";

const requirements = { minimumDataCompleteness: 1, minimumConfidence: "high" as const, minimumUniqueInsights: 2, minimumInternalLinks: 3 };
const base = {
  resultCount: 5,
  dataCompleteness: 1,
  confidence: "high" as const,
  uniqueInsightCount: 3,
  hasUniqueTitle: true,
  hasUniqueH1: true,
  hasCanonical: true,
  internalLinkCount: 4,
  createsCannibalization: false,
  containsUnsupportedClaims: false,
  isFutureRelevant: true,
  sourceFreshness: true,
};

test("SEO indexability gate permits complete pages and explains every rejection", () => {
  assert.deepEqual(evaluateIndexability(base, requirements), { indexable: true, reasons: [] });
  const rejected = evaluateIndexability({ ...base, confidence: "low", containsUnsupportedClaims: true, hasCanonical: false }, requirements);
  assert.equal(rejected.indexable, false);
  assert.deepEqual(rejected.reasons, ["insufficient-confidence", "missing-canonical", "unsupported-claims"]);
});

test("structured data emits an absolute WebPage contract", () => {
  const value = buildWebPageStructuredData({ name: "Example", description: "Description", url: "https://stargazingindex.com/en/example/", inLanguage: "en", isPartOf: "Stargazing Index" });
  const page = value["@graph"].find((item) => item["@type"] === "WebPage");
  assert.equal(page?.url, "https://stargazingindex.com/en/example/");
  assert.deepEqual(page?.isPartOf, { "@id": "https://stargazingindex.com/#website" });
});

test("gear guide structured data exposes citations, comparison order, and FAQ without invented offers", () => {
  const guides = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/gear/guides.json"), "utf8")) as GearGuide[];
  const guide = guides.find((candidate) => candidate.slug === "star-trackers");
  assert.ok(guide);
  const value = buildGearGuideStructuredData({ guide, locale: "en", url: "https://stargazingindex.com/en/gear/star-trackers/" });
  const article = value["@graph"].find((item) => item["@type"] === "Article");
  const itemList = value["@graph"].find((item) => item["@type"] === "ItemList");
  const faq = value["@graph"].find((item) => item["@type"] === "FAQPage");
  assert.equal((article?.citation as string[]).length, 3);
  assert.equal((article?.author as { name: string }).name, "Schayan Yousefian");
  assert.equal((article?.publisher as { name: string }).name, "Stargazing Index");
  assert.equal(article?.isAccessibleForFree, true);
  assert.equal(itemList?.numberOfItems, 3);
  assert.equal((faq?.mainEntity as unknown[]).length, guide.faq.length);
  assert.equal(JSON.stringify(value).includes('"offers"'), false);
  assert.equal(JSON.stringify(value).includes('"reviewRating"'), false);
});
