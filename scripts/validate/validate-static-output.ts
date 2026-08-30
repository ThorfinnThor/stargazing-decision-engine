import { resolve } from "node:path";

import { productionSiteOrigin } from "../../lib/seo/site-url.js";
import { validateStaticOutput } from "../../lib/static-output/links.js";

const outputDirectory = resolve(process.cwd(), "out");
const result = validateStaticOutput(outputDirectory, productionSiteOrigin);

for (const item of result.broken) {
  console.error(`${item.source}: ${item.reference} does not resolve to exported ${item.targetPath}`);
}
for (const item of result.localeParityGaps) {
  console.error(`${item.source}: localized counterpart ${item.expected} is missing`);
}

if (result.broken.length > 0 || result.localeParityGaps.length > 0) {
  process.exitCode = 1;
} else {
  console.log(`Validated ${result.htmlFiles} exported HTML files, ${result.references} same-origin references, and EN/DE route parity.`);
}
