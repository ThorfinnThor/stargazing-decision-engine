# Image pipeline

The image workflow is offline and attribution-first:

```text
Wikimedia Commons / public-domain source search
→ explicit free-license filter (CC0 / CC BY / CC BY-SA / public domain)
→ relevance review / manual override
→ local WebP conversion
→ public/images self-hosting
→ attribution manifest validation
```

`data-config/sources/destination-images.json` and
`data-config/sources/site-images.json` cover every active target. A pending
record is explicit and includes a reason; it produces no image URL. An
approved record must point to a local `/images/*.webp` file and include source,
author, license, license URL, attribution, alt text, and review date.

P3 candidates are kept separately in
`data-config/sources/p3-image-candidates.json`. They include source-page and
license evidence and have passed visual and Sol review. They are still not
consumed by the production manifest until the approved originals are converted
locally to WebP and the production manifest passes its attribution checks.

The build never fetches remote images and does not silently fall back to an
unlicensed asset. See [`docs/licensing.md`](licensing.md) for the source policy.
