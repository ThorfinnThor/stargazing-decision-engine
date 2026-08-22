# NASA Black Marble importer

The Black Marble workflow runs offline and publishes only derived site JSON.
Neither HDF files nor live NASA requests are used by page rendering or by
Cloudflare.

## Product choice

- Product: NASA VIIRS/S-NPP `VNP46A4`, Collection 2.
- Grid: 15 arc-seconds in geographic latitude/longitude (2400 × 2400 pixels per
  10-degree tile).
- Layer: `AllAngle_Composite_Snow_Free`.
- Quality layer: `AllAngle_Composite_Snow_Free_Quality`.
- Accepted quality: `0` only. Collection 2 defines `0` as good quality, `1` as
  poor quality, `2` as historical gap-fill, and `255` as fill.
- Values are decoded using the HDF layer's own `_FillValue`, `scale_factor`, and
  `offset`/`add_offset` attributes. This supports Collection 2 while making the
  decoder fail-safe against representation changes.

NASA describes VNP46A4 as a yearly, moonlight- and atmosphere-corrected
nighttime-light composite. The product also corrects for terrain, thermal, and
stray-light effects. Primary references:

- [NASA Collection 2 Black Marble User Guide](https://landweb.modaps.eosdis.nasa.gov/data/userguide/BlackMarbleUserGuide_Collection2.0_20241203.pdf)
- [NASA LAADS VNP46A4 file specification](https://ladsweb.modaps.eosdis.nasa.gov/filespec/VIIRS/1/VNP46A4)
- [NASA CMR collection directory](https://cmr.earthdata.nasa.gov/search/site/collections/directory/LAADS/gov.nasa.eosdis)
- [NASA-supported earthaccess client](https://github.com/earthaccess-dev/earthaccess)

## Baseline and spatial metrics

The fetcher searches backward from the previous calendar year and selects the
latest three years for which every tile intersecting the site's 75 km window is
available. Missing years may be skipped, but a one- or two-year baseline is
never accepted silently. An explicit processing override is required and is
recorded in the snapshot.

Pixel-centre distance is calculated with the haversine formula. Ring intervals
are non-overlapping:

- 0 ≤ d < 2 km: median radiance
- 2 ≤ d < 10 km: mean radiance
- 10 ≤ d < 30 km: mean radiance
- 30 ≤ d ≤ 75 km: mean radiance

Each ring is calculated separately for every year. The published ring value is
the median of those yearly metrics. No area weighting is applied: all cells are
on the same 15-arc-second grid and the window is local. Water pixels remain in
scope because nearby offshore lighting contributes to artificial-light
exposure.

Coverage is valid good-quality pixels divided by all candidate pixels in the
ring. The aggregate ring coverage is the minimum yearly coverage, so a poor
year cannot be hidden. Coverage below 0.90 emits a warning; below 0.70 fails
unless a site-specific reviewed override is present in
`data-config/sources/black-marble.json`. Each override has its own hard minimum,
review date, and rationale. Ad-hoc CLI overrides are rejected. An accepted
override remains visible in snapshot warnings and lowers the public confidence
through the measured coverage; it does not turn poor- or gap-filled pixels into
valid radiance.

## ALAN exposure

The four unrounded aggregate radiances `R0..R3` are transformed as `log1p(R)`
and combined as:

```text
0.45 × log1p(R0) +
0.30 × log1p(R1) +
0.15 × log1p(R2) +
0.10 × log1p(R3)
```

Only the final JSON values are rounded to six decimal places. Darkness-score
calibration is deliberately deferred to Task 10; this importer does not invent
a Bortle class or score.

## Operation

Install `requirements-data.txt` in the ingestion runner and provide a manually
rotated `EARTHDATA_TOKEN`. The secret belongs in GitHub Actions, not Cloudflare.

```bash
pnpm data:black-marble:fetch -- --site westhavelland-core
pnpm data:black-marble:extract -- --site westhavelland-core
pnpm data:black-marble:process -- --site westhavelland-core
pnpm data:black-marble:validate
```

Downloads and extracted pixels remain under ignored `raw-downloads/`. HDF files
are deleted after successful extraction unless `--keep-hdf` is passed. Reviewed
site snapshots under `data-snapshots/black-marble/` are intended to be
committed. Public pages will consume them only after the normalization/export
pipeline has fused them into `public/data/stargazing/` JSON.
