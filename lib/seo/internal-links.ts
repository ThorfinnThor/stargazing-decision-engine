// Deterministic internal-link selection shared by destination, tour, gear and
// blog pages. Everything here is pure so it can be unit tested and so every
// locale receives exactly the same link graph.

import type { Destination, ObservationSite } from "../data/types.js";

export interface GeoPoint { lat: number; lon: number }

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// The first listed observation site is the destination's primary site.
export function destinationAnchors(destinations: Destination[], sites: ObservationSite[]) {
  const sitesById = new Map(sites.map((site) => [site.id, site]));
  const anchors = new Map<string, GeoPoint>();
  for (const destination of destinations) {
    const site = destination.observationSiteIds.map((id) => sitesById.get(id)).find((item) => item?.destinationId === destination.id);
    if (site) anchors.set(destination.id, { lat: site.lat, lon: site.lon });
  }
  return anchors;
}

// Lower is closer. Geographic distance dominates; sharing a country halves it,
// another continent triples it, and each shared landscape/darkness tag pulls the
// candidate closer. Nearest-neighbour selection spreads inbound links across the
// catalogue instead of sending every page to the same few high-priority guides.
export function relatednessDistance(target: Destination, candidate: Destination, anchors: Map<string, GeoPoint>) {
  const a = anchors.get(target.id);
  const b = anchors.get(candidate.id);
  let distance = a && b ? haversineKm(a, b) : 20_000;
  if (candidate.countryCode === target.countryCode) distance *= 0.5;
  if (candidate.continent !== target.continent) distance *= 3;
  const targetTags = new Set(target.tags);
  const sharedTags = candidate.tags.filter((tag) => targetTags.has(tag)).length;
  return distance / (1 + 0.25 * sharedTags);
}

export function selectRelatedDestinations(
  target: Destination,
  candidates: Destination[],
  anchors: Map<string, GeoPoint>,
  limit: number,
) {
  return candidates
    .filter((candidate) => candidate.id !== target.id)
    .map((candidate) => ({ candidate, distance: relatednessDistance(target, candidate, anchors) }))
    .sort((left, right) => left.distance - right.distance || left.candidate.slug.localeCompare(right.candidate.slug))
    .slice(0, limit)
    .map((item) => item.candidate);
}

// Destination tags that make a gear guide genuinely useful on that trip.
export const gearGuideTagRules: Record<string, string[]> = {
  "dew-control": ["coast", "coastal", "maritime", "island", "lake", "forest", "woodland", "wetland", "river", "reservoir", "peatland", "moorland", "atlantic", "cloud-variable", "subtropical"],
  "portable-power": ["remote", "wilderness", "outback", "remote-4x4", "remote-camping", "campground", "canoe", "cold", "snow", "high-latitude", "salt-pan", "salt-flat", "salt-desert"],
  "star-trackers": ["very-dark", "dark-sky-reserve", "dark-sky-sanctuary", "southern-sky", "dry"],
  "imx585-astronomy-cameras": ["high-altitude", "very-dark", "dry", "desert", "high-desert"],
  "tripods": ["mountain", "mountains", "alpine", "highland", "upland", "canyon", "volcanic", "red-rock", "granite"],
  "observing-chairs": ["accessible", "comfortable", "road-trip", "prairie", "plain", "farmland", "rural"],
  "binoculars": ["national-park", "dark-sky-park", "wildlife", "savanna", "state-park", "national-monument"],
  "mounted-astronomy-binoculars": ["desert", "semi-desert", "dunes", "savanna", "prairie", "southern-sky"],
  "beginner-telescopes": ["dark-sky-community", "village", "villages", "community", "four-season", "year-round"],
  "eyepieces": ["observatory", "astronomy-centre"],
  "smartphone-telescope-adapters": ["observatory", "guided", "guided-programmes", "bookable-programmes", "programme-only"],
  "astronomy-filters": ["near-city", "urban-night-sky-place", "dark-sky-community", "rural", "heritage"],
};

const gearGuideFallbacks = ["red-flashlights", "binoculars", "observing-chairs"];

export interface GearMatch { slug: string; matchedTags: number }

export function selectGearGuidesForDestination(destination: Pick<Destination, "tags">, availableGuideSlugs: string[], limit = 3): GearMatch[] {
  const available = new Set(availableGuideSlugs);
  const tags = new Set(destination.tags);
  const ruleOrder = Object.keys(gearGuideTagRules);
  const matched = ruleOrder
    .filter((slug) => available.has(slug))
    .map((slug) => ({ slug, matchedTags: gearGuideTagRules[slug].filter((tag) => tags.has(tag)).length }))
    .filter((item) => item.matchedTags > 0)
    .sort((left, right) => right.matchedTags - left.matchedTags || ruleOrder.indexOf(left.slug) - ruleOrder.indexOf(right.slug))
    .slice(0, limit);
  for (const slug of gearGuideFallbacks) {
    if (matched.length >= limit) break;
    if (available.has(slug) && !matched.some((item) => item.slug === slug)) matched.push({ slug, matchedTags: 0 });
  }
  return matched;
}

// Reverse of selectGearGuidesForDestination: destinations whose tag-driven gear
// picks include this guide, strongest match first.
export function selectDestinationsForGearGuide(guideSlug: string, destinations: Destination[], availableGuideSlugs: string[], limit = 4) {
  return destinations
    .map((destination) => ({ destination, match: selectGearGuidesForDestination(destination, availableGuideSlugs).find((item) => item.slug === guideSlug) }))
    .filter((item): item is { destination: Destination; match: GearMatch } => Boolean(item.match && item.match.matchedTags > 0))
    .sort((left, right) => right.match.matchedTags - left.match.matchedTags || left.destination.priority - right.destination.priority || left.destination.slug.localeCompare(right.destination.slug))
    .slice(0, limit)
    .map((item) => item.destination);
}

// Circular neighbours in a stable list, so every item is linked from the same
// number of siblings (unlike always showing the first N).
export function circularNeighbours<T>(items: T[], index: number, count: number) {
  if (index < 0 || items.length <= 1) return items.slice(0, count);
  const result: T[] = [];
  for (let offset = 1; offset < items.length && result.length < count; offset += 1) {
    result.push(items[(index + offset) % items.length]);
  }
  return result;
}

// Counterpart of a localized path in another locale. English-only sections
// (the blog) fall back to the other locale's home page.
export function localeCounterpartPath(pathname: string, targetLocale: string, englishOnlyPrefixes = ["/en/blog/"]) {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (!match) return `/${targetLocale}/`;
  if (match[1] === targetLocale) return pathname;
  if (englishOnlyPrefixes.some((prefix) => pathname.startsWith(prefix))) return `/${targetLocale}/`;
  return `/${targetLocale}${match[2] ?? "/"}`;
}
