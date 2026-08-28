import type { GearCategory, GearGuide, GearProductMetadata } from "../data/types.js";

function assertDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label}: lastReviewedAt must be an ISO date`);
}

export function validateGearCatalog(categories: GearCategory[], guides: GearGuide[], products: GearProductMetadata[]) {
  if (categories.length < 1 || guides.length < 1) throw new Error("Gear catalog requires categories and guides");
  const categoryIds = new Set(categories.map((category) => category.id));
  if (categoryIds.size !== categories.length) throw new Error("Gear category IDs must be unique");
  const guideSlugs = new Set<string>();
  for (const guide of guides) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(guide.slug) || guideSlugs.has(guide.slug)) throw new Error(`Invalid or duplicate gear guide slug: ${guide.slug}`);
    guideSlugs.add(guide.slug);
    if (!categoryIds.has(guide.category)) throw new Error(`${guide.slug}: unknown gear category`);
    if (guide.items.length === 0 || guide.buyingCriteria.length === 0 || guide.faq.length === 0) throw new Error(`${guide.slug}: editorial sections are incomplete`);
    assertDate(guide.lastReviewedAt, `${guide.slug}`);
    for (const item of guide.items) {
      if (item.recommendationBasis !== "specification_analysis" || !item.partnerSearchQuery.trim() || item.affiliatePartnerId !== null) throw new Error(`${guide.slug}: gear item must remain specification-only with dormant affiliate hook`);
      if (Object.keys(item.coreSpecs).length === 0 || item.pros.en.length === 0 || item.cons.en.length === 0) throw new Error(`${guide.slug}: item requires specs, pros, and cons`);
      if (item.localizedCoreSpecs && (Object.keys(item.localizedCoreSpecs.en).length === 0 || Object.keys(item.localizedCoreSpecs.de).length === 0)) throw new Error(`${guide.slug}: localized item specs must be complete in both languages`);
      if (item.source) {
        if (!item.source.url.startsWith("https://") || !item.source.publisher.trim() || !item.source.title.trim()) throw new Error(`${guide.slug}: item source must be a complete HTTPS record`);
        assertDate(item.source.checkedAt, `${guide.slug} item source`);
      }
    }
  }
  const productIds = new Set<string>();
  for (const product of products) {
    if (!product.id || productIds.has(product.id)) throw new Error(`Invalid or duplicate gear product ID: ${product.id}`);
    productIds.add(product.id);
    if (!categoryIds.has(product.category) || product.recommendationBasis !== "specification_analysis" || product.affiliatePartnerId !== null) throw new Error(`${product.id}: invalid category or affiliate state`);
    assertDate(product.lastReviewedAt, product.id);
  }
}
