# Operations runbook

The production site is a static Next.js export. GitHub Actions is the only
place where source ingestion or JSON generation should run; Cloudflare only builds
and serves the committed static output.

## Safe refresh and rollback

1. Run `CI` on a pull request. It rebuilds the static real-derived products,
   validates every schema and source snapshot, runs tests and typechecking,
   and performs a production build.
2. Use the manually dispatched `Data ingestion` workflow only when the
   required source credentials are configured as GitHub Actions secrets. It
   commits derived JSON only after the full validation, test, typecheck, and
   build chain succeeds.
3. If a refresh is bad, revert the refresh commit in GitHub and merge the
   revert. Cloudflare then redeploys the previous known-good static dataset.

No ingestion workflow may force-push, commit raw downloads, or bypass a
failed validation. A failed job leaves the last committed dataset untouched.

## Credential and source failures

- `CDSAPI_KEY`: accept the ERA5 dataset terms before retrying. Rotate the
  repository secret if the provider reports a revoked key.
- `EARTHDATA_TOKEN`: rotate the NASA Earthdata token and rerun only after the
  account can access the configured Black Marble collection.
- `CDSE_S3_ACCESS_KEY` / `CDSE_S3_SECRET_KEY`: rotate both together and verify
  the endpoint, bucket, and prefix in `data-config/sources/copernicus-dem.json`.
- Calendar generation is deterministic and offline. A failing calendar job
  must not be replaced with hand-edited dates; fix the generator or revert.

## Disable affiliate links

Set every partner entry in `data-config/sources/affiliate-partners.json` to
`enabled: false`, rebuild, validate, and deploy. The generated redirect
manifest must contain no active redirect before the change is merged.
