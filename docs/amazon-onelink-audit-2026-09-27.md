# Amazon OneLink audit — 2026-09-27

## Verified account configuration

The Amazon.de Associates dashboard was inspected while signed in to the account that owns the site's German affiliate setup.

- Primary Amazon.de store ID: `seitenhafen36-21`
- Website tracking ID: `stargazingindex-21`
- `stargazingindex-21` is listed as a valid tracking ID inside the German store.
- United States default tracking ID: `seitenhafen36-20`
- Redirect preference for `stargazingindex-21`: **Close match**
- The OneLink dashboard identifies Germany as the primary geography and the United States as the selected destination geography.

No account setting was changed during this audit. The existing values were read and recorded.

## Website implementation

The site publishes full Amazon.de product links in this form:

```text
https://www.amazon.de/dp/<ASIN>?tag=stargazingindex-21&th=1&psc=1
```

A live binocular link opened the exact selected Amazon.de product and retained `tag=stargazingindex-21`. The repository continues to generate the German source link. It must not replace that tag with the US destination ID: OneLink performs the marketplace redirect and substitutes the mapped destination tracking ID when the visitor qualifies for redirection.

Amazon states that OneLink works with full and shortened Amazon text links after the one-time account setup. The site therefore does not add Amazon's separate oneTag advertising script. Avoiding that script also avoids introducing an additional tracking script and consent requirement solely for OneLink.

## Limits of this verification

- The audit browser was in Germany, so a normal product click correctly remained on Amazon.de. It cannot prove the experience from a US IP address.
- Amazon's **Check matching products** panel accepted the published product URL but returned no result row during this session. This is not treated as proof of either a match or a failure.
- OneLink may redirect to an exact product, a close product, or another Amazon destination according to Amazon's current matching logic and the configured **Close match** preference.
- Product availability, matching, and redirects can change after this review.
- Canada is not recorded as linked in this audit. Add it only after a Canadian Associates store and default tracking ID have been verified in the dashboard.

## Official references

- [Amazon.de OneLink FAQ](https://partnernet.amazon.de/help/node/topic/G8JHEWQ9GTDUN7EH)
- [Amazon.de OneLink integration guide](https://partnernet.amazon.de/help/node/topic/GKHRXG4YEJBTCAFC)
- [Amazon link-tag verification help](https://partnernet.amazon.de/help/node/topic/G6253GFSARDQENZR)

## Release rule

Keep `stargazingindex-21` on the site's Amazon.de source links. Treat the linked US store and redirect preference as externally managed account configuration, mirrored here only as a dated audit record. Recheck the dashboard if the source tracking ID, destination marketplace, or account ownership changes.
