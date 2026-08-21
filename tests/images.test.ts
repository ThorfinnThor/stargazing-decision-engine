import assert from "node:assert/strict";
import test from "node:test";

import { buildImageManifest } from "../lib/images/images.js";
import type { Destination, ImageAssetConfig, ObservationSite } from "../lib/data/types.js";

const destination: Destination = { id: "destination", slug: "destination", name: "Destination", countryCode: "DE", countryName: "Germany", continent: "Europe", regionSlugs: [], timezone: "Europe/Berlin", active: true, priority: 1, tags: [], observationSiteIds: ["site"], stayAreaIds: [], affiliateQuery: "Destination" };
const site: ObservationSite = { id: "site", slug: "site", destinationId: "destination", name: "Site", lat: 0, lon: 0, elevationM: null, siteType: "plain", publicAccess: "yes", accessScore: 80, active: true, priority: 1, certificationIds: [] };
const pending = (slug: string): ImageAssetConfig => ({ slug, status: "pending", overrideReason: "Awaiting manual source review" });

test("pending image records produce explicit non-published assets", () => {
  const manifest = buildImageManifest({ destinations: [destination], sites: [site], destinationImages: [pending("destination")], siteImages: [pending("site")], generatedAt: "2026-08-21T00:00:00.000Z", publicRoot: process.cwd() });
  assert.equal(manifest.destinations[0].status, "pending");
  assert.equal(manifest.destinations[0].localPath, null);
  assert.equal(manifest.sites[0].sourceUrl, null);
});

test("image coverage rejects missing active targets", () => {
  assert.throws(() => buildImageManifest({ destinations: [destination], sites: [site], destinationImages: [], siteImages: [pending("site")], generatedAt: "2026-08-21T00:00:00.000Z", publicRoot: process.cwd() }), /cover each active target/i);
});
