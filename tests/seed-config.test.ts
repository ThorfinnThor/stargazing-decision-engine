import assert from "node:assert/strict";
import { resolve } from "node:path";
import test from "node:test";

import { execFileSync } from "node:child_process";

test("seed configuration references resolve", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["--import", "tsx", resolve(process.cwd(), "scripts/validate/validate-seed-config.ts")], { stdio: "pipe" });
  });
});
