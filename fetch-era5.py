#!/usr/bin/env python3
"""Credentialed ERA5 point time-series retrieval with cache and safe extraction."""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import zipfile


ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "data-config" / "sources" / "era5.json"
SITES_PATH = ROOT / "data-config" / "sources" / "observation-sites.json"
RAW_ROOT = ROOT / "raw-downloads" / "era5"


def load_json(path: Path):
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def buffered_range(start_iso: str, end_iso: str) -> str:
    start = date.fromisoformat(start_iso) - timedelta(days=1)
    end = date.fromisoformat(end_iso) + timedelta(days=2)
    return f"{start.isoformat()}/{end.isoformat()}"


def safe_extract(archive: Path, destination: Path) -> list[str]:
    extracted: list[str] = []
    destination_root = destination.resolve()
    with zipfile.ZipFile(archive) as bundle:
        for member in bundle.infolist():
            resolved = (destination / member.filename).resolve()
            if destination_root not in resolved.parents and resolved != destination_root:
                raise RuntimeError(f"Unsafe archive member: {member.filename}")
            bundle.extract(member, destination)
            if not member.is_dir():
                extracted.append(member.filename)
    return extracted


def retrieve(site_slug: str) -> None:
    config = load_json(CONFIG_PATH)
    sites = load_json(SITES_PATH)
    site = next((item for item in sites if item["slug"] == site_slug), None)
    if site is None:
        raise SystemExit(f"Unknown site slug: {site_slug}")

    token = os.environ.get("CDSAPI_KEY")
    if not token:
        raise SystemExit("CDSAPI_KEY is required. Accept the dataset terms in CDS before retrieval.")

    target_dir = RAW_ROOT / site_slug
    target_dir.mkdir(parents=True, exist_ok=True)
    cached_csv = sorted(target_dir.glob("*.csv"))
    if cached_csv:
        if not (target_dir / "metadata.json").exists():
            raise SystemExit(
                f"Incomplete ERA5 cache for {site_slug}: CSV exists without metadata.json. "
                "Remove that site cache and retry."
            )
        print(f"ERA5 cache hit for {site_slug}: {len(cached_csv)} CSV file(s).")
        return

    request = {
        "variable": config["variables"],
        "location": {"longitude": site["lon"], "latitude": site["lat"]},
        "date": [buffered_range(config["climateNormal"]["startDate"], config["climateNormal"]["endDate"])],
        "data_format": config["request"]["dataFormat"],
    }

    try:
        import cdsapi  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before ERA5 retrieval.") from error

    payload = target_dir / "response.download"
    client = cdsapi.Client(
        url="https://cds.climate.copernicus.eu/api",
        key=token,
        retry_max=config["request"]["retryMax"],
        timeout=config["request"]["timeoutSeconds"],
        quiet=False,
    )
    client.retrieve(config["dataset"], request, str(payload))

    if zipfile.is_zipfile(payload):
        files = safe_extract(payload, target_dir)
    else:
        output = target_dir / "era5.csv"
        payload.replace(output)
        files = [output.name]

    metadata = {
        "dataset": config["dataset"],
        "siteId": site["id"],
        "siteSlug": site_slug,
        "requestedPoint": [site["lat"], site["lon"]],
        "request": request,
        "retrievedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "files": files,
    }
    with (target_dir / "metadata.json").open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
        handle.write("\n")
    print(f"Retrieved ERA5 data for {site_slug}: {len(files)} file(s).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, help="Observation-site slug")
    arguments = parser.parse_args()
    retrieve(arguments.site)
