#!/usr/bin/env python3
"""Extract snow-free radiance and quality pixels from cached VNP46A4 HDF-EOS5 tiles."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

from black_marble_common import parse_granule_name, site_bounding_box
from black_marble_target import resolve_target


ROOT = Path(__file__).resolve().parents[2]
DATA_FIELDS = "HDFEOS/GRIDS/VIIRS_Grid_DNB_2d/Data Fields"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def scalar_attribute(dataset, name: str, default: float) -> float:
    value = dataset.attrs.get(name, default)
    try:
        return float(value[0])
    except (IndexError, TypeError):
        return float(value)


def decode_radiance(raw_value: float, fill: float, scale: float, offset: float):
    if raw_value == fill:
        return None
    value = raw_value * scale + offset
    return value if math.isfinite(value) and value >= 0 else None


def extract_file(path: Path, bounds, radiance_name: str, quality_name: str):
    try:
        import h5py  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before Black Marble extraction.") from error

    west, south, east, north = bounds
    pixels: list[dict] = []
    with h5py.File(path, "r") as source:
        group = source[DATA_FIELDS]
        latitudes = np.asarray(group["lat"][:], dtype=float)
        longitudes = np.asarray(group["lon"][:], dtype=float)
        rows = np.flatnonzero((latitudes >= south) & (latitudes <= north))
        columns = np.flatnonzero((longitudes >= west) & (longitudes <= east))
        if rows.size == 0 or columns.size == 0:
            return pixels
        row_slice = slice(int(rows.min()), int(rows.max()) + 1)
        column_slice = slice(int(columns.min()), int(columns.max()) + 1)
        radiance_dataset = group[radiance_name]
        quality_dataset = group[quality_name]
        raw_radiance = np.asarray(radiance_dataset[row_slice, column_slice])
        raw_quality = np.asarray(quality_dataset[row_slice, column_slice])
        scale = scalar_attribute(radiance_dataset, "scale_factor", 1.0)
        offset = scalar_attribute(radiance_dataset, "offset", scalar_attribute(radiance_dataset, "add_offset", 0.0))
        fill = scalar_attribute(radiance_dataset, "_FillValue", -999.9)
        quality_fill = int(scalar_attribute(quality_dataset, "_FillValue", 255))
        cropped_latitudes = latitudes[row_slice]
        cropped_longitudes = longitudes[column_slice]

        for row_index, latitude in enumerate(cropped_latitudes):
            for column_index, longitude in enumerate(cropped_longitudes):
                raw_value = raw_radiance[row_index, column_index]
                quality = int(raw_quality[row_index, column_index])
                value = decode_radiance(float(raw_value), fill, scale, offset)
                pixels.append({
                    "lat": float(latitude),
                    "lon": float(longitude),
                    "radiance": value,
                    "quality": quality_fill if quality == quality_fill else quality,
                })
    return pixels


def extract(site_slug: str, keep_hdf: bool, target_kind: str = "site") -> None:
    config = load_json(ROOT / "data-config" / "sources" / "black-marble.json")
    site = resolve_target(ROOT, site_slug, target_kind)
    raw_dir = ROOT / "raw-downloads" / "black-marble" / site_slug
    metadata = load_json(raw_dir / "metadata.json")
    if metadata.get("siteId") != site["id"] or metadata.get("requestedPoint") != [site["lat"], site["lon"]]:
        raise SystemExit(f"Black Marble cache identity mismatch for {site_slug}")
    existing_outputs = [raw_dir / item for item in metadata.get("extractedFiles", [])]
    if len(existing_outputs) == config["baselineYearCount"] and all(path.exists() for path in existing_outputs):
        print(f"Black Marble extracted cache hit for {site_slug}: {len(existing_outputs)} year file(s).")
        return
    bounds = site_bounding_box(site["lat"], site["lon"], config["maxRadiusKm"])

    outputs: list[Path] = []
    for year in metadata["years"]:
        files = [raw_dir / item for item in metadata["files"] if parse_granule_name(item)[0] == year]
        pixels: list[dict] = []
        for path in files:
            pixels.extend(extract_file(path, bounds, config["layer"]["radiance"], config["layer"]["quality"]))
        output = raw_dir / f"pixels-{year}.json"
        with output.open("w", encoding="utf-8") as handle:
            json.dump({
                "year": year,
                "product": config["product"],
                "collectionVersion": config["collectionVersion"],
                "sourceFiles": [path.name for path in files],
                "pixels": pixels,
            }, handle, separators=(",", ":"))
            handle.write("\n")
        outputs.append(output)
        print(f"Extracted {len(pixels)} candidate pixels for {site_slug}, {year}.")

    if not keep_hdf and len(outputs) == len(metadata["years"]):
        for relative in metadata["files"]:
            (raw_dir / relative).unlink(missing_ok=True)
        metadata["hdfDeleted"] = True
        metadata["extractedFiles"] = [path.name for path in outputs]
        with (raw_dir / "metadata.json").open("w", encoding="utf-8") as handle:
            json.dump(metadata, handle, indent=2)
            handle.write("\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    targets = parser.add_mutually_exclusive_group(required=True)
    targets.add_argument("--site", help="Observation-site slug")
    targets.add_argument("--anchor", help="Darkness calibration-anchor id")
    parser.add_argument("--keep-hdf", action="store_true", help="Keep downloaded HDF files after successful extraction")
    args = parser.parse_args()
    extract(args.site or args.anchor, args.keep_hdf, "site" if args.site else "anchor")
