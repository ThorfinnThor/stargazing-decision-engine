from pathlib import Path
import sys
import unittest


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "import"))

from dem_common import median, tile_for_point, tile_key, valid_elevation  # noqa: E402


class DemGeometryTests(unittest.TestCase):
    def test_positive_and_negative_tile_names(self):
        self.assertEqual(tile_for_point(52.72, 12.28), "N52_00_E012_00")
        self.assertEqual(tile_for_point(-52.72, -12.28), "S53_00_W013_00")

    def test_coordinate_edges(self):
        self.assertEqual(tile_for_point(0, 0), "N00_00_E000_00")
        self.assertEqual(tile_for_point(-90, 180), "S90_00_E179_00")

    def test_tile_key_and_nodata(self):
        self.assertEqual(
            tile_key("Copernicus_DSM_COG_10_{tile}_DEM/file.tif", "N52_00_E012_00", "auxdata/CopDEM"),
            "auxdata/CopDEM/Copernicus_DSM_COG_10_N52_00_E012_00_DEM/file.tif",
        )
        self.assertEqual(valid_elevation(12.5, -32767), 12.5)
        self.assertIsNone(valid_elevation(-32767, -32767))
        self.assertIsNone(valid_elevation(float("nan"), None))
        self.assertIsNone(valid_elevation(10000, None))

    def test_public_elevation_object_key_is_not_an_auxiliary_raster(self):
        key = tile_key(
            "Copernicus_DSM_COG_10_{tile}_DEM/Copernicus_DSM_COG_10_{tile}_DEM.tif",
            "N28_00_W018_00",
        )
        self.assertEqual(
            key,
            "Copernicus_DSM_COG_10_N28_00_W018_00_DEM/Copernicus_DSM_COG_10_N28_00_W018_00_DEM.tif",
        )
        self.assertNotIn("AUXFILES", key)

    def test_true_median_for_even_and_odd_samples(self):
        self.assertEqual(median([1, 9, 3]), 3)
        self.assertEqual(median([1, 9, 3, 5]), 4)
        self.assertIsNone(median([]))


if __name__ == "__main__":
    unittest.main()
