import assert from "node:assert/strict";
import test from "node:test";

import { evaluateIndexability } from "../lib/seo/indexability.js";
import { buildWebPageStructuredData } from "../lib/seo/structured-data.js";

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
  const value = buildWebPageStructuredData({ name: "Example", description: "Description", url: "https://stargazing.local/en/example/", inLanguage: "en", isPartOf: "Stargazing Decision Engine" });
  assert.equal(value["@type"], "WebPage");
  assert.equal(value.url, "https://stargazing.local/en/example/");
  assert.equal(value.isPartOf?.url, "https://stargazing.local");
});
