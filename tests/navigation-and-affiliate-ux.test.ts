import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

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

test("destination pages render only individually curated activity offers", () => {
  const modules = read("components/affiliate-destination-modules.tsx");
  const partners = JSON.parse(read("data-config/sources/affiliate-partners.json"));
  assert.doesNotMatch(modules, /AffiliateDestinationSearches|GetYourGuideActivitiesWidget/);
  for (const partner of partners.partners.filter((entry: { type: string }) => entry.type === "activity")) {
    assert.equal(partner.destinationSearchEnabled, false);
    if (partner.widget) assert.equal(partner.widget.enabled, false);
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
  assert.match(destinationPage, /showIndependentRoute=\{!locationTour\}/);
  assert.match(destinationGuide, /destination-editorial-section/);
  assert.match(destinationGuide, /destination-content-disclosure/);
  assert.match(locationTour, /location-tour-block/);
  assert.match(locationTour, /<details className="location-tour-sources"/);
  assert.match(locationTourIndex, /hidden=\{index >= limit\}/);
  assert.match(locationTourIndex, /setLimit\(\(current\) => current \+ 12\)/);
  assert.doesNotMatch(gearGuide, /content-disclosure-state/);
});

test("curated activity links open in new tabs and public pages share the compact title scale", () => {
  const activityOffers = read("components/affiliate-activity-offers.tsx");
  const styles = read("app/globals.css");

  assert.match(activityOffers, /target="_blank"/);
  assert.match(activityOffers, /Relevant guided options/);
  assert.match(activityOffers, /More to do nearby/);
  assert.match(activityOffers, /No direct stargazing tour currently available/);
  assert.match(activityOffers, /not astronomy tours/);
  assert.match(styles, /--type-page-title: clamp\(2\.3rem, 4vw, 3\.75rem\)/);
  assert.match(styles, /--type-section-title: clamp\(1\.7rem, 2\.8vw, 2\.65rem\)/);
  assert.match(styles, /\.hero-copy h1 \{[\s\S]*?font-size: var\(--type-page-title\)/);
  assert.match(styles, /\.event-header h1 \{[\s\S]*?font-size: var\(--type-page-title\)/);
  assert.match(styles, /\.finder-header h1 \{[\s\S]*?font-size: var\(--type-page-title\)/);
});

test("public content does not display editorial review bylines", () => {
  const destinationGuide = read("components/destination-editorial-guide.tsx");
  const locationTour = read("components/location-tour-content.tsx");
  const gearGuide = read("app/[locale]/gear/[slug]/page.tsx");
  const activityOffers = read("components/affiliate-activity-offers.tsx");
  for (const file of [destinationGuide, locationTour, gearGuide, activityOffers]) {
    assert.doesNotMatch(file, /Editorially reviewed by|Redaktionell geprüft von|Link reviewed|Link geprüft am/);
  }
});
