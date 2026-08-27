# Night planner methodology

The destination night planner is a deterministic, client-side calculation for the selected observation site. It uses the existing `astronomy-engine` version and the same observer/refraction conventions as the calendar pipeline.

## Night identity

The planner evaluates local noon-to-local noon for a `nightDateLocal`. For a live view it uses the previous local date when the current instant is inside that evening-to-morning night; otherwise it uses the current local date. If a location has no normal sunset/sunrise events, the fallback is the previous date only between local midnight and 06:00. Fixed previews select the night containing their preview instant.

## Samples and score

The window is sampled every ten minutes. At each interval midpoint the planner evaluates the Sun altitude, Moon altitude, and illuminated Moon fraction. Samples are astronomically dark when the Sun is at or below −18°.

Within darkness, the score is a documented Moon-light heuristic:

```text
moonAltitudeFactor = smoothstep(0°, 45°, moonAltitude)
moonBrightnessFactor = illumination^0.65
moonPenalty = 0.78 × moonBrightnessFactor × moonAltitudeFactor
score = round(100 × clamp(1 − moonPenalty, 0, 1))
```

The recommendation selects the highest contiguous near-peak window, prefers at least 60 minutes, and deterministically ranks ties by average score, duration, peak score, then start time. It never uses weather, light pollution, terrain, stars, planets, or external runtime APIs.

## Live updates and time labels

The expensive Sun/Moon sampling is anchored to the relevant local night. In live mode it is recalculated only when the recommendation or astronomical-night boundary is crossed; the current-time marker continues to update each minute without rebuilding the samples. Locations without sunset or sunrise are explicitly identified as polar night when astronomical darkness exists. If a timeline crosses a daylight-saving offset transition, clock labels include their UTC offset so repeated local times remain distinguishable.

## User-facing limitations

The recommendation is astronomical only. Weather, haze, smoke, local light pollution, trees, buildings, terrain, and object-specific visibility are not calculated. A visible disclaimer is rendered with every plan.
