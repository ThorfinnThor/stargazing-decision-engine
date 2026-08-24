import { resolve } from "node:path";

import { root, readJson } from "../pipeline/io.js";

type Candidate = {
  destinationSlug: string;
  destinationName: string;
  sourceTitle: string;
  sourcePlatform: string;
  sourceUrl: string;
  downloadUrl: string;
  creator: string;
  sourceLicense: string;
  licenseFamily: string;
  licenseUrl: string;
  attribution: string;
  reviewStatus: string;
};

type CandidateRegister = {
  version: number;
  generatedAt: string;
  policy: { publicationBlocked: boolean; allowedLicenseFamilies: string[] };
  audit: {
    reviewedAt: string;
    reviewedBy: string;
    status: string;
    visualReviewCount: number;
    metadataVerificationCount: number;
    minimumOriginalWidth: number;
    minimumOriginalHeight: number;
    replacementCount: number;
    replacedDestinationSlugs: string[];
    publicationStatus: string;
  };
  candidates: Candidate[];
};

const register = readJson<CandidateRegister>(resolve(root, "data-config/sources/p3-image-candidates.json"));
const errors: string[] = [];
const allowed = new Set(register.policy.allowedLicenseFamilies);
const required = [
  "destinationSlug", "destinationName", "sourceTitle", "sourcePlatform", "sourceUrl", "downloadUrl",
  "creator", "sourceLicense", "licenseFamily", "licenseUrl", "attribution", "reviewStatus",
] as const;

if (register.policy.publicationBlocked !== true) errors.push("P3 candidate register must remain publication-blocked");
if (register.candidates.length !== 50) errors.push(`expected 50 P3 candidates, found ${register.candidates.length}`);
if (register.audit.reviewedBy !== "Sol" || register.audit.status !== "approved-for-local-processing") {
  errors.push("P3 candidate register is missing the completed Sol audit");
}
if (register.audit.visualReviewCount !== register.candidates.length || register.audit.metadataVerificationCount !== register.candidates.length) {
  errors.push("P3 audit counts must cover every candidate");
}
if (register.audit.minimumOriginalWidth < 1600 || register.audit.minimumOriginalHeight < 900) {
  errors.push("P3 candidates do not meet the audited source-resolution floor");
}
if (register.audit.replacementCount !== register.audit.replacedDestinationSlugs.length) {
  errors.push("P3 replacement count does not match its destination list");
}
if (register.audit.publicationStatus !== "blocked-until-local-webp-and-production-manifest-validation") {
  errors.push("P3 candidates must remain blocked until local WebP and production manifest validation");
}
if (new Set(register.candidates.map((candidate) => candidate.destinationSlug)).size !== register.candidates.length) {
  errors.push("P3 candidates must have unique destination slugs");
}

for (const [index, candidate] of register.candidates.entries()) {
  for (const field of required) {
    if (typeof candidate[field] !== "string" || candidate[field].trim().length === 0) {
      errors.push(`candidate ${index + 1} is missing ${field}`);
    }
  }
  if (!allowed.has(candidate.licenseFamily)) errors.push(`${candidate.destinationSlug}: license family is not allowlisted`);
  if (!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(candidate.sourceUrl)) {
    errors.push(`${candidate.destinationSlug}: source URL is not a Wikimedia Commons file page`);
  }
  if (!/^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\//.test(candidate.downloadUrl)) {
    errors.push(`${candidate.destinationSlug}: download URL is not an upload.wikimedia.org asset`);
  }
  if (!/^https:\/\/creativecommons\.org\/licenses\/(by|by-sa)\//.test(candidate.licenseUrl)) {
    errors.push(`${candidate.destinationSlug}: CC license URL is missing or malformed`);
  }
  if (candidate.reviewStatus !== "sol-approved-for-download") {
    errors.push(`${candidate.destinationSlug}: candidate is missing Sol download approval`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Validated ${register.candidates.length} Sol-audited P3 image candidates; all remain publication-blocked pending local WebP and production manifest validation.`);
}
