# Gear catalog expansion — 9 September 2026

## Scope

Expanded the existing 13 guides from 39 to 52 distinct products. Eight guides changed in both English and German. No new routes, prices, ratings or hands-on test claims were introduced.

| Guide | Before | After |
| --- | ---: | ---: |
| Beginner telescopes | 3 | 6 |
| 8×42 binoculars | 3 | 5 |
| Red lights | 3 | 4 |
| Portable power | 3 | 4 |
| Eyepieces | 3 | 5 |
| Astronomy filters | 3 | 5 |
| Smartphone adapters | 3 | 4 |
| Mounted binoculars | 3 | 4 |

The other five guides retain three products each.

## Evidence and presentation

- Exact models and source URLs are recorded in the companion JSON audit.
- Every added product has a direct Astroshop affiliate destination and an image supplied by the authenticated partner generator. All 13 image assets returned valid 300×300 JPEG data.
- Published product images increase from 23 to 36. The 16 earlier permission gaps remain unchanged; candidate images were not promoted without permission.
- Hero summaries, buying advice, relevant FAQs and comparative superlatives were revised for the larger selections. The public gear index, SEO registry and llms.txt were regenerated.
- Existing compact cards remain in use. Only the main strength, caution and retailer CTA are initially exposed; the full assessment and specifications stay in native details controls.
- The provenance note now correctly distinguishes manufacturer and retailer specifications.

## Verification

User flow checked: gear guide → expanded comparison → image and product identity → optional specifications → exact tracked retailer link.

- Gear, SEO and llms validators passed.
- Production build generated 519 pages.
- TypeScript passed.
- Static-output validation passed for 736 HTML files and 30,408 same-origin references with EN/DE parity.
- Full suite passed 202 JavaScript tests and 15 Python tests, including the new expansion regression.
- Browser checks used the in-app browser on the exported production build. The CLI headless browser was unavailable in this desktop sandbox, so the established in-app fallback was used.
- All eight expanded German routes checked at 390 px and all eight English routes at 1280 px. Every declared product image loaded after scrolling through the cards; no horizontal overflow or framework error overlay was found.
- Every checked card link retained a new-tab target and sponsored relationship.
- All 13 new affiliate URLs resolved with HTTP 200 to the matching article ID. Astroshop removes the affiliate query during its redirect; this check confirms the landing page, not a credited conversion.
- Screenshots inspected for telescope cards on desktop and mobile, and the newly added 20×80 binocular on both widths. The telescope details control opened correctly.
- A 768 px eyepiece-page spot check also passed, with all five images loaded and no horizontal overflow. The temporary viewport override was reset.

## Boundaries

An accessible retailer page and working image do not establish stock availability or a successful paid conversion. No checkout or purchase was performed. Older image-research files outside this change were left untouched.
