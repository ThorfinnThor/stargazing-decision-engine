import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide } from "../../lib/data/types.js";
import { destinationGuideWordCount, validateDestinationEditorialGuides } from "../../lib/editorial/destination-guides.js";
import { publicDataDir, readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const guides = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
validateDestinationEditorialGuides(guides, destinations);

const directory = resolve(publicDataDir, "editorial/destinations");
if (!existsSync(directory)) throw new Error("Published destination editorial directory is missing");
const publishedFiles = readdirSync(directory).filter((file) => file.endsWith(".json") && file !== "index.json");
if (publishedFiles.length !== guides.length) throw new Error("Published editorial guide count does not match configuration");
const schema = createSchemaValidator().getSchema("https://stargazing.local/schema/destination-editorial-guide.json");
for (const file of publishedFiles) {
  const guide = readJson<DestinationEditorialGuide>(resolve(directory, file));
  if (!schema?.(guide)) throw new Error(`Destination editorial guide schema failed: ${file}: ${JSON.stringify(schema?.errors)}`);
}

const depth = guides.map((guide) => `${guide.slug} EN ${destinationGuideWordCount(guide, "en")} / DE ${destinationGuideWordCount(guide, "de")}`).join("; ");
console.log(`Validated ${guides.length} unique destination guides (${depth}).`);
