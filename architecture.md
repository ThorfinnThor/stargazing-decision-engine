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
  -> Vercel CDN
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

## GitHub and Vercel responsibilities

GitHub Actions will run ingestion and deterministic rebuild workflows. A data
workflow may commit exported public JSON only after normalization, validation,
tests, type checking, and the static build all succeed. Vercel performs the
static build from the committed repository; it does not ingest or score data.

## Static-compatible routing

- Localized content uses explicit `/en/...` and `/de/...` paths generated at
  build time.
- Dynamic content routes must enumerate every path with `generateStaticParams`
  and disable unknown parameters.
- Locale negotiation must not depend on Next.js middleware. Optional default
  redirects belong in `vercel.json`.
- Affiliate links should use static outbound URLs or finite Vercel redirects;
  no runtime redirect handler is part of V1.
