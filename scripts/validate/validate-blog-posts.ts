import { existsSync } from "node:fs";

import type { BlogPost, BlogPostSummary, ImageManifest } from "../../lib/data/types.js";
import { blogPostSources } from "../../data-config/editorial/blog-posts.js";
import { publicPath, readJson } from "../pipeline/io.js";

const errors: string[] = [];
const indexPath = publicPath("editorial/blog/index.json");
const index = existsSync(indexPath) ? readJson<BlogPostSummary[]>(indexPath) : [];
const images = readJson<ImageManifest>(publicPath("images/manifest.json"));

if (blogPostSources.length !== 8) errors.push(`Expected exactly eight reviewed articles, found ${blogPostSources.length}`);
if (index.length !== blogPostSources.length) errors.push(`Blog index has ${index.length} posts, expected ${blogPostSources.length}`);
for (let position = 1; position < index.length; position += 1) {
  if (Date.parse(index[position - 1].publishedAt) < Date.parse(index[position].publishedAt)) errors.push("Blog index must be ordered from newest to oldest");
}
if (new Set(blogPostSources.map((post) => post.slug)).size !== blogPostSources.length) errors.push("Blog slugs must be unique");
if (new Set(blogPostSources.map((post) => post.title)).size !== blogPostSources.length) errors.push("Blog titles must be unique");

const paragraphOwners = new Map<string, string>();
for (const source of blogPostSources) {
  const path = publicPath(`editorial/blog/${source.slug}.json`);
  if (!existsSync(path)) {
    errors.push(`${source.slug}: published post is missing`);
    continue;
  }
  const post = readJson<BlogPost>(path);
  const hero = images.destinations.find((image) => image.slug === post.heroDestinationSlug);
  if (!hero || hero.status !== "approved" || !hero.localPath || !hero.attribution || !hero.sourceUrl || !hero.licenseUrl) errors.push(`${post.slug}: hero image lacks approved licensing metadata`);
  if (post.version !== 1 || post.slug !== source.slug || post.datasetId !== source.datasetId) errors.push(`${source.slug}: published identity does not match source`);
  if (Number.isNaN(Date.parse(post.publishedAt)) || Number.isNaN(Date.parse(post.lastReviewedAt))) errors.push(`${post.slug}: invalid publication or review date`);
  if (post.readingMinutes < 5 || post.readingMinutes > 15) errors.push(`${post.slug}: implausible reading time`);
  if (post.metrics.length !== 3) errors.push(`${post.slug}: expected three summary metrics`);
  if (post.relatedDestinationSlugs.length < 4) errors.push(`${post.slug}: needs at least four destination links`);
  if (!/not (?:a )?(?:live )?forecast/i.test(post.methodologyNote)) errors.push(`${post.slug}: methodology must state the forecast limitation`);

  const tables = post.blocks.filter((block) => block.kind === "table");
  if (tables.length !== 1) errors.push(`${post.slug}: expected one generated evidence table`);
  for (const block of tables) {
    if (block.rows.length < 6) errors.push(`${post.slug}: evidence table needs at least six rows`);
    for (const row of block.rows) if (row.length !== block.columns.length) errors.push(`${post.slug}: table row does not match its column count`);
  }

  const prose = post.blocks.flatMap((block) => block.kind === "prose" ? [block.heading, ...block.paragraphs] : block.kind === "callout" ? [block.heading, block.body] : [block.heading, block.introduction, block.note]);
  const wordCount = [post.title, post.standfirst, ...prose, post.methodologyNote].join(" ").trim().split(/\s+/).length;
  if (wordCount < 600) errors.push(`${post.slug}: only ${wordCount} editorial words; expected at least 600`);
  for (const paragraph of post.blocks.flatMap((block) => block.kind === "prose" ? block.paragraphs : [])) {
    const normalized = paragraph.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const owner = paragraphOwners.get(normalized);
    if (owner) errors.push(`${post.slug}: duplicates a paragraph from ${owner}`);
    paragraphOwners.set(normalized, post.slug);
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log("Validated eight unique English articles, newest-first ordering, generated evidence tables, internal links, and approved hero-image provenance.");
}
