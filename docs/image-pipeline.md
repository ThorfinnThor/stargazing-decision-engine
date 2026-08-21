# Image pipeline

The image workflow is offline and attribution-first:

```text
Wikimedia Commons search
→ commercial-use license filter
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

The build never fetches remote images and does not silently fall back to an
unlicensed asset. See [`docs/licensing.md`](licensing.md) for the source policy.
