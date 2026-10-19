import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { BlogPost, BlogPostSummary } from "../lib/data/types.js";
import type { SeoRegistry } from "../lib/data/load.js";

const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;

test("English blog publishes exactly six reviewed data-led articles", () => {
  const index = read<BlogPostSummary[]>("public/data/stargazing/editorial/blog/index.json");
  assert.equal(index.length, 6);
  assert.equal(new Set(index.map((post) => post.slug)).size, 6);
  for (const summary of index) {
    const post = read<BlogPost>(`public/data/stargazing/editorial/blog/${summary.slug}.json`);
    const tables = post.blocks.filter((block) => block.kind === "table");
    assert.equal(tables.length, 1);
    assert.ok(tables[0].rows.length >= 6);
    assert.ok(post.blocks.filter((block) => block.kind === "prose").length >= 4);
    assert.ok(post.relatedDestinationSlugs.length >= 4);
    assert.match(post.methodologyNote, /not (?:a )?(?:live )?forecast/i);
  }
});

test("blog SEO is indexable, discoverable, and explicitly English-only", () => {
  const index = read<BlogPostSummary[]>("public/data/stargazing/editorial/blog/index.json");
  const registry = read<SeoRegistry>("public/data/stargazing/seo/registry.json");
  const blogPages = registry.pages.filter((page) => page.pageType === "blog" || page.pageType === "blog-post");
  assert.equal(blogPages.length, 7);
  assert.ok(blogPages.every((page) => page.locale === "en" && page.indexable));
  assert.ok(blogPages.every((page) => page.alternatePaths.en === page.path && page.alternatePaths.de === undefined));
  assert.deepEqual(new Set(blogPages.filter((page) => page.pageType === "blog-post").map((page) => page.path.split("/").at(-2))), new Set(index.map((post) => post.slug)));
});

test("monthly atlas is generated from twelve different destinations", () => {
  const post = read<BlogPost>("public/data/stargazing/editorial/blog/where-to-stargaze-each-month.json");
  const table = post.blocks.find((block) => block.kind === "table");
  assert.ok(table && table.kind === "table");
  assert.equal(table.rows.length, 12);
  assert.equal(new Set(table.rows.map((row) => row[1])).size, 12);
  assert.deepEqual(table.rows.map((row) => row[0]), ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]);
});
