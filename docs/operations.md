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

- The catalog contains 100 destinations and 200 observation sites, with 100
  bilingual destination guides and 100 bilingual location tours. Every production
  site must have a real score snapshot before the build can pass.
- Calendar generation evaluates expensive Moon and Milky Way calculations only
  inside exact astronomical-darkness intervals. A one-month, 75-destination
  benchmark completed in 3.13 seconds after this change.
- All 100 destinations now have locally stored, license-audited assets. The final
  25 expansion images were promoted only after source metadata, license and visual
  relevance checks passed. All 200 observation-site records reuse their parent
  destination asset as explicitly labelled regional context, with copied provenance
  checked against a dedicated mapping audit.
- The strengthened editorial audit reports zero banned phrases, exact duplicate
  passages, repeated long sentences, repeated twelve-word openings and repeated
  destination section-ID sequences. Redundant sentences within individual pages
  were removed, while recurring cross-page guidance was rewritten around the
  relevant site, access decision and return route.
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
