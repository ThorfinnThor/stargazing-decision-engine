import type { GearCategory, GearGuide, GearProductMetadata } from "../data/types.js";

function assertDate(value: string, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label}: lastReviewedAt must be an ISO date`);
}

function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

export function gearGuideEditorialIssues(guide: GearGuide) {
  const issues: string[] = [];
  if (guide.items.length < 3) issues.push("fewer-than-three-compared-products");
  if (guide.buyingCriteria.length < 4) issues.push("insufficient-buying-criteria");
  if (guide.tradeoffs.en.length < 3 || guide.tradeoffs.de.length < 3) issues.push("insufficient-tradeoffs");
  if (guide.faq.length < 3) issues.push("insufficient-faq-depth");
  if (wordCount(guide.summary.en) < 10 || wordCount(guide.summary.de) < 10) issues.push("thin-summary");
  if (wordCount(guide.decisionSummary.en) < 25 || wordCount(guide.decisionSummary.de) < 25) issues.push("thin-decision-summary");
  if (wordCount(guide.audience.en) < 10 || wordCount(guide.audience.de) < 10) issues.push("thin-audience-definition");

  const names = new Set<string>();
  const sources = new Set<string>();
  for (const item of guide.items) {
    if (names.has(item.name.en)) issues.push("duplicate-product-name");
    names.add(item.name.en);
    if (!item.source) {
      issues.push("product-without-primary-source");
    } else if (sources.has(item.source.url)) {
      issues.push("duplicate-product-source");
    } else {
      sources.add(item.source.url);
    }
    if (!item.localizedCoreSpecs || Object.keys(item.localizedCoreSpecs.en).length < 4 || Object.keys(item.localizedCoreSpecs.de).length < 4) issues.push("insufficient-localized-specifications");
    if (item.pros.en.length < 2 || item.pros.de.length < 2 || item.cons.en.length < 2 || item.cons.de.length < 2) issues.push("insufficient-product-tradeoffs");
    if (wordCount(item.whyItMatters.en) < 15 || wordCount(item.whyItMatters.de) < 15) issues.push("thin-product-rationale");
  }
  for (const faq of guide.faq) {
    if (wordCount(faq.answer.en) < 18 || wordCount(faq.answer.de) < 18) issues.push("thin-faq-answer");
  }
  return [...new Set(issues)];
}

export function isGearGuideEditorialReady(guide: GearGuide) {
  return gearGuideEditorialIssues(guide).length === 0;
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
    if (guide.items.some((item) => item.source) && !guide.items.every((item) => item.source)) throw new Error(`${guide.slug}: source-backed comparisons may not mix sourced and unsourced products`);
    if (guide.items.some((item) => item.source)) {
      const editorialIssues = gearGuideEditorialIssues(guide);
      if (editorialIssues.length > 0) throw new Error(`${guide.slug}: source-backed comparison is not editorially ready (${editorialIssues.join(", ")})`);
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
