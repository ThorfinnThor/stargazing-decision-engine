# Milky Way opportunity methodology

Milky Way opportunity is generated offline and published only as static JSON
calendar fields. The browser never calls an astronomy or weather API.

The engine evaluates the Galactic Center reference position in the J2000 frame
using Astronomy Engine's explicit `Rotation_EQJ_HOR` vector conversion. Fixed
J2000 angles are not passed directly to `Horizon`, which expects equator-of-date
angles. The geometric altitude has no atmospheric-refraction correction. Each ten-minute
midpoint interval from the reviewed calendar sampler contributes only when it
is both astronomically dark and Moonless under the geometric Moon-altitude
mask. This produces two transparent durations:

- `milkyWayUsefulHours`: Moonless dark time with the Galactic Center at or above
  the configured useful altitude (20° in the current candidate configuration).
- `milkyWayStrongHours`: the subset at or above the strong altitude (30°).

The maximum Galactic Center altitude is reported across astronomical-dark
intervals, while the opportunity score combines a monotonic utility of useful
Moonless duration (60%) with a monotonic utility of maximum altitude (40%). It
is a visibility opportunity indicator, not a cloud forecast, sky-quality
measurement, or Bortle classification. Values are rounded only after interval
sums and score calculation.

If the Galactic Center remains below the horizon, the engine reports zero
useful/strong overlap and does not make the stronger claim that the Milky Way
itself is invisible. High-latitude cases are therefore explicit edge cases in
the test suite.

The coordinate is the Sgr A*/Galactic Center J2000 reference, RA
17h45m40.03845s and Dec -29°00′28.0701″, from
[NASA NTRS 20130012905](https://ntrs.nasa.gov/api/citations/20130012905/downloads/20130012905.pdf).
The required Sol review approved this target and verified the coordinate-frame,
Moonless-overlap, and high-latitude semantics. The production builder requires
the committed reference status to remain `approved`.

Validate the configuration with:

```bash
pnpm data:milky-way:validate
```
