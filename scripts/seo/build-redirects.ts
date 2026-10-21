import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { listGearGuides, loadDestinations, loadGearCategories, loadGearGuide } from "../../lib/data/load.js";
import { locales } from "../../lib/i18n/config.js";
import { buildGearAliasRedirects, buildLegacyAffiliateRedirects, serializeRedirects, type LegacyAffiliateRedirect, type RedirectRule } from "../../lib/seo/redirects.js";
import { readJson, root } from "../pipeline/io.js";

const legacy = readJson<{ paths: LegacyAffiliateRedirect[] }>(resolve(root, "data-config/seo/legacy-affiliate-redirects.json"));
const manifest = readJson<{ entries: Array<{ path: string }> }>(resolve(root, "public/go/manifest.json"));

const rules: RedirectRule[] = [
  { from: "/", to: "/en/", status: 301, reason: "default locale" },
  ...buildGearAliasRedirects(locales, {
    categories: loadGearCategories(),
    guides: listGearGuides().map(loadGearGuide),
  }),
  ...buildLegacyAffiliateRedirects(legacy.paths, {
    activeRedirectPaths: new Set(manifest.entries.map((entry) => entry.path)),
    destinationSlugs: new Set(loadDestinations().map((destination) => destination.slug)),
    locale: "en",
  }),
];

writeFileSync(resolve(root, "public/_redirects"), serializeRedirects(rules), "utf8");
console.log(`Wrote ${rules.length} permanent redirect rule(s) to public/_redirects.`);
