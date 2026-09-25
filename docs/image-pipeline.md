# Image pipeline

The image workflow is offline and attribution-first:

```text
Wikimedia Commons / public-domain source search
→ explicit free-license filter (CC0 / CC BY / CC BY-SA / public domain)
→ relevance review / manual override
→ local WebP conversion
→ public/images self-hosting
→ attribution manifest validation
```

`data-config/sources/destination-images.json` and
`data-config/sources/site-images.json` cover every active target. A pending
record is explicit and includes a reason; it produces no image URL. An
approved record must point to a local `/images/*.webp` file and include source,
author, license, license URL, attribution, alt text, and review date.

P3 candidates are kept separately in
`data-config/sources/p3-image-candidates.json`. They include source-page and
download provenance and are not consumed directly by page rendering. The original
50 reviewed records were copied into `destination-images.json` after local WebP
conversion. A second source audit on 2026-09-08 promoted the remaining 25 images
from that catalog, leaving all 75 pre-expansion destinations with approved local
assets. A separate metadata and visual review then cleared the 25 destinations in
the 100-destination expansion. On 2026-09-25, the staged 50-destination cohort
passed the same metadata, minimum-resolution and visual gates. All 150 destination
records now point to approved, locally stored assets with complete provenance, and
all 300 observation-site records reuse those assets only as regional context. The
staged review is retained in a dated audit file rather than merged into an earlier
review. Site alt text
names the observation site and explicitly describes the image as regional context;
it does not claim that the photograph depicts the exact observing position. The
mapping and copied provenance are recorded in
the dated `data-config/sources/site-image-audit-*.json` register and validated on
every build. The validator loads every dated destination audit and the latest site
mapping audit, so later cohorts cannot bypass or overwrite earlier evidence.
Pending records do not publish an asset. Inactive destinations remain excluded from
the public manifest even when their image records are approved. The production
validator checks that every copied provenance field still matches the audit register
exactly.

The build never fetches remote images and does not silently fall back to an
unlicensed asset. See [`docs/licensing.md`](licensing.md) for the source policy.
