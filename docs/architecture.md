# Architecture

## V1 invariant

Process dynamically and offline; publish statically. The deployed application
has no runtime database and makes no source-data requests while rendering a
page.

## Build and deployment

```text
curated config + committed snapshots
  -> offline normalize / score / calendar scripts
  -> public/data/stargazing/**/*.json
  -> validation and tests
  -> git commit
  -> Next.js static export
  -> Cloudflare Workers Static Assets
```

`next.config.ts` sets `output: "export"`. This is an executable architecture
guard: unsupported runtime-only route features fail the production build.

## Public data boundary

Pages may read published product data only from:

```text
public/data/stargazing/**
```

The following are offline-only and must not be read by page code:

- `data-snapshots/**`
- `generated/**`
- source APIs such as ERA5, Black Marble, and Copernicus DEM

## GitHub and Cloudflare responsibilities

GitHub Actions will run ingestion and deterministic rebuild workflows. A data
workflow may commit exported public JSON only after normalization, validation,
tests, type checking, and the static build all succeed. Cloudflare performs the
static build from the committed repository; it does not ingest or score data.
Derived-data commits must not contain `[skip ci]`, because the Cloudflare Git
integration deploys those committed static artifacts.

## Static-compatible routing

- Localized content uses explicit `/en/...` and `/de/...` paths generated at
  build time.
- Dynamic content routes must enumerate every path with `generateStaticParams`
  and disable unknown parameters.
- Locale negotiation must not depend on Next.js middleware. Optional default
  redirects must be finite static routes or Cloudflare configuration.
- Affiliate links should use static outbound URLs or finite static redirects;
  no runtime redirect handler is part of V1.
- Cache, robots, and referrer headers for static paths live in `public/_headers`
  and are copied into the Cloudflare asset bundle by the Next.js export.
