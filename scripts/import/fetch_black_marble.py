#!/usr/bin/env python3
"""Discover and download the latest complete three-year VNP46A4 site baseline."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sys
import time

from black_marble_common import required_tiles, site_bounding_box
from black_marble_target import resolve_target


ROOT = Path(__file__).resolve().parents[2]
RAW_ROOT = ROOT / "raw-downloads" / "black-marble"
_EARTHACCESS = None
LAADS_ARCHIVE_ROOT = "https://ladsweb.modaps.eosdis.nasa.gov/archive/allData/5200"
CMR_GRANULE_SEARCH = "https://cmr.earthdata.nasa.gov/search/granules.json"
EARTHDATA_CLOUD_HOST = "data.laadsdaac.earthdatacloud.nasa.gov"
HDF5_SIGNATURE = b"\x89HDF\r\n\x1a\n"


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


def retry_nonempty_results(
    label: str,
    operation,
    attempts: int = 4,
    initial_delay_seconds: float = 5,
    sleeper=time.sleep,
):
    """Retry Earthdata searches that transiently return no granules."""
    return retry_network(
        label,
        lambda: operation() or (_ for _ in ()).throw(RuntimeError("Earthdata returned no granules")),
        attempts=attempts,
        initial_delay_seconds=initial_delay_seconds,
        sleeper=sleeper,
    )


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


def laads_granule_names(index_html: str, product: str, year: int, tile: str, collection_version: str) -> list[str]:
    """Extract current collection granules from a LAADS archive directory listing."""
    version = f"{int(collection_version):03d}"
    pattern = re.compile(
        rf"{re.escape(product)}\.A{year}001\.{re.escape(tile)}\.{version}\.\d+\.h5"
    )
    return sorted(set(pattern.findall(index_html)))


def laads_request(url: str, token: str, *, stream: bool = False):
    try:
        import requests  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before LAADS retrieval.") from error
    response = requests.get(
        url,
        headers={"Authorization": f"Bearer {token}", "User-Agent": "stargazing-index-data-ingest/1.0"},
        timeout=(30, 180),
        stream=stream,
    )
    response.raise_for_status()
    return response


def cmr_granule_entry(payload: dict, product: str, year: int, tile: str, collection_version: str) -> tuple[str, str]:
    """Return the reviewed producer filename and Earthdata Cloud URL from CMR JSON."""
    version = f"{int(collection_version):03d}"
    expected = re.compile(rf"^{re.escape(product)}\.A{year}001\.{re.escape(tile)}\.{version}\.\d+\.h5$")
    matches: list[tuple[str, str]] = []
    for entry in payload.get("feed", {}).get("entry", []):
        name = str(entry.get("producer_granule_id", ""))
        if not expected.fullmatch(name):
            continue
        urls = [
            str(link.get("href", ""))
            for link in entry.get("links", [])
            if str(link.get("href", "")).startswith(f"https://{EARTHDATA_CLOUD_HOST}/")
        ]
        if urls:
            matches.append((name, sorted(urls)[0]))
    if not matches:
        raise RuntimeError(f"CMR returned no Earthdata Cloud granule for {product} {year} {tile} collection {version}")
    return sorted(matches)[-1]


def retrieve_via_cmr(
    *,
    site_slug: str,
    config: dict,
    tiles: set[str],
    candidate_years: list[int],
    target: Path,
) -> dict[int, list[Path]]:
    """Discover through public CMR metadata and download from Earthdata Cloud.

    This path does not need the URS login host. The EDL token is presented to
    Earthdata Cloud, which returns a method-specific signed download URL.
    """
    token = os.environ.get("EARTHDATA_TOKEN")
    if not token:
        raise SystemExit("EARTHDATA_TOKEN is required for a Black Marble cache miss.")
    try:
        import requests  # type: ignore
    except ImportError as error:
        raise SystemExit("Install requirements-data.txt before CMR retrieval.") from error

    selected_by_year: dict[int, list[Path]] = {}
    for year in candidate_years:
        discovered: list[tuple[str, str]] = []
        for tile in sorted(tiles):
            pattern = f"{config['product']}.A{year}001.{tile}.{int(config['collectionVersion']):03d}.*"

            def discover() -> tuple[str, str]:
                response = requests.get(
                    CMR_GRANULE_SEARCH,
                    params={
                        "short_name": config["product"],
                        "version": config["collectionVersion"],
                        "producer_granule_id": pattern,
                        "options[producer_granule_id][pattern]": "true",
                        "page_size": "10",
                    },
                    headers={"Accept": "application/json", "User-Agent": "stargazing-index-data-ingest/1.0"},
                    timeout=(30, 180),
                )
                response.raise_for_status()
                return cmr_granule_entry(response.json(), config["product"], year, tile, config["collectionVersion"])

            discovered.append(retry_network(f"CMR search for {year} {tile}", discover))

        year_dir = target / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        downloaded: list[Path] = []
        for name, url in discovered:
            destination = year_dir / name

            def download() -> Path:
                temporary = destination.with_suffix(f"{destination.suffix}.part")
                temporary.unlink(missing_ok=True)
                with requests.get(
                    url,
                    headers={"Authorization": f"Bearer {token}", "User-Agent": "stargazing-index-data-ingest/1.0"},
                    timeout=(30, 300),
                    stream=True,
                    allow_redirects=True,
                ) as response:
                    response.raise_for_status()
                    chunks = response.iter_content(chunk_size=1024 * 1024)
                    first = next(chunks, b"")
                    if not first.startswith(HDF5_SIGNATURE):
                        content_type = response.headers.get("content-type", "unknown")
                        raise RuntimeError(
                            f"Earthdata Cloud did not return HDF5 for {name} "
                            f"(content-type {content_type}, final URL {response.url}). "
                            "Refresh the EDL token and confirm the LAADS application is authorized."
                        )
                    with temporary.open("wb") as handle:
                        handle.write(first)
                        for chunk in chunks:
                            if chunk:
                                handle.write(chunk)
                temporary.replace(destination)
                return destination

            downloaded.append(retry_network(f"Earthdata Cloud download for {site_slug} {year} {name}", download))
        selected_by_year[year] = downloaded
        if len(selected_by_year) == config["baselineYearCount"]:
            break
    return selected_by_year


def retrieve_via_laads(
    *,
    site_slug: str,
    config: dict,
    tiles: set[str],
    candidate_years: list[int],
    target: Path,
) -> dict[int, list[Path]]:
    """Use the official LAADS archive when the Earthdata login host is unreachable."""
    token = os.environ.get("EARTHDATA_TOKEN")
    if not token:
        raise SystemExit("EARTHDATA_TOKEN is required for a Black Marble cache miss.")

    selected_by_year: dict[int, list[Path]] = {}
    for year in candidate_years:
        directory_url = f"{LAADS_ARCHIVE_ROOT}/{config['product']}/{year}/001/"
        index_html = retry_network(
            f"LAADS archive listing for {year}",
            lambda: laads_request(directory_url, token).text,
        )
        names: list[str] = []
        for tile in sorted(tiles):
            matches = laads_granule_names(index_html, config["product"], year, tile, config["collectionVersion"])
            if not matches:
                names = []
                break
            names.append(matches[-1])
        if not names:
            continue

        year_dir = target / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        downloaded: list[Path] = []
        for name in names:
            destination = year_dir / name

            def download() -> Path:
                temporary = destination.with_suffix(f"{destination.suffix}.part")
                temporary.unlink(missing_ok=True)
                with laads_request(f"{directory_url}{name}", token, stream=True) as response, temporary.open("wb") as handle:
                    for chunk in response.iter_content(chunk_size=1024 * 1024):
                        if chunk:
                            handle.write(chunk)
                if temporary.stat().st_size == 0:
                    raise RuntimeError(f"LAADS returned an empty file for {name}")
                temporary.replace(destination)
                return destination

            downloaded.append(retry_network(f"LAADS download for {site_slug} {year} {name}", download))
        selected_by_year[year] = downloaded
        if len(selected_by_year) == config["baselineYearCount"]:
            break
    return selected_by_year


def retrieve(site_slug: str, target_kind: str = "site") -> None:
    config = load_json(ROOT / "data-config" / "sources" / "black-marble.json")
    site = resolve_target(ROOT, site_slug, target_kind)
    darkness_config = load_json(ROOT / "data-config" / "scoring" / "darkness.json")
    calibrated_years = darkness_config.get("blackMarbleYears", []) if darkness_config.get("status") == "calibrated" else []

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
    if target_kind == "site" and calibrated_years:
        candidate_years = sorted((int(year) for year in calibrated_years), reverse=True)
    else:
        first_candidate_year = datetime.now(timezone.utc).year - 1
        candidate_years = list(range(first_candidate_year, config["availableFromYear"] - 1, -1))

    selected_by_year: dict[int, list] = {}
    provider_key = os.environ.get("BLACK_MARBLE_PROVIDER")
    provider = {"laads": "LAADS archive", "cmr": "CMR and Earthdata Cloud"}.get(
        provider_key, "Earthdata Search"
    )
    earthaccess = None
    try:
        if provider == "LAADS archive":
            selected_by_year = retrieve_via_laads(
                site_slug=site_slug,
                config=config,
                tiles=tiles,
                candidate_years=candidate_years,
                target=target,
            )
        elif provider == "CMR and Earthdata Cloud":
            selected_by_year = retrieve_via_cmr(
                site_slug=site_slug,
                config=config,
                tiles=tiles,
                candidate_years=candidate_years,
                target=target,
            )
        else:
            earthaccess = earthdata_client()
            for year in candidate_years:
                by_tile: dict[str, object] = {}
                for tile in sorted(tiles):
                    # CMR records expose the human-readable producer filename through
                    # the granule-name query even when GranuleUR is an opaque LAADS id.
                    # VNP46A4 is annual, but its ending timestamp is in the following
                    # year, so the temporal window intentionally ends on January 1 of
                    # the next year.
                    results = retry_nonempty_results(
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
    except Exception as error:
        provider = "CMR and Earthdata Cloud"
        selected_by_year = retrieve_via_cmr(
            site_slug=site_slug,
            config=config,
            tiles=tiles,
            candidate_years=candidate_years,
            target=target,
        )
        if earthaccess is not None:
            print(
                f"Earthdata Search was unavailable ({error.__class__.__name__}); "
                "used public CMR metadata and Earthdata Cloud with the same EDL token.",
                file=sys.stderr,
            )

    if len(selected_by_year) != config["baselineYearCount"]:
        raise SystemExit(
            f"Found only {len(selected_by_year)} complete VNP46A4 year(s) for {site_slug}; "
            f"required {config['baselineYearCount']}."
        )
    if target_kind == "site" and calibrated_years and sorted(selected_by_year) != sorted(calibrated_years):
        raise SystemExit(
            f"Black Marble years for {site_slug} do not match the calibrated baseline: "
            f"found {sorted(selected_by_year)}, required {sorted(calibrated_years)}."
        )

    target.mkdir(parents=True, exist_ok=True)
    downloaded: list[str] = []
    if provider == "Earthdata Search":
        if earthaccess is None:
            raise RuntimeError("Earthdata client was not initialized")
        for year, results in sorted(selected_by_year.items()):
            year_dir = target / str(year)
            year_dir.mkdir(parents=True, exist_ok=True)
            paths = retry_network(
                f"Earthdata download for {site_slug} {year}",
                lambda: earthaccess.download(results, str(year_dir)),
            )
            for path in paths:
                downloaded.append(str(Path(path).resolve().relative_to(target.resolve())))
    else:
        for paths in selected_by_year.values():
            for path in paths:
                downloaded.append(str(path.resolve().relative_to(target.resolve())))

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
        "retrievalProvider": provider,
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
