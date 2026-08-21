# Seed configuration

The JSON files in this directory are synthetic development fixtures. They are
useful for exercising normalization, scoring, calendar, page generation, and
validation, but they are not production observations and must not be described
as measured climate or access data.

Production ingestion will replace these inputs with curated records and
versioned source snapshots before the production data gate.

The calibration directory is different: its candidate darkness anchors are
explicitly marked as operator-review pending, and the scoring curve remains in
an unavailable state until the documented real-data minimums are satisfied.

Astronomy configuration is deterministic build input. Real calendar builds must
receive an explicit start month and write only static JSON; no runtime source
access is permitted. The Milky Way configuration uses a J2000 Galactic Center
reference approved by the required Sol astronomy review. Real calendar
generation still fails closed if that status is changed away from `approved`.

Meteor shower dates and radiants are curated under
`data-config/astronomy/meteor-showers/` by source year. Date-only maxima remain
date-only when the source does not publish a reliable hour; the build never
invents a peak timestamp.

Short-trip origins and their distance/scoring contract live under
`data-config/trips/`. Rankings use Haversine distance and are exported as
static JSON; they never estimate driving time or live availability.

Gear categories, guides, and product metadata live under `data-config/gear/`.
They are specification-analysis records only: no scraped prices, inventory,
manufacturer copy, hands-on claims, or active affiliate hooks are included.

Image source records live under `data-config/sources/*-images.json`; the image
manifest is generated only from local, attribution-complete WebP assets.
