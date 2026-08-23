#!/usr/bin/env python3
"""Download the one Copernicus DEM COG tile required by each observation site."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path

from dem_common import tile_for_point, tile_key


ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "raw-downloads" / "dem"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def fetch(site_slug: str, use_public_fallback: bool) -> None:
    config = load_json(ROOT / "data-config" / "sources" / "copernicus-dem.json")
    sites = load_json(ROOT / "data-config" / "sources" / "observation-sites.json")
    site = next((item for item in sites if item["slug"] == site_slug), None)
    if site is None:
        raise SystemExit(f"Unknown site slug: {site_slug}")
    tile = tile_for_point(site["lat"], site["lon"])
    target = RAW_ROOT / site_slug
    raster_path = target / f"{tile}.tif"
    metadata_path = target / "metadata.json"
    if raster_path.exists() and metadata_path.exists():
        cached = load_json(metadata_path)
        if cached.get("siteId") != site["id"] or cached.get("tile") != tile or cached.get("dataset") != config["dataset"]:
            raise SystemExit(f"DEM cache metadata does not match {site_slug}; remove that site cache and retry.")
        print(f"DEM cache hit for {site_slug}: {tile}.")
        return

    try:
        import boto3  # type: ignore
        from botocore import UNSIGNED  # type: ignore
        from botocore.client import Config  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before DEM retrieval.") from error

    if use_public_fallback:
        endpoint = config["s3"]["publicFallbackEndpoint"]
        bucket = config["s3"]["publicFallbackBucket"]
        prefix = config["s3"]["publicFallbackPrefix"]
        access_key = None
        secret_key = None
    else:
        endpoint = os.environ.get("CDSE_S3_ENDPOINT", config["s3"]["endpoint"])
        bucket = os.environ.get("CDSE_S3_BUCKET", config["s3"]["bucket"])
        prefix = os.environ.get("CDSE_S3_PREFIX", config["s3"]["prefix"])
        access_key = os.environ.get("CDSE_S3_ACCESS_KEY")
        secret_key = os.environ.get("CDSE_S3_SECRET_KEY")
        if not access_key or not secret_key:
            raise SystemExit("CDSE_S3_ACCESS_KEY and CDSE_S3_SECRET_KEY are required for CDSE DEM retrieval.")

    target.mkdir(parents=True, exist_ok=True)
    client_options = {
        "endpoint_url": endpoint,
        "aws_access_key_id": access_key,
        "aws_secret_access_key": secret_key,
        "region_name": "eu-central-1" if use_public_fallback else "default",
    }
    if use_public_fallback:
        client_options["config"] = Config(signature_version=UNSIGNED)
    client = boto3.client(
        "s3",
        **client_options,
    )
    configured_key = os.environ.get("CDSE_S3_KEY") if not use_public_fallback else None
    if use_public_fallback:
        # The public COG mirror exposes a deterministic elevation-object key.
        # Listing the tile prefix can select an AUXFILES mask GeoTIFF instead.
        key = tile_key(config["tileKeyTemplate"], tile, prefix)
    elif configured_key:
        key = configured_key
    else:
        key_prefix = tile_key(config["tileKeyTemplate"], tile, prefix).rsplit("/", 1)[0] + "/"
        objects = client.list_objects_v2(Bucket=bucket, Prefix=key_prefix).get("Contents", [])
        tif_keys = [item["Key"] for item in objects if str(item["Key"]).lower().endswith((".tif", ".tiff"))]
        if not tif_keys:
            raise SystemExit(f"No DEM GeoTIFF found below s3://{bucket}/{key_prefix}")
        key = sorted(tif_keys)[0]
    client.download_file(bucket, key, str(raster_path))
    metadata = {
        "siteId": site["id"],
        "siteSlug": site_slug,
        "dataset": config["dataset"],
        "requestedPoint": [site["lat"], site["lon"]],
        "tile": tile,
        "bucket": bucket,
        "key": key,
        "retrievedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "publicFallback": use_public_fallback,
    }
    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
        handle.write("\n")
    print(f"Retrieved Copernicus DEM tile for {site_slug}: {tile}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, help="Observation-site slug")
    parser.add_argument("--public-fallback", action="store_true", help="Use the documented public COG bucket instead of CDSE S3")
    args = parser.parse_args()
    fetch(args.site, args.public_fallback)
