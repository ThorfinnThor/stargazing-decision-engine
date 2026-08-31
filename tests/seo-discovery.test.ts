import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { buildWebPageStructuredData } from "../lib/seo/structured-data.js";
import type { SeoRegistry } from "../lib/data/load.js";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const registry = JSON.parse(read("public/data/stargazing/seo/registry.json")) as SeoRegistry;

test("SEO registry exposes accurate discovery fields and the publisher page", () => {
  assert.ok(registry.pages.some((page) => page.id === "about-en" && page.indexable));
  const emptyAucklandPage = registry.pages.find((page) => page.id === "short-trip-auckland-en");
  assert.equal(emptyAucklandPage?.indexable, false);
  assert.ok(emptyAucklandPage?.reasons.includes("no-qualifying-destinations"));
  assert.equal(new Set(registry.pages.map((page) => page.canonical)).size, registry.pages.length);
  for (const page of registry.pages) {
    assert.equal(page.alternatePaths["x-default"], page.alternatePaths.en);
    assert.ok(!Number.isNaN(Date.parse(page.lastModified)));
  }
});

test("sitemap and robots sources preserve canonical, language, freshness, and AI-search discovery", () => {
  const sitemap = read("app/sitemap.ts");
  assert.match(sitemap, /filter\(\(page\) => page\.indexable\)/);
  assert.match(sitemap, /lastModified: page\.lastModified/);
  assert.match(sitemap, /page\.alternatePaths/);
  const robots = read("app/robots.ts");
  assert.match(robots, /OAI-SearchBot/);
  assert.match(robots, /ChatGPT-User/);
  assert.match(robots, /sitemap\.xml/);
});

test("llms.txt is curated and states material product limitations", () => {
  const content = read("public/llms.txt");
  assert.match(content, /^# Stargazing Index\n\n> /);
  assert.match(content, /historical climate normals and darkness data, not live weather/i);
  assert.match(content, /do not include local clouds/i);
  assert.match(content, /manufacturer specifications/i);
  assert.match(content, /\/data\/stargazing\/manifest\.json/);
});

test("structured data connects pages to the site, publisher, and breadcrumbs", () => {
  const home = buildWebPageStructuredData({ name: "Stargazing for dark skies", description: "Description", url: "https://stargazingindex.com/en/", inLanguage: "en", dateModified: "2026-08-28T00:00:00.000Z" });
  const homeTypes = home["@graph"].map((item) => item["@type"]);
  assert.deepEqual(homeTypes, ["WebPage", "WebSite", "Organization"]);

  const destination = buildWebPageStructuredData({ name: "Westhavelland", description: "Description", url: "https://stargazingindex.com/de/stargazing-destinations/westhavelland/", inLanguage: "de" });
  const breadcrumb = destination["@graph"].find((item) => item["@type"] === "BreadcrumbList");
  assert.ok(breadcrumb);
  assert.equal((breadcrumb?.itemListElement as Array<unknown>).length, 2);
});
