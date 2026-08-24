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
if (register.candidates.length !== 25) errors.push(`expected 25 P3 candidates, found ${register.candidates.length}`);
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
  if (candidate.reviewStatus !== "needs-visual-review") {
    errors.push(`${candidate.destinationSlug}: candidate must remain needs-visual-review until Sol audit`);
  }
}

if (errors.length > 0) {
  for (const error of errors) console.error(error);
  process.exitCode = 1;
} else {
  console.log(`Validated ${register.candidates.length} P3 image candidates; all remain publication-blocked pending visual and Sol license audit.`);
}
