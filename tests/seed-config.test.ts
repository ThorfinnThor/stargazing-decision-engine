import assert from "node:assert/strict";
import test from "node:test";

import { execFileSync } from "node:child_process";

test("seed configuration references resolve", () => {
  assert.doesNotThrow(() => {
    execFileSync("pnpm", ["data:seed:validate"], { stdio: "pipe" });
  });
});
