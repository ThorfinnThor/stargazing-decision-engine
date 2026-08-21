import type { ConfidenceLevel } from "../data/types.js";

export interface IndexabilityInput {
  resultCount: number;
  dataCompleteness: number;
  confidence: ConfidenceLevel;
  uniqueInsightCount: number;
  hasUniqueTitle: boolean;
  hasUniqueH1: boolean;
  hasCanonical: boolean;
  internalLinkCount: number;
  createsCannibalization: boolean;
  containsUnsupportedClaims: boolean;
  isFutureRelevant: boolean;
  sourceFreshness: boolean;
}

export interface IndexabilityRequirements {
  minimumDataCompleteness: number;
  minimumConfidence: ConfidenceLevel;
  minimumUniqueInsights: number;
  minimumInternalLinks: number;
}

const confidenceRank: Record<ConfidenceLevel, number> = { low: 0, moderate: 1, high: 2 };

export function evaluateIndexability(input: IndexabilityInput, requirements: IndexabilityRequirements) {
  const reasons: string[] = [];
  if (input.resultCount <= 0) reasons.push("no-results");
  if (input.dataCompleteness < requirements.minimumDataCompleteness) reasons.push("insufficient-data-completeness");
  if (confidenceRank[input.confidence] < confidenceRank[requirements.minimumConfidence]) reasons.push("insufficient-confidence");
  if (input.uniqueInsightCount < requirements.minimumUniqueInsights) reasons.push("insufficient-unique-insights");
  if (!input.hasUniqueTitle) reasons.push("missing-unique-title");
  if (!input.hasUniqueH1) reasons.push("missing-unique-h1");
  if (!input.hasCanonical) reasons.push("missing-canonical");
  if (input.internalLinkCount < requirements.minimumInternalLinks) reasons.push("insufficient-internal-links");
  if (input.createsCannibalization) reasons.push("cannibalization-risk");
  if (input.containsUnsupportedClaims) reasons.push("unsupported-claims");
  if (!input.isFutureRelevant) reasons.push("not-future-relevant");
  if (!input.sourceFreshness) reasons.push("stale-source");
  return { indexable: reasons.length === 0, reasons };
}
