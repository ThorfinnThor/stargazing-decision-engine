#!/usr/bin/env python3
"""Discover and download the latest complete three-year VNP46A4 site baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
import time

from black_marble_common import required_tiles, site_bounding_box
from black_marble_target import resolve_target


ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "raw-downloads" / "black-marble"
_EARTHACCESS = None


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def retry_network(label: str, operation, attempts: int = 4, initial_delay_seconds: float = 5, sleeper=time.sleep):
    """Retry a bounded Earthdata network operation with exponential backoff."""
    if attempts < 1:
        raise ValueError("attempts must be positive")
    for attempt in range(1, attempts + 1):
        try:
            return operation()
        except Exception as error:
            if attempt == attempts:
                raise
            delay = initial_delay_seconds * (2 ** (attempt - 1))
            print(
                f"{label} failed ({error.__class__.__name__}); retrying in {delay:g}s "
                f"({attempt}/{attempts}).",
                file=sys.stderr,
            )
            sleeper(delay)


def earthdata_client():
    """Authenticate once and reuse the Earthdata client for a batch."""
    global _EARTHACCESS
    if _EARTHACCESS is not None:
        return _EARTHACCESS
    if not os.environ.get("EARTHDATA_TOKEN"):
        raise SystemExit("EARTHDATA_TOKEN is required for a Black Marble cache miss.")
    try:
        import earthaccess  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before Black Marble retrieval.") from error
    retry_network("Earthdata login", lambda: earthaccess.login(strategy="environment"))
    _EARTHACCESS = earthaccess
    return _EARTHACCESS


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

    bounds = site_bounding_box(site["lat"], site["lon"], config["maxRadiusKm"])
    tiles = set(required_tiles(bounds))
    earthaccess = earthdata_client()
    selected_by_year: dict[int, list] = {}
    first_candidate_year = datetime.now(timezone.utc).year - 1

    for year in range(first_candidate_year, config["availableFromYear"] - 1, -1):
        by_tile: dict[str, object] = {}
        for tile in sorted(tiles):
            # CMR records expose the human-readable producer filename through
            # the granule-name query even when GranuleUR is an opaque LAADS id.
            # VNP46A4 is annual, but its ending timestamp is in the following
            # year, so the temporal window intentionally ends on January 1 of
            # the next year.
            results = retry_network(
                f"Earthdata search for {year} {tile}",
                lambda: earthaccess.search_data(
                    short_name=config["product"],
                    version=config["collectionVersion"],
                    granule_name=f"{config['product']}.A{year}*.{tile}.*",
                    temporal=(f"{year}-01-01", f"{year + 1}-01-01"),
                    count=10,
                ),
            )
            if results:
                by_tile[tile] = sorted(results, key=lambda result: str(result["umm"]["GranuleUR"]))[0]
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
        paths = retry_network(
            f"Earthdata download for {site_slug} {year}",
            lambda: earthaccess.download(results, str(year_dir)),
        )
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
    targets.add_argument("--anchors-file", type=Path, help="One darkness calibration-anchor id per line")
    args = parser.parse_args()
    if args.anchors_file:
        anchors = [line.strip() for line in args.anchors_file.read_text(encoding="utf-8").splitlines() if line.strip()]
        if not anchors:
            raise SystemExit("Anchor file is empty.")
        for anchor in anchors:
            retrieve(anchor, "anchor")
    else:
        retrieve(args.site or args.anchor, "site" if args.site else "anchor")
