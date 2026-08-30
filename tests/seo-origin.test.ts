import assert from "node:assert/strict";
import test from "node:test";

import { productionSiteOrigin, validateProductionSiteOrigin } from "../lib/seo/site-url.js";

test("SEO generation accepts only the exact reviewed production origin", () => {
  assert.equal(validateProductionSiteOrigin(productionSiteOrigin), productionSiteOrigin);

  for (const invalid of [
    "http://stargazingindex.com",
    "https://www.stargazingindex.com",
    "https://stargazingindex.com/preview",
    "https://stargazing-decision-engine.workers.dev",
    "https://example.com",
    "https://user:secret@stargazingindex.com",
  ]) {
    assert.throws(() => validateProductionSiteOrigin(invalid), /Production site URL must be exactly/);
  }
});

test("SEO generation rejects malformed origins explicitly", () => {
  assert.throws(() => validateProductionSiteOrigin("not a URL"), /Invalid production site URL/);
});
