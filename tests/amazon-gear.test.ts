import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildAmazonProductUrl, validateAmazonGearConfig, type AmazonGearConfig } from "../lib/affiliate/amazon.js";
import type { GearGuide } from "../lib/data/types.js";

const config = JSON.parse(readFileSync("data-config/gear/amazon-product-matches.json", "utf8")) as AmazonGearConfig;
const guides = JSON.parse(readFileSync("data-config/gear/guides.json", "utf8")) as GearGuide[];

test("all approved Amazon links identify a specific guide product and preserve the supplied tracking ID", () => {
  validateAmazonGearConfig(config, guides);
  assert.equal(config.matches.length, 27);
  for (const match of config.matches) {
    const item = guides.find(g => g.slug === match.guideSlug)!.items.find(i => i.name.en === match.productName)!;
    const url = new URL(buildAmazonProductUrl(config, match.guideSlug, item)!);
    assert.equal(url.origin, "https://www.amazon.de");
    assert.equal(url.pathname, `/dp/${match.asin}`);
    assert.equal(url.searchParams.get("tag"), "stargazingindex-21");
    assert.equal(url.searchParams.get("th"), "1");
    assert.equal(url.searchParams.get("psc"), "1");
    assert.equal(url.searchParams.has("linkId"), false);
  }
});

test("Amazon OneLink records the verified DE-to-US account mapping without rewriting source links", () => {
  validateAmazonGearConfig(config, guides);
  assert.deepEqual(config.oneLink, {
    enabled: true,
    sourceStoreId: "seitenhafen36-21",
    destinationStoreIds: { "amazon.com": "seitenhafen36-20" },
    redirectPreference: "close-match",
    checkedAt: "2026-09-27",
  });
  const match = config.matches[0];
  const item = guides.find(g => g.slug === match.guideSlug)!.items.find(i => i.name.en === match.productName)!;
  const url = new URL(buildAmazonProductUrl(config, match.guideSlug, item)!);
  assert.equal(url.hostname, "www.amazon.de");
  assert.equal(url.searchParams.get("tag"), "stargazingindex-21");
  assert.equal(url.toString().includes("seitenhafen36-20"), false);
});

test("Amazon links fail closed without an exact match or valid configuration", () => {
  const item = guides[0].items[0];
  assert.equal(buildAmazonProductUrl(config, guides[0].slug, item), null);
  const match = config.matches[0];
  const known = guides.find(g => g.slug === match.guideSlug)!.items.find(i => i.name.en === match.productName)!;
  assert.equal(buildAmazonProductUrl({...config, enabled:false}, match.guideSlug, known), null);
  assert.equal(buildAmazonProductUrl({...config, trackingId:"bad&redirect=evil"}, match.guideSlug, known), null);
  assert.equal(buildAmazonProductUrl(config, "another-guide", known), null);
  assert.equal(buildAmazonProductUrl(config, match.guideSlug, {...known, name:{en:"Different model",de:"Different model"}}), null);
  assert.throws(() => validateAmazonGearConfig({...config,matches:[match,match]},guides), /Duplicate/);
  assert.throws(() => validateAmazonGearConfig({...config,matches:[{...match,asin:"../search"}]},guides), /Invalid/);
  assert.throws(() => validateAmazonGearConfig({...config,matches:[{...match,productName:"Unknown"}]},guides), /unknown/);
  assert.throws(() => validateAmazonGearConfig({...config,oneLink:{...config.oneLink!,sourceStoreId:"wrong-20"}},guides), /OneLink/);
  assert.throws(() => validateAmazonGearConfig({...config,oneLink:{...config.oneLink!,destinationStoreIds:{"amazon.com":"wrong-21"}}},guides), /OneLink/);
});

test("replacement products never inherit the unavailable model's affiliate mapping", () => {
  for (const [slug, oldName, newName] of [
    ["smartphone-telescope-adapters","Move Shoot Move Lightweight Tridaptor","Move Shoot Move Tridaptor Metal"],
    ["portable-power","Jackery Explorer 300 Plus","Jackery Explorer 240 v2"],
    ["star-trackers","Move Shoot Move NOMAD","Vixen Polarie Star Tracker"],
  ]) {
    const guide = guides.find(g => g.slug === slug)!;
    assert.equal(buildAmazonProductUrl(config, slug, guide.items.find(i => i.name.en === oldName)!), null);
    assert.ok(buildAmazonProductUrl(config, slug, guide.items.find(i => i.name.en === newName)!));
  }
});

test("redirected or unavailable Amazon listings fail closed", () => {
  for (const [slug, productName] of [
    ["portable-power", "Anker SOLIX C300 DC"],
    ["eyepieces", "Explore Scientific 82° Series 11 mm"],
    ["smartphone-telescope-adapters", "Omegon Smartphone Adapter 25–48 mm"],
  ]) {
    const guide = guides.find(g => g.slug === slug)!;
    const item = guide.items.find(i => i.name.en === productName)!;
    assert.equal(buildAmazonProductUrl(config, slug, item), null);
  }
});

test("retailer links remain separate, open new tabs and disclose Amazon commissions and imports", () => {
  const component = readFileSync("components/affiliate-gear-product-link.tsx", "utf8");
  const page = readFileSync("app/[locale]/gear/[slug]/page.tsx", "utf8");
  assert.match(component, /target="_blank"/);
  assert.match(component, /affiliateRel\(\).*noopener noreferrer/);
  assert.match(page, /retailer="Amazon"/);
  assert.match(page, /As an Amazon Associate I earn from qualifying purchases/);
  assert.match(page, /Als Amazon-Partner verdiene ich an qualifizierten Verkäufen/);
  assert.match(page, /Amazon US import offer/);
  assert.deepEqual(
    config.matches.filter(m => m.importOffer).map(m => m.productName).sort(),
    [
      "Celestron Nature DX 8×42",
      "Celestron Omni 12 mm",
      "Celestron Smart DewHeater Controller 2X",
    ].sort(),
  );
});
