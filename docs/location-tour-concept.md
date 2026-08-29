# Location-tour concept

Location tours turn a destination score into a usable night plan for one verified observing place. They do not attempt to become generic travel articles and they do not repeat the same route under different place names.

## Product role

The destination profile answers when a trip is climatologically promising and shows the astronomical sky for the selected site. A location tour answers where the reader should go, which access model applies, how the evening should be organised, and which boundary must not be crossed. Official access information always takes precedence over the itinerary.

Every tour opens with a compact set of source-backed facts. The editorial body is assembled from flexible prose, decision, schedule, and context blocks. A page must use at least three block types, but their order and emphasis follow the location. This allows a permit decision at Cherry Springs, an altitude and community framework in Hanle, and a gate-bound camp night in Kgalagadi to remain fundamentally different reading experiences.

## Static architecture

- Source copy lives in `data-config/editorial/location-tours.json`.
- A validation step resolves every destination, observation site, and citation against the reviewed destination-guide catalog.
- The build publishes static JSON below `public/data/stargazing/editorial/location-tours/`.
- Next.js generates bilingual static HTML below `/{locale}/stargazing-tours/` and `/{locale}/stargazing-tours/{slug}/`.
- The SEO registry, XML sitemap, language alternates, structured data, and `llms.txt` are generated from the same reviewed records.
- Destination profiles link to a tour only when that destination has a published tour. No placeholder page is created for the remaining destinations.

## First collection

The initial collection covers ten distinct access and planning situations:

1. Llanos del Jable on La Palma separates a public astronomical viewpoint from the closed research complex at night.
2. Cherry Springs uses the short-term public viewing area without implying an overnight-field permit.
3. Cumeada in Alqueva is organised around a booked guided observation.
4. Parey to Gülpe in Westhavelland focuses on fog, vehicle light, and the difference between observing and camping.
5. Coomakista Pass in Kerry makes Atlantic weather the main go or no-go decision.
6. Craig Goch in the Elan Valley prioritises offline navigation and untreated winter roads.
7. Montsec explains what the ticketed two-hour program contains and why visitor parking is not an overnight site.
8. Sutherland separates the SAAO visitor telescopes from the research observatory and SALT.
9. Twee Rivieren keeps the entire night within SANParks camp and gate rules.
10. Hanle places acclimatisation, community arrangements, and observatory permission ahead of equipment.

The collection deliberately avoids fabricated driving times, unverified parking promises, weather guarantees, personal test claims, and unsourced visibility statements.

## Second collection

The next ten tours extend the same source standard into new access models without copying the first collection's structure:

1. Tenerife reduces the official seven-stop Planets and Stars route to one or two deliberate high-zone stops.
2. Clatteringshaws plans for a lochside night without relying on the closed visitor centre, café, or toilets.
3. San Pedro uses a registered astronomy excursion and keeps protected-area visits separate from night access.
4. Sotol Vista makes paved-road access, desert supplies, and the return drive part of the Big Bend observing decision.
5. Mount John uses an authorised night experience while preserving the boundary around an active research observatory.
6. NamibRand treats a concession booking and host-approved observing area as the foundation of a two-night stay.
7. Pyramid Island combines Jasper's open map, bulletins, and trail conditions into one same-day status check.
8. Mesquite Flat separates a night visit from camping and makes heat, flooding, and road conditions decisive.
9. Maunakea directs public night observing to the Visitor Information Station while respecting summit closure, altitude, and cultural responsibilities.
10. Mather Overlook pairs seasonal mountain access with a lower-elevation fallback and a direct descent.
