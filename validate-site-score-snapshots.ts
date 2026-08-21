import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import type { MonthlySiteScore } from "../../lib/data/types.js";
import { readJson, root } from "../pipeline/io.js";
import { createSchemaValidator } from "./validate-schemas.js";

interface SiteScoreSnapshot { siteId: string; algorithmVersion: string; generatedAt: string; months: MonthlySiteScore[] }

export function validateSiteScoreSnapshot(snapshot: SiteScoreSnapshot) {
  const validate = createSchemaValidator().getSchema("https://stargazing.local/schema/site-score-snapshot.json");
  const errors = validate?.(snapshot) ? [] : [JSON.stringify(validate?.errors ?? "site score snapshot schema missing")];
  if (new Set(snapshot.months.map((month) => month.month)).size !== 12) errors.push("score snapshot requires 12 unique months");
  if (snapshot.months.some((month) => month.siteId !== snapshot.siteId)) errors.push("monthly score identity mismatch");
  if (snapshot.months.some((month) => month.confidenceLevel === "low" && !month.caveats.some((item) => item.includes("top rankings")))) {
    errors.push("low-confidence month must carry a top-ranking caveat");
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = resolve(root, "data-snapshots/scores");
  const files = existsSync(directory) ? readdirSync(directory).filter((file) => file.endsWith(".json")) : [];
  const errors = files.flatMap((file) => validateSiteScoreSnapshot(readJson(resolve(directory, file))).map((error) => `${file}: ${error}`));
  if (errors.length > 0) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Validated ${files.length} committed real site-score snapshot(s).`);
  }
}
