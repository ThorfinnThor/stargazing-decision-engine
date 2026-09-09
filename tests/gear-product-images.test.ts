import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { loadGearProductImages, validateGearProductImages } from "../lib/gear/product-images.js";
import type { GearGuide } from "../lib/data/types.js";

const read = <T>(path: string) => JSON.parse(readFileSync(path, "utf8")) as T;
const images = loadGearProductImages();
const guides = read<GearGuide[]>("data-config/gear/guides.json");
const matches = read<{guideSlug: string; productName: string; path: string}[]>("data-config/gear/astroshop-product-matches.json");
const evidence = read<{products: {id: string; productName: string; usedImageSrc: string; generatedHref: string}[]}>("docs/gear-product-image-permissions-2026-09-09.json");

test("each published image matches a real guide item, exact affiliate product, and captured permission", () => {
  assert.equal(images.length, 36);
  for (const image of images) {
    assert.ok(guides.find(g => g.slug === image.guideSlug)?.items.some(p => p.name.en === image.productName));
    const match = matches.find(m => m.guideSlug === image.guideSlug && m.productName === image.productName);
    assert.equal(image.sourceUrl, `https://www.astroshop.de${match?.path}`);
    const permission = evidence.products.find(p => p.productName === image.productName);
    assert.ok(permission);
    assert.equal(image.src, permission.usedImageSrc);
    assert.equal(permission.generatedHref, `${image.sourceUrl}?affiliate_id=StargazingIndex`);
    assert.equal(image.permissionEvidence, `docs/gear-product-image-permissions-2026-09-09.json#${permission.id}`);
    assert.ok(!image.src.includes("dehttps://"));
  }
});

test("unapproved manufacturer candidates never enter the published image catalog", () => {
  const audit = read<{products: {guideSlug: string; productName: string; status: string}[]}>("docs/gear-product-image-audit-2026-09-09.json");
  assert.equal(audit.products.length, 52);
  for (const item of audit.products) {
    const published = images.some(i => i.guideSlug === item.guideSlug && i.productName === item.productName);
    assert.equal(published, item.status === "approved-affiliate-media");
  }
});

test("invalid, duplicated, or untraceable product images fail validation", () => {
  const sample = images[0];
  assert.throws(() => validateGearProductImages([sample, sample]), /Duplicate/);
  for (const src of ["http://www.astroshop.de/Produktbilder/a.jpg", "https://example.com/a.jpg", "https://www.astroshop.dehttps://nc.nimax-img.de/a.jpg", "https://www.astroshop.de/account"]) {
    assert.throws(() => validateGearProductImages([{...sample, src}]), /Unapproved/);
  }
  assert.throws(() => validateGearProductImages([{...sample, permissionEvidence: ""}]), /provenance/);
  assert.throws(() => validateGearProductImages([{...sample, width: 0}]), /dimensions/);
});
