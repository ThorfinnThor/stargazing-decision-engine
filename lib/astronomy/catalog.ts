import catalogJson from "../../public/data/stargazing/astronomy/bright-stars.json";
import type { BrightStarCatalog, CatalogStar } from "./types";

const catalog = catalogJson as BrightStarCatalog;

export const brightStarCatalogMetadata = catalog.source;
export const brightStars: readonly CatalogStar[] = catalog.stars.map(([id, xEqj, yEqj, zEqj, magnitude, colorIndex]) => ({
  id, xEqj, yEqj, zEqj, magnitude, colorIndex,
}));
