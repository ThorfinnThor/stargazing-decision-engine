#!/usr/bin/env python3
"""Build the reviewed city list for the light-pollution comparison.

Cities come from the GeoNames cities15000 dump and their English and German display
names from the GeoNames alternate-names dump (both CC BY 4.0), with the GeoNames
name as fallback. The output is committed as
configuration and is the input for the Black Marble city fetch.
"""

from __future__ import annotations

import argparse
import csv
from datetime import datetime, timezone
import io
import json
import math
from pathlib import Path
import re
import unicodedata
import urllib.request
import zipfile


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "data-config" / "astronomy" / "comparison-cities.json"
GEONAMES_URL = "https://download.geonames.org/export/dump/cities15000.zip"
ALTERNATE_NAMES_URL = "https://download.geonames.org/export/dump/alternateNamesV2.zip"
USER_AGENT = "city-list-fetch/1.0 (static data pipeline)"
GLOBAL_MIN_POPULATION = 500_000
DACH_MIN_POPULATION = 50_000
DACH = {"DE", "AT", "CH"}
# Sections of a populated place (city districts) are not separate cities.
EXCLUDED_FEATURE_CODES = {"PPLX", "PPLH", "PPLQ", "PPLW"}
MAX_WINDOW_KM = 75
EARTH_RADIUS_KM = 6371.0088

# Phase 1 reference-city ids are part of shared links (?city=…) and must keep resolving.
LEGACY_IDS = {
    "berlin": (52.52, 13.405), "hamburg": (53.551, 9.994), "munich": (48.137, 11.575), "cologne": (50.938, 6.96),
    "frankfurt": (50.11, 8.682), "stuttgart": (48.776, 9.183), "leipzig": (51.34, 12.375), "vienna": (48.208, 16.373),
    "zurich": (47.377, 8.541), "london": (51.507, -0.128), "manchester": (53.481, -2.243), "dublin": (53.35, -6.26),
    "amsterdam": (52.37, 4.9), "paris": (48.857, 2.352), "madrid": (40.417, -3.704), "rome": (41.903, 12.496),
    "new-york": (40.713, -74.006), "boston": (42.36, -71.059), "washington": (38.907, -77.037), "toronto": (43.653, -79.383),
    "chicago": (41.878, -87.63), "denver": (39.739, -104.99), "phoenix": (33.448, -112.074), "los-angeles": (34.052, -118.244),
    "san-francisco": (37.775, -122.419), "seattle": (47.606, -122.332), "vancouver": (49.283, -123.121), "dubai": (25.205, 55.271),
    "tokyo": (35.676, 139.65), "cape-town": (-33.925, 18.424), "sydney": (-33.869, 151.209), "melbourne": (-37.814, 144.963),
    "auckland": (-36.848, 174.763),
}


def distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def crosses_antimeridian(lat: float, lon: float) -> bool:
    angular = MAX_WINDOW_KM / EARTH_RADIUS_KM
    delta = math.degrees(math.asin(min(1.0, math.sin(angular) / math.cos(math.radians(lat)))))
    return lon - delta < -180 or lon + delta > 180


def slugify(value: str) -> str:
    ascii_value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_value.lower()).strip("-")


def http_get(url: str, *, accept: str | None = None, data: bytes | None = None) -> bytes:
    headers = {"User-Agent": USER_AGENT}
    if accept:
        headers["Accept"] = accept
    if data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    request = urllib.request.Request(url, headers=headers, data=data)
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def load_geonames(cache: Path | None):
    raw = cache.read_bytes() if cache and cache.exists() else http_get(GEONAMES_URL)
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        text = archive.read("cities15000.txt").decode("utf-8")
    return list(csv.reader(io.StringIO(text), delimiter="\t", quoting=csv.QUOTE_NONE))


def alternate_names(geoname_ids: set[str], archive_path: Path | None) -> dict[str, dict[str, list[tuple[int, str]]]]:
    """English and German names from GeoNames alternateNamesV2, ranked per city and language."""
    raw = archive_path.read_bytes() if archive_path and archive_path.exists() else http_get(ALTERNATE_NAMES_URL)
    names: dict[str, dict[str, list[tuple[int, str]]]] = {}
    with zipfile.ZipFile(io.BytesIO(raw)) as archive, archive.open("alternateNamesV2.txt") as handle:
        for line in io.TextIOWrapper(handle, encoding="utf-8"):
            # alternateNameId, geonameid, isolanguage, name, isPreferredName, isShortName, isColloquial, isHistoric, from, to
            fields = line.rstrip("\n").split("\t")
            if len(fields) < 8 or fields[2] not in ("en", "de") or fields[1] not in geoname_ids:
                continue
            if fields[6] == "1" or fields[7] == "1" or (len(fields) > 9 and fields[9]):
                continue
            rank = 0 if fields[4] == "1" else 1 if fields[5] == "1" else 2
            names.setdefault(fields[1], {}).setdefault(fields[2], []).append((rank, fields[3]))
    return names


def choose_names(names: dict[str, list[tuple[int, str]]], geoname: str) -> dict[str, str]:
    """Preferred name first, then the short name, then the first listed; GeoNames' own name otherwise."""
    def pick(language: str):
        candidates = names.get(language, [])
        return min(candidates, key=lambda item: item[0])[1] if candidates else None

    en = pick("en") or geoname
    return {"en": en, "de": pick("de") or en}


def build(cache: Path | None, alternate_names_zip: Path | None = None) -> dict:
    rows = load_geonames(cache)
    candidates = []
    for row in rows:
        population = int(row[14] or 0)
        country = row[8]
        threshold = DACH_MIN_POPULATION if country in DACH else GLOBAL_MIN_POPULATION
        if population < threshold or row[7] in EXCLUDED_FEATURE_CODES:
            continue
        lat, lon = float(row[4]), float(row[5])
        if crosses_antimeridian(lat, lon):
            continue
        candidates.append({"geonameId": row[0], "geoname": row[1], "country": country,
                           "lat": lat, "lon": lon, "timeZone": row[17], "population": population})

    # Make sure every legacy reference city is present, even below the population floor.
    by_id = {item["geonameId"]: item for item in candidates}
    legacy: dict[str, str] = {}
    for legacy_id, (lat, lon) in LEGACY_IDS.items():
        nearby = [row for row in rows if row[7] not in EXCLUDED_FEATURE_CODES and distance_km(lat, lon, float(row[4]), float(row[5])) < 15]
        if not nearby:
            raise SystemExit(f"No GeoNames city near legacy reference city {legacy_id}")
        best = max(nearby, key=lambda row: int(row[14] or 0))
        legacy[best[0]] = legacy_id
        if best[0] not in by_id:
            by_id[best[0]] = {"geonameId": best[0], "geoname": best[1], "country": best[8], "lat": float(best[4]),
                              "lon": float(best[5]), "timeZone": best[17], "population": int(best[14] or 0)}

    labels = alternate_names(set(by_id), alternate_names_zip)
    cities = []
    for item in by_id.values():
        cities.append({**item, "name": choose_names(labels.get(item["geonameId"], {}), item["geoname"])})

    # Stable ids: legacy id, else English slug, with the country code added where names collide.
    slug_counts: dict[str, int] = {}
    for city in cities:
        slug_counts[slugify(city["name"]["en"])] = slug_counts.get(slugify(city["name"]["en"]), 0) + 1
    used: set[str] = set(legacy.values())
    output = []
    for city in sorted(cities, key=lambda item: (-item["population"], item["geonameId"])):
        slug = slugify(city["name"]["en"]) or city["geonameId"]
        city_id = legacy.get(city["geonameId"])
        if city_id is None:
            city_id = slug if slug_counts[slug] == 1 and slug not in used else f"{slug}-{city['country'].lower()}"
            if city_id in used:
                city_id = f"{city_id}-{city['geonameId']}"
        used.add(city_id)
        output.append({
            "id": city_id,
            "geonameId": int(city["geonameId"]),
            "name": city["name"],
            "country": city["country"],
            "lat": round(city["lat"], 4),
            "lon": round(city["lon"], 4),
            "timeZone": city["timeZone"],
            "population": city["population"],
        })

    return {
        "version": 1,
        "source": {
            "cities": {"name": "GeoNames cities15000", "url": GEONAMES_URL, "license": "CC BY 4.0"},
            "labels": {"name": "GeoNames alternate names", "url": ALTERNATE_NAMES_URL, "license": "CC BY 4.0"},
            "criteria": {
                "globalMinPopulation": GLOBAL_MIN_POPULATION,
                "dachMinPopulation": DACH_MIN_POPULATION,
                "excludedFeatureCodes": sorted(EXCLUDED_FEATURE_CODES),
                "excludesAntimeridianWindowsKm": MAX_WINDOW_KM,
                "legacyReferenceCities": len(LEGACY_IDS),
            },
            "retrievedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        },
        "cities": output,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--geonames-zip", type=Path, help="Use a cached cities15000.zip instead of downloading it")
    parser.add_argument("--alternate-names-zip", type=Path, help="Use a cached alternateNamesV2.zip (about 200 MB) instead of downloading it")
    args = parser.parse_args()
    result = build(args.geonames_zip, args.alternate_names_zip)
    with OUTPUT.open("w", encoding="utf-8") as handle:
        json.dump(result, handle, ensure_ascii=False, indent=1)
        handle.write("\n")
    print(f"Wrote {len(result['cities'])} comparison cities to {OUTPUT.relative_to(ROOT)}.")
