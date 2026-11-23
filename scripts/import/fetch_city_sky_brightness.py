#!/usr/bin/env python3
"""Measure VNP46A4 night-light rings around every comparison city, one tile at a time.

The observation-site importer downloads a three-year baseline per site. That does not
scale to more than a thousand cities, so this batch job downloads each 10-degree tile
once for the most recent complete year, accumulates the same distance rings that the
site pipeline uses (data-config/sources/black-marble.json) for every city whose 75 km
window touches the tile, and deletes the tile before fetching the next one.
"""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import sys

from black_marble_common import required_tiles, site_bounding_box
from fetch_black_marble import CMR_GRANULE_SEARCH, HDF5_SIGNATURE, cmr_granule_entry, retry_network


ROOT = Path(__file__).resolve().parents[2]
CITIES = ROOT / "data-config" / "astronomy" / "comparison-cities.json"
CONFIG = ROOT / "data-config" / "sources" / "black-marble.json"
OUTPUT = ROOT / "data-snapshots" / "black-marble" / "cities" / "measurements.json"
RAW_DIR = ROOT / "raw-downloads" / "black-marble" / "cities"
DATA_FIELDS = "HDFEOS/GRIDS/VIIRS_Grid_DNB_2d/Data Fields"
EARTH_RADIUS_KM = 6371.0088
USER_AGENT = "stargazing-index-data-ingest/1.0"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def scalar_attribute(dataset, name: str, default: float) -> float:
    value = dataset.attrs.get(name, default)
    try:
        return float(value[0])
    except (IndexError, TypeError):
        return float(value)


def requests_module():
    try:
        import requests  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before Black Marble retrieval.") from error
    return requests


def discover(config: dict, year: int, tile: str):
    """Return (granule name, Earthdata Cloud URL), or None when the tile has no granule (open ocean)."""
    requests = requests_module()
    pattern = f"{config['product']}.A{year}001.{tile}.{int(config['collectionVersion']):03d}.*"

    def search():
        response = requests.get(
            CMR_GRANULE_SEARCH,
            params={
                "short_name": config["product"],
                "version": config["collectionVersion"],
                "producer_granule_id": pattern,
                "options[producer_granule_id][pattern]": "true",
                "page_size": "10",
            },
            headers={"Accept": "application/json", "User-Agent": USER_AGENT},
            timeout=(30, 180),
        )
        response.raise_for_status()
        return response.json()

    payload = retry_network(f"CMR search for {year} {tile}", search)
    try:
        return cmr_granule_entry(payload, config["product"], year, tile, config["collectionVersion"])
    except RuntimeError:
        return None


def download(name: str, url: str, token: str) -> Path:
    requests = requests_module()
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    destination = RAW_DIR / name

    def fetch() -> Path:
        temporary = destination.with_suffix(f"{destination.suffix}.part")
        temporary.unlink(missing_ok=True)
        with requests.get(
            url,
            headers={"Authorization": f"Bearer {token}", "User-Agent": USER_AGENT},
            timeout=(30, 300),
            stream=True,
            allow_redirects=True,
        ) as response:
            response.raise_for_status()
            chunks = response.iter_content(chunk_size=1024 * 1024)
            first = next(chunks, b"")
            if not first.startswith(HDF5_SIGNATURE):
                raise RuntimeError(
                    f"Earthdata Cloud did not return HDF5 for {name} (content-type "
                    f"{response.headers.get('content-type', 'unknown')}). Refresh the EDL token."
                )
            with temporary.open("wb") as handle:
                handle.write(first)
                for chunk in chunks:
                    if chunk:
                        handle.write(chunk)
        temporary.replace(destination)
        return destination

    if destination.exists():
        return destination
    return retry_network(f"Earthdata Cloud download for {name}", fetch)


class RingAccumulator:
    def __init__(self, rings: list[dict]):
        self.rings = rings
        self.total = {ring["id"]: 0 for ring in rings}
        self.valid = {ring["id"]: 0 for ring in rings}
        self.sum = {ring["id"]: 0.0 for ring in rings}
        self.values = {ring["id"]: [] for ring in rings if ring["statistic"] == "median"}

    def add(self, distances, radiance, valid):
        import numpy as np  # type: ignore

        for ring in self.rings:
            upper = distances <= ring["maxKm"] if ring["upperInclusive"] else distances < ring["maxKm"]
            inside = (distances >= ring["minKm"]) & upper
            accepted = inside & valid
            self.total[ring["id"]] += int(np.count_nonzero(inside))
            self.valid[ring["id"]] += int(np.count_nonzero(accepted))
            selected = radiance[accepted]
            self.sum[ring["id"]] += float(selected.sum())
            if ring["id"] in self.values:
                self.values[ring["id"]].extend(float(value) for value in selected)

    def summary(self):
        rings = {}
        for ring in self.rings:
            ring_id = ring["id"]
            valid = self.valid[ring_id]
            if valid == 0:
                radiance = None
            elif ring["statistic"] == "median":
                ordered = sorted(self.values[ring_id])
                middle = len(ordered) // 2
                radiance = ordered[middle] if len(ordered) % 2 else (ordered[middle - 1] + ordered[middle]) / 2
            else:
                radiance = self.sum[ring_id] / valid
            rings[ring_id] = {
                "radiance": None if radiance is None else round(radiance, 6),
                "coverage": round(valid / self.total[ring_id], 6) if self.total[ring_id] else 0,
            }
        return rings


def process_tile(path: Path, cities: list[dict], accumulators: dict[str, RingAccumulator], config: dict, max_radius_km: float):
    import h5py  # type: ignore
    import numpy as np  # type: ignore

    accepted_quality = np.asarray(config["layer"]["acceptedQualityValues"])
    with h5py.File(path, "r") as source:
        group = source[DATA_FIELDS]
        latitudes = np.asarray(group["lat"][:], dtype=float)
        longitudes = np.asarray(group["lon"][:], dtype=float)
        radiance_dataset = group[config["layer"]["radiance"]]
        quality_dataset = group[config["layer"]["quality"]]
        scale = scalar_attribute(radiance_dataset, "scale_factor", 1.0)
        offset = scalar_attribute(radiance_dataset, "offset", scalar_attribute(radiance_dataset, "add_offset", 0.0))
        fill = scalar_attribute(radiance_dataset, "_FillValue", -999.9)
        for city in cities:
            west, south, east, north = site_bounding_box(city["lat"], city["lon"], max_radius_km)
            rows = np.flatnonzero((latitudes >= south) & (latitudes <= north))
            columns = np.flatnonzero((longitudes >= west) & (longitudes <= east))
            if rows.size == 0 or columns.size == 0:
                continue
            row_slice = slice(int(rows.min()), int(rows.max()) + 1)
            column_slice = slice(int(columns.min()), int(columns.max()) + 1)
            raw = np.asarray(radiance_dataset[row_slice, column_slice], dtype=float)
            quality = np.asarray(quality_dataset[row_slice, column_slice])
            radiance = raw * scale + offset
            valid = (raw != fill) & np.isfinite(radiance) & (radiance >= 0) & np.isin(quality, accepted_quality)
            lat_grid = np.radians(latitudes[row_slice])[:, None]
            lon_grid = np.radians(longitudes[column_slice])[None, :]
            lat0, lon0 = math.radians(city["lat"]), math.radians(city["lon"])
            a = np.sin((lat_grid - lat0) / 2) ** 2 + math.cos(lat0) * np.cos(lat_grid) * np.sin((lon_grid - lon0) / 2) ** 2
            distances = 2 * EARTH_RADIUS_KM * np.arcsin(np.sqrt(np.minimum(1.0, a)))
            accumulators[city["id"]].add(distances, radiance, valid)


def latest_year(config: dict, probe_tile: str) -> int:
    year = datetime.now(timezone.utc).year - 1
    while year >= config["availableFromYear"]:
        if discover(config, year, probe_tile):
            return year
        year -= 1
    raise SystemExit("No VNP46A4 year found")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, help="Annual composite year (default: latest available)")
    parser.add_argument("--keep-hdf", action="store_true")
    parser.add_argument("--limit", type=int, help="Only the first N cities (for a trial run)")
    args = parser.parse_args()

    token = os.environ.get("EARTHDATA_TOKEN")
    if not token:
        raise SystemExit("EARTHDATA_TOKEN is required for the city Black Marble fetch.")
    config = load_json(CONFIG)
    cities = load_json(CITIES)["cities"]
    if args.limit:
        cities = cities[: args.limit]
    max_radius = config["maxRadiusKm"]

    by_tile: dict[str, list[dict]] = {}
    for city in cities:
        for tile in required_tiles(site_bounding_box(city["lat"], city["lon"], max_radius)):
            by_tile.setdefault(tile, []).append(city)
    year = args.year or latest_year(config, "h18v03")
    print(f"{len(cities)} cities, {len(by_tile)} tiles, VNP46A4 {year}.")

    accumulators = {city["id"]: RingAccumulator(config["rings"]) for city in cities}
    granules: list[str] = []
    missing_tiles: list[str] = []
    for index, tile in enumerate(sorted(by_tile), start=1):
        entry = discover(config, year, tile)
        if entry is None:
            missing_tiles.append(tile)
            print(f"[{index}/{len(by_tile)}] {tile}: no granule, skipped.", file=sys.stderr)
            continue
        name, url = entry
        path = download(name, url, token)
        process_tile(path, by_tile[tile], accumulators, config, max_radius)
        granules.append(name)
        if not args.keep_hdf:
            path.unlink(missing_ok=True)
        print(f"[{index}/{len(by_tile)}] {tile}: {len(by_tile[tile])} cities.")

    weights = {ring["id"]: ring["alanWeight"] for ring in config["rings"]}
    results = []
    for city in cities:
        rings = accumulators[city["id"]].summary()
        radiances = [rings[ring_id]["radiance"] for ring_id in weights]
        exposure = None if any(value is None for value in radiances) else round(
            sum(weights[ring_id] * math.log1p(rings[ring_id]["radiance"]) for ring_id in weights), 6)
        results.append({"id": city["id"], "rings": rings, "coverage": min(ring["coverage"] for ring in rings.values()), "alanExposure": exposure})

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump({
            "version": 1,
            "source": config["product"],
            "collectionVersion": config["collectionVersion"],
            "radianceLayer": config["layer"]["radiance"],
            "qualityLayer": config["layer"]["quality"],
            "units": "nW/cm2/sr",
            "year": year,
            "ringConfig": config["rings"],
            "granules": sorted(granules),
            "missingTiles": missing_tiles,
            "retrievedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "cities": results,
        }, handle, indent=1)
        handle.write("\n")
    print(f"Wrote {len(results)} city measurements to {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
