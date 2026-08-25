import type { Destination, ObservationSite } from "../data/types.js";
import type { Locale } from "../i18n/config.js";
import { localizedLinks } from "../i18n/links";
import { createSkyLocation, resolvePrimaryObservationSite } from "./primary-site";
import type { HomepageSkyCandidate, NightPreview } from "./types.js";

export function buildHomepageSkyCandidates(input: {
  destinations: readonly Destination[];
  sites: readonly ObservationSite[];
  locale: Locale;
  previews: readonly NightPreview[];
}): HomepageSkyCandidate[] {
  const output: HomepageSkyCandidate[] = [];
  const includedDestinationIds = new Set<string>();
  for (const destination of input.destinations) {
    if (!destination.active || includedDestinationIds.has(destination.id)) continue;
    const site = resolvePrimaryObservationSite(destination, input.sites, { requireHomepageEligibility: true });
    if (!site) continue;
    const location = createSkyLocation(destination, site);
    if (!location) continue;
    const previewIds = input.previews
      .filter((preview) => preview.destinationId === destination.id && preview.destinationSlug === destination.slug && preview.siteId === site.id)
      .map((preview) => preview.id)
      .sort();
    if (previewIds.length === 0) continue;
    output.push({
      id: `${destination.id}:${site.id}`,
      destinationHref: localizedLinks.destination(input.locale, destination.slug),
      location,
      previewIds,
    });
    includedDestinationIds.add(destination.id);
  }
  return output.sort((left, right) => {
    const leftPriority = input.destinations.find((item) => item.id === left.location.destinationId)?.priority ?? 0;
    const rightPriority = input.destinations.find((item) => item.id === right.location.destinationId)?.priority ?? 0;
    return rightPriority - leftPriority || left.location.destinationSlug.localeCompare(right.location.destinationSlug) || left.location.siteId.localeCompare(right.location.siteId);
  });
}
