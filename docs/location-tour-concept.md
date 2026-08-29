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

## Third collection

The third collection adds twenty nights whose usefulness depends on a specific access decision rather than darkness alone:

1. Canyonlands keeps the session on the paved Island in the Sky mesa and treats cliff edges and the descent as part of the plan.
2. Sutton Bank distinguishes an independent visit to the Star Hub from a place on a guided North York Moors event.
3. Hortobágy uses a current guided fishpond walk as the legal and ecological framework for the night.
4. Zselic builds the visit around a confirmed public observatory programme instead of an unverified forest track.
5. Witsand makes a reserve stay, staff-approved observing surface, and nearby bed the foundation of the session.
6. Al Wathba remains within current visitor hours and authorised surfaces around protected fossil-dune formations.
7. Frenchman Valley Campground resolves the Grasslands night at a booked pitch without turning the backcountry into overflow.
8. ASTROLab separates Mont-Mégantic's public programme from independent access to the summit research observatory.
9. Natural Bridges keeps observing within the established campground and leaves unlit monument roads for daylight.
10. Piñon Flats uses a booked Great Sand Dunes campsite without making the dune field a night route.
11. McDonald Observatory treats the Star Party ticket as an appointment and the research roads as closed working space.
12. Borrego Palm Canyon keeps the Anza-Borrego session at the assigned campground rather than searching desert pullouts.
13. Usk Reservoir makes one compact public dark-sky site the whole Brecon Beacons evening.
14. Vogelsang combines a named Eifel observing point with current protected-area and facility rules.
15. Stonehaugh uses a single Kielder venue whose event and independent-access conditions are checked separately.
16. Wimbleball makes Exmoor's weather and named Dark Sky Hub more important than collecting remote moorland stops.
17. Yulara supplies the lawful overnight base after Uluru's national-park visitor window closes.
18. Kitt Peak pairs a booked public programme with one careful summit descent and no photographic road stops.
19. Mamalluca turns an Elqui Valley reputation into a programme with language, check-in, transport, and a known return.
20. Camp Blackman lets the Warrumbungle vehicle remain parked while Siding Spring stays a separate daylight visit.

## Final collection

The final ten tours complete one source-backed night plan for every reviewed destination:

1. Hoya de la Mora exists as a night route only through a current organised event and never as informal access to the Sierra Nevada Observatory.
2. Pico do Arieiro uses current parking, shuttle, road, and trail information to contain a short summit session and its fixed descent.
3. CESCO receives its own advance reservation from a Barreal base while CASLEO and camping remain separate permissions.
4. Paranal is visited at night only through a current ticketed ESO event and its official transport.
5. Collowara supplies the booked public night near Andacollo while La Silla remains a separately registered daytime visit.
6. Cederberg Observatory turns a selected Saturday roster, ticket, Moon phase, weather decision, and nearby bed into one complete evening.
7. Lake St Clair replaces a regional Central Tasmania coordinate with a legal stay and a permitted walk-from-bed observing surface.
8. Khongoryn Els depends on a confirmed guide or ger camp that provides transport, water, shelter, and an approved nearby night area.
9. A Bieszczady show uses the organiser's dated booking and emailed meeting point rather than treating the wider starry-sky park as unrestricted access.
10. Musala Hut places a compact session beside confirmed shelter between a daylight ascent and a daylight descent.
