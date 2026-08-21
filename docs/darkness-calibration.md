# Darkness calibration methodology

The public darkness score is an offline-derived, static value. Browser code does
not fit a model and Vercel does not retrieve Black Marble data. A reviewed GitHub
Actions ingestion run can create the source snapshots and commit the resulting
fixed JSON curve.

## Inputs and production gate

`data-config/calibration/darkness-anchors.json` separates three kinds of control:

- at least 30 dark references;
- at least 20 intermediate references;
- at least 20 urban controls.

Every point needs a source, notes, and explicit operator approval. Candidate
points are checked in so retrieval can be exercised, but they are intentionally
underfilled and unapproved. They cannot produce a curve.

Each approved anchor is processed with the same VNP46A4 Collection 2,
snow-free all-angle radiance, quality mask, four distance rings, three complete
years, and coverage gates as an observation site. Its snapshot lives under
`data-snapshots/black-marble/anchors/`. Calibration rejects incomplete baselines,
coverage overrides, differing baseline years, missing ALAN exposure, duplicate
identities, or snapshots not listed in the approved configuration.

## Robust mapping

The fitter calculates the minimum, P10, P25, median, P75, P90, maximum, and
median absolute deviation for each group. The group medians must be ordered:

```text
dark_reference < mid_reference < urban_control
```

It then writes a strictly decreasing piecewise-linear curve with these fixed
control points:

| ALAN exposure anchor | Darkness score |
| --- | ---: |
| dark P10 | 100 |
| dark median | 90 |
| intermediate median | 50 |
| urban median | 10 |
| urban P90 | 0 |

Any duplicate or reversed exposure node is a build error. Values below or above
the curve are clamped to 100 or 0. Between nodes, scoring is deterministic linear
interpolation rounded only at the final score. The fitted curve, distributions,
baseline years, and calibration timestamp are stored in
`data-config/scoring/darkness.json`; runtime fit logic is forbidden.

The score is a project-specific artificial-light exposure calibration. Labels
are limited to “Very dark”, “Dark”, “Moderate artificial light”, and “Bright
surroundings”. They are not Bortle classifications.

## Commands

The recommended production path is the manually dispatched
`Darkness calibration data` GitHub Actions workflow. Its `anchors` input accepts
one or more comma-separated anchor IDs, or `all-candidates`. Retrieval can be
split into reviewable batches; each successful run commits only the derived
anchor JSON snapshots. Keep `fit_curve` disabled until the checked-in anchor
configuration is complete and explicitly approved. The workflow rejects an
unapproved curve fit before it downloads any data.

The equivalent local commands for each reviewed anchor are:

For each reviewed anchor:

```bash
pnpm data:black-marble:fetch -- --anchor <anchor-id>
pnpm data:black-marble:extract -- --anchor <anchor-id>
pnpm data:black-marble:process -- --anchor <anchor-id>
```

After all anchor snapshots pass review:

```bash
pnpm data:darkness:calibrate
pnpm data:darkness:validate
```

The committed `awaiting_calibration` state is intentional until the complete
real dataset and operator review exist. Synthetic fixtures exercise the
algorithm but are never accepted as a production calibration source.
