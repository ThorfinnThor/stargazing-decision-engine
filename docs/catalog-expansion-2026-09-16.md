# Catalog expansion to 150 destinations

The source catalog now contains 150 destinations and 300 observation sites.
The original 100 destinations and 200 sites remain the production cohort.
The additional 50 destinations and 100 sites are staged with `active: false`
until their source snapshots and image rights are verified.

## Why the new cohort is staged

Publishing a destination without real climate, darkness, elevation and score
snapshots would make the finder and destination pages look complete while
presenting unverified results. Staging keeps the current production catalog
honest and allows editorial work to proceed without inventing scores.

The staged records include bilingual destination guides, location tours, stay
areas, observation-site metadata, source records and image requests. Their
images remain `pending`; no image is treated as licensed until a documented
license or an approved source asset is available.

## Activation checklist

For each staged destination:

1. Verify the linked authority and dark-sky sources and record the checked URL.
2. Ingest real climate, darkness and elevation snapshots for both sites.
3. Run the real-score pipeline and its validation checks.
4. Confirm one licensed destination image and one licensed image per site.
5. Set the destination and its sites to `active: true` and rebuild the data.
6. Run the full test, typecheck, build and static-output validation commands.

The repeatable catalog step is available as `pnpm data:catalog:expand-150`.
