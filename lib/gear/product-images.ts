import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Only approved product media belongs here; research candidates stay in the audit. */
export interface GearProductImage {
  guideSlug: string;
  productName: string;
  src: string;
  width: number;
  height: number;
  sourceUrl: string;
  permissionEvidence: string;
  checkedAt: string;
}

export function loadGearProductImages(): GearProductImage[] {
  const images = JSON.parse(readFileSync(resolve(process.cwd(), "data-config/gear/product-images.json"), "utf8")) as GearProductImage[];
  validateGearProductImages(images);
  return images;
}

export function validateGearProductImages(images: GearProductImage[]): void {
  const keys = new Set<string>();
  for (const image of images) {
    const key = `${image.guideSlug}/${image.productName}`;
    if (keys.has(key)) throw new Error(`Duplicate gear product image: ${key}`);
    keys.add(key);
    const url = new URL(image.src);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !["www.astroshop.de", "nc.nimax-img.de"].includes(url.hostname) || !url.pathname.startsWith("/Produktbilder/")) throw new Error(`Unapproved product-image host or path: ${key}`);
    if (!image.permissionEvidence?.trim() || !image.sourceUrl?.startsWith("https://") || !/^\d{4}-\d{2}-\d{2}$/.test(image.checkedAt)) throw new Error(`Missing product-image provenance: ${key}`);
    if (!Number.isInteger(image.width) || !Number.isInteger(image.height) || image.width <= 0 || image.height <= 0) throw new Error(`Invalid product-image dimensions: ${key}`);
  }
}
