# Licensing and attribution policy

The site publishes source provenance alongside derived static data. Before a
source-backed production refresh, verify the current terms on the provider's
own page and retain the relevant source URL in the manifest.

## NASA Black Marble

Black Marble-derived darkness values retain NASA product and collection
identification, the required NASA acknowledgement, and no implied NASA
endorsement. Raw raster downloads are not published by the site.

## ERA5

ERA5-derived climate snapshots retain the dataset identifier, Copernicus
Climate Data Store attribution, the 1991–2020 normal period, and the source
snapshot hash. Derived values are labelled as such.

## Copernicus DEM

DEM-derived elevation retains the Copernicus DEM GLO-30 source notice and an
adapted-data note where processing changes the source grid or neighborhood
summary.

## Wikimedia Commons images

Images are selected manually from Wikimedia Commons, filtered for a compatible
free-use license, converted to self-hosted WebP, and recorded in the image
manifest with source URL, file title, author, license, license URL, and visible
attribution text. The allowlist is explicit: `CC0`, `CC BY`, `CC BY-SA`,
`Public Domain`, `Public Domain Mark`, `NASA Public Domain`, and `U.S. Government
Work`. Pending records are not presented as image assets.

The P3 research register at
[`data-config/sources/p3-image-candidates.json`](../data-config/sources/p3-image-candidates.json)
contains 50 candidate source pages with complete provenance fields. It is
publication-blocked. All 50 candidates passed a separate Sol visual and license
audit and are marked `sol-approved-for-download`. Their provenance is copied
into the production configuration only after local WebP conversion. The
research register itself remains publication-blocked and is never rendered
directly. `pnpm data:images:validate` now cross-checks every promoted field and
the local WebP signature before publication.

Government and NASA images are accepted only when the source page explicitly
identifies the work as public domain or a U.S. Government work; the manifest
uses `NASA Public Domain` or `U.S. Government Work` as the license value. No
`NC` (non-commercial), `ND` (no-derivatives), “all rights reserved”, unclear,
or merely free-to-view source is accepted.

## OpenStreetMap

If OSM data is added later, the workflow must preserve ODbL attribution and
identify any derived database or adapted dataset before publication.
