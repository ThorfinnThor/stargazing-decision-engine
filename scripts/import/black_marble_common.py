"""Pure geometry and filename helpers for the VNP46A4 importer."""

from __future__ import annotations

import math
import re


EARTH_RADIUS_KM = 6371.0088
GRANULE_PATTERN = re.compile(r"VNP46A4\.A(?P<year>\d{4})\d{3}\.(?P<tile>h\d{2}v\d{2})\.")


def site_bounding_box(lat: float, lon: float, radius_km: float) -> tuple[float, float, float, float]:
    """Return west, south, east, north for a geodesic-radius search window."""
    angular = radius_km / EARTH_RADIUS_KM
    latitude = math.radians(lat)
    south = max(-90.0, math.degrees(latitude - angular))
    north = min(90.0, math.degrees(latitude + angular))
    if south <= -90.0 or north >= 90.0:
        longitude_delta = 180.0
    else:
        longitude_delta = math.degrees(math.asin(math.sin(angular) / math.cos(latitude)))
    west = lon - longitude_delta
    east = lon + longitude_delta
    if west < -180.0 or east > 180.0:
        raise ValueError("Black Marble windows crossing the antimeridian require split CMR queries")
    return west, south, east, north


def required_tiles(bounds: tuple[float, float, float, float]) -> list[str]:
    """Resolve 10-degree geographic VNP46 tiles intersected by a non-wrapping box."""
    west, south, east, north = bounds
    epsilon = 1e-10
    h_start = max(0, min(35, math.floor((west + 180.0) / 10.0)))
    h_end = max(0, min(35, math.floor((east + 180.0 - epsilon) / 10.0)))
    v_start = max(0, min(17, math.floor((90.0 - north) / 10.0)))
    v_end = max(0, min(17, math.floor((90.0 - south - epsilon) / 10.0)))
    return [f"h{horizontal:02d}v{vertical:02d}" for vertical in range(v_start, v_end + 1) for horizontal in range(h_start, h_end + 1)]


def parse_granule_name(name: str) -> tuple[int, str]:
    match = GRANULE_PATTERN.search(name)
    if not match:
        raise ValueError(f"Unrecognized VNP46A4 granule name: {name}")
    return int(match.group("year")), match.group("tile")
