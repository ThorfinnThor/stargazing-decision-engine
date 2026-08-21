"""Pure helpers shared by the Copernicus DEM downloader and tests."""

from __future__ import annotations

import math


def tile_for_point(lat: float, lon: float) -> str:
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise ValueError("DEM coordinate outside WGS84 bounds")
    # Longitude 180 belongs to the final western tile; latitude -90 to S90.
    tile_lat = min(89, math.floor(lat)) if lat < 90 else 89
    tile_lon = min(179, math.floor(lon)) if lon < 180 else 179
    lat_prefix = "N" if tile_lat >= 0 else "S"
    lon_prefix = "E" if tile_lon >= 0 else "W"
    return f"{lat_prefix}{abs(tile_lat):02d}_00_{lon_prefix}{abs(tile_lon):03d}_00"


def tile_key(template: str, tile: str, prefix: str = "") -> str:
    rendered = template.replace("{tile}", tile)
    return f"{prefix.rstrip('/')}/{rendered.lstrip('/')}" if prefix else rendered


def valid_elevation(value, nodata=None, minimum=-500.0, maximum=9000.0):
    if value is None:
        return None
    numeric = float(value)
    if not math.isfinite(numeric):
        return None
    if nodata is not None and math.isclose(numeric, float(nodata), rel_tol=0, abs_tol=1e-9):
        return None
    if numeric < minimum or numeric > maximum:
        return None
    return numeric


def median(values):
    if not values:
        return None
    ordered = sorted(float(value) for value in values)
    middle = len(ordered) // 2
    if len(ordered) % 2:
        return ordered[middle]
    return (ordered[middle - 1] + ordered[middle]) / 2
