import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();
const workflow = (name: string) => readFileSync(join(root, ".github/workflows", name), "utf8");

test("GitHub workflows keep static quality gates explicit", () => {
  const ci = workflow("ci.yml");
  assertIncludes(ci, "pnpm data:rebuild");
  assertIncludes(ci, "pnpm typecheck");
  assertIncludes(ci, "pnpm test");
  assertIncludes(ci, "pnpm build");
});

test("GitHub workflows use the packageManager pnpm version", () => {
  for (const name of ["ci.yml", "calendar-refresh.yml", "health-check.yml", "data-ingest.yml", "darkness-calibration.yml"]) {
    const contents = workflow(name);
    assertIncludes(contents, "actions/checkout@v7");
    assertIncludes(contents, "pnpm/setup@v2");
    assertIncludes(contents, "runtime: node@22");
    assertIncludes(contents, "install: false");
    assertIncludes(contents, "pnpm install --frozen-lockfile");
    const setupBlock = contents.slice(contents.indexOf("pnpm/setup@v2"), contents.indexOf("pnpm/setup@v2") + 220);
    if (/\n\s+version:/.test(setupBlock)) {
      throw new Error(`${name} must read the pnpm version from package.json`);
    }
  }

  assertIncludes(workflow("data-ingest.yml"), "actions/setup-python@v7");
  assertIncludes(workflow("darkness-calibration.yml"), "actions/setup-python@v7");
});

test("ingestion is manual and commits only after the full gate", () => {
  const ingest = workflow("data-ingest.yml");
  assertIncludes(ingest, "workflow_dispatch:");
  assertIncludes(ingest, "pnpm data:validate");
  assertIncludes(ingest, "pnpm data:score:real");
  assertIncludes(ingest, "pnpm data:score:real:validate");
  assertIncludes(ingest, "pnpm data:dem:fetch --site \"$site\" --public-fallback");
  assertIncludes(ingest, "xargs -r -n 1 -P 3");
  assertIncludes(ingest, "data-config/sources/observation-sites.json | sort -u > /tmp/stargazing-destinations");
  assertIncludes(ingest, 'pnpm data:calendar:real -- --start "$calendar_start" --months 36 --destination "$destination"');
  assertIncludes(ingest, "pnpm data:calendar:manifest");
  assertIncludes(ingest, "pnpm test");
  assertIncludes(ingest, "pnpm build");
  assertIncludes(ingest, "git diff --cached --quiet");
  if (/^\s+push:/m.test(ingest) || /^\s+schedule:/m.test(ingest)) throw new Error("data ingestion must not run automatically");
});

test("darkness calibration retrieval is manual and approval-gated", () => {
  const calibration = workflow("darkness-calibration.yml");
  assertIncludes(calibration, "workflow_dispatch:");
  assertIncludes(calibration, "all-candidates");
  assertIncludes(calibration, ".status == \"approved\"");
  assertIncludes(calibration, "[.anchors[].operatorApproved] | all");
  assertIncludes(calibration, "fetch_black_marble.py --anchors-file /tmp/darkness-anchors");
  assertIncludes(calibration, "pnpm data:darkness:calibrate");
  assertIncludes(calibration, "pnpm data:rebuild");
  assertIncludes(calibration, "git add -- data-snapshots/black-marble/anchors data-config/scoring/darkness.json");
  if (/^\s+push:/m.test(calibration) || /^\s+schedule:/m.test(calibration)) {
    throw new Error("darkness calibration retrieval must not run automatically");
  }
});

test("derived-data commits trigger the Cloudflare Git integration without deploying from workflows", () => {
  const ingest = workflow("data-ingest.yml");
  const calibration = workflow("darkness-calibration.yml");
  const calendar = workflow("calendar-refresh.yml");
  const health = workflow("health-check.yml");
  assertIncludes(calendar, "schedule:");
  assertIncludes(calendar, "pnpm data:calendar:real");
  assertIncludes(calendar, "--replace");
  assertIncludes(calendar, "pnpm data:calendar:manifest");
  assertIncludes(health, "pnpm data:health:validate");
  const publishingWorkflows = `${ingest}\n${calibration}\n${calendar}`;
  if (/\[skip ci\]/i.test(publishingWorkflows)) throw new Error("derived-data commits must not suppress Cloudflare Git builds");
  if (/vercel deploy|wrangler deploy|cloudflare deploy/i.test(`${publishingWorkflows}\n${health}`)) {
    throw new Error("workflows must leave deployment to the Cloudflare Git integration");
  }
});

test("scheduled static health validation does not require ignored intermediate files", () => {
  const imageValidator = readFileSync(join(root, "scripts/validate/validate-images.ts"), "utf8");
  if (imageValidator.includes("generatedPath") || imageValidator.includes("generated/intermediate")) {
    throw new Error("image validation must be reproducible from committed source configuration");
  }
});

function assertIncludes(value: string, expected: string) {
  if (!value.includes(expected)) throw new Error(`Expected workflow text to contain: ${expected}`);
}
