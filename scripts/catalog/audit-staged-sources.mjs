import { execFile } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const root = process.cwd();
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const argument = (name, fallback) => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
};

const output = argument("--output", "docs/staged-source-audit.json");
const concurrency = Number(argument("--concurrency", "8"));
const timeoutMs = Number(argument("--timeout-ms", "20000"));
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 20) throw new Error("--concurrency must be an integer from 1 to 20");
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) throw new Error("--timeout-ms must be an integer from 1000 to 120000");

const destinations = readJson("data-config/sources/destinations.json");
const guides = readJson("data-config/editorial/destination-guides.json");
const sites = readJson("data-config/sources/observation-sites.json");
const factualReviews = readJson("data-config/sources/staged-factual-reviews.json");
const cohortDestinationIds = new Set(factualReviews.records.map((record) => record.destinationId));
const stagedGuides = guides.filter((guide) => cohortDestinationIds.has(guide.destinationId));
const stagedSites = sites.filter((site) => cohortDestinationIds.has(site.destinationId));
const execFileAsync = promisify(execFile);

const references = new Map();
const addReference = (url, reference) => {
  if (!references.has(url)) references.set(url, []);
  references.get(url).push(reference);
};
for (const guide of stagedGuides) {
  for (const source of guide.sources ?? []) {
    addReference(source.url, { destinationId: guide.destinationId, kind: "guide", sourceId: source.id });
  }
}
for (const site of stagedSites) {
  if (site.notesSourceUrl) addReference(site.notesSourceUrl, { destinationId: site.destinationId, kind: "site", siteId: site.id });
}

async function request(url, method) {
  const writeOut = "%{http_code}\t%{url_effective}\t%{content_type}\t%{num_redirects}\t%{time_total}";
  const argumentsList = [
    "--silent", "--show-error", "--location", "--max-time", String(Math.ceil(timeoutMs / 1000)),
    "--output", "/dev/null", "--write-out", writeOut,
    "--user-agent", "stargazing-index-source-audit/1.0 (+https://stargazingindex.com)",
  ];
  if (method === "HEAD") argumentsList.push("--head");
  else argumentsList.push("--range", "0-0");
  argumentsList.push(url);
  const { stdout } = await execFileAsync("curl", argumentsList, { timeout: timeoutMs + 2000, maxBuffer: 1024 * 1024 });
  const [status, finalUrl, contentType, redirectCount, seconds] = stdout.trim().split("\t");
  return {
    status: Number(status),
    url: finalUrl,
    contentType: contentType || null,
    redirectCount: Number(redirectCount),
    durationMs: Math.round(Number(seconds) * 1000),
    ok: Number(status) >= 200 && Number(status) < 400,
  };
}

function classification(status, error) {
  if (error) return "error";
  if (status >= 200 && status < 400) return "reachable";
  if ([401, 403, 429].includes(status)) return "blocked";
  if ([404, 410].includes(status)) return "missing";
  return "http-error";
}

async function inspect(url) {
  const startedAt = Date.now();
  let response;
  let method = "HEAD";
  let error = null;
  try {
    response = await request(url, method);
  } catch (caught) {
    error = caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught);
  }
  if (!response?.ok) {
    method = "GET";
    try {
      response = await request(url, method);
      error = null;
    } catch (caught) {
      error = caught instanceof Error ? `${caught.name}: ${caught.message}` : String(caught);
    }
  }
  const status = response?.status ?? 0;
  return {
    url,
    references: references.get(url),
    https: url.startsWith("https://"),
    classification: classification(status, error),
    status,
    method,
    finalUrl: response?.url ?? null,
    redirected: Boolean(response?.url && response.url !== url),
    redirectCount: response?.redirectCount ?? 0,
    contentType: response?.contentType ?? null,
    durationMs: response?.durationMs ?? Date.now() - startedAt,
    error,
  };
}

const urls = [...references.keys()].sort();
const records = new Array(urls.length);
let cursor = 0;
async function worker() {
  while (cursor < urls.length) {
    const index = cursor;
    cursor += 1;
    records[index] = await inspect(urls[index]);
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()));

const counts = records.reduce((result, record) => {
  result[record.classification] = (result[record.classification] ?? 0) + 1;
  return result;
}, { reachable: 0, blocked: 0, missing: 0, "http-error": 0, error: 0 });
const report = {
  version: 1,
  checkedAt: new Date().toISOString(),
  method: "HTTP HEAD with GET fallback, redirects followed; reachability does not verify factual support, current access, or image licensing.",
  cohort: {
    destinations: cohortDestinationIds.size,
    sites: stagedSites.length,
    sourceRecords: stagedGuides.reduce((sum, guide) => sum + (guide.sources?.length ?? 0), 0),
    uniqueUrls: urls.length,
  },
  summary: counts,
  records,
};
const outputPath = resolve(root, output);
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Audited ${urls.length} staged source URL(s): ${Object.entries(counts).map(([key, value]) => `${key}=${value}`).join(", ")}.`);
console.log(`Wrote ${output}.`);
