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
    assertIncludes(contents, "pnpm/action-setup@v4");
    if (/pnpm\/action-setup@v4\n\s+with:\n\s+version:/.test(contents)) {
      throw new Error(`${name} must read the pnpm version from package.json`);
    }
  }
});

test("ingestion is manual and commits only after the full gate", () => {
  const ingest = workflow("data-ingest.yml");
  assertIncludes(ingest, "workflow_dispatch:");
  assertIncludes(ingest, "pnpm data:validate");
  assertIncludes(ingest, "pnpm data:score:real");
  assertIncludes(ingest, "pnpm data:score:real:validate");
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

test("scheduled workflows do not deploy or ingest on Vercel", () => {
  const calendar = workflow("calendar-refresh.yml");
  const health = workflow("health-check.yml");
  assertIncludes(calendar, "schedule:");
  assertIncludes(calendar, "pnpm data:calendar:real");
  assertIncludes(calendar, "pnpm data:calendar:manifest");
  assertIncludes(health, "pnpm data:health:validate");
  if (/vercel deploy|vercel\.com\/new/i.test(`${calendar}\n${health}`)) throw new Error("workflows must leave deployment to the Vercel integration");
});

function assertIncludes(value: string, expected: string) {
  if (!value.includes(expected)) throw new Error(`Expected workflow text to contain: ${expected}`);
}
