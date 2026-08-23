# Stargazing Decision Engine

A static-first decision engine for stargazing travel. Data is ingested and
processed offline, exported as versioned JSON under
`public/data/stargazing/`, and rendered into static pages for Cloudflare Workers
Static Assets.

## Local development

```bash
pnpm install
pnpm dev
```

## Production checks

```bash
pnpm typecheck
pnpm test
pnpm data:pipeline
pnpm build
```

The production build uses Next.js static export. Cloudflare never performs remote
source ingestion and the application has no runtime database.

SEO governance is generated as static JSON before the build. It controls page
indexability, canonicals, hreflang, robots, sitemap, and WebPage structured
data. Set `NEXT_PUBLIC_APP_URL` to the production origin before deployment;
the local fallback is `https://stargazing.local`.

## ERA5 ingestion

ERA5 is fetched only by the offline data workflow. After accepting the dataset
terms, install `requirements-data.txt`, provide `CDSAPI_KEY`, and run:

```bash
pnpm data:era5:fetch -- --site westhavelland-core
pnpm data:era5:process -- --site westhavelland-core
pnpm data:era5:validate
```

Raw downloads are cached outside Git. Reviewed climate snapshots are committed
as JSON and later fused into the public static-data contract. See
[`docs/era5-methodology.md`](docs/era5-methodology.md) for the time, precipitation,
astronomical-night, and completeness semantics.

## Black Marble ingestion

NASA nighttime-light radiance is also processed offline. Install
`requirements-data.txt`, provide `EARTHDATA_TOKEN`, and run:

```bash
pnpm data:black-marble:fetch -- --site westhavelland-core
pnpm data:black-marble:extract -- --site westhavelland-core
pnpm data:black-marble:process -- --site westhavelland-core
pnpm data:black-marble:validate
```

Only the derived JSON snapshot is committed; no public raw raster is produced.
See [`docs/black-marble-methodology.md`](docs/black-marble-methodology.md).

## DEM ingestion

Elevation follows the same offline/static contract. CDSE credentials are kept
in GitHub Actions; a public COG fallback is available for development:

```bash
pnpm data:dem:fetch -- --site westhavelland-core
pnpm data:dem:process -- --site westhavelland-core
pnpm data:dem:validate
```

See [`docs/dem-methodology.md`](docs/dem-methodology.md) for tile, NoData and
neighborhood-median semantics.

## Darkness calibration

The ALAN exposure-to-darkness mapping is fitted offline from reviewed Black
Marble anchor snapshots and committed as a fixed JSON curve. The calibration
fails closed until at least 30 dark, 20 intermediate, and 20 urban anchors pass
operator review; synthetic seed values cannot create the production curve.
See [`docs/darkness-calibration.md`](docs/darkness-calibration.md).

## Real site scoring

Once the reviewed ERA5, Black Marble, darkness calibration, and optional DEM
snapshots exist, `pnpm data:score:real -- --site <site-slug>` writes the static
12-month real score snapshot. The component curves, confidence penalties, and
missing-data behavior are documented in
[`docs/site-score-methodology.md`](docs/site-score-methodology.md).

The real astronomy calendar is generated offline for an explicit rolling horizon
with `pnpm data:calendar:real -- --start YYYY-MM --months 36 --replace`. Its lunar and
astronomical-darkness and Milky Way-overlap semantics are documented in
[`docs/calendar-methodology.md`](docs/calendar-methodology.md).
The Milky Way coordinate and utility configuration is validated with
`pnpm data:milky-way:validate`; real calendar export requires its Sol-reviewed
reference status to remain approved.

Meteor-shower events are curated per year from the reviewed source calendar and
exported as static JSON and static event pages:

```bash
pnpm data:meteor-showers -- --year 2027
pnpm data:meteor-showers:validate
```

The 2027 catalog uses the International Meteor Organization calendar. Event
viewing scores combine monthly historical sky quality, concrete-night Moon
conditions, and radiant altitude; they do not forecast meteor counts or ZHR.
See [`docs/meteor-showers-methodology.md`](docs/meteor-showers-methodology.md).

Short-trip rankings use Haversine distance, the complete committed real-score
snapshot set, and static JSON exports. Meteor and short-trip publication fail
when an active site lacks its real 12-month score snapshot. Conditional-access
sites additionally require a reviewed access source before they can enter a
travel ranking. See
[`docs/short-trips-methodology.md`](docs/short-trips-methodology.md).

Affiliate links are disabled by default and isolated behind allow-listed static
redirects. See [`docs/affiliate-setup.md`](docs/affiliate-setup.md).

Gear guides are static specification-analysis pages with no scraped prices or
availability claims. See [`docs/gear-methodology.md`](docs/gear-methodology.md).

The current catalog contains 50 destinations with 50 complete reviewed real
score snapshots. Synthetic scoring remains only as an isolated development
fixture and cannot feed calendars, meteor rankings, short trips, or the
production manifest.
