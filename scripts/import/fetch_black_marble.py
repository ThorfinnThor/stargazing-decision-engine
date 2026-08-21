#!/usr/bin/env python3
"""Discover and download the latest complete three-year VNP46A4 site baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys

from black_marble_common import parse_granule_name, required_tiles, site_bounding_box
from black_marble_target import resolve_target


ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "raw-downloads" / "black-marble"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def granule_name(result) -> str:
    return str(result["umm"]["GranuleUR"])


def retrieve(site_slug: str, target_kind: str = "site") -> None:
    config = load_json(ROOT / "data-config" / "sources" / "black-marble.json")
    site = resolve_target(ROOT, site_slug, target_kind)

    target = RAW_ROOT / site_slug
    metadata_path = target / "metadata.json"
    if metadata_path.exists():
        cached = load_json(metadata_path)
        cached_point = cached.get("requestedPoint")
        cache_matches = cached.get("siteId") == site["id"] and cached_point == [site["lat"], site["lon"]]
        cached_files = [target / item for item in cached.get("files", [])]
        extracted_files = [target / item for item in cached.get("extractedFiles", [])]
        complete_years = len(cached.get("years", [])) == config["baselineYearCount"]
        if cache_matches and complete_years and cached_files and all(path.exists() for path in cached_files):
            print(f"Black Marble cache hit for {site_slug}: {len(cached_files)} HDF file(s).")
            return
        if cache_matches and complete_years and len(extracted_files) == config["baselineYearCount"] and all(path.exists() for path in extracted_files):
            print(f"Black Marble extracted cache hit for {site_slug}: {len(extracted_files)} year file(s).")
            return

    if not os.environ.get("EARTHDATA_TOKEN"):
        raise SystemExit("EARTHDATA_TOKEN is required for a Black Marble cache miss.")
    try:
        import earthaccess  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before Black Marble retrieval.") from error

    bounds = site_bounding_box(site["lat"], site["lon"], config["maxRadiusKm"])
    tiles = set(required_tiles(bounds))
    earthaccess.login(strategy="environment")
    selected_by_year: dict[int, list] = {}
    first_candidate_year = datetime.now(timezone.utc).year - 1

    for year in range(first_candidate_year, config["availableFromYear"] - 1, -1):
        results = earthaccess.search_data(
            short_name=config["product"],
            version=config["collectionVersion"],
            bounding_box=bounds,
            temporal=(f"{year}-01-01", f"{year}-12-31"),
            count=100,
        )
        by_tile: dict[str, object] = {}
        for result in sorted(results, key=granule_name):
            name = granule_name(result)
            try:
                granule_year, tile = parse_granule_name(name)
            except ValueError:
                continue
            if granule_year == year and tile in tiles:
                by_tile[tile] = result
        if tiles.issubset(by_tile):
            selected_by_year[year] = [by_tile[tile] for tile in sorted(tiles)]
        if len(selected_by_year) == config["baselineYearCount"]:
            break

    if len(selected_by_year) != config["baselineYearCount"]:
        raise SystemExit(
            f"Found only {len(selected_by_year)} complete VNP46A4 year(s) for {site_slug}; "
            f"required {config['baselineYearCount']}."
        )

    target.mkdir(parents=True, exist_ok=True)
    downloaded: list[str] = []
    for year, results in sorted(selected_by_year.items()):
        year_dir = target / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        paths = earthaccess.download(results, str(year_dir))
        for path in paths:
            downloaded.append(str(Path(path).resolve().relative_to(target.resolve())))

    metadata = {
        "product": config["product"],
        "collectionVersion": config["collectionVersion"],
        "siteId": site["id"],
        "siteSlug": site_slug,
        "targetKind": target_kind,
        "requestedPoint": [site["lat"], site["lon"]],
        "radiusKm": config["maxRadiusKm"],
        "boundingBox": list(bounds),
        "requiredTiles": sorted(tiles),
        "years": sorted(selected_by_year),
        "files": sorted(downloaded),
        "hdfDeleted": False,
        "retrievedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    with metadata_path.open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
        handle.write("\n")
    print(f"Retrieved {len(downloaded)} VNP46A4 granule(s) for {site_slug}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    targets = parser.add_mutually_exclusive_group(required=True)
    targets.add_argument("--site", help="Observation-site slug")
    targets.add_argument("--anchor", help="Darkness calibration-anchor id")
    args = parser.parse_args()
    retrieve(args.site or args.anchor, "site" if args.site else "anchor")
