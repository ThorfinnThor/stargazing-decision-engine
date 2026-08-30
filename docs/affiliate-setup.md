# Affiliate setup

Affiliate links remain disabled until a partner and at least one reviewed offer
are explicitly enabled. Partner settings live in
`data-config/sources/affiliate-partners.json`; individually reviewed activity
links live in `data-config/sources/affiliate-activity-offers.json`.

## Viator and GetYourGuide activity links

Only direct links copied from the official partner tools may be added. Do not
construct or scrape product URLs. Replace the account-specific value in the
copied URL with `{affiliateId}` before committing it.

- Viator links must retain `pid`, `mcid`, and `medium`. The offer template uses
  `{affiliateId}` as the `pid` value.
- GetYourGuide links must retain `partner_id`. The offer template uses
  `{affiliateId}` as that value.
- Every offer must name the destination and at least one matching location-tour
  slug, contain original bilingual summary copy, and include the date on which
  the product page was reviewed.
- Prices, ratings, availability, and cancellation promises are deliberately not
  copied into the static catalog because they can change.

The partner ID may be stored in the partner record or supplied at build time,
with the environment value taking precedence:

```text
AFFILIATE_VIATOR_ACTIVITIES_ID
AFFILIATE_GETYOURGUIDE_ACTIVITIES_ID
```

These IDs are public tracking identifiers rather than credentials; they are
necessarily present in the generated outbound URL. Passwords, API keys, and
other private account credentials must never be committed.

An activity becomes visible only when both its partner and its offer are set to
`enabled: true`. Until then the destination and location-tour components return
no markup.

## Static redirect boundary

Curated activity links use `/go/{partner}/offer/{offer}/`. Destination searches,
where explicitly supported, use `/go/{partner}/{destination}/`. Every redirect
is generated during the data build. There is no runtime redirect endpoint and
no request parameter can select an outbound URL.

Build validation rejects unknown partners, destination/tour mismatches,
non-HTTPS targets, hosts outside the partner allowlist, missing tracking
parameters, and enabled records without a build-time affiliate ID. The public
offer JSON contains only display copy and the internal redirect path, never the
external target URL.

Rendered links use `rel="sponsored nofollow"`, each card says that it is an
affiliate link, and redirect pages are marked `noindex,nofollow`. Affiliate
configuration cannot affect destination, calendar, meteor, short-trip, or
stargazing rankings.
