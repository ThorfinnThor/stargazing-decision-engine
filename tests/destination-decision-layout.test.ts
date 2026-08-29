import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { recommendedSiteView } from "../lib/destination/site-recommendation.js";

test("destination recommendation prefers verified public access before a higher closed-site score", () => {
  const recommended = recommendedSiteView([
    { site: { id: "closed", publicAccess: "no" as const }, monthly: { months: [{ score: 99 }] } },
    { site: { id: "public", publicAccess: "yes" as const }, monthly: { months: [{ score: 82 }] } },
    { site: { id: "limited", publicAccess: "limited" as const }, monthly: { months: [{ score: 91 }] } },
  ]);
  assert.equal(recommended?.site.id, "public");
});

test("destination recommendation uses the strongest month among equally accessible sites", () => {
  const recommended = recommendedSiteView([
    { site: { id: "lower", publicAccess: "yes" as const }, monthly: { months: [{ score: 73 }, { score: 79 }] } },
    { site: { id: "higher", publicAccess: "yes" as const }, monthly: { months: [{ score: 81 }, { score: 80 }] } },
  ]);
  assert.equal(recommended?.site.id, "higher");
});

test("destination and gear templates expose decision-first layout contracts without repeating the standfirst", () => {
  const destinationPage = readFileSync(resolve(process.cwd(), "app/[locale]/stargazing-destinations/[slug]/page.tsx"), "utf8");
  const destinationGuide = readFileSync(resolve(process.cwd(), "components/destination-editorial-guide.tsx"), "utf8");
  const gearPage = readFileSync(resolve(process.cwd(), "app/[locale]/gear/[slug]/page.tsx"), "utf8");
  const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

  assert.match(destinationPage, /DestinationDecisionSummary/);
  assert.match(destinationPage, /guide \? guide\.seoDescription\[locale\]/);
  assert.doesNotMatch(destinationGuide, /destination-editorial-standfirst/);
  assert.match(gearPage, /gear-decision-summary/);
  assert.match(gearPage, /gear-related-guides/);
  assert.match(styles, /\.event-summary > h2:not\(:first-child\)/);
  assert.match(styles, /\.gear-related-guides \.gear-guide-card h3/);
});
