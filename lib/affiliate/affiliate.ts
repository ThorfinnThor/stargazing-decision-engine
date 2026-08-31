import type { AffiliateActivityOffer, AffiliateActivityOfferConfig, AffiliateConfig, AffiliatePartner, Destination, LocationTour } from "../data/types.js";

const partnerTypes = new Set(["hotel", "activity", "camping", "car_rental", "gear"]);

export function affiliatePartnerId(partner: AffiliatePartner) {
  const key = `AFFILIATE_${partner.id.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}_ID`;
  return process.env[key]?.trim() || partner.affiliateId.trim();
}

export function hostAllowed(host: string, allowedHosts: string[]) {
  return allowedHosts.map((value) => value.toLowerCase()).includes(host.toLowerCase());
}

function parseAffiliateTemplate(partner: AffiliatePartner, template: string, label: string) {
  if (!template.includes("{affiliateId}")) throw new Error(`${label}: URL template must include {affiliateId}`);
  const sample = template.replaceAll("{query}", "Sample%20destination").replaceAll("{affiliateId}", "sample-id");
  let parsed: URL;
  try { parsed = new URL(sample); } catch { throw new Error(`${label}: URL template is not a valid absolute URL`); }
  if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname, partner.allowedHosts)) throw new Error(`${label}: URL host is not allow-listed HTTPS`);
  for (const parameter of partner.requiredQueryParameters) {
    if (!parsed.searchParams.has(parameter)) throw new Error(`${label}: URL template must preserve the ${parameter} tracking parameter`);
  }
  return parsed;
}

export function validateAffiliateConfig(config: AffiliateConfig) {
  if (config.version !== 1 || config.partners.length === 0) throw new Error("Affiliate config must use version 1 and define at least one partner");
  const ids = new Set<string>();
  for (const partner of config.partners) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(partner.id) || ids.has(partner.id)) throw new Error(`Affiliate partner ID is invalid or duplicated: ${partner.id}`);
    ids.add(partner.id);
    if (!partner.name.trim()) throw new Error(`${partner.id}: partner name is required`);
    if (!partnerTypes.has(partner.type)) throw new Error(`${partner.id}: unsupported affiliate type`);
    if (partner.allowedHosts.length === 0 || partner.allowedHosts.some((host) => !/^[a-z0-9.-]+$/.test(host) || host.includes(".."))) throw new Error(`${partner.id}: invalid host allowlist`);
    if (partner.requiredQueryParameters.some((parameter) => !/^[A-Za-z0-9_-]+$/.test(parameter))) throw new Error(`${partner.id}: invalid required query parameter`);
    if (!partner.disclosure.en.trim() || !partner.disclosure.de.trim()) throw new Error(`${partner.id}: bilingual disclosure is required`);
    if (partner.destinationSearchEnabled) {
      if (!partner.urlTemplate?.includes("{query}")) throw new Error(`${partner.id}: destination-search URL template must include {query}`);
      parseAffiliateTemplate(partner, partner.urlTemplate, partner.id);
      const variantIds = new Set<string>();
      for (const variant of partner.destinationSearchVariants ?? []) {
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variant.id) || variantIds.has(variant.id)) throw new Error(`${partner.id}: destination-search variant ID is invalid or duplicated: ${variant.id}`);
        variantIds.add(variant.id);
        if (!variant.queryTemplate.includes("{query}")) throw new Error(`${partner.id}/${variant.id}: query template must include {query}`);
        if (variant.queryTemplate.replaceAll("{query}", "").includes("{")) throw new Error(`${partner.id}/${variant.id}: query template contains an unsupported placeholder`);
      }
    } else if (partner.urlTemplate !== null) {
      throw new Error(`${partner.id}: curated-only partner must not define a destination-search URL template`);
    } else if ((partner.destinationSearchVariants?.length ?? 0) > 0) {
      throw new Error(`${partner.id}: disabled destination search must not define variants`);
    }
    if (partner.widget) {
      if (partner.widget.type !== "activities") throw new Error(`${partner.id}: unsupported widget type`);
      if (!/^[A-Za-z0-9_-]+$/.test(partner.widget.campaign)) throw new Error(`${partner.id}: invalid widget campaign`);
      if (!Number.isInteger(partner.widget.itemCount) || partner.widget.itemCount < 1 || partner.widget.itemCount > 5) throw new Error(`${partner.id}: widget item count must be between 1 and 5`);
      if (partner.widget.destinationIds.length === 0 || new Set(partner.widget.destinationIds).size !== partner.widget.destinationIds.length) throw new Error(`${partner.id}: widget destination IDs must be unique and non-empty`);
      for (const [label, rawUrl] of [["script", partner.widget.scriptUrl], ["frame", partner.widget.frameUrl]] as const) {
        let widgetUrl: URL;
        try { widgetUrl = new URL(rawUrl); } catch { throw new Error(`${partner.id}: widget ${label} URL is invalid`); }
        if (widgetUrl.protocol !== "https:" || !hostAllowed(widgetUrl.hostname, partner.allowedHosts)) throw new Error(`${partner.id}: widget ${label} host is not allow-listed HTTPS`);
      }
      if (partner.widget.enabled && !partner.enabled) throw new Error(`${partner.id}: enabled widget requires an enabled partner`);
    }
    if (partner.enabled && !affiliatePartnerId(partner)) throw new Error(`${partner.id}: enabled partner requires an affiliate ID`);
  }
}

export function validateAffiliateActivityOffers(config: AffiliateActivityOfferConfig, partners: AffiliateConfig, destinations: Destination[], tours: LocationTour[]) {
  if (config.version !== 1) throw new Error("Affiliate activity offers must use version 1");
  const ids = new Set<string>();
  const destinationIds = new Set(destinations.map((destination) => destination.id));
  const tourBySlug = new Map(tours.map((tour) => [tour.slug, tour]));
  for (const offer of config.offers) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(offer.id) || ids.has(offer.id)) throw new Error(`Affiliate activity offer ID is invalid or duplicated: ${offer.id}`);
    ids.add(offer.id);
    const partner = getAffiliatePartner(partners, offer.partnerId);
    if (!partner || partner.type !== "activity") throw new Error(`${offer.id}: activity partner does not exist`);
    if (!destinationIds.has(offer.destinationId)) throw new Error(`${offer.id}: destination does not exist`);
    if (!offer.title.en.trim() || !offer.title.de.trim() || !offer.description.en.trim() || !offer.description.de.trim()) throw new Error(`${offer.id}: bilingual title and description are required`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(offer.lastReviewedAt)) throw new Error(`${offer.id}: lastReviewedAt must use YYYY-MM-DD`);
    if (offer.locationTourSlugs.length === 0) throw new Error(`${offer.id}: at least one location tour mapping is required`);
    for (const slug of new Set(offer.locationTourSlugs)) {
      const tour = tourBySlug.get(slug);
      if (!tour || tour.destinationId !== offer.destinationId) throw new Error(`${offer.id}: location tour ${slug} does not match destination ${offer.destinationId}`);
    }
    parseAffiliateTemplate(partner, offer.urlTemplate, offer.id);
    if (offer.enabled && !partner.enabled) throw new Error(`${offer.id}: enabled offer requires an enabled partner`);
  }
}

export function getAffiliatePartner(config: AffiliateConfig, partnerId: string) {
  return config.partners.find((partner) => partner.id === partnerId) ?? null;
}

export function buildAffiliateUrl(config: AffiliateConfig, partnerId: string, destination: Destination, variantId?: string) {
  const partner = getAffiliatePartner(config, partnerId);
  if (!partner || !partner.enabled || !partner.destinationSearchEnabled || !partner.urlTemplate) return null;
  const variants = partner.destinationSearchVariants ?? [];
  const variant = variantId ? variants.find((item) => item.id === variantId) : null;
  if (variantId && !variant) return null;
  if (!variantId && variants.length > 0) return null;
  const affiliateId = affiliatePartnerId(partner);
  if (partner.urlTemplate.includes("{affiliateId}") && !affiliateId) return null;
  const query = variant ? variant.queryTemplate.replaceAll("{query}", destination.affiliateQuery) : destination.affiliateQuery;
  const rawUrl = partner.urlTemplate.replaceAll("{query}", encodeURIComponent(query)).replaceAll("{affiliateId}", encodeURIComponent(affiliateId));
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return null; }
  if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname, partner.allowedHosts)) return null;
  return parsed.toString();
}

export function buildAffiliateActivityUrl(config: AffiliateConfig, offer: AffiliateActivityOffer) {
  const partner = getAffiliatePartner(config, offer.partnerId);
  if (!partner || !partner.enabled || !offer.enabled) return null;
  const affiliateId = affiliatePartnerId(partner);
  if (!affiliateId) return null;
  const rawUrl = offer.urlTemplate.replaceAll("{affiliateId}", encodeURIComponent(affiliateId));
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return null; }
  if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname, partner.allowedHosts)) return null;
  if (partner.requiredQueryParameters.some((parameter) => !parsed.searchParams.has(parameter))) return null;
  return parsed.toString();
}

export function affiliateRel() {
  return "sponsored nofollow";
}
