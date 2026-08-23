# Copernicus DEM importer

Elevation is ingested offline and published as a small JSON snapshot. Cloudflare
does not download or sample a raster at request time.

## Source and access

V1 uses `COP-DEM_GLO-30-DGED`, the 30 m Copernicus DEM product. The production
GitHub ingestion reads the public Copernicus DEM COG mirror because its tile
keys are stable and directly addressable. The downloader can also use the
authenticated CDSE S3 endpoint when an exact collection object key is known.
Snapshot provenance always records the selected bucket and key.

The public COG mirror is selected with `--public-fallback`. The tile key template is kept in
`data-config/sources/copernicus-dem.json` because object paths can change with
the provider catalogue. In the public COG naming convention, `10` denotes the
one-arc-second GLO-30 grid; it does not mean ten-metre resolution.
The public path is calculated exactly rather than discovered by listing the tile
directory, which also contains non-elevation auxiliary GeoTIFFs.

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
