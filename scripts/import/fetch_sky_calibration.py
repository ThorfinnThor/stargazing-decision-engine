#!/usr/bin/env python3
"""Measure the city night-light rings at published sky-brightness stations.

Each station in data-config/astronomy/sky-calibration-sites.json has a measured clear,
moonless zenith brightness. This job pairs it with the Black Marble exposure of the same
year, using the same rings and weights as the city estimate.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import math
import os

from black_marble_common import required_tiles, site_bounding_box
from fetch_city_sky_brightness import CONFIG, ROOT, RingAccumulator, discover, download, load_json, process_tile


SITES = ROOT / "data-config" / "astronomy" / "sky-calibration-sites.json"
OUTPUT = ROOT / "data-snapshots" / "black-marble" / "cities" / "calibration-sites.json"


def main() -> None:
    token = os.environ.get("EARTHDATA_TOKEN")
    if not token:
        raise SystemExit("EARTHDATA_TOKEN is required for the calibration fetch.")
    config = load_json(CONFIG)
    sites = load_json(SITES)["sites"]
    max_radius = config["maxRadiusKm"]
    accumulators = {site["id"]: RingAccumulator(config["rings"]) for site in sites}
    jobs: dict[tuple[int, str], list[dict]] = {}
    for site in sites:
        for tile in required_tiles(site_bounding_box(site["lat"], site["lon"], max_radius)):
            jobs.setdefault((site["year"], tile), []).append(site)

    granules: list[str] = []
    missing: list[str] = []
    for year, tile in sorted(jobs):
        entry = discover(config, year, tile)
        if entry is None:
            missing.append(f"{year} {tile}")
            continue
        name, url = entry
        path = download(name, url, token)
        process_tile(path, jobs[(year, tile)], accumulators, config, max_radius)
        granules.append(name)
        path.unlink(missing_ok=True)
        print(f"{year} {tile}: {len(jobs[(year, tile)])} sites.")

    weights = {ring["id"]: ring["alanWeight"] for ring in config["rings"]}
    results = []
    for site in sites:
        rings = accumulators[site["id"]].summary()
        values = [rings[ring_id]["radiance"] for ring_id in weights]
        exposure = None if any(value is None for value in values) else round(
            sum(weights[ring_id] * math.log1p(rings[ring_id]["radiance"]) for ring_id in weights), 6)
        results.append({"id": site["id"], "year": site["year"], "rings": rings,
                        "coverage": min(ring["coverage"] for ring in rings.values()), "alanExposure": exposure})

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump({
            "version": 1,
            "source": config["product"],
            "collectionVersion": config["collectionVersion"],
            "granules": sorted(granules),
            "missingTiles": missing,
            "retrievedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            "sites": results,
        }, handle, indent=1)
        handle.write("\n")
    print(f"Wrote {len(results)} calibration measurements to {OUTPUT.relative_to(ROOT)}.")


if __name__ == "__main__":
    main()
