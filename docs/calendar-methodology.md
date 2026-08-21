# Astronomy calendar methodology

The real calendar is generated offline with Astronomy Engine 2.1.19 and written
as static JSON. No remote API is used by the browser, Vercel, or the calendar
builder. Run it with an explicit start month so the output is reproducible:

```bash
pnpm data:calendar:real -- --start 2027-01 --months 36 --generated-at 2026-12-01T00:00:00.000Z
pnpm data:calendar:validate
```

`--destination <slug>` supports an incremental destination build. Test and CI
runs may use `--output-root <path>` and validate it with
`pnpm data:calendar:validate -- --root <path>` before publishing.

Each destination uses its active observation-site coordinates and IANA timezone.
Each local night is named by the evening’s local calendar date and spans local
noon to the following local noon. Internally, all ephemeris calculations use
UTC. The output contains no ten-minute raw series.

Astronomical darkness is the interval where the Sun’s geometric center is at or
below -18°. The lunar mask is deliberately conservative: a dark interval is
moonless only while the Moon’s geometric altitude is at or below 0°. The
calendar score is purely astronomical and contains no historical cloud or
weather data:

```text
70% moonless-dark-hours utility + 30% total-astronomical-dark-hours utility
```

The utility curves and sampling interval are versioned in
`data-config/astronomy/calendar-config.json`. No artificial minimum darkness is
inserted at high latitudes. If no astronomical darkness exists, dusk, dawn, and
maximum-darkness lunar altitude are null and all darkness hours and the calendar
score are zero.

Astronomical dusk, dawn, and total dark duration use Astronomy Engine’s exact
geometric −18° altitude searches. Lunar overlap remains on the documented
ten-minute raster. Displayed Moon rise/set values use Astronomy Engine’s
conventional rise/set search (upper limb and refraction semantics); these are
intentionally distinct from the geometric center-altitude mask used to classify
moonless time.

Moon illumination, phase angle, conventional rise/set events, and geometric
above/below-horizon dark-hour partitions are emitted for display. Milky Way
opportunity is calculated by a separate deterministic layer over the same
ten-minute dark/Moonless intervals. It reports useful and strong overlap
durations, maximum Galactic Center altitude, and a bounded utility score. The
coordinate reference, thresholds, and curves are versioned in
`data-config/astronomy/milky-way.json`; real calendar generation fails closed
unless its reference status is approved.

The public calendar ranks a destination’s active sites by mean calendar darkness,
then mean moonless hours, then stable site ID. It must not be described as a
weather forecast. Every exported night also receives a static darkness rank:
calendar-darkness score descending, optional Milky Way score descending, then
local date ascending as the stable tie-breaker.
