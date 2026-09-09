import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("GetYourGuide Integration Analyzer is present in both static root layouts", () => {
  assert.match(read("app/(root)/layout.tsx"), /<GetYourGuideAnalytics\s*\/>/);
  assert.match(read("app/[locale]/layout.tsx"), /<GetYourGuideAnalytics\s*\/>/);
  const integration = read("components/getyourguide-integration.tsx");
  assert.match(integration, /from "next\/script"/);
  assert.match(integration, /strategy="afterInteractive"/);
  assert.match(integration, /data-gyg-partner-id/);
});

test("destination and location-tour pages use manually curated activity widgets", () => {
  const destination = read("app/[locale]/stargazing-destinations/[slug]/page.tsx");
  const tour = read("app/[locale]/stargazing-tours/[slug]/page.tsx");
  assert.match(destination, /<AffiliateDestinationModules/);
  assert.match(tour, /<AffiliateDestinationModules/);
  const offers = read("components/affiliate-activity-offers.tsx");
  assert.match(offers, /<GetYourGuideActivitiesWidget model=\{getYourGuideWidget\}/);
  const widget = read("components/getyourguide-activities-widget.tsx");
  assert.match(widget, /data-gyg-widget="activities"/);
  assert.match(widget, /data-gyg-tour-ids=\{model\.tourIds\.join\(","\)\}/);
  assert.match(widget, /data-gyg-href=\{model\.frameUrl\}/);
  assert.match(widget, /data-gyg-locale-code=\{model\.localeCode\}/);
  assert.doesNotMatch(widget, /data-gyg-widget="auto"|data-gyg-q/);
});

test("automatic GetYourGuide search is disabled while curated widgets are enabled", () => {
  const config = JSON.parse(read("data-config/sources/affiliate-partners.json"));
  const partner = config.partners.find(
    (entry: { id: string }) => entry.id === "getyourguide-activities",
  );

  assert.equal(partner.destinationSearchEnabled, false);
  assert.equal(partner.widget.enabled, true);
  assert.equal(partner.widget.itemCount, 3);
  const widget = read("components/getyourguide-activities-widget.tsx");
  assert.match(widget, /getGetYourGuideActivityId/);
  assert.doesNotMatch(widget, /affiliateQuery|destinationScope|destinationIds/);
});

test("privacy notice identifies analytics, curated widgets, and excludes automatic results", () => {
  const privacy = read("app/[locale]/privacy/page.tsx");
  assert.match(privacy, /GetYourGuide Integration Analyzer/);
  assert.match(privacy, /widget\.getyourguide\.com/);
  assert.match(privacy, /manually curated activity widgets/);
  assert.match(privacy, /load images, duration, and rating information directly from GetYourGuide/);
  assert.match(privacy, /We do not use automatically assembled result widgets/);
});
