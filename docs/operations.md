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

Scheduled health and calendar workflows intentionally run from committed data,
without an ingestion rebuild. Tests shared with those workflows must not read
ignored `generated/intermediate` files. Destination editorial tests read
`data-config/sources/destinations.json`; a regression check enforces this contract.

## Backlog status, 2026-09-08

- The catalog contains 75 destinations and 150 real-scored observation sites,
  with 75 bilingual destination guides and 75 bilingual location tours. Expansion
  to 100 remains unfinished, not hidden by a presentation filter.
- The missing intermediate-file dependency behind the failed health and calendar
  runs has been removed from the editorial test. Verify both dispatched workflows
  after merge before calling the operational repair complete.
- Images: 25 destination assets and 150 optional site assets remain pending.
- The editorial audit now lists the actual repeated-opening occurrences. Many
  link a destination guide to its corresponding tour; they still need editorial
  review rather than a numerical claim of 247 unrelated-page defects.
- Cloudflare Crawler Hints was confirmed enabled in the dashboard on 2026-09-08.
  OAI-SearchBot, ChatGPT-User and Claude-SearchBot were explicitly blocked.
  Changing those controls awaits user confirmation. Claude-User's blocked switch
  was disabled in this view and requires investigation of the controlling rule.
- Bing Webmaster Tools requires the user's existing-account sign-in. No account
  was created and no additional permissions were granted.
- Infrastructure deletion remains deferred until ownership, DNS use and rollback
  requirements are established. No deployment has been deleted.

The dated August audits record historical verification, not current catalog counts
or a guarantee that dashboard configuration remains unchanged.

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
