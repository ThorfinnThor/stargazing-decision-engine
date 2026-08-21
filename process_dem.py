#!/usr/bin/env python3
"""Sample a cached Copernicus DEM COG and write a static site snapshot."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from dem_common import median, tile_for_point, valid_elevation


ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "raw-downloads" / "dem"
SNAPSHOT_ROOT = ROOT / "data-snapshots" / "dem"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def haversine_km(lat_a: float, lon_a: float, lat_b: float, lon_b: float) -> float:
    radius = 6371.0088
    radians = math.pi / 180
    d_lat = (lat_b - lat_a) * radians
    d_lon = (lon_b - lon_a) * radians
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat_a * radians) * math.cos(lat_b * radians) * math.sin(d_lon / 2) ** 2
    return radius * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def process(site_slug: str, keep_raster: bool) -> None:
    try:
        import rasterio  # type: ignore
        from rasterio.windows import from_bounds  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before DEM processing.") from error

    config = load_json(ROOT / "data-config" / "sources" / "copernicus-dem.json")
    sites = load_json(ROOT / "data-config" / "sources" / "observation-sites.json")
    site = next((item for item in sites if item["slug"] == site_slug), None)
    if site is None:
        raise SystemExit(f"Unknown site slug: {site_slug}")
    raw_dir = RAW_ROOT / site_slug
    metadata = load_json(raw_dir / "metadata.json")
    expected_tile = tile_for_point(site["lat"], site["lon"])
    if metadata.get("siteId") != site["id"] or metadata.get("dataset") != config["dataset"] or metadata.get("tile") != expected_tile:
        raise RuntimeError(f"DEM metadata identity mismatch for {site_slug}")
    if metadata.get("requestedPoint") != [site["lat"], site["lon"]]:
        raise RuntimeError(f"DEM requested point mismatch for {site_slug}")
    if not metadata.get("retrievedAt") or not metadata.get("bucket") or not metadata.get("key"):
        raise RuntimeError(f"DEM provenance metadata is incomplete for {site_slug}")
    raster_path = raw_dir / f"{metadata['tile']}.tif"
    if not raster_path.exists():
        raise SystemExit(f"No cached DEM raster for {site_slug}; run data:dem:fetch first.")

    warnings: list[str] = []
    with rasterio.open(raster_path) as dataset:
        if dataset.crs is None or dataset.crs.to_epsg() != 4326:
            raise RuntimeError(f"DEM tile CRS must be EPSG:4326, received {dataset.crs}")
        nodata = dataset.nodata
        valid_min, valid_max = config["validElevationRangeM"]
        row, column = dataset.index(site["lon"], site["lat"])
        if row < 0 or column < 0 or row >= dataset.height or column >= dataset.width:
            raise RuntimeError(f"DEM tile does not contain requested coordinate for {site_slug}")
        point = dataset.read(1, window=((row, row + 1), (column, column + 1)), masked=True)
        point_value = None if point.mask[0, 0] else valid_elevation(point[0, 0], nodata, valid_min, valid_max)
        if point_value is None and config["requirePointData"]:
            raise RuntimeError(f"DEM point is NoData for {site_slug}")

        neighborhoods = []
        for radius_km in config["neighborhoodsKm"]:
            lat_delta = radius_km / 111.2
            lon_delta = radius_km / (111.2 * max(0.01, math.cos(math.radians(site["lat"]))))
            west = site["lon"] - lon_delta
            south = site["lat"] - lat_delta
            east = site["lon"] + lon_delta
            north = site["lat"] + lat_delta
            if west < dataset.bounds.left or east > dataset.bounds.right or south < dataset.bounds.bottom or north > dataset.bounds.top:
                neighborhoods.append({"radiusKm": radius_km, "elevationM": None, "validSampleCount": 0})
                warnings.append(f"{radius_km} km neighborhood crosses the downloaded tile boundary and was omitted")
                continue
            window = from_bounds(
                west,
                south,
                east,
                north,
                transform=dataset.transform,
            ).round_offsets().round_lengths()
            values = dataset.read(1, window=window, masked=True)
            transform = dataset.window_transform(window)
            valid_values: list[float] = []
            for row_index in range(values.shape[0]):
                for column_index in range(values.shape[1]):
                    if values.mask[row_index, column_index]:
                        continue
                    lon, lat = transform * (column_index + 0.5, row_index + 0.5)
                    if haversine_km(site["lat"], site["lon"], lat, lon) <= radius_km:
                        value = valid_elevation(values[row_index, column_index], nodata, valid_min, valid_max)
                        if value is not None:
                            valid_values.append(value)
            neighborhoods.append({
                "radiusKm": radius_km,
                "elevationM": None if not valid_values else round(median(valid_values), 3),
                "validSampleCount": len(valid_values),
            })
            if not valid_values:
                warnings.append(f"No valid DEM samples within {radius_km} km")

    snapshot = {
        "siteId": site["id"],
        "source": "copernicus-dem-glo-30",
        "dataset": config["dataset"],
        "modelType": "DSM",
        "resolutionM": config["resolutionM"],
        "resolutionArcSeconds": config["resolutionArcSeconds"],
        "verticalDatum": config["verticalDatum"],
        "requestedPoint": [site["lat"], site["lon"]],
        "tile": metadata["tile"],
        "sourceObject": f"s3://{metadata['bucket']}/{metadata['key']}",
        "publicFallback": bool(metadata.get("publicFallback", False)),
        "elevationM": None if point_value is None else round(point_value, 3),
        "neighborhoods": neighborhoods,
        "noDataPolicy": "masked-or-nodata-values-excluded",
        "coverage": 0 if point_value is None else 1,
        "warnings": warnings,
        "retrievedAt": metadata["retrievedAt"],
    }
    SNAPSHOT_ROOT.mkdir(parents=True, exist_ok=True)
    with (SNAPSHOT_ROOT / f"{site_slug}.json").open("w", encoding="utf-8") as handle:
        json.dump(snapshot, handle, indent=2)
        handle.write("\n")
    if not keep_raster:
        raster_path.unlink(missing_ok=True)
    print(f"Processed Copernicus DEM snapshot for {site_slug}: {snapshot['elevationM']} m.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, help="Observation-site slug")
    parser.add_argument("--keep-raster", action="store_true", help="Keep the temporary GeoTIFF after processing")
    args = parser.parse_args()
    process(args.site, args.keep_raster)
