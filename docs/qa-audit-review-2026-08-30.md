# QA audit review — 2026-08-30

This checklist validates the external QA audit against the current `main`
branch before implementation. Stargazing Index is a Next.js static export with
committed JSON products, no runtime business API, database, authentication, or
authorization layer. The relevant blast radius is therefore client state,
generated artifacts, SEO output, CI duration, and Cloudflare deployment.

## Finding 1 — Low-confidence Finder exclusions are silent

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM

**Why:** `findDestinations()` removes positive low-confidence months before the
UI receives them. A scientifically cautious exclusion is correct, but presenting
it as an ordinary non-match hides the reason.

**Audit recommendation:** Return first-class exclusion reasons and explain
withheld results.

**Implementation decision:** Preserve the ranking gate and existing
`findDestinations()` API. Add a companion analysis result with destination-level
exclusion counts, and show a localized notice for positive low-confidence data.

**Potential impact:** Finder result calculation, UI copy, and Finder tests. No
published score or ranking weight changes.

## Finding 2 — Finder load failure has no recovery action

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW

**Why:** The component has a terminal `error` state even though the static JSON
request can fail transiently.

**Audit recommendation:** Add a retry action and optionally a catalog fallback.

**Implementation decision:** Add a keyboard-accessible Retry button that starts
a fresh abortable request without reloading the page, plus a normal link to the
static destination catalog.

**Potential impact:** Finder fetch lifecycle and error-state styling only.

## Finding 3 — Homepage filters cannot be shared or restored

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** LOW

**Why:** Query and continent are local state only. Synchronizing every keystroke
with new history entries would be noisy, but restoring a shared filter URL is
useful.

**Safer approach:** Hydrate validated `q` and `region` parameters after mount and
use `replaceState` to keep one stable history entry. Preserve unrelated query
parameters and the unfiltered canonical URL.

**Potential impact:** Homepage catalog client state and URL only; ordering and
destination eligibility remain unchanged.

## Finding 4 — Finder changes use `replaceState`

**Verdict:** ❌ NO — Do Not Implement

**Why:** This is documented behavior, not a confirmed defect. Creating a history
entry for five controls, particularly rapid changes, can make Back navigation
unusable and requires a deliberate product contract plus `popstate` behavior.
The current URLs are already shareable and restorable.

**Audit recommendation rejected:** Switching to `pushState` automatically.

## Finding 5 — No browser-level release coverage

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** MEDIUM

**Why:** Unit and data coverage is strong, but it cannot prove hydration,
responsive overflow, retry behavior, or rendered navigation.

**Safer approach:** Add a small Playwright Chromium smoke suite against the
already exported `out` directory. Cover both locales, Finder query hydration and
retry, homepage filter restoration, one destination, language navigation,
console errors, and 320 px overflow. Avoid screenshots and broad brittle visual
assertions.

**Potential impact:** One development dependency, CI duration, and release-gate
configuration. No production JavaScript dependency.

## Finding 6 — Canonical origin can be overridden by the environment

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** LOW

**Why:** `NEXT_PUBLIC_APP_URL` can currently replace the reviewed canonical
origin during data generation. This static product has one production canonical,
so preview-origin canonicals are not useful.

**Safer approach:** Generate SEO data only from the checked-in SEO config and
validate that it is exactly the approved HTTPS origin without credentials, path,
query, or fragment. Do not rely on a mutable deployment URL.

**Potential impact:** SEO generation fails early for an invalid checked-in
origin. Existing Cloudflare preview and production HTML continue to canonicalize
to the custom domain.

## Finding 7 — Finder “Priority” sounds stronger than its weight

**Verdict:** ⚠️ YES, BUT MODIFY  
**Risk:** LOW

**Why:** The calculation is documented and tested, but the short label can imply
that the selected component dominates the published trip score.

**Safer approach:** Keep the established weights and rename the control to
“Preference focus”. State the 60/25/15 composition concisely in both locales.
Changing ranking weights requires separate sensitivity analysis.

**Potential impact:** Localized Finder copy only.

## Finding 8 — Catalog cards expose continent slugs

**Verdict:** ✅ YES — Makes Sense  
**Risk:** LOW

**Why:** The select already has localized labels while cards print the internal
slug directly.

**Implementation decision:** Reuse the same localized continent-label lookup on
each card and include the localized name in text-search matching.

**Potential impact:** Visible card copy and search terms only.

## Finding 9 — Catalog has no explicit sorting

**Verdict:** ❌ NO — Do Not Implement

**Why:** This is an optional product enhancement rather than a defect. The
catalog's declared order is currently intentional and tested. Adding sort modes
without a product decision about default order, null/provisional scores, and
localized month sorting would add interface complexity and could weaken the
editorial ordering contract.

## Finding 10 — Obsolete deployment surfaces may exist

**Verdict:** 🛑 DANGEROUS — Could Break the Project  
**Risk:** HIGH

**Why:** No obsolete public deployment was identified in repository
configuration, and archiving a provider project or alias is an external,
potentially destructive operation. It could affect DNS, rollback, or the active
Cloudflare Git integration.

**Do not implement automatically.** A safe cleanup requires an inventory of
provider projects, aliases, DNS records, current build hooks, and rollback
requirements, followed by explicit approval for exact targets.

## Finding 11 — Generated internal links are not validated after build

**Verdict:** ✅ YES — Makes Sense  
**Risk:** MEDIUM

**Why:** The product has hundreds of generated static routes, so a missing route
or asset can escape source-level tests.

**Implementation decision:** Add a dependency-free post-build validator that
crawls every exported HTML file and verifies same-origin `href` targets and
EN/DE route parity. Run it after `next build` in CI and test its path-resolution
logic independently.

**Potential impact:** CI can fail on broken generated artifacts. Runtime output
is unchanged.

## Implementation groups

### Safe to implement

- Finder low-confidence explanation.
- Finder retry and catalog fallback.
- Localized continent labels.
- Fixed, validated canonical origin.
- Generated static-link validation.

### Implement with modification

- Shareable homepage filters using hydration plus `replaceState`.
- Compact Playwright smoke coverage rather than a broad visual suite.
- Finder weight transparency without changing the scoring model.

### Do not implement

- Finder `pushState` history semantics.
- Catalog sorting.

### Requires human decision

- Any deletion, archival, or DNS change for obsolete deployment surfaces.
