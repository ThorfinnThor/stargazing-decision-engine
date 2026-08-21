# Affiliate setup

Affiliate links are disabled by default in
`data-config/sources/affiliate-partners.json`. A partner can be activated only
when its HTTPS template resolves to an explicitly allow-listed host and its
affiliate ID is present in configuration or in the corresponding environment
variable (`AFFILIATE_<PARTNER_ID>_ID`).

Travel redirects use the static route `/go/{partner}/{destination}`. The route
is generated only for enabled partners and active destinations. It rejects
unknown or disabled partners, never accepts a raw destination URL, and returns
`noindex, nofollow`, `no-store`, and `no-referrer` headers. Links rendered in
content must use `rel="sponsored nofollow"`.

Affiliate configuration cannot affect destination, calendar, meteor, or
short-trip rankings. Disclosure copy is bilingual and remains visible in the
page templates even while the partner catalog is dormant. No live booking or
availability claim is made.
