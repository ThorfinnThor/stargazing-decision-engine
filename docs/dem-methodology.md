# Copernicus DEM importer

Elevation is ingested offline and published as a small JSON snapshot. Cloudflare
does not download or sample a raster at request time.

## Source and access

V1 uses `COP-DEM_GLO-30-DGED`, the 30 m Copernicus DEM product. CDSE documents
S3-compatible object storage as a supported access method and identifies the
GLO-30 collection as available through S3. The runner uses the endpoint
`eodata.dataspace.copernicus.eu`, bucket `eodata`, and the configurable
`auxdata/CopDEM/COP-DEM_GLO-30-DGED` prefix. Credentials are supplied only via
`CDSE_S3_ACCESS_KEY` and `CDSE_S3_SECRET_KEY` in the ingestion environment. If
the CDSE catalogue exposes a product key that differs from the configured tile
prefix, set `CDSE_S3_KEY` to that exact object key.

The official public COG bucket is available as an explicit `--public-fallback`
for development and recovery. The tile key template is kept in
`data-config/sources/copernicus-dem.json` because object paths can change with
the provider catalogue. In the public COG naming convention, `10` denotes the
one-arc-second GLO-30 grid; it does not mean ten-metre resolution.

References:

- [CDSE S3 access](https://documentation.dataspace.copernicus.eu/APIs/S3.html)
- [CDSE Copernicus DEM collection](https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM)
- [CDSE CCM product identifiers](https://documentation.dataspace.copernicus.eu/Data/Others/CCM.html)
- [Copernicus public COG layout](https://copernicus-dem-30m.s3.amazonaws.com/readme.html)

## Sampling semantics

Each point maps to its containing 1° × 1° geographic tile. The sampler requires
EPSG:4326 and reads the point through Rasterio's masked array interface. Raster
mask and dataset NoData values are excluded; non-finite and invalid values are
also excluded. A missing point elevation is an error for the default
`requirePointData` policy.

Copernicus DEM is a digital surface model (DSM), so buildings and vegetation can
contribute to the sampled height. The snapshot records that model type instead
of presenting it as a bare-earth terrain model.

The snapshot stores the point elevation and true statistical medians of valid pixel centres
within 250 m and 1 km. The neighbourhood uses haversine distance, not a square
window statistic. A neighborhood that crosses the downloaded tile boundary is
omitted with a warning rather than silently calculated from a truncated circle.
The vertical datum is recorded as EGM2008, and values remain
in metres. Temporary GeoTIFFs are deleted after successful processing unless
`--keep-raster` is passed.

## Commands

```bash
pnpm data:dem:fetch -- --site westhavelland-core
pnpm data:dem:process -- --site westhavelland-core
pnpm data:dem:validate
```

For a public development tile:

```bash
pnpm data:dem:fetch -- --site westhavelland-core --public-fallback
```
