# Short-trip methodology

Short-trip files are generated offline at
`public/data/stargazing/short-trips/{originSlug}.json` and rendered as static
localized pages. The engine does not call a routing service and never presents
great-circle distance as driving time.

For each active origin, destinations are eligible only when they have an active
observation site whose curated `publicAccess` is not `no`. The destination's
best site is the site with the highest annual mean `stargazingTrip` score, with
priority and stable ID tie-breakers. The ranking score uses the best month at
that site:

```text
shortTripScore = 75% stargazingTripScore + 25% distanceUtility
```

Distance is Haversine great-circle distance to that best site. Distance bands
and utilities are versioned in `data-config/trips/short-trip-scoring.json`.
The output includes all monthly scores, the top three months, stay-area
metadata where curated, and `campingAvailable: null` until a source-backed
campsite dataset exists. Low-confidence seed scores remain visible for
pipeline testing but are not a claim about real weather or availability.
