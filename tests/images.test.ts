import assert from "node:assert/strict";
import test from "node:test";

import { allowedImageLicenses, buildImageManifest } from "../lib/images/images.js";
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

test("image policy accepts only explicit free or public-domain licenses", () => {
  assert.deepEqual([...allowedImageLicenses], ["CC0", "CC BY", "CC BY-SA", "Public Domain", "Public Domain Mark", "NASA Public Domain", "U.S. Government Work"]);
  assert.equal(allowedImageLicenses.includes("CC BY-NC" as never), false);
  assert.equal(allowedImageLicenses.includes("CC BY-ND" as never), false);
  assert.equal(allowedImageLicenses.includes("All rights reserved" as never), false);
});

test("approved image records resolve self-hosted assets under public", () => {
  const approved: ImageAssetConfig = {
    slug: "destination",
    status: "approved",
    localPath: "/images/destinations/alqueva.webp",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:A_Barragem_de_Alqueva_01.jpg",
    sourceTitle: "A Barragem de Alqueva 01",
    author: "GualdimG",
    license: "CC BY-SA",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    attribution: "GualdimG, Wikimedia Commons, CC BY-SA 4.0",
    checkedAt: "2026-08-24",
  };
  const manifest = buildImageManifest({ destinations: [destination], sites: [site], destinationImages: [approved], siteImages: [pending("site")], generatedAt: "2026-08-24T00:00:00.000Z", publicRoot: process.cwd() });
  assert.equal(manifest.destinations[0].localPath, "/images/destinations/alqueva.webp");
});
