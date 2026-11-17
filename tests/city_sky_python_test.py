from pathlib import Path
import math
import sys
import tempfile
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "import"))

from build_comparison_cities import choose_names, crosses_antimeridian, slugify  # noqa: E402

try:
    import h5py  # type: ignore
    import numpy as np  # type: ignore
except ImportError:  # CI's static gate has no data stack; the data workflow does.
    h5py = None
    np = None

RINGS = [
    {"id": "0to2", "minKm": 0, "maxKm": 2, "upperInclusive": False, "statistic": "median", "alanWeight": 0.45},
    {"id": "2to10", "minKm": 2, "maxKm": 10, "upperInclusive": False, "statistic": "mean", "alanWeight": 0.30},
    {"id": "10to30", "minKm": 10, "maxKm": 30, "upperInclusive": False, "statistic": "mean", "alanWeight": 0.15},
    {"id": "30to75", "minKm": 30, "maxKm": 75, "upperInclusive": True, "statistic": "mean", "alanWeight": 0.10},
]
CONFIG = {"layer": {"radiance": "rad", "quality": "qa", "acceptedQualityValues": [0]}, "rings": RINGS}
STEP = 15 / 3600


class CityListTests(unittest.TestCase):
    def test_preferred_then_short_name_then_geonames(self):
        names = {"en": [(2, "Koeln"), (0, "Cologne")], "de": [(1, "Köln")]}
        self.assertEqual(choose_names(names, "Köln"), {"en": "Cologne", "de": "Köln"})
        self.assertEqual(choose_names({"de": [(2, "Genf")]}, "Geneva"), {"en": "Geneva", "de": "Genf"})
        self.assertEqual(choose_names({}, "Bielefeld"), {"en": "Bielefeld", "de": "Bielefeld"})

    def test_slug_and_antimeridian(self):
        self.assertEqual(slugify("São Paulo"), "sao-paulo")
        self.assertEqual(slugify("Washington, D.C."), "washington-d-c")
        self.assertTrue(crosses_antimeridian(-16.5, 179.6))
        self.assertFalse(crosses_antimeridian(-36.85, 174.76))


@unittest.skipIf(np is None, "numpy and h5py are only installed in the data workflow")
class CityTileTests(unittest.TestCase):
    def write_tile(self, directory: Path, name: str, lat_range, lon_range, value_for):
        latitudes = np.arange(lat_range[1] - STEP / 2, lat_range[0], -STEP)
        longitudes = np.arange(lon_range[0] + STEP / 2, lon_range[1], STEP)
        lat_grid, lon_grid = np.meshgrid(latitudes, longitudes, indexing="ij")
        raw = value_for(lat_grid, lon_grid).astype("uint16")
        path = directory / name
        with h5py.File(path, "w") as handle:
            group = handle.create_group("HDFEOS/GRIDS/VIIRS_Grid_DNB_2d/Data Fields")
            group["lat"] = latitudes
            group["lon"] = longitudes
            radiance = group.create_dataset("rad", data=raw)
            radiance.attrs["scale_factor"] = 0.1
            radiance.attrs["add_offset"] = 0.0
            radiance.attrs["_FillValue"] = 65535
            quality = np.zeros_like(raw, dtype="uint8")
            quality[raw == 65535] = 255
            group.create_dataset("qa", data=quality)
        return path

    @staticmethod
    def distance(lat, lon, city):
        lat0, lon0 = math.radians(city["lat"]), math.radians(city["lon"])
        a = np.sin((np.radians(lat) - lat0) / 2) ** 2 + math.cos(lat0) * np.cos(np.radians(lat)) * np.sin((np.radians(lon) - lon0) / 2) ** 2
        return 2 * 6371.0088 * np.arcsin(np.sqrt(np.minimum(1.0, a)))

    def test_rings_match_the_site_pipeline_definition(self):
        from fetch_city_sky_brightness import RingAccumulator, process_tile

        city = {"id": "test", "lat": 45.0, "lon": 15.0}

        def value_for(lat, lon):
            km = self.distance(lat, lon, city)
            values = np.where(km < 2, 500, np.where(km < 10, 200, np.where(km < 30, 50, 10)))
            # A fill pixel inside 2 km must not count as valid.
            values[np.unravel_index(np.argmin(km), km.shape)] = 65535
            return values

        with tempfile.TemporaryDirectory() as directory:
            path = self.write_tile(Path(directory), "tile.h5", (43.5, 46.5), (13.0, 17.0), value_for)
            accumulators = {"test": RingAccumulator(RINGS)}
            process_tile(path, [city], accumulators, CONFIG, 75)
        rings = accumulators["test"].summary()
        self.assertAlmostEqual(rings["0to2"]["radiance"], 50.0, places=4)
        self.assertAlmostEqual(rings["2to10"]["radiance"], 20.0, places=4)
        self.assertAlmostEqual(rings["10to30"]["radiance"], 5.0, places=4)
        self.assertAlmostEqual(rings["30to75"]["radiance"], 1.0, places=4)
        self.assertLess(rings["0to2"]["coverage"], 1)
        self.assertEqual(rings["30to75"]["coverage"], 1)

    def test_city_on_a_tile_edge_accumulates_both_tiles(self):
        from fetch_city_sky_brightness import RingAccumulator, process_tile

        city = {"id": "edge", "lat": 45.0, "lon": 20.0}
        with tempfile.TemporaryDirectory() as directory:
            west = self.write_tile(Path(directory), "west.h5", (43.5, 46.5), (18.0, 20.0), lambda lat, lon: np.full(lat.shape, 100))
            east = self.write_tile(Path(directory), "east.h5", (43.5, 46.5), (20.0, 22.0), lambda lat, lon: np.full(lat.shape, 300))
            accumulators = {"edge": RingAccumulator(RINGS)}
            process_tile(west, [city], accumulators, CONFIG, 75)
            process_tile(east, [city], accumulators, CONFIG, 75)
        rings = accumulators["edge"].summary()
        self.assertAlmostEqual(rings["2to10"]["radiance"], 20.0, delta=0.2)
        self.assertAlmostEqual(rings["30to75"]["radiance"], 20.0, delta=0.2)
        self.assertEqual(rings["30to75"]["coverage"], 1)


if __name__ == "__main__":
    unittest.main()
