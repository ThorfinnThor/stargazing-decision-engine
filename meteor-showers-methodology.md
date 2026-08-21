# Meteor-shower event methodology

Meteor events are curated offline and exported as static JSON under
`public/data/stargazing/events/meteor-showers/{year}/{slug}.json`. Each event
also has a statically generated English and German page. No page request calls a
remote astronomy service, weather API, or database.

The 2027 catalog is based on the [International Meteor Organization 2027 Meteor
Shower Calendar](https://www.imo.net/files/meteor-shower/cal2027.pdf), whose
working list provides the active interval, maximum date/time where available,
equatorial 2000.0 (J2000) radiant coordinates, and contextual reference ZHR. The
calculation transforms that fixed J2000 frame to the local horizon through
Astronomy Engine's EQJ-to-HOR rotation. The source explicitly
notes timing uncertainty for several showers. When it publishes only a maximum
date, the configuration keeps `peakUtc: null`; no artificial hour is inserted.

For each active observation site, the deterministic viewing score is:

```text
50% monthly historical sky-quality climatology
30% Moon conditions on the local peak-date night
20% radiant visibility during that local night
```

The climate component uses the event month’s `skyQuality` score and is clearly
labelled historical climatology. The Moon component is 70% Moonless fraction
of astronomical darkness and 30% inverse representative illumination. The
radiant component samples every ten minutes, counts dark intervals with the
radiant at or above 20°, and combines duration (60%) with maximum dark-time
radiant altitude (40%). All curves and weights are versioned in
`data-config/astronomy/meteor-scoring.json`.

An observing night is identified noon-to-noon in the destination timezone. If
an exact UTC maximum falls before local noon, the event is assigned to the
preceding local calendar date so an early-morning maximum is not evaluated on
the following evening. Date-only maxima use the cited date as the local evening
date. V1 evaluates the complete astronomical-dark interval of that local night;
it does not claim visibility at an exact instant or model a shower-specific
peak-width curve.

This score ranks observing opportunity; it is not a meteor-count forecast and
does not promise the reference ZHR. Seed climate inputs are low confidence and
event pages are marked non-indexable until reviewed real snapshots replace the
synthetic catalog.
