import type { PublicAccess } from "../data/types.js";

export type RecommendableSiteView = {
  site: { publicAccess: PublicAccess };
  monthly: { months: Array<{ score: number }> };
};

const accessRank: Record<PublicAccess, number> = { yes: 0, limited: 1, unknown: 2, no: 3 };

export function recommendedSiteView<T extends RecommendableSiteView>(options: T[]) {
  return [...options].sort((left, right) => {
    const accessDifference = accessRank[left.site.publicAccess] - accessRank[right.site.publicAccess];
    if (accessDifference !== 0) return accessDifference;
    const leftBest = Math.max(...left.monthly.months.map((month) => month.score));
    const rightBest = Math.max(...right.monthly.months.map((month) => month.score));
    return rightBest - leftBest;
  })[0] ?? null;
}
