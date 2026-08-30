import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";

import { extractStaticReferences, resolveExportedTarget, validateStaticOutput } from "../lib/static-output/links.js";

function fixture() {
  const directory = mkdtempSync(resolve(tmpdir(), "stargazing-static-links-"));
  for (const path of ["en", "de", "en/about", "de/about", "assets"]) mkdirSync(resolve(directory, path), { recursive: true });
  writeFileSync(resolve(directory, "index.html"), '<a href="/en/">English</a>');
  writeFileSync(resolve(directory, "en/index.html"), '<a href="/en/about/?q=one&amp;region=europe#details">About</a><script src="/assets/app.js"></script>');
  writeFileSync(resolve(directory, "de/index.html"), '<a href="/de/about/">Über</a>');
  writeFileSync(resolve(directory, "en/about/index.html"), '<a href="../">Home</a>');
  writeFileSync(resolve(directory, "de/about/index.html"), '<a href="../">Start</a>');
  writeFileSync(resolve(directory, "assets/app.js"), "");
  return directory;
}

test("static reference extraction handles links, assets, and encoded query strings", () => {
  assert.deepEqual(extractStaticReferences('<a href="/en/?q=dark&amp;region=europe">x</a><script src="/app.js"></script>'), [
    "/en/?q=dark&region=europe",
    "/app.js",
  ]);
});

test("static output validation resolves trailing slashes, relative links, assets, and locale parity", () => {
  const directory = fixture();
  assert.ok(resolveExportedTarget(directory, "/en/about/"));
  assert.ok(resolveExportedTarget(directory, "/assets/app.js"));
  const result = validateStaticOutput(directory, "https://stargazingindex.com");
  assert.equal(result.htmlFiles, 5);
  assert.deepEqual(result.broken, []);
  assert.deepEqual(result.localeParityGaps, []);
});

test("static output validation reports broken links and missing localized routes", () => {
  const directory = fixture();
  writeFileSync(resolve(directory, "en/about/index.html"), '<a href="/missing/">Missing</a><a href="https://example.com/external">External</a>');
  writeFileSync(resolve(directory, "en/only.html"), "English only");
  const result = validateStaticOutput(directory, "https://stargazingindex.com");
  assert.deepEqual(result.broken.map((item) => item.targetPath), ["/missing/"]);
  assert.deepEqual(result.localeParityGaps, [{ source: "/en/only", expected: "/de/only" }]);
});
