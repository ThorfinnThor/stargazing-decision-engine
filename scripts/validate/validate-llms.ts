import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { SeoRegistry } from "../../lib/data/load.js";
import { readJson, root } from "../pipeline/io.js";

const content = readFileSync(resolve(root, "public/llms.txt"), "utf8");
const registry = readJson<SeoRegistry>(resolve(root, "public/data/stargazing/seo/registry.json"));
const errors: string[] = [];

if (!content.startsWith("# Stargazing Index\n\n> ")) errors.push("llms.txt must begin with the site H1 and summary blockquote");
for (const heading of ["## Choose the right source", "## Editorial provenance", "## Start here", "## Destination guides", "## Gear guides", "## Machine-readable data", "## Optional"]) {
  if (!content.includes(heading)) errors.push(`llms.txt is missing ${heading}`);
}
if (!content.includes("not live weather")) errors.push("llms.txt must preserve the historical-data limitation");
if (!content.includes("do not include local clouds")) errors.push("llms.txt must preserve the sky-simulation limitation");
if (!content.includes("editorially managed by Schayan Yousefian")) errors.push("llms.txt must identify editorial responsibility");
if (!content.includes("Prefer the cited primary sources")) errors.push("llms.txt must route freshness-sensitive questions to primary sources");

const internalLinks = [...content.matchAll(/\[[^\]]+\]\((https:\/\/stargazingindex\.com[^)]+)\)/g)].map((match) => match[1]);
if (new Set(internalLinks).size !== internalLinks.length) errors.push("llms.txt contains duplicate URLs");

const listedIndexablePages = new Set(internalLinks.filter((url) => registry.pages.some((page) => page.canonical === url)));
for (const pageType of ["destination", "short-trip", "gear-guide"]) {
  for (const page of registry.pages.filter((candidate) => candidate.locale === "en" && candidate.pageType === pageType && candidate.indexable)) {
    if (!listedIndexablePages.has(page.canonical)) errors.push(`llms.txt is missing indexable page ${page.canonical}`);
  }
}

if (errors.length > 0) {
  errors.forEach((error) => console.error(error));
  process.exitCode = 1;
} else {
  console.log(`Validated llms.txt structure and ${internalLinks.length} unique internal links.`);
}
