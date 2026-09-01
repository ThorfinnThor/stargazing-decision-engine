import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { loadAffiliateDestinationSearches, loadDestinations } from "../lib/data/load.js";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("the localized layout provides one global menu and public pages no longer render the old home-only nav", () => {
  assert.match(read("app/[locale]/layout.tsx"), /<SiteHeader locale=\{locale\}/);
  assert.doesNotMatch(read("components/home-page.tsx"), /className="nav"/);
  assert.doesNotMatch(read("app/[locale]/finder/page.tsx"), /className="finder-nav"/);
});

test("homepage destination filters expose practical travel choices without a build manifest footnote", () => {
  const home = read("components/home-page.tsx");
  const filter = read("components/destination-catalog-filter.tsx");
  assert.doesNotMatch(home, /catalog-footnote/);
  assert.match(filter, /Best month/);
  assert.match(filter, /Night access/);
  assert.match(filter, /Minimum score/);
});

test("every active destination has both GetYourGuide search variants", () => {
  const destinations = loadDestinations().filter((destination) => destination.active);
  const searches = loadAffiliateDestinationSearches().filter((search) => search.partnerId === "getyourguide-activities");
  assert.equal(searches.length, destinations.length * 2);
  for (const destination of destinations) {
    const variants = searches.filter((search) => search.destinationId === destination.id).map((search) => search.variantId).sort();
    assert.deepEqual(variants, ["activities", "stargazing"]);
  }
});

test("long destination and tour content uses progressive disclosure without changing gear guides", () => {
  const destinationPage = read("app/[locale]/stargazing-destinations/[slug]/page.tsx");
  const destinationGuide = read("components/destination-editorial-guide.tsx");
  const locationTour = read("components/location-tour-content.tsx");
  const locationTourIndex = read("components/location-tour-index-filter.tsx");
  const gearGuide = read("app/[locale]/gear/[slug]/page.tsx");

  assert.match(destinationPage, /className="destination-section-nav"/);
  assert.match(destinationPage, /destination-access-summary/);
  assert.match(destinationGuide, /destination-editorial-section/);
  assert.match(destinationGuide, /destination-content-disclosure/);
  assert.match(locationTour, /location-tour-block/);
  assert.match(locationTour, /<details className="location-tour-sources"/);
  assert.match(locationTourIndex, /hidden=\{index >= limit\}/);
  assert.match(locationTourIndex, /setLimit\(\(current\) => current \+ 12\)/);
  assert.doesNotMatch(gearGuide, /content-disclosure-state/);
});
