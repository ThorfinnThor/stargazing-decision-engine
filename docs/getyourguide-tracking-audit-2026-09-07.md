# GetYourGuide tracking audit — 2026-09-07

## Scope

- 107 enabled GetYourGuide offers
- 17 direct stargazing offers and 90 regional activities
- 52 destination pages and their 52 mapped location-tour pages
- CTA markup, affiliate parameters, static fallback redirects, and Integration Analyzer discovery

## Finding

The booking URLs and static redirects preserved the required `partner_id`, `utm_medium`, and `cmp` parameters. Attribution after arrival on GetYourGuide therefore remained possible.

The visible CTA `href`, however, pointed to an internal `/go/getyourguide-activities/offer/.../` page. The GetYourGuide Integration Analyzer downloaded from `https://widget.getyourguide.com/dist/pa.umd.production.min.js` on 2026-09-07 only discovers anchors whose `href` already contains `getyourguide.`. It also attaches click tracking only to those direct links. Internal redirect links were consequently absent from the Analyzer's deeplink inventory and click-event listener.

## Resolution

- Publish each validated GetYourGuide affiliate URL alongside its legacy redirect path.
- Render direct GetYourGuide URLs in every destination and location-tour CTA so the Analyzer can discover and instrument them.
- Retain the generated `/go/...` pages for compatibility with existing inbound links and bookmarks.
- Require `sponsored nofollow noopener noreferrer` on every activity CTA.
- Validate that every published direct URL exactly matches its enabled source offer and that every legacy fallback redirect still exists.

## Verification contract

The automated suite now checks that:

1. all published offers have an enabled curated source;
2. the direct URL is HTTPS on `www.getyourguide.com`;
3. the partner ID remains `BKWM9K1`;
4. CTA components use the direct URL rather than the fallback redirect;
5. every fallback redirect remains generated;
6. links open in a new tab with the required affiliate and security relationship values.

The downloaded Analyzer artifact used for this audit had SHA-256 `b23c1ddb252aae4c5e54883c24fb51f4eafb679d2a5c38e4bae39ba6cecf2447`.
