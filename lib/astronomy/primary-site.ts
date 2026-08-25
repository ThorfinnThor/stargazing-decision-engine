import { isTravelEligibleSite } from "../access/travel";
import type { Destination, ObservationSite } from "../data/types.js";
import type { SkyLocation } from "./types.js";
import { isFiniteLatitude, isFiniteLongitude, isValidTimeZone } from "./validation";

function isUsableSite(site: ObservationSite) {
  return site.active && isFiniteLatitude(site.lat) && isFiniteLongitude(site.lon);
}

export function resolvePrimaryObservationSite(
  destination: Destination,
  allSites: readonly ObservationSite[],
  options: { requireHomepageEligibility?: boolean } = {},
) {
  const homepage = options.requireHomepageEligibility === true;
  const byId = new Map(allSites.map((site) => [site.id, site]));
  let selected: ObservationSite | null = null;
  for (const id of destination.observationSiteIds) {
    const site = byId.get(id);
    if (site?.destinationId === destination.id && isUsableSite(site)) { selected = site; break; }
  }
  selected ??= allSites
    .filter((site) => site.destinationId === destination.id && isUsableSite(site))
    .sort((left, right) => right.priority - left.priority || left.id.localeCompare(right.id))[0] ?? null;
  return selected && (!homepage || isTravelEligibleSite(selected)) ? selected : null;
}

export function createSkyLocation(destination: Destination, site: ObservationSite): SkyLocation | null {
  if (site.destinationId !== destination.id || !isFiniteLatitude(site.lat) || !isFiniteLongitude(site.lon) || !isValidTimeZone(destination.timezone)) return null;
  return {
    id: `${destination.id}:${site.id}`,
    destinationId: destination.id,
    destinationSlug: destination.slug,
    destinationName: destination.name,
    siteId: site.id,
    siteName: site.name,
    label: `${site.name} · ${destination.name}`,
    lat: site.lat,
    lon: site.lon,
    elevationM: site.elevationM,
    timeZone: destination.timezone,
  };
}
