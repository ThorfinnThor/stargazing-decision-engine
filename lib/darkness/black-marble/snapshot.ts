import { robustMedian, summarizeBlackMarbleYear } from "./rings.js";
import type {
  BlackMarbleConfig,
  BlackMarbleExtractedYear,
  BlackMarbleRingMetric,
  BlackMarbleSnapshot,
} from "./types.js";

const round = (value: number, digits = 6) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function buildBlackMarbleSnapshot(options: {
  site: { id: string; lat: number; lon: number };
  years: BlackMarbleExtractedYear[];
  config: BlackMarbleConfig;
  retrievedAt: string;
  allowIncompleteYears?: boolean;
  allowLowCoverage?: boolean;
}): BlackMarbleSnapshot {
  const { site, config } = options;
  const byYear = [...options.years].sort((a, b) => b.year - a.year);
  for (const year of byYear) {
    if (year.product !== config.product || year.collectionVersion !== config.collectionVersion) {
      throw new Error(`Unexpected Black Marble product identity for ${year.year}`);
    }
  }
  if (new Set(byYear.map((item) => item.year)).size !== byYear.length) throw new Error("Duplicate Black Marble baseline year");
  if (byYear.length > config.baselineYearCount) throw new Error(`Expected at most ${config.baselineYearCount} Black Marble years`);
  const baselineOverrideUsed = byYear.length < config.baselineYearCount;
  if (baselineOverrideUsed && !options.allowIncompleteYears) {
    throw new Error(`Black Marble requires ${config.baselineYearCount} complete years; received ${byYear.length}`);
  }
  if (byYear.length === 0) throw new Error("Black Marble baseline is empty");

  const yearly = byYear.map((item) => summarizeBlackMarbleYear(item, site, config));
  const warnings: string[] = [];
  const rawRadiances = new Map<string, number | null>();
  const rings: BlackMarbleRingMetric[] = config.rings.map((ring) => {
    const rawYears = yearly.map((metrics) => {
      const metric = metrics.find((item) => item.ringId === ring.id);
      if (!metric) throw new Error(`Missing ${ring.id} metric`);
      const { ringId: _, ...output } = metric;
      return output;
    });
    const coverageRaw = Math.min(...rawYears.map((item) => item.coverage));
    const coverage = round(coverageRaw);
    if (coverage < config.coverageWarningMin) warnings.push(`${ring.id} minimum yearly coverage is ${coverage}`);
    const values = rawYears.flatMap((item) => item.radiance === null ? [] : [item.radiance]);
    const radianceRaw = values.length === byYear.length ? robustMedian(values) : null;
    rawRadiances.set(ring.id, radianceRaw);
    return {
      ...ring,
      radiance: radianceRaw === null ? null : round(radianceRaw),
      coverage,
      years: rawYears.map((year) => ({
        ...year,
        radiance: year.radiance === null ? null : round(year.radiance),
        coverage: round(year.coverage),
      })),
    };
  });

  const coverage = Math.min(...rings.map((ring) => ring.coverage));
  const coverageOverrideUsed = coverage < config.coverageErrorMin;
  if (coverageOverrideUsed && !options.allowLowCoverage) {
    throw new Error(`Black Marble coverage ${coverage} is below ${config.coverageErrorMin}`);
  }
  if (coverageOverrideUsed) {
    warnings.push(`Low-coverage override used: ${coverage} is below ${config.coverageErrorMin}`);
  }
  if (baselineOverrideUsed) warnings.push(`Baseline uses ${byYear.length} year(s), not ${config.baselineYearCount}`);

  const radiances = new Map(rings.map((ring) => [ring.id, ring.radiance]));
  const alanTerms = config.rings.map((ring) => {
    const radiance = rawRadiances.get(ring.id);
    return radiance === null || radiance === undefined ? null : ring.alanWeight * Math.log1p(radiance);
  });
  const alanExposure = alanTerms.some((term) => term === null)
    ? null
    : round((alanTerms as number[]).reduce((sum, term) => sum + term, 0));

  return {
    siteId: site.id,
    source: config.product,
    collectionVersion: config.collectionVersion,
    radianceLayer: config.layer.radiance,
    qualityLayer: config.layer.quality,
    units: "nW/cm2/sr",
    blackMarbleYears: byYear.map((item) => item.year).sort((a, b) => a - b),
    baselineOverrideUsed,
    coverageOverrideUsed,
    rings,
    radiance0to2: radiances.get("0to2") ?? null,
    radiance2to10: radiances.get("2to10") ?? null,
    radiance10to30: radiances.get("10to30") ?? null,
    radiance30to75: radiances.get("30to75") ?? null,
    alanExposure,
    darknessScore: null,
    coverage,
    warnings,
    retrievedAt: options.retrievedAt,
  };
}
