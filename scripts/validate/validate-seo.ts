import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { publicDataDir, readJson } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

interface SeoPage { id: string; path: string; canonical: string; alternatePaths: Record<string, string>; title: string; h1: string; indexable: boolean; reasons: string[] }
interface SeoRegistry { version: 1; siteUrl: string; pages: SeoPage[] }
interface SeoConfig { siteUrl: string }
const directory = resolve(publicDataDir, "seo");
const registryPath = resolve(directory, "registry.json");
const errors: string[] = [];
if (!existsSync(registryPath)) errors.push("SEO registry is missing");
if (errors.length === 0) {
  const registry = readJson<SeoRegistry>(registryPath);
  const config = readJson<SeoConfig>(resolve(process.cwd(), "data-config/seo/project-seo-config.json"));
  const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/seo-registry.json");
  if (!validate?.(registry)) errors.push(JSON.stringify(validate?.errors ?? "SEO registry schema missing"));
  if (registry.siteUrl !== config.siteUrl) errors.push(`SEO registry site URL ${registry.siteUrl} does not match project config ${config.siteUrl}`);
  if (registry.siteUrl.includes(".workers.dev")) errors.push("Production canonicals must use the custom domain, not workers.dev");
  if (new Set(registry.pages.map((page) => page.id)).size !== registry.pages.length) errors.push("SEO page IDs must be unique");
  if (new Set(registry.pages.map((page) => page.path)).size !== registry.pages.length) errors.push("SEO page paths must be unique");
  for (const page of registry.pages) {
    if (page.indexable && page.reasons.length > 0) errors.push(`${page.id}: indexable page has gate reasons`);
    if (!page.indexable && page.reasons.length === 0) errors.push(`${page.id}: non-indexable page has no gate reason`);
    if (!page.canonical.startsWith(`${registry.siteUrl}/`)) errors.push(`${page.id}: canonical is outside configured site URL`);
    if (page.alternatePaths.en === undefined || page.alternatePaths.de === undefined) errors.push(`${page.id}: missing hreflang alternate`);
  }
}
if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log("Validated SEO registry, canonical paths, alternates, and indexability gates.");
}
