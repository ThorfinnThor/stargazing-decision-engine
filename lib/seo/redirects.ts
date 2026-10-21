// Permanent redirects for the static export. Cloudflare Workers static assets
// read `_redirects` from the asset directory (`out/`, copied from `public/`),
// so every rule here is served as a real HTTP redirect before any asset lookup.
// Rules always win over assets, so a rule must never point away from a path
// that is still exported; validateRedirectRules enforces that against `out/`.

export interface RedirectRule {
  from: string;
  to: string;
  status: 301 | 302 | 307 | 308;
  reason: string;
}

export interface GearRedirectInput {
  categories: Array<{ id: string; slug: string }>;
  guides: Array<{ slug: string; category: string }>;
}

export interface LegacyAffiliateRedirect {
  from: string;
  destinationSlug: string;
}

export function buildGearAliasRedirects(locales: readonly string[], input: GearRedirectInput): RedirectRule[] {
  const guideSlugs = new Set(input.guides.map((guide) => guide.slug));
  const rules: RedirectRule[] = [];
  for (const category of input.categories) {
    if (guideSlugs.has(category.slug)) continue;
    const guide = input.guides.find((item) => item.category === category.id);
    if (!guide) continue;
    for (const locale of locales) {
      // Both spellings: without an exported asset there is no automatic
      // trailing-slash redirect to fall back on.
      for (const suffix of ["/", ""]) {
        rules.push({
          from: `/${locale}/gear/${category.slug}${suffix}`,
          to: `/${locale}/gear/${guide.slug}/`,
          status: 301,
          reason: `gear category slug ${category.slug} is published as guide ${guide.slug}`,
        });
      }
    }
  }
  return rules;
}

export function buildLegacyAffiliateRedirects(
  entries: LegacyAffiliateRedirect[],
  options: { activeRedirectPaths: Set<string>; destinationSlugs: Set<string>; locale: string },
): RedirectRule[] {
  return entries
    .filter((entry) => !options.activeRedirectPaths.has(entry.from))
    .map((entry) => {
      if (!entry.from.startsWith("/go/") || !entry.from.endsWith("/")) throw new Error(`Legacy affiliate path must be a /go/ directory path: ${entry.from}`);
      if (!options.destinationSlugs.has(entry.destinationSlug)) throw new Error(`Legacy affiliate path ${entry.from} points to unknown destination ${entry.destinationSlug}`);
      return {
        from: entry.from,
        to: `/${options.locale}/stargazing-destinations/${entry.destinationSlug}/`,
        status: 301 as const,
        reason: "removed affiliate redirect",
      };
    });
}

export function serializeRedirects(rules: RedirectRule[]) {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const rule of rules) {
    if (seen.has(rule.from)) throw new Error(`Duplicate redirect source: ${rule.from}`);
    if (rule.from === rule.to) throw new Error(`Redirect loops to itself: ${rule.from}`);
    if (/\s/.test(rule.from) || /\s/.test(rule.to)) throw new Error(`Redirect paths must not contain whitespace: ${rule.from}`);
    seen.add(rule.from);
    lines.push(`${rule.from} ${rule.to} ${rule.status}`);
  }
  return `${lines.join("\n")}\n`;
}

export function parseRedirects(text: string): Array<Pick<RedirectRule, "from" | "to" | "status">> {
  return text.split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const [from, to, status = "302"] = line.split(/\s+/);
      return { from, to, status: Number(status) as RedirectRule["status"] };
    });
}

export interface RedirectRuleProblem {
  from: string;
  to: string;
  problem: "target-missing" | "source-shadows-exported-page" | "redirect-chain" | "not-permanent";
}

// `exists` answers whether a pathname is served from the static export.
// `intentionalShadows` lists sources that deliberately replace an exported file
// (the locale-picking root `/`, whose HTML is only a no-JS fallback).
export function validateRedirectRules(
  rules: Array<Pick<RedirectRule, "from" | "to" | "status">>,
  exists: (pathname: string) => boolean,
  intentionalShadows: string[] = ["/"],
): RedirectRuleProblem[] {
  const sources = new Set(rules.map((rule) => rule.from));
  const problems: RedirectRuleProblem[] = [];
  for (const rule of rules) {
    if (rule.status !== 301 && rule.status !== 308) problems.push({ ...rule, problem: "not-permanent" });
    if (!rule.to.startsWith("/")) continue;
    const target = new URL(rule.to, "https://example.invalid").pathname;
    if (sources.has(target)) problems.push({ ...rule, problem: "redirect-chain" });
    if (!exists(target)) problems.push({ ...rule, problem: "target-missing" });
    if (!intentionalShadows.includes(rule.from) && !rule.from.includes("*") && !rule.from.includes(":") && exists(rule.from)) {
      problems.push({ ...rule, problem: "source-shadows-exported-page" });
    }
  }
  return problems;
}
