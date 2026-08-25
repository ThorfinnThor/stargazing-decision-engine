# Astronomical sky implementation audit

Reviewed on 2026-08-25 before implementation.

## Repository baseline

- `components/home-page.tsx` is a Server Component and loads committed destination,
  site, score, SEO, trip, and gear data directly.
- `app/[locale]/stargazing-destinations/[slug]/page.tsx` uses
  `generateStaticParams`, `dynamic = "force-static"`, and `dynamicParams = false`.
- `next.config.ts` uses `output: "export"`; no request-time service is required.
- `astronomy-engine` is pinned as a production dependency at `2.1.19`.
- The previous hero used only `.orbit`, `.moon`, `.moon::after`, and three
  decorative `.star` spans. It had no location or time model.
- There are 50 active destinations and 50 active observation sites in the
  committed source data.
- `Destination` and `ObservationSite` already expose the required IDs,
  coordinates, elevation, timezone, activity, priority, access, and relation
  fields.
- `localizedLinks.destination(locale, slug)` is the existing internal route
  builder. Node tests use `node:test` with strict assertions.

## Decisions and specification clarifications

- Homepage and destination pages remain statically generated. Current time,
  random homepage selection, and preview query parsing live inside narrow Client
  Components.
- The globally deterministic destination primary site is resolved first. A
  destination is excluded from homepage promotion when that same primary site is
  not travel-eligible. This prevents a homepage click from silently switching to
  a different site on the destination page.
- Refraction is disabled consistently for Sun, Moon, and catalog stars.
- The dome is azimuthal equidistant: north up, east left, south down, west right.
- Live selection uses Sun altitude tiers `<= -18°`, then `<= -12°`; reselection
  occurs only above `-10°`.
- Destination preview input is a validated preview ID, never a free timestamp.
- No weather, terrain, buildings, vegetation, or atmospheric transparency are
  modeled.

## Catalog decision

HYG Stellar Database 4.1 was selected because its upstream repository provides
an explicit CC BY-SA 4.0 license and J2000 right ascension/declination fields.
The generated derivative keeps stars with apparent magnitude `<= 6.0`, removes
the Sun row, converts coordinates to normalized EQJ vectors, and retains only
ID, vector, magnitude, and color index. The exact checksum and source version are
locked in `data-config/astronomy/star-catalog.json`.
