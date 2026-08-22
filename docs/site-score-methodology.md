# Real site-score methodology

The real score engine consumes reviewed JSON snapshots for one observation site:

- the 1991–2020 ERA5 astronomical-night climate normal;
- VNP46A4 ALAN exposure with a score from the committed darkness curve;
- Copernicus DEM elevation when available;
- curated access metadata from the site configuration.

All curves and weights live in `data-config/scoring/`. The production command is:

```bash
pnpm data:score:real -- --site <site-slug>
pnpm data:score:real:validate
```

It writes a deterministic 12-month JSON snapshot under
`data-snapshots/scores/`. The latest source retrieval timestamp is used as the
derived timestamp, so an unchanged source set has an unchanged output. The
browser and Cloudflare never calculate source metrics or retrieve remote data.

The score command applies the current committed darkness curve directly to the
committed ALAN exposure. It therefore does not require the raw Black Marble
raster cache merely because a new reviewed calibration curve was published.
The static exporter prefers a complete real score snapshot per destination and
keeps destinations without one explicitly marked as `seed`; real and seed
scores are never presented under the same provenance label.

## Components

Clear-sky score combines the specified clear-night curve at 70% and clear-hour
curve at 30%. Sky quality is 45% clear sky, 40% calibrated darkness, 10% dew,
and 5% elevation. Trip comfort is 45% temperature, 30% wind, 15% rain, and 10%
access. If access is unknown, the three climate weights are renormalized. The
overall stargazing-trip score is 80% sky quality and 20% trip comfort.

All calculation remains floating point until the public components are rounded
to whole score points. The current temperature component uses the monthly mean
of astronomical-night hours because the reviewed ERA5 snapshot does not retain
hourly utilities; every score carries this limitation as a caveat.

When a climate-normal month contains no astronomical-night hours, its overall,
sky-quality, and comfort scores are forced to zero and explicitly explained.
Missing non-polar climate metrics or missing calibrated darkness are build
errors. Missing DEM uses the curated site elevation when present, but the DEM
confidence component becomes zero.

## Confidence

Confidence follows the fixed 30/25/15/10/10/10 weighting for ERA5 completeness,
Black Marble coverage, Black Marble baseline completeness, ERA5 grid distance,
DEM availability, and site/access metadata. Scores of 85 or more are high,
70–84 moderate, and below 70 low. Every low-confidence result contains an
explicit caveat requiring destination/ranking builders to exclude it from an
unqualified top result. A reviewed Black Marble low-coverage override is also
named in every monthly score caveat and remains numerically penalized by the
unchanged confidence formula.
