# Gear foundation

Gear is an editorial/commerce layer separate from stargazing rankings. The
static catalog is configured in `data-config/gear/` and exported to
`public/data/stargazing/gear/` before the Next.js build.

V1 guides compare portable observing archetypes using explicit criteria such as
aperture, magnification, mount stability, weight, portability, runtime, and
beam control. Each item declares pros, cons, core specifications, a review
date, and `recommendationBasis: specification_analysis`.

The catalog intentionally excludes scraped prices, stock, product images,
manufacturer copy, and hands-on test claims. Product records can carry a
partner search query and affiliate hook, but hooks remain `null` until a
source-backed partner is activated. No gear recommendation affects a
destination or astronomy score.
