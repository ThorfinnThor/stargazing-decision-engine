# Affiliate direct-link audit — 2026-09-26

The GetYourGuide catalogue used direct product paths with the correct partner,
medium and campaign parameters. However, 107 of the 121 published links did not
include `referral_redirect=1`. In a live browser check, an affected link opened a
GetYourGuide search-result page with the intended product selected rather than
the product detail page. Repeating the same tracked URL with
`referral_redirect=1` opened the exact product page while retaining partner
`BKWM9K1`, `utm_medium=online_publisher` and the campaign value.

The parameter was therefore added to every GetYourGuide product URL. A catalogue
test now requires the parameter on every published GetYourGuide offer and still
checks the product path and all attribution fields. This is a navigation check;
it does not assert commission reporting or date-specific availability.

Four additional current stargazing products were checked through their complete
tracked URLs and added:

- **Flagstaff** — GetYourGuide product `1071001`, “Private Stargazing at Your
  Hotel in Flagstaff or Sedona”. The live detail page showed a private telescope
  session, product ID `1071001`, Flagstaff meeting information, and a weather
  refund policy.
- **AlUla** — GetYourGuide product `1452573`, “Al-Ula: A magical stargazing
  experience”. The live detail page showed a three-hour telescope experience in
  the Ghramel area, product ID `1452573`, and selectable booking options.
- **Iriomote–Ishigaki** — GetYourGuide product `737920`, “Ishigaki: Jungle Walk
  and Stargazing Night Tour”. The tracked URL opened the exact product page. The
  listing describes a two-hour guided night outing that combines wildlife and
  jungle viewing with weather-dependent stargazing; it is not presented as a
  telescope session.
- **Iriomote–Ishigaki** — Viator product `389033P1`, “Dark Sky Stargazing & Night
  Portrait Tour in Kabira Bay”. The tracked URL opened Viator with that exact
  product selected and current booking controls visible. The listing describes
  a private 90-minute stargazing and night-portrait experience.

Uyuni products `684882` (GetYourGuide) and `108758P5` (Viator) were also live
and correctly tracked. They were deliberately not published because Uyuni's
transparent planning draft is excluded from the public location-tour index
while independent night access remains unverified. A commercial listing is not
used to override that access gate.

The Flagstaff Viator product `135630P4` was not added. Although its listing was
still visible, a recent provider response on the product page stated that the
host no longer works with Viator after a reported no-show. Publishing it would
not meet the catalogue's current-product standard.

Booking.com coverage remains unchanged: 149 destination searches are published,
with Wood Buffalo intentionally suppressed because a reliable local result has
not been established. Amazon OneLink remains outside this audit.
