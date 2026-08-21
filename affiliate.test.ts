import assert from "node:assert/strict";
import test from "node:test";

import { buildAffiliateUrl, validateAffiliateConfig } from "../lib/affiliate/affiliate.js";
import type { AffiliateConfig, Destination } from "../lib/data/types.js";

const destination: Destination = {
  id: "destination", slug: "destination", name: "Destination", countryCode: "DE", countryName: "Germany", continent: "Europe", regionSlugs: [], timezone: "Europe/Berlin", active: true, priority: 1, tags: [], observationSiteIds: [], stayAreaIds: [], affiliateQuery: "Monsaraz & Alqueva",
};

const config: AffiliateConfig = {
  version: 1,
  partners: [{ id: "stay-search", type: "hotel", enabled: false, affiliateId: "", urlTemplate: "https://booking.com/search?ss={query}&aid={affiliateId}", allowedHosts: ["booking.com"], disclosure: { en: "Disclosure", de: "Hinweis" } }],
};

test("disabled affiliate partners cannot produce a CTA URL", () => {
  validateAffiliateConfig(config);
  assert.equal(buildAffiliateUrl(config, "stay-search", destination), null);
});

test("enabled affiliate URLs are encoded and host allow-listed", () => {
  const enabled: AffiliateConfig = { ...config, partners: [{ ...config.partners[0], enabled: true, affiliateId: "abc123" }] };
  const url = buildAffiliateUrl(enabled, "stay-search", destination);
  assert.ok(url);
  const parsed = new URL(url);
  assert.equal(parsed.protocol, "https:");
  assert.equal(parsed.hostname, "booking.com");
  assert.equal(parsed.searchParams.get("ss"), "Monsaraz & Alqueva");
  assert.equal(parsed.searchParams.get("aid"), "abc123");
});

test("affiliate validation rejects an unallow-listed template host", () => {
  assert.throws(() => validateAffiliateConfig({ ...config, partners: [{ ...config.partners[0], urlTemplate: "https://evil.example/?q={query}", allowedHosts: ["booking.com"] }] }), /allow-listed/i);
});
