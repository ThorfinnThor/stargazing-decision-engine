import type { ObservationSite } from "../data/types.js";

/**
 * Fail-closed publication gate for travel recommendations.
 * Public sites are eligible; limited sites require a reviewed access source.
 */
export function isTravelEligibleSite(site: ObservationSite) {
  if (!site.active || site.publicAccess === "no" || site.publicAccess === "unknown") return false;
  if (site.publicAccess === "limited") return Boolean(site.notesSourceUrl?.trim());
  return true;
}
