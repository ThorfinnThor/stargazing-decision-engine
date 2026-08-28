import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("homepage catalog ships an accessible static-compatible client filter", () => {
  const homepage = read("components/home-page.tsx");
  const filter = read("components/destination-catalog-filter.tsx");

  assert.match(homepage, /<DestinationCatalogFilter/);
  assert.match(filter, /^"use client";/);
  assert.match(filter, /type="search"/);
  assert.match(filter, /<select/);
  assert.match(filter, /aria-live="polite"/);
  assert.match(filter, /Clear filters/);
  assert.match(filter, /destination\.countryName/);
});

test("public-facing process and missing-camping copy is removed", () => {
  const publicCopy = [
    read("lib/i18n/config.ts"),
    read("components/home-page.tsx"),
    read("app/[locale]/short-trips/[origin]/page.tsx"),
  ].join("\n");

  for (const removed of [
    "Every destination score is built from reviewed climate, darkness, elevation, and access snapshots.",
    "with transparent assumptions",
    "Camping remains unknown until curated source metadata is available.",
    "Camping-Angabe bleibt unbekannt",
  ]) {
    assert.doesNotMatch(publicCopy, new RegExp(removed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
