# ERA5 climate importer

The ERA5 pipeline is a build-time data workflow. The deployed application does
not call Copernicus or run a server function: it reads committed JSON snapshots
that are copied into the static export.

## Source and retrieval

- Dataset: `reanalysis-era5-single-levels-timeseries` from the Copernicus
  Climate Data Store.
- Climate normal: 1991-01-01 through 2020-12-31, with a one-day leading and a
  two-day trailing retrieval buffer. The buffer is used only to finish local
  noon-to-noon nights at the boundaries; aggregation remains restricted to the
  exact 1991–2020 normal.
- Spatial sampling: the dataset returns the nearest 0.25-degree ERA5 grid point
  for each site. Its coordinates and great-circle distance from the requested
  site are preserved in the snapshot.
- Variables: total cloud cover, 2 m temperature, 2 m dew-point temperature,
  10 m U/V wind components, and total precipitation.
- Raw downloads live in `raw-downloads/era5/` and are ignored by Git. Processed
  snapshots live in `data-snapshots/climate/` and are intended to be committed.

The time-series product represents a coarse ERA5 model grid cell. At mountain
sites its 2 m temperature and 10 m wind can differ from conditions at the exact
summit elevation. Production scoring therefore labels these values as
climatology rather than forecasts and caps high-elevation confidence at
`moderate` until explicit grid-cell orography is available.

Primary references:

- [ERA5 hourly time-series dataset](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels-timeseries)
- [CDS API setup](https://cds.climate.copernicus.eu/how-to-api)
- [ECMWF precipitation conversion and accumulation convention](https://confluence.ecmwf.int/pages/viewpage.action?pageId=253727898)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)

## Time and night semantics

ERA5 timestamps are parsed as UTC. A night is named for its local evening date:
timestamps before local noon belong to the previous local calendar date. This
noon-to-noon definition remains stable across daylight-saving transitions.

Only hours with geometric solar-centre altitude at or below -18 degrees are
included in night and monthly statistics. Solar altitude is calculated without
atmospheric refraction. A clear night requires at least three qualifying hours
that are exactly consecutive in UTC; a missing hour breaks the run.

ERA5 reanalysis total precipitation is the accumulation over the hour ending at
the validity timestamp. Values are converted from metres to millimetres before
the wet-hour threshold is applied. Consequently, a civil-day total includes
hours ending 01:00–23:00 on that date and 00:00 on the following date.

## Aggregation

Thresholds are versioned in `data-config/sources/era5.json`. Monthly output
contains clear/good/overcast/wet/dew-risk/wind-risk hour probabilities,
clear/good-night probabilities, temperature percentiles, expected versus
observed astronomical-hour counts, and the number of represented years.

Completeness is the ratio of unique observed astronomical timestamps to the
astronomical timestamps expected for the site and exact normal. It is reported
rather than silently imputed. Duplicate timestamps, missing variables, mixed
grid points, invalid ranges, and malformed timestamps fail the build.

## Running the importer

1. Accept the ERA5 dataset terms in the CDS web interface.
2. Install the pinned Python dependency from `requirements-data.txt`.
3. Provide `CDSAPI_KEY` to the ingestion environment. This secret belongs in
   GitHub Actions, not Cloudflare.
4. Run `pnpm data:era5:fetch` to populate the ignored cache.
5. Run `pnpm data:era5:process` and `pnpm data:era5:validate`.

The fetcher retries transient failures and reuses cached downloads. Tests use
small committed CSV fixtures, so they do not require credentials or network
access. Production claims are made only for real ERA5 snapshots committed by
the credentialed workflow; the current catalog contains one for every active
site.
