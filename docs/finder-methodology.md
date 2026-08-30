# Finder methodology

The destination finder is a static, client-side comparison tool. It reads the
versioned build artifact at
`public/data/stargazing/search/destination-index.json`; it does not call a
runtime API, database, weather service, or geocoder.

## Published inputs

The index contains all published destinations, the selected validated
observation site, its reviewed access status, and twelve monthly records from
the same real score and ERA5 snapshots used by the destination pages. The
export and public-data validators fail when a destination or month is missing,
duplicated, or outside the published schema.

The interface deliberately exposes only five primary inputs:

1. month;
2. region;
3. preferred mean night temperature;
4. preference focus; and
5. reviewed night-access level.

Camping is not offered as a filter because the current catalog has no complete,
reviewed camping-availability dataset.

## Eligibility gates

Sites with `publicAccess: no` or `publicAccess: unknown` are never recommended.
The default reviewed-access option accepts unrestricted public access and
source-reviewed conditional or booking-only access. The stricter option accepts
only unrestricted public access. Months with low score confidence are excluded.
Months whose published Stargazing Trip score is zero are also excluded, because
they contain no usable astronomical observing window and cannot be rescued by a
single component priority.

The interface keeps low-confidence months out of recommendations but reports
how many otherwise relevant destinations were withheld for that reason. Missing
data and a genuine zero observing window remain separate internal exclusion
states, so uncertainty is not presented as an ordinary filter mismatch.

## Match calculation

The public `stargazingTrip` value remains unchanged. The finder calculates a
separate preference score for ordering results:

```text
preference = 0.65 * selected-priority fit
           + 0.35 * temperature fit

match = 0.60 * published Stargazing Trip score
      + 0.25 * preference
      + 0.15 * source confidence
```

For balanced priority, the priority fit is the published Stargazing Trip score.
The other priorities use the published darkness, trip-comfort, or clear-sky
component. Temperature fit declines linearly with distance from the selected
reference mean: cold 0 °C, cool 7 °C, mild 14 °C, and warm 21 °C. Scores are
bounded by their source contracts and the final match is rounded to one decimal.

When no month is selected, each destination contributes its highest-scoring
eligible month. Deterministic tie-breakers use Stargazing Trip score, month, and
destination name.

## Interpretation and indexing

The finder compares historical climatology, calibrated darkness, astronomy,
access, and source confidence. It is not a weather forecast and does not claim
that a future night will be clear. Filter state is stored in the URL query
string with `replaceState`, so one Finder visit remains one browser-history
entry while still being shareable and restorable. Finder and query-state pages
use `noindex, follow`; static destination and editorial pages remain the
canonical searchable surfaces.
