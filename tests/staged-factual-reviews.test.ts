import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { Destination, DestinationEditorialGuide } from "../lib/data/types.js";
import type { ObservationSite } from "../lib/data/types.js";
import { isTravelEligibleSite } from "../lib/access/travel.js";

type FactualReviewStatus = "changes-required" | "verified";

interface FactualReview {
  destinationId: string;
  status: FactualReviewStatus;
  reviewedAt: string;
  reviewedUrls: string[];
  verifiedFindings: string[];
  requiredChanges: Array<{ scope: string; reason: string }>;
  publicationDecision?: {
    mode: "transparent-unverified-access";
    decidedAt: string;
    disclosureRequired: true;
    currentClosure: boolean;
    readerAction: { en: string; de: string };
  };
}

interface FactualReviewRegister {
  version: number;
  records: FactualReview[];
}

const read = <T>(path: string) => JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8")) as T;
const register = read<FactualReviewRegister>("data-config/sources/staged-factual-reviews.json");
const destinations = read<Destination[]>("data-config/sources/destinations.json");
const guides = read<DestinationEditorialGuide[]>("data-config/editorial/destination-guides.json");
const sites = read<ObservationSite[]>("data-config/sources/observation-sites.json");

test("staged factual reviews are traceable and cannot silently clear unresolved claims", () => {
  assert.equal(register.version, 1);
  assert.equal(new Set(register.records.map((record) => record.destinationId)).size, register.records.length);

  for (const record of register.records) {
    const destination = destinations.find((candidate) => candidate.id === record.destinationId);
    const guide = guides.find((candidate) => candidate.destinationId === record.destinationId);
    assert.ok(destination, `${record.destinationId}: destination is missing`);
    assert.ok(guide, `${record.destinationId}: guide is missing`);
    assert.match(record.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(record.reviewedUrls.length > 0, `${record.destinationId}: reviewed URLs are missing`);
    assert.ok(record.reviewedUrls.every((url) => /^https:\/\//.test(url)), `${record.destinationId}: reviewed URLs must use HTTPS`);
    assert.ok(record.verifiedFindings.length > 0, `${record.destinationId}: verified findings are missing`);

    if (record.status === "changes-required") {
      assert.ok(record.requiredChanges.length > 0, `${record.destinationId}: unresolved changes must be recorded`);
    } else {
      assert.deepEqual(record.requiredChanges, [], `${record.destinationId}: verified reviews cannot retain required changes`);
      const reviewedUrls = new Set(record.reviewedUrls);
      assert.ok(guide.sources.every((source) => reviewedUrls.has(source.url)), `${record.destinationId}: verified review must cover every published guide source`);
    }
  }
});

test("transparent publication preserves access uncertainty and delegates confirmation to the reader", () => {
  const transparent = register.records.filter((record) => record.publicationDecision?.mode === "transparent-unverified-access");
  assert.equal(transparent.length, 8);

  for (const record of transparent) {
    const decision = record.publicationDecision!;
    const guide = guides.find((candidate) => candidate.destinationId === record.destinationId)!;
    const destinationSites = sites.filter((site) => site.destinationId === record.destinationId);
    assert.match(decision.decidedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(decision.disclosureRequired, true);
    assert.match(decision.readerAction.en, /(contact|do not travel)/i);
    assert.match(decision.readerAction.de, /(kontaktiere|reise nicht)/i);
    assert.match(guide.standfirst.en, /(contact|do not travel)/i);
    assert.match(guide.standfirst.de, /(kontaktiere|reise)/i);
    assert.equal(destinationSites.length, 2);
    assert.ok(destinationSites.every((site) => !isTravelEligibleSite(site)));
    assert.ok(destinationSites.every((site) => site.publicAccess === (decision.currentClosure ? "no" : "unknown")));
  }
});
