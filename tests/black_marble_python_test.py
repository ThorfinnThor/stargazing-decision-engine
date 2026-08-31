from pathlib import Path
import os
import sys
import unittest
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts" / "import"))

from black_marble_common import parse_granule_name, required_tiles, site_bounding_box  # noqa: E402
from extract_black_marble import decode_radiance  # noqa: E402
import fetch_black_marble  # noqa: E402
from fetch_black_marble import earthdata_client, retry_network, retry_nonempty_results  # noqa: E402


class BlackMarbleGeometryTests(unittest.TestCase):
    def test_equatorial_window_crosses_four_tiles(self):
        bounds = site_bounding_box(0, 0, 75)
        self.assertEqual(required_tiles(bounds), ["h17v08", "h18v08", "h17v09", "h18v09"])

    def test_antimeridian_window_fails_explicitly(self):
        with self.assertRaisesRegex(ValueError, "antimeridian"):
            site_bounding_box(0, 179.8, 75)

    def test_collection_two_granule_name(self):
        self.assertEqual(
            parse_granule_name("VNP46A4.A2025001.h18v04.002.2026123456789.h5"),
            (2025, "h18v04"),
        )

    def test_radiance_metadata_is_applied_before_validation(self):
        self.assertAlmostEqual(decode_radiance(123, 65535, 0.1, 0), 12.3)
        self.assertIsNone(decode_radiance(65535, 65535, 0.1, 0))
        self.assertIsNone(decode_radiance(-1, -999.9, 1, 0))

    def test_network_retry_uses_bounded_exponential_backoff(self):
        calls = []
        delays = []

        def operation():
            calls.append(1)
            if len(calls) < 3:
                raise ConnectionError("temporary outage")
            return "connected"

        self.assertEqual(
            retry_network("test", operation, attempts=4, initial_delay_seconds=2, sleeper=delays.append),
            "connected",
        )
        self.assertEqual(len(calls), 3)
        self.assertEqual(delays, [2, 4])

    def test_network_retry_reraises_after_the_final_attempt(self):
        with self.assertRaisesRegex(ConnectionError, "still unavailable"):
            retry_network(
                "test",
                lambda: (_ for _ in ()).throw(ConnectionError("still unavailable")),
                attempts=2,
                initial_delay_seconds=0,
                sleeper=lambda _delay: None,
            )

    def test_empty_search_results_are_retried(self):
        calls = []
        delays = []

        def operation():
            calls.append(1)
            return [] if len(calls) < 3 else ["granule"]

        self.assertEqual(
            retry_nonempty_results("search", operation, attempts=4, initial_delay_seconds=1, sleeper=delays.append),
            ["granule"],
        )
        self.assertEqual(len(calls), 3)
        self.assertEqual(delays, [1, 2])

    def test_earthdata_login_is_reused_for_a_batch(self):
        class FakeEarthaccess:
            login_calls = 0

            @classmethod
            def login(cls, strategy):
                self.assertEqual(strategy, "environment")
                cls.login_calls += 1

        fetch_black_marble._EARTHACCESS = None
        try:
            with patch.dict(os.environ, {"EARTHDATA_TOKEN": "test-token"}), patch.dict(
                sys.modules, {"earthaccess": FakeEarthaccess}
            ):
                self.assertIs(earthdata_client(), FakeEarthaccess)
                self.assertIs(earthdata_client(), FakeEarthaccess)
            self.assertEqual(FakeEarthaccess.login_calls, 1)
        finally:
            fetch_black_marble._EARTHACCESS = None


if __name__ == "__main__":
    unittest.main()
