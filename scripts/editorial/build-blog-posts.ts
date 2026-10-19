import { resolve } from "node:path";

import { blogPostSources } from "../../data-config/editorial/blog-posts.js";
import type { BlogMetric, BlogPost, BlogPostBlock, BlogPostSummary, Destination, ImageManifest, MonthlySiteScore, ObservationSite } from "../../lib/data/types.js";
import type { Era5ClimateSnapshot } from "../../lib/climate/era5/types.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

interface SeedData { destinations: Destination[]; sites: ObservationSite[] }
interface SiteMonthlyFile { scores: MonthlySiteScore[] }
interface DatasetOutput { metrics: BlogMetric[]; block: BlogPostBlock; relatedDestinationSlugs?: string[] }

const seed = readJson<SeedData>(resolve(root, "generated/intermediate/seed.normalized.json"));
const images = readJson<ImageManifest>(publicPath("images/manifest.json"));
const destinationsBySlug = new Map(seed.destinations.map((destination) => [destination.slug, destination]));
const sitesById = new Map(seed.sites.map((site) => [site.id, site]));
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function context(slug: string) {
  const destination = destinationsBySlug.get(slug);
  if (!destination) throw new Error(`Unknown blog destination: ${slug}`);
  const destinationMonthly = readJson<{ siteId: string; dataStatus: "real" | "seed" }>(publicPath(`monthly/destinations/${slug}.json`));
  const site = sitesById.get(destinationMonthly.siteId);
  if (!site) throw new Error(`Missing representative site for blog destination: ${slug}`);
  const monthly = readJson<SiteMonthlyFile>(publicPath(`monthly/sites/${site.slug}.json`)).scores;
  const climate = readJson<Era5ClimateSnapshot>(resolve(root, `data-snapshots/climate/${site.slug}.json`));
  return { destination, site, monthly, climate, dataStatus: destinationMonthly.dataStatus };
}

function table(heading: string, introduction: string, columns: string[], rows: string[][], note: string): BlogPostBlock {
  return { kind: "table", heading, introduction, columns, rows, note };
}

function monthlyAtlas(): DatasetOutput {
  const eligible = seed.destinations.filter((destination) => destination.active).map((destination) => context(destination.slug))
    .filter((item) => item.dataStatus === "real" && (item.site.publicAccess === "yes" || item.site.publicAccess === "limited"));
  const used = new Set<string>();
  const selections = monthNames.map((_, index) => {
    const month = index + 1;
    const winner = eligible
      .filter((item) => !used.has(item.destination.slug) && item.monthly.find((score) => score.month === month)?.confidenceLevel === "high")
      .sort((left, right) => {
        const leftScore = left.monthly.find((score) => score.month === month)?.stargazingTrip ?? -1;
        const rightScore = right.monthly.find((score) => score.month === month)?.stargazingTrip ?? -1;
        return rightScore - leftScore || left.destination.name.localeCompare(right.destination.name);
      })[0];
    if (!winner) throw new Error(`No eligible monthly-atlas destination for month ${month}`);
    used.add(winner.destination.slug);
    return [month, winner.destination.slug] as const;
  });
  const rows = selections.map(([month, slug]) => {
    const { destination, site, monthly, climate } = context(slug);
    const score = monthly.find((item) => item.month === month);
    const weather = climate.months.find((item) => item.month === month);
    if (!score || !weather) throw new Error(`${slug}: missing month ${month}`);
    return [
      monthNames[month - 1], destination.name, destination.countryName, String(score.stargazingTrip),
      String(score.skyQuality), String(score.tripComfort), `${round((weather.clearNightProbability ?? 0) * 100)}%`,
      site.publicAccess === "yes" ? "Public" : "Limited",
    ];
  });
  return {
    metrics: [
      { label: "Destinations assessed", value: String(seed.destinations.filter((item) => item.active).length), note: "Active catalog with real monthly score files" },
      { label: "Monthly selections", value: "12", note: "One non-repeating destination per month" },
      { label: "Climate baseline", value: "1991–2020", note: "Historical ERA5 normal, not a forecast" },
    ] satisfies BlogMetric[],
    block: table(
      "The 12-stop atlas",
      "The score columns use a 0–100 scale. Clear nights are the historical monthly probability at the representative site; access is the reviewed catalog status.",
      ["Month", "Destination", "Country", "Trip", "Sky", "Comfort", "Clear nights", "Access"],
      rows,
      "Selection rule: highest monthly Stargazing Trip score among eligible real-data destinations, with no destination used twice. This creates variety; it is not an absolute global ranking.",
    ),
    relatedDestinationSlugs: selections.map(([, slug]) => slug),
  };
}

function darknessVersusClear(): DatasetOutput {
  const slugs = ["namibrand", "great-barrier-island", "kangaroo-island", "rakiura", "death-valley", "richtersveld"];
  const values = slugs.map((slug) => {
    const { destination, site, monthly, climate } = context(slug);
    return {
      destination: destination.name,
      darkness: average(monthly.map((item) => item.darknessScore)),
      clear: average(climate.months.map((item) => item.clearNightProbability ?? 0)) * 100,
      sky: average(monthly.map((item) => item.skyQuality)),
      trip: average(monthly.map((item) => item.stargazingTrip)),
      access: site.publicAccess === "yes" ? "Public" : "Limited",
    };
  });
  const maxClear = Math.max(...values.filter((item) => item.darkness === 100).map((item) => item.clear));
  const minClear = Math.min(...values.filter((item) => item.darkness === 100).map((item) => item.clear));
  return {
    metrics: [
      { label: "Darkness leaders", value: String(values.filter((item) => item.darkness === 100).length), note: "Selected sites scoring 100 for darkness" },
      { label: "Clear-night spread", value: `${round(minClear)}–${round(maxClear)}%`, note: "Among those 100-darkness sites" },
      { label: "Independent signals", value: "2", note: "Artificial light and cloud climate" },
    ] satisfies BlogMetric[],
    block: table(
      "Six dark sites, six different weather profiles",
      "Annual values are simple means across the twelve monthly rows. They make the structural contrast visible; use monthly data for an actual trip.",
      ["Destination", "Darkness", "Clear nights", "Sky quality", "Trip score", "Access"],
      values.map((item) => [item.destination, String(round(item.darkness)), `${round(item.clear)}%`, String(round(item.sky)), String(round(item.trip)), item.access]),
      "Darkness comes from the calibrated artificial-light layer. Clear-night probability comes from ERA5 cloud history. A perfect score in one column does not imply a perfect result in the other.",
    ),
  };
}

function altitudeVersusDarkness(): DatasetOutput {
  const slugs = ["hanle", "mauna-kea", "cerro-paranal", "great-basin", "kalbarri", "richtersveld", "great-barrier-island", "rakiura"];
  const values = slugs.map((slug) => {
    const { destination, site, monthly } = context(slug);
    return {
      destination: destination.name,
      elevation: site.elevationM ?? 0,
      darkness: average(monthly.map((item) => item.darknessScore)),
      sky: average(monthly.map((item) => item.skyQuality)),
      trip: average(monthly.map((item) => item.stargazingTrip)),
      access: site.publicAccess === "yes" ? "Public" : "Limited",
    };
  });
  return {
    metrics: [
      { label: "Elevation range", value: `${Math.min(...values.map((item) => item.elevation)).toLocaleString("en-US")}–${Math.max(...values.map((item) => item.elevation)).toLocaleString("en-US")} m`, note: "Representative sites in this comparison" },
      { label: "Low-site darkness", value: "90–100", note: "Selected sites below 200 metres" },
      { label: "Variables shown", value: "5", note: "Height, darkness, sky, trip, and access" },
    ] satisfies BlogMetric[],
    block: table(
      "Height and darkness side by side",
      "The comparison deliberately mixes high and low sites. Annual Sky Quality and Trip scores are simple means of the twelve published monthly values.",
      ["Destination", "Elevation", "Darkness", "Sky quality", "Trip score", "Access"],
      values.map((item) => [item.destination, `${item.elevation.toLocaleString("en-US")} m`, String(round(item.darkness)), String(round(item.sky)), String(round(item.trip)), item.access]),
      "A low site can be extremely dark; a high site can carry a lower darkness score. Access labels do not replace current official visitor rules.",
    ),
  };
}

function longestNightVersusBestMonth(): DatasetOutput {
  const slugs = ["wood-buffalo", "rakiura", "waterton-lakes", "galloway", "jasper", "central-idaho"];
  const values = slugs.map((slug) => {
    const { destination, monthly, climate } = context(slug);
    const longest = climate.months.reduce((best, item) => item.astronomicalHourCount / item.sampleYearCount > best.astronomicalHourCount / best.sampleYearCount ? item : best);
    const best = monthly.reduce((winner, item) => item.stargazingTrip > winner.stargazingTrip ? item : winner);
    const bestClimate = climate.months.find((item) => item.month === best.month);
    const longestScore = monthly.find((item) => item.month === longest.month);
    if (!bestClimate || !longestScore) throw new Error(`${slug}: incomplete seasonal comparison`);
    return {
      destination: destination.name,
      longestMonth: monthNames[longest.month - 1],
      longestHours: longest.astronomicalHourCount / longest.sampleYearCount,
      longestClear: (longest.clearNightProbability ?? 0) * 100,
      longestTrip: longestScore.stargazingTrip,
      bestMonth: monthNames[best.month - 1],
      bestHours: bestClimate.astronomicalHourCount / bestClimate.sampleYearCount,
      bestClear: (bestClimate.clearNightProbability ?? 0) * 100,
      bestTrip: best.stargazingTrip,
    };
  });
  const largestGain = Math.max(...values.map((item) => item.bestTrip - item.longestTrip));
  return {
    metrics: [
      { label: "Destinations compared", value: String(values.length), note: "Northern and southern high-latitude examples" },
      { label: "Largest score gain", value: `+${largestGain}`, note: "Best month versus longest-night month" },
      { label: "Result", value: "6 of 6", note: "Best trip month falls outside longest-night month" },
    ] satisfies BlogMetric[],
    block: table(
      "Longer darkness versus the stronger trip month",
      "Astronomical hours are average totals for the calendar month across the climate sample. Clear nights and scores refer to the same representative site.",
      ["Destination", "Longest-night month", "Hours", "Clear", "Trip", "Best trip month", "Hours", "Clear", "Trip"],
      values.map((item) => [item.destination, item.longestMonth, String(round(item.longestHours)), `${round(item.longestClear)}%`, String(item.longestTrip), item.bestMonth, String(round(item.bestHours)), `${round(item.bestClear)}%`, String(item.bestTrip)]),
      "More astronomical hours do not guarantee more usable observing. Monthly totals also reflect the number of days in the month; the comparison is for travel planning, not a nightly darkness-duration model.",
    ),
  };
}

function accessVersusScore(): DatasetOutput {
  const eligible = seed.destinations.filter((destination) => destination.active).map((destination) => context(destination.slug))
    .filter((item) => item.dataStatus === "real" && (item.site.publicAccess === "yes" || item.site.publicAccess === "limited"));
  const values = eligible.map(({ destination, site, monthly }) => {
    const best = monthly.reduce((winner, item) => item.stargazingTrip > winner.stargazingTrip ? item : winner);
    return {
      slug: destination.slug,
      destination: destination.name,
      access: site.publicAccess,
      trip: average(monthly.map((item) => item.stargazingTrip)),
      sky: average(monthly.map((item) => item.skyQuality)),
      bestMonth: monthNames[best.month - 1],
      bestTrip: best.stargazingTrip,
    };
  });
  const selected = (["yes", "limited"] as const).flatMap((access) => values
    .filter((item) => item.access === access)
    .sort((left, right) => right.trip - left.trip || left.destination.localeCompare(right.destination))
    .slice(0, 4));
  const publicLeader = selected.find((item) => item.access === "yes");
  const limitedLeader = selected.find((item) => item.access === "limited");
  if (!publicLeader || !limitedLeader) throw new Error("Insufficient access groups for blog comparison");
  return {
    metrics: [
      { label: "Destinations compared", value: String(selected.length), note: "Four public and four limited-access leaders" },
      { label: "Public benchmark", value: String(round(publicLeader.trip)), note: `${publicLeader.destination} annual Trip score` },
      { label: "Limited benchmark", value: String(round(limitedLeader.trip)), note: `${limitedLeader.destination} annual Trip score` },
    ] satisfies BlogMetric[],
    block: table(
      "Eight high-scoring destinations, two access realities",
      "Annual values are simple means of the twelve published monthly rows. The access label describes the reviewed representative site and must be checked against current official rules.",
      ["Destination", "Access", "Annual trip", "Sky quality", "Best month", "Best-month trip"],
      selected.map((item) => [item.destination, item.access === "yes" ? "Public" : "Limited", String(round(item.trip)), String(round(item.sky)), item.bestMonth, String(item.bestTrip)]),
      "Selection rule: the four highest annual Stargazing Trip means in each access group among active destinations with real score data. Limited may mean booking, guest-only use, permits, seasonal operation, a controlled visitor footprint, or route constraints.",
    ),
    relatedDestinationSlugs: selected.map((item) => item.slug),
  };
}

function dewRiskSpectrum(): DatasetOutput {
  const values = seed.destinations.filter((destination) => destination.active).map((destination) => context(destination.slug))
    .filter((item) => item.dataStatus === "real" && (item.site.publicAccess === "yes" || item.site.publicAccess === "limited"))
    .map(({ destination, site, monthly, climate }) => ({
      slug: destination.slug,
      destination: destination.name,
      access: site.publicAccess,
      clear: average(climate.months.map((item) => item.clearNightProbability ?? 0)) * 100,
      dew: average(climate.months.map((item) => item.dewRiskProbability ?? 0)) * 100,
      trip: average(monthly.map((item) => item.stargazingTrip)),
    }))
    .sort((left, right) => left.dew - right.dew || left.destination.localeCompare(right.destination));
  const dry = values.slice(0, 4);
  const damp = values.slice(-4).sort((left, right) => right.dew - left.dew || left.destination.localeCompare(right.destination));
  const selected = [...dry.map((item) => ({ ...item, group: "Drier end" })), ...damp.map((item) => ({ ...item, group: "Dew-prone end" }))];
  return {
    metrics: [
      { label: "Destinations compared", value: String(selected.length), note: "Four at each end of the catalog distribution" },
      { label: "Drier-end range", value: `${round(Math.min(...dry.map((item) => item.dew)))}–${round(Math.max(...dry.map((item) => item.dew)))}%`, note: "Annual mean nighttime dew-risk probability" },
      { label: "Dew-prone range", value: `${round(Math.min(...damp.map((item) => item.dew)))}–${round(Math.max(...damp.map((item) => item.dew)))}%`, note: "Annual mean nighttime dew-risk probability" },
    ] satisfies BlogMetric[],
    block: table(
      "The two ends of the historical dew-risk spectrum",
      "Clear-night and dew-risk percentages are separate annual means from the 1991–2020 ERA5 snapshot. They should not be multiplied or read as a joint probability.",
      ["Signal group", "Destination", "Clear nights", "Dew risk", "Trip score", "Access"],
      selected.map((item) => [item.group, item.destination, `${round(item.clear)}%`, `${round(item.dew)}%`, String(round(item.trip)), item.access === "yes" ? "Public" : "Limited"]),
      "The comparison uses the representative site for each destination. The reanalysis grid cannot resolve every local fog pocket, waterside surface, sheltered valley, or exposed ridge.",
    ),
    relatedDestinationSlugs: selected.map((item) => item.slug),
  };
}

const builders = {
  "monthly-atlas": monthlyAtlas,
  "darkness-versus-clear": darknessVersusClear,
  "altitude-versus-darkness": altitudeVersusDarkness,
  "longest-night-versus-best-month": longestNightVersusBestMonth,
  "access-versus-score": accessVersusScore,
  "dew-risk-spectrum": dewRiskSpectrum,
};

const posts = blogPostSources.map((source): BlogPost => {
  const hero = images.destinations.find((image) => image.slug === source.heroDestinationSlug);
  if (!hero || hero.status !== "approved" || !hero.localPath) throw new Error(`${source.slug}: hero image is not approved`);
  for (const slug of source.relatedDestinationSlugs) if (!destinationsBySlug.get(slug)?.active) throw new Error(`${source.slug}: related destination ${slug} is not active`);
  const generated = builders[source.datasetId]();
  return {
    version: 1,
    ...source,
    relatedDestinationSlugs: generated.relatedDestinationSlugs ?? source.relatedDestinationSlugs,
    metrics: generated.metrics,
    blocks: [source.blocks[0], generated.block, ...source.blocks.slice(1)],
  };
});

for (const post of posts) writeJson(publicPath(`editorial/blog/${post.slug}.json`), post);
const index: BlogPostSummary[] = posts.map(({ slug, title, seoDescription, standfirst, publishedAt, lastReviewedAt, readingMinutes, heroDestinationSlug, relatedDestinationSlugs }) => ({ slug, title, seoDescription, standfirst, publishedAt, lastReviewedAt, readingMinutes, heroDestinationSlug, relatedDestinationSlugs }));
writeJson(publicPath("editorial/blog/index.json"), index);
console.log(`Built ${posts.length} English blog posts from committed destination data.`);
