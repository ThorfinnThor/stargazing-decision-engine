import { validateSiteScoreConfig } from "../../lib/scoring/site-score.js";
import { loadSiteScoreConfig } from "../score/score-config.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    validateSiteScoreConfig(loadSiteScoreConfig());
    console.log("Validated real site-score weights, curves, and confidence levels.");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
