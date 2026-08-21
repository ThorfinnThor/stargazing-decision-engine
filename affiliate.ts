import type { AffiliateConfig, AffiliatePartner, Destination } from "../data/types.js";

const partnerTypes = new Set(["hotel", "activity", "camping", "car_rental", "gear"]);

function environmentAffiliateId(partner: AffiliatePartner) {
  const key = `AFFILIATE_${partner.id.replace(/[^A-Za-z0-9]/g, "_").toUpperCase()}_ID`;
  return process.env[key]?.trim() || partner.affiliateId.trim();
}

function hostAllowed(host: string, allowedHosts: string[]) {
  return allowedHosts.map((value) => value.toLowerCase()).includes(host.toLowerCase());
}

export function validateAffiliateConfig(config: AffiliateConfig) {
  if (config.version !== 1 || config.partners.length === 0) throw new Error("Affiliate config must use version 1 and define at least one partner");
  const ids = new Set<string>();
  for (const partner of config.partners) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(partner.id) || ids.has(partner.id)) throw new Error(`Affiliate partner ID is invalid or duplicated: ${partner.id}`);
    ids.add(partner.id);
    if (!partnerTypes.has(partner.type)) throw new Error(`${partner.id}: unsupported affiliate type`);
    if (partner.allowedHosts.length === 0 || partner.allowedHosts.some((host) => !/^[a-z0-9.-]+$/.test(host) || host.includes(".."))) throw new Error(`${partner.id}: invalid host allowlist`);
    if (!partner.disclosure.en.trim() || !partner.disclosure.de.trim()) throw new Error(`${partner.id}: bilingual disclosure is required`);
    if (!partner.urlTemplate.includes("{query}")) throw new Error(`${partner.id}: URL template must include {query}`);
    const sample = partner.urlTemplate.replaceAll("{query}", "Sample%20destination").replaceAll("{affiliateId}", "sample-id");
    let parsed: URL;
    try { parsed = new URL(sample); } catch { throw new Error(`${partner.id}: URL template is not a valid absolute URL`); }
    if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname, partner.allowedHosts)) throw new Error(`${partner.id}: URL host is not allow-listed HTTPS`);
    if (partner.enabled && !environmentAffiliateId(partner) && partner.urlTemplate.includes("{affiliateId}")) throw new Error(`${partner.id}: enabled partner requires an affiliate ID`);
  }
}

export function getAffiliatePartner(config: AffiliateConfig, partnerId: string) {
  return config.partners.find((partner) => partner.id === partnerId) ?? null;
}

export function buildAffiliateUrl(config: AffiliateConfig, partnerId: string, destination: Destination) {
  const partner = getAffiliatePartner(config, partnerId);
  if (!partner || !partner.enabled) return null;
  const affiliateId = environmentAffiliateId(partner);
  if (partner.urlTemplate.includes("{affiliateId}") && !affiliateId) return null;
  const rawUrl = partner.urlTemplate.replaceAll("{query}", encodeURIComponent(destination.affiliateQuery)).replaceAll("{affiliateId}", encodeURIComponent(affiliateId));
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return null; }
  if (parsed.protocol !== "https:" || !hostAllowed(parsed.hostname, partner.allowedHosts)) return null;
  return parsed.toString();
}

export function affiliateRel() {
  return "sponsored nofollow";
}
