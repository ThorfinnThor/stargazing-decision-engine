import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { buildAffiliateUrl } from "../../lib/affiliate/affiliate.js";
import { loadAffiliateConfig } from "../../lib/affiliate/config.js";
import { loadDestinations } from "../../lib/data/load.js";
import { buildStaticAffiliateRedirectHtml } from "../../lib/affiliate/static-redirect.js";
import { publicPath, writeJson } from "../pipeline/io.js";
import { writeFileSync } from "node:fs";

const legacyDirectory = publicPath("go");
rmSync(legacyDirectory, { recursive: true, force: true });
const directory = resolve(process.cwd(), "public/go");
rmSync(directory, { recursive: true, force: true });
mkdirSync(directory, { recursive: true });
const config = loadAffiliateConfig();
const entries: Array<{ partner: string; destination: string; path: string; targetHost: string }> = [];
for (const partner of config.partners.filter((item) => item.enabled)) {
  for (const destination of loadDestinations().filter((item) => item.active)) {
    const url = buildAffiliateUrl(config, partner.id, destination);
    if (!url) throw new Error(`Unable to build enabled affiliate URL for ${partner.id}/${destination.slug}`);
    const relative = `/${partner.id}/${destination.slug}/index.html`;
    const filePath = resolve(directory, partner.id, destination.slug, "index.html");
    mkdirSync(resolve(directory, partner.id, destination.slug), { recursive: true });
    writeFileSync(filePath, buildStaticAffiliateRedirectHtml(url), "utf8");
    entries.push({ partner: partner.id, destination: destination.slug, path: `/go/${partner.id}/${destination.slug}/`, targetHost: new URL(url).hostname });
  }
}
writeJson(resolve(directory, "manifest.json"), { version: 1, entries });
console.log(`Built ${entries.length} static affiliate redirect(s).`);
