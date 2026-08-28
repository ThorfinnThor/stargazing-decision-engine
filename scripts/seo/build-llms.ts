import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { SeoPageRecord, SeoRegistry } from "../../lib/data/load.js";
import { readJson, root } from "../pipeline/io.js";

const registry = readJson<SeoRegistry>(resolve(root, "public/data/stargazing/seo/registry.json"));
const origin = registry.siteUrl.replace(/\/$/, "");
const indexableEnglishPages = registry.pages.filter((page) => page.indexable && page.locale === "en");

function absolute(path: string) {
  return `${origin}${path}`;
}

function pageLink(page: SeoPageRecord) {
  return `- [${page.title}](${page.canonical}): ${page.description}`;
}

function section(title: string, pageType: string) {
  const pages = indexableEnglishPages.filter((page) => page.pageType === pageType);
  return pages.length > 0 ? `\n## ${title}\n\n${pages.map(pageLink).join("\n")}\n` : "";
}

const content = `# Stargazing Index

> Stargazing Index is a bilingual, data-driven guide for choosing stargazing destinations, months, observing sites, and astronomy gear. It publishes static pages backed by reproducible JSON data and clearly stated limitations.

The primary language is English. German versions use the same paths under \`/de/\`; each page declares reciprocal language alternates. Destination scores use historical climate normals and darkness data, not live weather. Astronomical sky simulations do not include local clouds, haze, terrain, buildings, vegetation, or measured on-site light pollution. Gear comparisons are editorial analyses of cited manufacturer specifications and do not claim hands-on testing unless explicitly stated.

## Start here

- [English home](${absolute("/en/")}): Browse destinations, short trips, and gear guides.
- [German home](${absolute("/de/")}): Deutsche Übersicht aller Ziele, Kurzreisen und Ausrüstungsguides.
- [About the publisher](${absolute("/en/about/")}): Mission, editorial responsibility, corrections, and ownership.
- [Editorial methodology](${absolute("/en/methodology/")}): Evidence, source, freshness, and independence rules.
- [XML sitemap](${absolute("/sitemap.xml")}): Complete list of indexable English and German canonical pages.
${section("Destination guides", "destination")}${section("Short-trip guides", "short-trip")}${section("Gear guides", "gear-guide")}
## Machine-readable data

- [Dataset manifest](${absolute("/data/stargazing/manifest.json")}): Dataset version, generation time, sources, counts, hashes, and checksums.
- [Destination index](${absolute("/data/stargazing/destinations/index.json")}): Destination identifiers, countries, time zones, tags, and related observing sites.
- [Observation-site index](${absolute("/data/stargazing/sites/index.json")}): Coordinates, elevation, access status, and source-backed access notes.
- [SEO registry](${absolute("/data/stargazing/seo/registry.json")}): Canonicals, language alternates, descriptions, modification dates, and indexability decisions.

## Optional

- [Contact](${absolute("/en/contact/")}): Corrections and editorial inquiries.
- [Imprint](${absolute("/en/imprint/")}): Legal provider information.
- [Privacy](${absolute("/en/privacy/")}): Privacy information for this static site.
`;

writeFileSync(resolve(root, "public/llms.txt"), content, "utf8");
console.log(`Built llms.txt with ${indexableEnglishPages.length} curated indexable page links.`);
