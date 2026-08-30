# Audit implementation report — 2026-08-30

## Summary

- Findings reviewed: 11
- Approved: 4
- Approved with modification: 4
- Rejected: 2
- Dangerous: 1
- Requiring a human infrastructure decision: 1
- Implemented: 8

The implementation preserves the static-export architecture, published scores,
destination ordering, URL compatibility, affiliate integrations, and the
Cloudflare deployment model. It adds no runtime production dependency, API,
database, authentication flow, or migration.

## Implemented

### Low-confidence Finder exclusions

**Verdict:** ✅ YES — Makes Sense

`analyzeDestinations()` now returns recommendation matches and separate counts
for low-confidence evidence, absent month data, and a genuine zero observing
window. The existing `findDestinations()` return contract remains intact.
Positive low-confidence evidence is still excluded from ranking and is now
explained in localized UI copy.

**Files:** `lib/finder/finder.ts`, `components/finder-client.tsx`,
`docs/finder-methodology.md`, `tests/finder.test.ts`, `app/globals.css`.

**Verification:** Finder unit tests cover every exclusion class. The complete
unit suite and static build pass.

### Recoverable Finder loading failure

**Verdict:** ✅ YES — Makes Sense

The error state now offers an accessible retry without a full-page reload and a
normal link to the static catalog. Requests remain abortable.

**Files:** `components/finder-client.tsx`, `app/globals.css`,
`e2e/static-product.spec.ts`.

**Verification:** The browser suite intercepts one transient 503 response and
requires the second request to render results.

### Shareable homepage catalog filters

**Verdict:** ⚠️ YES, BUT MODIFY

Validated `q` and `region` parameters hydrate the client controls. Changes use
`replaceState`, preserve unrelated parameters and the hash, and avoid filling
browser history with one entry per keystroke.

**Files:** `components/destination-catalog-filter.tsx`,
`e2e/static-product.spec.ts`.

**Verification:** Local browser QA restored `q=spain&region=europe`, synchronized
edited values back to the URL, and rendered the filtered result count.

### Browser-level release coverage

**Verdict:** ⚠️ YES, BUT MODIFY

A six-test Chromium smoke suite targets the exported product rather than adding
a broad screenshot suite. It covers both locales, language navigation, catalog
URL state, Finder deep links, exclusion messaging, transient request recovery,
console errors, and 320 px overflow.

**Files:** `e2e/static-product.spec.ts`, `playwright.config.ts`, `package.json`,
`pnpm-lock.yaml`, `.github/workflows/ci.yml`, `.gitignore`, `README.md`.

**Verification:** Chromium 1.62.1 is pinned. The in-app browser passed the local
interactive and responsive checks. The desktop sandbox cannot launch a
standalone Chromium process, so execution of the Playwright command itself is
delegated to the unsandboxed GitHub Actions gate.

### Fixed canonical production origin

**Verdict:** ⚠️ YES, BUT MODIFY

SEO generation now accepts only the exact reviewed HTTPS origin
`https://stargazingindex.com` from checked-in configuration. Preview environment
variables can no longer replace production canonicals.

**Files:** `lib/seo/site-url.ts`, `scripts/seo/build-seo.ts`,
`scripts/validate/validate-seo.ts`, `tests/seo-origin.test.ts`, `.env.example`,
`README.md`.

**Verification:** Unit tests reject protocol, hostname, path, credential, and
malformed-origin variants. SEO regeneration and validation pass.

### Finder weight clarity

**Verdict:** ⚠️ YES, BUT MODIFY

The control is renamed from “Priority” to “Preference focus” and the existing
60/25/15 match composition is stated in both languages. No ranking weight was
changed.

**Files:** `components/finder-client.tsx`, `docs/finder-methodology.md`,
`e2e/static-product.spec.ts`.

**Verification:** The Finder deep-link browser test requires the new accessible
label while existing ranking tests remain unchanged and pass.

### Localized continent labels

**Verdict:** ✅ YES — Makes Sense

Catalog cards now use the existing localized continent labels, and localized
continent names participate in text search.

**Files:** `components/destination-catalog-filter.tsx`,
`e2e/static-product.spec.ts`.

**Verification:** German local browser QA renders “Europa”; the browser suite
also rejects raw `north-america` output.

### Exported link and locale-parity validation

**Verdict:** ✅ YES — Makes Sense

A dependency-free post-build validator crawls every exported HTML page, resolves
same-origin `href` and `src` targets, rejects path traversal, and verifies that
every English HTML route has a German counterpart.

**Files:** `lib/static-output/links.ts`,
`scripts/validate/validate-static-output.ts`,
`tests/static-output-links.test.ts`, `package.json`, `.github/workflows/ci.yml`,
`README.md`.

**Verification:** 425 exported HTML files, 13,770 same-origin references, and
EN/DE route parity pass. Unit fixtures cover trailing slashes, relative links,
assets, encoded queries, broken targets, and missing translations.

## Rejected

### Replace Finder `replaceState` with `pushState`

**Reason:** Current Finder URLs are already shareable. Pushing on every control
change would degrade Back navigation and requires a separate `popstate` product
contract. Existing behavior is retained and documented.

### Add catalog sorting

**Reason:** This is an optional product choice rather than a defect. The current
declared order is intentional and tested. Sorting also needs decisions for
provisional/null scores and default editorial order.

## Not implemented due to risk

### Archive or remove potentially obsolete deployment surfaces

**Verdict:** 🛑 DANGEROUS — Could Break the Project

No obsolete deployment target is proven by repository configuration. Removing a
provider project, alias, or DNS record could break production, previews,
rollbacks, or Cloudflare Git deployment.

Safe implementation requires an inventory of provider projects, DNS records,
aliases, build hooks, the current production target, and rollback requirements,
followed by explicit approval for each exact target.

## Regression check

- TypeScript: passed (`tsc --noEmit`)
- Unit/integration tests: 178/178 TypeScript tests passed
- Python tests: 12/12 passed
- Production build: passed; 313 static routes generated
- Data rebuild: passed; 50 destinations, 100 sites, 50 guides, 50 tours,
  300 localized SEO pages, and 116 affiliate redirects regenerated and validated
- Static-output validation: 425 HTML files and 13,770 references passed
- Local interactive QA: passed for EN/DE catalog hydration, Finder deep links,
  localized labels, and 320 px overflow on home, Finder, and La Palma
- Standalone local Playwright: blocked by the managed macOS browser sandbox,
  which denies Chromium's Mach rendezvous registration; the same suite is an
  enforced GitHub Actions gate
- Database migrations: none
- Authentication/authorization/payment behavior: not applicable to this static
  repository

## Changed files

- `.env.example` — removes an unsafe canonical-origin override example
- `.github/workflows/ci.yml` — adds post-build and browser release gates
- `.gitignore` — ignores Playwright runtime artifacts
- `README.md` — documents the new checks and canonical policy
- `app/globals.css` — accessible Finder error and exclusion presentation
- `components/destination-catalog-filter.tsx` — URL hydration and localized labels
- `components/finder-client.tsx` — retry, exclusion notice, and clearer weighting
- `docs/finder-methodology.md` — documents exclusion and history semantics
- `docs/qa-audit-review-2026-08-30.md` — complete pre-change verdict checklist
- `docs/qa-audit-implementation-report-2026-08-30.md` — this report
- `e2e/static-product.spec.ts` — focused browser regression suite
- `lib/finder/finder.ts` — backward-compatible Finder analysis result
- `lib/seo/site-url.ts` — exact production-origin validation
- `lib/static-output/links.ts` — exported-reference and locale-parity validation
- `package.json`, `pnpm-lock.yaml` — pinned Playwright test dependency and scripts
- `playwright.config.ts` — static-export Chromium test configuration
- `scripts/seo/build-seo.ts` — removes mutable origin override
- `scripts/validate/validate-seo.ts` — validates the checked-in origin
- `scripts/validate/validate-static-output.ts` — post-build validation entry point
- `tests/finder.test.ts` — exclusion-reason regression coverage
- `tests/seo-origin.test.ts` — canonical-origin regression coverage
- `tests/static-output-links.test.ts` — export resolver regression coverage

## Remaining recommendation

The only valid unresolved recommendation is infrastructure cleanup. It is
intentionally deferred because repository evidence is insufficient to identify
a safe deletion target.
