# Affiliate setup

Affiliate output remains disabled until a partner is explicitly enabled.
Curated product cards additionally require an enabled, reviewed offer. Partner settings live in
`data-config/sources/affiliate-partners.json`; individually reviewed activity
links live in `data-config/sources/affiliate-activity-offers.json`.

An enabled destination-search partner may also define
`destinationSearchVariants`. The Viator configuration currently builds two
static searches for every active destination: a stargazing query and a broader
destination-activity query. These are search links, not reviewed product
recommendations, and the interface labels that distinction explicitly.

## Viator and GetYourGuide activity links

Only canonical links to complete product pages on the provider's own domain may
be added. The tracking-parameter structure must come from the official partner
tools already issued for the account; do not invent product IDs from search
snippets or scrape dynamic inventory. Replace the account-specific value in the
tracking URL with `{affiliateId}` before committing it.

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

## GetYourGuide automatic widget and Integration Analyzer

The enabled GetYourGuide partner may define one JSON-backed `widget` record
with the official automatic-widget script URL, partner campaign, and enabled
state. `GetYourGuideAnalytics` loads that script once in both application root
layouts through `next/script`. It is therefore available on every generated
page without converting the site to runtime rendering.

Only destinations in the widget record's reviewed `destinationIds` allowlist
render the automatic widget on their destination and location-tour pages.
GetYourGuide selects three live activities from the page location, surrounding
copy, and metadata. Those results are provider-selected live inventory, not
individually reviewed editorial recommendations. A destination enters the
allowlist only after its rendered results pass a relevance check. The page
labels that boundary and keeps the reviewed direct-offer cards separate.

The relevance audit of all 50 destinations was completed on 2026-08-30. The
allowlist contains La Palma, Tenerife, Atacama, Jasper, Mauna Kea, Uluru, Pico
do Arieiro, Death Valley, Canyonlands, North York Moors, Hanle, and Rila.
Ambiguous or incorrect provider matches are kept disabled even when the
destination has bookable activity inventory.

The direct-product review and same-day link revalidation were completed on
2026-08-30. Reviewed GetYourGuide stargazing offers are published for La Palma,
Tenerife, Alqueva near Monsaraz, Aoraki Mackenzie at Mount John, Elqui Valley at
Mamalluca, Atacama, Jasper, Mauna Kea, Uluru, Pico do Arieiro via a Madeira-wide
activity, Death Valley, Canyonlands via nearby Moab, and Hanle. Reviewed Viator
offers are published for La Palma, Atacama, and Pico do Arieiro via a
Madeira-wide activity. No exact active product was found for North York Moors
or Rila, so those destinations deliberately retain only their reviewed
automatic widget.

The former GetYourGuide Atacama product `1230238` stopped resolving to a
bookable product page and was removed. It was replaced by active product
`852357`; an independently reviewed Viator option (`396238P1`) was added at the
same time. The Madeira cards explicitly state that neither operator guarantees
Pico do Arieiro as the observing site.
The Alqueva card distinguishes the Monsaraz activity from the Cumeada field
guide, the Death Valley card identifies its Las Vegas departure, the
Canyonlands card identifies its Moab location outside the national park, and
the Hanle card identifies the offer as a multi-day high-altitude journey.

The remaining destinations were also checked against the current GetYourGuide
catalog. A product was not added when it was only a general night activity,
when its observing location did not match the destination, or when the direct
product URL no longer resolved to a live product page. That boundary excludes,
among others, an Abu Dhabi desert safari that is not tied to the Al Wathba
observation site and a former Sierra Nevada telescope listing whose product URL
now redirects to a general regional catalog.

The destination-by-destination result and exclusion reasons are recorded in
`docs/affiliate-direct-offer-audit-2026-08-30.md`. A search-engine snippet or a
provider category page is not sufficient evidence: each published card must
resolve to a complete current product page on the provider's own domain.

The site remains statically generated. Only the third-party widget contents are
loaded in the browser. If the GetYourGuide script is blocked, the editorial
guide, static Viator searches, and reviewed offer links remain usable.

An activity becomes visible only when both its partner and its offer are set to
`enabled: true`. Until then the destination and location-tour components return
no markup.

## Static redirect boundary

Curated activity links use `/go/{partner}/offer/{offer}/`. Destination searches,
where explicitly supported, use `/go/{partner}/{destination}/{variant}/` (or
the legacy `/go/{partner}/{destination}/` for a partner without variants).
Every redirect is generated during the data build. There is no runtime redirect
endpoint and no request parameter can select an outbound URL.

Build validation rejects unknown partners, destination/tour mismatches,
non-HTTPS targets, hosts outside the partner allowlist, missing tracking
parameters, and enabled records without a build-time affiliate ID. The public
offer JSON contains only display copy and the internal redirect path, never the
external target URL.

Rendered links use `rel="sponsored nofollow"`, each card says that it is an
affiliate link, and redirect pages are marked `noindex,nofollow`. Affiliate
configuration cannot affect destination, calendar, meteor, short-trip, or
stargazing rankings.
