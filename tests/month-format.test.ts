import assert from "node:assert/strict";
import test from "node:test";

import { formatMonth } from "../lib/i18n/months.js";

test("formats numeric month data as localized user-facing names", () => {
  assert.equal(formatMonth(7, "en"), "July");
  assert.equal(formatMonth(7, "de"), "Juli");
  assert.equal(formatMonth(0, "en"), "—");
  assert.equal(formatMonth(13, "de"), "—");
});
