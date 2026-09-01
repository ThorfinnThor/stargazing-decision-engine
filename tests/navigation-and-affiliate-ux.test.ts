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
