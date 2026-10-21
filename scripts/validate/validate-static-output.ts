import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";

import { productionSiteOrigin } from "../../lib/seo/site-url.js";
import { findOrphanedStaticPages, resolveExportedTarget, validateStaticOutput } from "../../lib/static-output/links.js";
import { parseRedirects, validateRedirectRules } from "../../lib/seo/redirects.js";

const outputDirectory = resolve(process.cwd(), "out");
const result = validateStaticOutput(outputDirectory, productionSiteOrigin);
const registry = JSON.parse(readFileSync(resolve(process.cwd(), "public/data/stargazing/seo/registry.json"), "utf8")) as {
  pages: Array<{ path: string; indexable: boolean }>;
};
const orphans = findOrphanedStaticPages(
  outputDirectory,
  productionSiteOrigin,
  registry.pages.filter((page) => page.indexable).map((page) => page.path),
);

const redirectsFile = resolve(outputDirectory, "_redirects");
const redirectRules = existsSync(redirectsFile) ? parseRedirects(readFileSync(redirectsFile, "utf8")) : [];
const redirectProblems = validateRedirectRules(redirectRules, (pathname) => Boolean(resolveExportedTarget(outputDirectory, pathname)));
if (!existsSync(redirectsFile)) console.error("out/_redirects is missing; Cloudflare would serve no redirects");

for (const item of redirectProblems) {
  console.error(`_redirects: ${item.from} -> ${item.to}: ${item.problem}`);
}
for (const item of result.broken) {
  console.error(`${item.source}: ${item.reference} does not resolve to exported ${item.targetPath}`);
}
for (const item of result.localeParityGaps) {
  console.error(`${item.source}: localized counterpart ${item.expected} is missing`);
}
for (const item of orphans) {
  console.error(`${item.path}: indexable page has no internal link from another exported HTML page`);
}

if (!existsSync(redirectsFile) || redirectProblems.length > 0 || result.broken.length > 0 || result.localeParityGaps.length > 0 || orphans.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`Validated ${result.htmlFiles} exported HTML files, ${result.references} same-origin references, EN/DE route parity (with the declared English-only blog exception), internal discovery for every indexable page, and ${redirectRules.length} permanent redirect rule(s).`);
}
