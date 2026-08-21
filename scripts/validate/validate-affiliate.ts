import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { validateAffiliateConfig } from "../../lib/affiliate/affiliate.js";
import type { AffiliateConfig } from "../../lib/data/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const config = readJson<AffiliateConfig>(resolve(root, "data-config/sources/affiliate-partners.json"));
validateAffiliateConfig(config);
const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/affiliate-partners.json");
const redirectManifestPath = resolve(root, "public/go/manifest.json");
if (!existsSync(redirectManifestPath)) throw new Error("Affiliate redirect manifest is missing; run data:affiliate");
const redirects = readJson<{ version: 1; entries: Array<{ partner: string; destination: string; path: string; targetHost: string }> }>(redirectManifestPath);
const expectedPartnerCount = config.partners.filter((partner) => partner.enabled).length;
if (redirects.version !== 1) throw new Error("Affiliate redirect manifest version is invalid");
if (expectedPartnerCount === 0 && redirects.entries.length !== 0) throw new Error("Disabled affiliate config produced redirect artifacts");
if (!validate?.(config)) {
  console.error(validate?.errors ?? "Affiliate schema missing");
  process.exitCode = 1;
} else {
  console.log(`Validated ${config.partners.length} affiliate partner configuration(s) and ${redirects.entries.length} static redirect(s); enabled links remain allow-listed.`);
}
