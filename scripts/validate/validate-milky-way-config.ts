import { resolve } from "node:path";

import { validateMilkyWayConfig, type MilkyWayConfig } from "../../lib/astronomy/milky-way.js";
import { readJson, root } from "../pipeline/io.js";

const config = readJson<MilkyWayConfig>(resolve(root, "data-config/astronomy/milky-way.json"));

try {
  validateMilkyWayConfig(config);
  console.log(`Validated Milky Way configuration (${config.referenceStatus}).`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
