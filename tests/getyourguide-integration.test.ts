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

test("destination-pinned GetYourGuide widget is rendered on destination and location-tour pages", () => {
  const destination = read("app/[locale]/stargazing-destinations/[slug]/page.tsx");
  const tour = read("app/[locale]/stargazing-tours/[slug]/page.tsx");
  assert.match(destination, /<AffiliateDestinationModules/);
  assert.match(tour, /<AffiliateDestinationModules/);
  const modules = read("components/affiliate-destination-modules.tsx");
  assert.match(modules, /<GetYourGuideActivitiesWidget/);
  const integration = read("components/getyourguide-integration.tsx");
  assert.match(integration, /data-gyg-widget="activities"/);
  assert.match(integration, /data-gyg-href=\{widget\.frameUrl\}/);
  assert.match(integration, /data-gyg-number-of-items=\{widget\.itemCount\}/);
  assert.match(integration, /data-gyg-q=\{destinationQuery\}/);
  assert.match(destination, /destinationQuery=\{destination\.affiliateQuery\}/);
  assert.match(tour, /destinationQuery=\{destination\.affiliateQuery\}/);
  assert.match(integration, /We have not reviewed these live results individually/);
});

test("destination-pinned widgets are limited to destinations with reviewed provider matches", () => {
  const config = JSON.parse(read("data-config/sources/affiliate-partners.json"));
  const partner = config.partners.find(
    (entry: { id: string }) => entry.id === "getyourguide-activities",
  );

  assert.deepEqual([...partner.widget.destinationIds].sort(), [
    "atacama",
    "canyonlands",
    "death-valley",
    "hanle",
    "jasper",
    "la-palma",
    "mauna-kea",
    "north-york-moors",
    "pico-do-arieiro",
    "rila",
    "tenerife",
    "uluru",
  ]);
});

test("privacy notice identifies the GetYourGuide script and destination selection", () => {
  const privacy = read("app/[locale]/privacy/page.tsx");
  assert.match(privacy, /GetYourGuide Integration Analyzer/);
  assert.match(privacy, /widget\.getyourguide\.com/);
  assert.match(privacy, /destination-based GetYourGuide widgets/);
});
