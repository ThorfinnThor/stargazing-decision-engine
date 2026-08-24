import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { allowedImageLicenses } from "../../lib/images/images.js";
import type { ImageAssetConfig } from "../../lib/data/types.js";
import { readJson, root, writeJson } from "../pipeline/io.js";

type Candidate = {
  destinationSlug: string;
  destinationName: string;
  sourceTitle: string;
  sourceUrl: string;
  creator: string;
  licenseFamily: string;
  licenseUrl: string;
  attribution: string;
  reviewStatus: string;
};

type CandidateRegister = {
  policy: { publicationBlocked: boolean };
  audit: { reviewedAt: string; status: string; publicationStatus: string };
  candidates: Candidate[];
};

const candidatesPath = resolve(root, "data-config/sources/p3-image-candidates.json");
const destinationImagesPath = resolve(root, "data-config/sources/destination-images.json");
const register = readJson<CandidateRegister>(candidatesPath);
const destinationImages = readJson<ImageAssetConfig[]>(destinationImagesPath);

if (register.policy.publicationBlocked !== true || register.audit.status !== "approved-for-local-processing") {
  throw new Error("P3 image candidates have not passed the required Sol audit");
}
if (register.audit.publicationStatus !== "blocked-until-local-webp-and-production-manifest-validation") {
  throw new Error("P3 publication gate is not in the expected pre-promotion state");
}

const candidates = new Map(register.candidates.map((candidate) => [candidate.destinationSlug, candidate]));
const promoted = destinationImages.map((image): ImageAssetConfig => {
  const candidate = candidates.get(image.slug);
  if (!candidate) return image;
  if (candidate.reviewStatus !== "sol-approved-for-download") throw new Error(`${image.slug}: missing Sol approval`);
  if (!allowedImageLicenses.includes(candidate.licenseFamily as typeof allowedImageLicenses[number])) {
    throw new Error(`${image.slug}: license family is not approved`);
  }
  const localPath = `/images/destinations/${image.slug}.webp`;
  if (!existsSync(resolve(root, `public${localPath}`))) throw new Error(`${image.slug}: reviewed local WebP is missing`);
  return {
    slug: image.slug,
    status: "approved",
    localPath,
    sourceUrl: candidate.sourceUrl,
    sourceTitle: candidate.sourceTitle,
    author: candidate.creator,
    license: candidate.licenseFamily,
    licenseUrl: candidate.licenseUrl,
    attribution: candidate.attribution,
    checkedAt: register.audit.reviewedAt,
  };
});

writeJson(destinationImagesPath, promoted);
console.log(`Promoted ${register.candidates.length} Sol-audited destination images; ${promoted.filter((image) => image.status === "pending").length} destination images remain pending.`);
