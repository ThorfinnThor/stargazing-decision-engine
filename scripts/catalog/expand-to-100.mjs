import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), `${JSON.stringify(value, null, 2)}\n`);
const bi = (en, de) => ({ en, de });

const candidates = [
  {
    id: "central-idaho", name: "Central Idaho", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["idaho", "north-america"], timezone: "America/Boise", priority: 94, tags: ["dark-sky-reserve", "mountain", "remote"], affiliateQuery: "Stanley Idaho",
    stay: ["stanley-idaho", "Stanley", 44.217, -114.938],
    sites: [["stanley-lake", "Stanley Lake day-use area", 44.244, -115.055, 1985, "lakeside-day-use", "limited", 78], ["redfish-lake", "Redfish Lake visitor area", 44.142, -114.922, 1990, "lake-viewpoint", "limited", 72]],
    sources: [["DarkSky International", "Central Idaho Dark Sky Reserve", "https://darksky.org/places/central-idaho-dark-sky-reserve/", "nonprofit-certifier"], ["U.S. Forest Service", "Sawtooth National Recreation Area", "https://www.fs.usda.gov/r04/sawtooth/recreation", "public-agency"], ["U.S. Forest Service", "Sawtooth alerts and notices", "https://www.fs.usda.gov/r04/sawtooth/alerts", "public-agency"]],
    title: bi("A Stanley Lake night with the mountain road settled early", "Eine Nacht am Stanley Lake mit früh geklärter Bergstraße"),
    opening: bi("Central Idaho is a vast reserve, not a single viewing platform. Stanley Lake gives an independent visitor a named public recreation area and a straightforward base in Stanley, while Redfish Lake belongs to a separately checked plan.", "Central Idaho ist ein großes Reservat und keine einzelne Aussichtsplattform. Stanley Lake bietet unabhängigen Gästen eine benannte öffentliche Erholungsfläche und Stanley als klare Basis, während Redfish Lake einen separat geprüften Plan verlangt."),
    constraint: bi("Snow, wildfire smoke, seasonal facilities and long stretches without mobile service can overrule a clear-sky forecast.", "Schnee, Waldbrandrauch, saisonale Einrichtungen und lange Abschnitte ohne Mobilfunk können eine gute Himmelsprognose aufheben."),
    route: bi("Leave Stanley before sunset, inspect the day-use boundary and return on the same road rather than crossing the reserve after dark.", "Verlasse Stanley vor Sonnenuntergang, prüfe die Grenze der Tagesfläche und kehre auf derselben Straße zurück, statt das Reservat nachts zu durchqueren."),
    conduct: bi("Protect lakeshore vegetation, campsites and other visitors from vehicle light and equipment spread.", "Schütze Ufervegetation, Campingplätze und andere Gäste vor Fahrzeuglicht und ausgebreiteter Ausrüstung."),
    fallback: bi("When a forest notice or smoke closes the plan, stay in Stanley and wait for a verified alternative night.", "Wenn Waldmeldung oder Rauch den Plan schließen, bleibe in Stanley und warte auf eine bestätigte Alternative."),
  },
  {
    id: "cosmic-campground", name: "Cosmic Campground", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["new-mexico", "north-america"], timezone: "America/Denver", priority: 92, tags: ["dark-sky-sanctuary", "campground", "remote"], affiliateQuery: "Glenwood New Mexico",
    stay: ["glenwood-new-mexico", "Glenwood", 33.316, -108.884],
    sites: [["cosmic-observation-pads", "Cosmic Campground observation pads", 33.479, -108.922, 1500, "astronomy-pad", "limited", 84], ["cosmic-campground-sites", "Cosmic Campground camping loop", 33.48, -108.923, 1500, "campground", "limited", 76]],
    sources: [["DarkSky International", "Cosmic Campground Dark Sky Sanctuary", "https://darksky.org/places/cosmic-campground-dark-sky-place/", "nonprofit-certifier"], ["U.S. Forest Service", "Cosmic Campground", "https://www.fs.usda.gov/detailfull/gila/home?cid=STELPRDB5362176", "public-agency"], ["U.S. Forest Service", "Gila National Forest alerts", "https://www.fs.usda.gov/r03/gila/alerts", "public-agency"]],
    title: bi("Use Cosmic Campground as an astronomy site, not a roadside stop", "Cosmic Campground als Astronomieplatz statt als Straßenhalt nutzen"),
    opening: bi("Cosmic Campground was created for the night sky, yet its remoteness makes preparation more important than at an urban observatory. The observation pads and camping loop serve different users and should not be treated as interchangeable parking.", "Cosmic Campground wurde für den Nachthimmel angelegt, doch seine Abgeschiedenheit verlangt mehr Vorbereitung als ein städtisches Observatorium. Beobachtungsflächen und Campingrunde dienen unterschiedlichen Gästen und sind keine austauschbaren Parkplätze."),
    constraint: bi("Water, fuel, heat, rough access roads and the site's lighting rules determine whether the trip is responsible.", "Wasser, Kraftstoff, Hitze, raue Zufahrten und die Lichtregeln des Platzes bestimmen, ob die Reise verantwortbar ist."),
    route: bi("Carry the confirmed reservation or use rule offline, arrive from Glenwood in daylight and place the vehicle once.", "Speichere Reservierung oder Nutzungsregel offline, komme bei Tageslicht aus Glenwood und stelle das Fahrzeug nur einmal ab."),
    conduct: bi("Observation pads must remain dark and free of headlights, campfires and casual vehicle movements.", "Beobachtungsflächen bleiben frei von Scheinwerfern, Lagerfeuern und beiläufigen Fahrzeugbewegungen."),
    fallback: bi("A doubtful road or missing supplies cancels the remote night rather than prompting a search for another forest clearing.", "Eine zweifelhafte Straße oder fehlende Vorräte sagen die abgelegene Nacht ab, statt eine andere Waldlichtung zu suchen."),
  },
  {
    id: "flagstaff", name: "Flagstaff", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["arizona", "north-america"], timezone: "America/Phoenix", priority: 90, tags: ["dark-sky-community", "observatory", "accessible"], affiliateQuery: "Flagstaff Arizona",
    stay: ["flagstaff-city", "Flagstaff", 35.199, -111.651],
    sites: [["lowell-observatory", "Lowell Observatory visitor campus", 35.203, -111.664, 2210, "public-observatory", "limited", 86], ["buffalo-park-flagstaff", "Buffalo Park", 35.221, -111.623, 2115, "urban-park", "limited", 68]],
    sources: [["DarkSky International", "Flagstaff Dark Sky Community", "https://darksky.org/places/flagstaff-arizona-dark-sky-community/", "nonprofit-certifier"], ["Lowell Observatory", "Visitor information", "https://lowell.edu/visit/", "science-institution"], ["City of Flagstaff", "Buffalo Park", "https://www.flagstaff.az.gov/2881/Buffalo-Park", "public-agency"]],
    title: bi("Choose between a booked observatory evening and a city park", "Zwischen gebuchtem Observatoriumsabend und Stadtpark wählen"),
    opening: bi("Flagstaff protects darkness inside a working city. Lowell Observatory provides structured public astronomy with tickets and hours, whereas Buffalo Park is an outdoor recreation space whose current rules and closing arrangements need their own check.", "Flagstaff schützt Dunkelheit innerhalb einer lebendigen Stadt. Lowell Observatory bietet öffentliche Astronomie mit Tickets und Zeiten, während Buffalo Park eine Erholungsfläche ist, deren aktuelle Regeln und Schließung separat geprüft werden."),
    constraint: bi("Event capacity, park hours, winter ice and nearby urban light make the two experiences fundamentally different.", "Veranstaltungskapazität, Parkzeiten, Wintereis und städtisches Licht machen beide Erlebnisse grundlegend verschieden."),
    route: bi("Book Lowell when interpretation matters; choose Buffalo only after confirming legal evening access and a simple return.", "Buche Lowell, wenn Vermittlung zählt; wähle Buffalo nur nach bestätigtem Abendzugang und einfachem Rückweg."),
    conduct: bi("Respect programme staff, shared paths and the city's long-standing low-light culture.", "Respektiere Programmteam, gemeinsame Wege und die langjährige lichtarme Kultur der Stadt."),
    fallback: bi("When outdoor conditions deteriorate, keep the evening within a booked indoor programme or postpone it.", "Wenn sich Außenbedingungen verschlechtern, bleibe bei einem gebuchten Innenprogramm oder verschiebe den Abend."),
  },
  {
    id: "watoga", name: "Watoga State Park", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["west-virginia", "north-america"], timezone: "America/New_York", priority: 83, tags: ["dark-sky-park", "forest", "campground"], affiliateQuery: "Pocahontas County West Virginia",
    stay: ["marlinton", "Marlinton", 38.223, -80.094],
    sites: [["watoga-riverside-campground", "Riverside Campground area", 38.102, -80.156, 760, "campground", "limited", 76], ["watoga-beaver-creek", "Beaver Creek Campground area", 38.11, -80.151, 790, "campground", "limited", 72]],
    sources: [["DarkSky International", "Watoga State Park Dark Sky Park", "https://darksky.org/places/watoga-state-park-dark-sky-park/", "nonprofit-certifier"], ["West Virginia State Parks", "Watoga State Park", "https://wvstateparks.com/park/watoga-state-park/", "public-agency"], ["West Virginia State Parks", "Watoga camping", "https://wvstateparks.com/parks/watoga-state-park/lodging/camping-at-watoga-state-park/", "public-agency"]],
    title: bi("A Watoga night anchored to the booked campground", "Eine Watoga-Nacht am gebuchten Campingplatz"),
    opening: bi("Watoga's forest canopy means the useful sky is tied to established clearings rather than arbitrary map coordinates. A legal campsite provides the cleanest night plan because the vehicle, sleeping place and return are already settled.", "Watogas Waldkrone bindet den brauchbaren Himmel an vorhandene Lichtungen statt an beliebige Kartenkoordinaten. Ein legaler Stellplatz ergibt den klarsten Nachtplan, weil Fahrzeug, Schlafplatz und Rückweg bereits geklärt sind."),
    constraint: bi("Campground seasons, wildlife, fog and narrow forest roads matter more than a small score difference between loops.", "Campingsaison, Wildtiere, Nebel und schmale Waldstraßen zählen mehr als kleine Wertunterschiede zwischen den Schleifen."),
    route: bi("Check in before dusk, identify the approved observing area and walk back to the same campsite without driving.", "Checke vor der Dämmerung ein, bestimme die zulässige Beobachtungsfläche und gehe ohne Autofahrt zum selben Stellplatz zurück."),
    conduct: bi("Quiet hours, fire rules and neighbouring campers take precedence over equipment placement.", "Ruhezeiten, Feuerregeln und benachbarte Camper haben Vorrang vor der Aufstellung der Ausrüstung."),
    fallback: bi("Fog or a closed loop turns the night into a cabin or campsite stay, not a forest-road search.", "Nebel oder eine geschlossene Schleife machen die Nacht zum Hütten- oder Campingaufenthalt und nicht zur Suche auf Waldstraßen."),
  },
  {
    id: "mesa-verde", name: "Mesa Verde", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["colorado", "north-america"], timezone: "America/Denver", priority: 91, tags: ["dark-sky-park", "archaeology", "high-desert"], affiliateQuery: "Mesa Verde Colorado",
    stay: ["cortez-colorado", "Cortez", 37.349, -108.585],
    sites: [["morefield-campground", "Morefield Campground", 37.3, -108.414, 2380, "campground", "limited", 78], ["far-view-area", "Far View visitor area", 37.16, -108.489, 2440, "visitor-centre-grounds", "limited", 67]],
    sources: [["DarkSky International", "Mesa Verde National Park Dark Sky Park", "https://darksky.org/places/mesa-verde-national-park-dark-sky-park/", "nonprofit-certifier"], ["National Park Service", "Mesa Verde stargazing", "https://www.nps.gov/meve/planyourvisit/stargazing.htm", "public-agency"], ["National Park Service", "Mesa Verde conditions", "https://www.nps.gov/meve/planyourvisit/conditions.htm", "public-agency"]],
    title: bi("Observe from a visitor area without entering archaeological ground", "Von einer Besucherfläche beobachten, ohne archäologisches Gelände zu betreten"),
    opening: bi("Mesa Verde's darkness sits within a cultural landscape, so night access cannot be inferred from a daytime overlook. Morefield Campground is the conservative base; Far View is considered only when the park explicitly supports access at the intended hour.", "Mesa Verdes Dunkelheit liegt in einer Kulturlandschaft, daher lässt sich Nachtzugang nicht aus einem Tagesaussichtspunkt ableiten. Morefield Campground ist die konservative Basis; Far View kommt nur bei ausdrücklich bestätigtem Zugang zur geplanten Zeit infrage."),
    constraint: bi("Protected archaeological sites, seasonal services, steep roads and winter closures impose firm boundaries.", "Geschützte archäologische Stätten, saisonale Dienste, steile Straßen und Wintersperren setzen feste Grenzen."),
    route: bi("Enter with time to understand park notices, remain around the booked visitor footprint and avoid late drives toward cliff-dwelling roads.", "Fahre mit Zeit für Parkhinweise ein, bleibe im gebuchten Besucherbereich und vermeide späte Fahrten zu den Straßen der Felsensiedlungen."),
    conduct: bi("Do not leave established surfaces or illuminate cultural features for photographs.", "Verlasse keine ausgewiesenen Flächen und beleuchte keine Kulturstätten für Fotos."),
    fallback: bi("A closure keeps the evening in Cortez or at approved lodging rather than at an unverified mesa pull-out.", "Eine Sperrung hält den Abend in Cortez oder an genehmigter Unterkunft statt an einer ungeprüften Haltebucht auf der Mesa."),
  },
  {
    id: "chaco-culture", name: "Chaco Culture", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["new-mexico", "north-america"], timezone: "America/Denver", priority: 93, tags: ["dark-sky-park", "archaeology", "remote"], affiliateQuery: "Chaco Culture New Mexico",
    stay: ["farmington-new-mexico", "Farmington", 36.729, -108.219],
    sites: [["gallo-campground", "Gallo Campground", 36.044, -107.922, 1890, "campground", "limited", 78], ["chaco-astronomy-center", "Chaco Astronomy Center programme area", 36.06, -107.967, 1885, "astronomy-centre", "limited", 82]],
    sources: [["DarkSky International", "Chaco Culture Dark Sky Park", "https://darksky.org/places/chaco-culture-national-historic-park-dark-sky-park/", "nonprofit-certifier"], ["National Park Service", "Chaco night sky", "https://www.nps.gov/chcu/planyourvisit/nightsky.htm", "public-agency"], ["National Park Service", "Chaco alerts and conditions", "https://www.nps.gov/chcu/planyourvisit/conditions.htm", "public-agency"]],
    title: bi("A Chaco night that respects the canyon and its road", "Eine Chaco-Nacht mit Respekt für Canyon und Zufahrt"),
    opening: bi("Chaco's night sky is inseparable from a living ancestral landscape. Gallo Campground supports an overnight plan, while the Astronomy Center is linked to published programmes and must never be assumed open because a map shows it.", "Chacos Nachthimmel ist untrennbar mit einer lebendigen Ahnenlandschaft verbunden. Gallo Campground trägt einen Übernachtungsplan, während das Astronomy Center an veröffentlichte Programme gebunden ist und nicht wegen einer Kartenmarke als offen gelten darf."),
    constraint: bi("Remote roads, flash-flood damage, limited services and cultural protection make spontaneous arrival especially weak.", "Abgelegene Straßen, Sturzflutschäden, begrenzte Dienste und Kulturschutz machen spontane Ankunft besonders problematisch."),
    route: bi("Verify the approach before leaving Farmington, arrive well before dark and observe only from the campground or an announced programme.", "Prüfe die Zufahrt vor der Abfahrt aus Farmington, komme lange vor Dunkelheit und beobachte nur am Campingplatz oder in einem angekündigten Programm."),
    conduct: bi("No light, tripod or shortcut should intrude on archaeological structures or ceremonial meaning.", "Kein Licht, Stativ oder Abkürzung darf archäologische Strukturen oder zeremonielle Bedeutung beeinträchtigen."),
    fallback: bi("Road uncertainty cancels the canyon visit before departure and keeps the observer on established regional roads.", "Unsicherheit über die Straße sagt den Canyonbesuch vor der Abfahrt ab und hält Beobachter auf etablierten Regionalstraßen."),
  },
  {
    id: "craters-of-the-moon", name: "Craters of the Moon", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["idaho", "north-america"], timezone: "America/Boise", priority: 88, tags: ["dark-sky-park", "volcanic", "national-monument"], affiliateQuery: "Craters of the Moon Idaho",
    stay: ["arco-idaho", "Arco", 43.637, -113.301],
    sites: [["lava-flow-campground", "Lava Flow Campground", 43.462, -113.556, 1800, "campground", "limited", 76], ["north-crater-flow-lot", "North Crater Flow parking area", 43.456, -113.558, 1805, "park-parking-area", "limited", 68]],
    sources: [["DarkSky International", "Craters of the Moon Dark Sky Park", "https://darksky.org/places/craters-of-the-moon-national-monument-dark-sky-park/", "nonprofit-certifier"], ["National Park Service", "Craters of the Moon night sky", "https://www.nps.gov/crmo/learn/nature/night-sky.htm", "public-agency"], ["National Park Service", "Craters of the Moon conditions", "https://www.nps.gov/crmo/planyourvisit/conditions.htm", "public-agency"]],
    title: bi("Keep the lava-field night close to the campground", "Die Nacht im Lavafeld nahe am Campingplatz halten"),
    opening: bi("Craters of the Moon has broad sky above terrain that is unforgiving underfoot. Lava Flow Campground provides a controlled base; North Crater Flow is an alternative only when loop-road access and parking hours are confirmed.", "Craters of the Moon bietet weiten Himmel über Gelände, das nachts keinen Fehler verzeiht. Lava Flow Campground ist die kontrollierte Basis; North Crater Flow gilt nur bei bestätigter Loop-Road-Zufahrt und Parkzeit als Alternative."),
    constraint: bi("Sharp lava, snow, heat, wind and seasonal road operations limit movement after sunset.", "Scharfe Lava, Schnee, Hitze, Wind und saisonaler Straßenbetrieb begrenzen Bewegungen nach Sonnenuntergang."),
    route: bi("Settle at the campground in daylight and keep every observation on an established hard surface.", "Richte dich bei Tageslicht am Campingplatz ein und halte jede Beobachtung auf einer etablierten festen Fläche."),
    conduct: bi("Protect crusts, caves and vegetation by refusing off-trail shortcuts even when a horizon looks close.", "Schütze Krusten, Höhlen und Vegetation, indem du auch bei nah wirkendem Horizont keine Abkürzung abseits des Wegs nimmst."),
    fallback: bi("A closed loop road reduces the plan to the open visitor footprint or postpones it entirely.", "Eine geschlossene Loop Road reduziert den Plan auf die offene Besucherfläche oder verschiebt ihn vollständig."),
  },
  {
    id: "antelope-island", name: "Antelope Island", countryCode: "US", countryName: "United States", continent: "north-america", regions: ["utah", "north-america"], timezone: "America/Denver", priority: 87, tags: ["dark-sky-park", "lake", "wildlife"], affiliateQuery: "Antelope Island Utah",
    stay: ["layton-utah", "Layton", 41.06, -111.971],
    sites: [["white-rock-bay", "White Rock Bay campground area", 41.038, -112.252, 1285, "campground", "limited", 76], ["bridger-bay", "Bridger Bay campground area", 41.055, -112.254, 1280, "campground", "limited", 72]],
    sources: [["DarkSky International", "Antelope Island Dark Sky Park", "https://darksky.org/places/antelope-island-dark-sky-park/", "nonprofit-certifier"], ["Utah State Parks", "Antelope Island State Park", "https://stateparks.utah.gov/parks/antelope-island/", "public-agency"], ["Utah State Parks", "Antelope Island camping", "https://stateparks.utah.gov/parks/antelope-island/park-fees/", "public-agency"]],
    title: bi("Plan the island around a legal campsite and wildlife", "Die Insel um einen legalen Stellplatz und Wildtiere planen"),
    opening: bi("Antelope Island faces both the dark lake and the glow of the Wasatch Front. A campground-based night resolves gate and vehicle questions more honestly than a generic shoreline pin.", "Antelope Island blickt zugleich auf den dunklen See und den Schein der Wasatch Front. Eine Nacht vom Campingplatz klärt Tor- und Fahrzeugfragen ehrlicher als eine allgemeine Ufermarke."),
    constraint: bi("Gate times, biting insects, bison, lake conditions and strong wind can redefine the evening quickly.", "Torzeiten, stechende Insekten, Bisons, Seezustand und starker Wind können den Abend schnell neu bestimmen."),
    route: bi("Enter during staffed hours, learn the campground boundary and avoid crossing the island after fatigue develops.", "Fahre während betreuter Zeiten ein, lerne die Campinggrenze kennen und durchquere die Insel nicht mehr bei Müdigkeit."),
    conduct: bi("Wildlife distance and closed shoreline habitat remain non-negotiable after dark.", "Abstand zu Wildtieren und gesperrter Uferlebensraum bleiben nach Einbruch der Dunkelheit unverhandelbar."),
    fallback: bi("High wind or a full campground redirects the trip to Layton rather than an unsigned roadside bay.", "Starker Wind oder ein voller Campingplatz verlagern die Reise nach Layton statt an eine unbeschilderte Straßenbucht."),
  },
  {
    id: "pic-du-midi", name: "Pic du Midi", countryCode: "FR", countryName: "France", continent: "europe", regions: ["pyrenees", "europe"], timezone: "Europe/Paris", priority: 95, tags: ["dark-sky-reserve", "observatory", "high-altitude"], affiliateQuery: "Pic du Midi France",
    stay: ["bagneres-de-bigorre", "Bagnères-de-Bigorre", 43.065, 0.149],
    sites: [["pic-du-midi-summit", "Pic du Midi booked summit programme", 42.936, 0.142, 2877, "observatory-visitor-area", "limited", 90], ["col-du-tourmalet", "Col du Tourmalet visitor area", 42.91, 0.145, 2115, "mountain-pass", "limited", 66]],
    sources: [["DarkSky International", "Pic du Midi Dark Sky Reserve", "https://darksky.org/places/pic-du-midi-dark-sky-reserve/", "nonprofit-certifier"], ["Pic du Midi", "Official visitor and night programmes", "https://picdumidi.com/en/", "science-institution"], ["N'PY", "Pic du Midi live access information", "https://www.n-py.com/en/pic-du-midi/snow-information", "official-destination"]],
    title: bi("Separate the summit programme from an independent mountain night", "Gipfelprogramm und unabhängige Bergnacht klar trennen"),
    opening: bi("Pic du Midi is both a reserve and a working high-altitude attraction. The summit is a booked experience reached through official transport, while the Tourmalet pass depends on road, season and parking rules that change independently.", "Pic du Midi ist zugleich Reservat und betriebene Hochgebirgsattraktion. Der Gipfel ist ein gebuchtes Erlebnis mit offizieller Beförderung, während der Tourmalet-Pass von Straße, Saison und eigenständigen Parkregeln abhängt."),
    constraint: bi("Altitude, cable-car schedules, snow, wind and road closures make casual substitution between summit and pass unsafe.", "Höhe, Seilbahnzeiten, Schnee, Wind und Straßensperren machen einen beiläufigen Wechsel zwischen Gipfel und Pass unsicher."),
    route: bi("Choose the paid summit product in advance or build a separate pass plan after checking the road that day.", "Wähle das bezahlte Gipfelprodukt im Voraus oder plane den Pass separat nach Prüfung der Straße am selben Tag."),
    conduct: bi("Follow observatory staff at the summit and keep independent equipment away from traffic and protected slopes at the pass.", "Folge am Gipfel dem Observatoriumsteam und halte unabhängige Ausrüstung am Pass von Verkehr und geschützten Hängen fern."),
    fallback: bi("Poor mountain conditions move the night to Bagnères-de-Bigorre rather than into an improvised high pass.", "Schlechte Bergbedingungen verlagern die Nacht nach Bagnères-de-Bigorre statt auf einen improvisierten Hochpass."),
  },
  {
    id: "cevennes", name: "Cévennes", countryCode: "FR", countryName: "France", continent: "europe", regions: ["occitanie", "europe"], timezone: "Europe/Paris", priority: 92, tags: ["dark-sky-reserve", "mountain", "national-park"], affiliateQuery: "Cevennes France",
    stay: ["florac", "Florac", 44.326, 3.594],
    sites: [["mont-aigoual", "Mont Aigoual visitor area", 44.121, 3.581, 1565, "mountain-visitor-area", "limited", 74], ["mas-de-la-barque", "Mas de la Barque visitor area", 44.381, 3.878, 1420, "mountain-visitor-area", "limited", 68]],
    sources: [["DarkSky International", "Cévennes Dark Sky Reserve", "https://darksky.org/places/cevennes-dark-sky-reserve/", "nonprofit-certifier"], ["Cévennes National Park", "Official visitor information", "https://www.cevennes-parcnational.fr/en", "protected-area"], ["Cévennes National Park", "Mont Aigoual access and parking", "https://destination.cevennes-parcnational.fr/en/trek/74829-The-spine-of-Mont-Aigoual-%28Trail%29", "protected-area"]],
    title: bi("Read the Cévennes as valleys and high plateaus, not one pin", "Die Cévennen als Täler und Hochflächen statt als eine Markierung lesen"),
    opening: bi("The Cévennes reserve spans inhabited valleys, farms, plateaus and mountain roads. Mont Aigoual offers a defined visitor destination, while Mas de la Barque is a different approach with its own operating season.", "Das Cévennen-Reservat umfasst bewohnte Täler, Höfe, Hochflächen und Bergstraßen. Mont Aigoual ist ein definiertes Besucherziel, während Mas de la Barque eine andere Anfahrt mit eigener Saison darstellt."),
    constraint: bi("Fog, wind, snow, livestock and long bends between valleys can erase the advantage of elevation.", "Nebel, Wind, Schnee, Weidetiere und lange Kurven zwischen Tälern können den Höhenvorteil aufheben."),
    route: bi("Commit to one high area before leaving Florac and arrive early enough to identify the safe visitor footprint.", "Lege vor der Abfahrt aus Florac eine Hochfläche fest und komme früh genug, um den sicheren Besucherbereich zu erkennen."),
    conduct: bi("Working farms, quiet villages and protected habitat require very low light and no roadside overflow.", "Bewirtschaftete Höfe, ruhige Dörfer und geschützte Lebensräume verlangen sehr wenig Licht und kein Ausweichen an den Straßenrand."),
    fallback: bi("Cloud on the crest keeps the session lower and near accommodation instead of starting a valley-to-valley chase.", "Wolken am Kamm halten die Sitzung tiefer und nahe der Unterkunft, statt eine Jagd von Tal zu Tal zu beginnen."),
  },
  {
    id: "alpes-azur-mercantour", name: "Alpes Azur Mercantour", countryCode: "FR", countryName: "France", continent: "europe", regions: ["provence-alpes-cote-d-azur", "europe"], timezone: "Europe/Paris", priority: 93, tags: ["dark-sky-reserve", "alpine", "remote"], affiliateQuery: "Mercantour France",
    stay: ["valberg", "Valberg", 44.095, 6.929],
    sites: [["valberg-sentinel", "Valberg astronomy trail area", 44.096, 6.926, 1670, "astronomy-area", "limited", 78], ["col-de-la-cayolle", "Col de la Cayolle visitor area", 44.259, 6.745, 2326, "mountain-pass", "limited", 62]],
    sources: [["DarkSky International", "Alpes Azur Mercantour Dark Sky Reserve", "https://darksky.org/places/alpes-azur-mercantour-dark-sky-reserve/", "nonprofit-certifier"], ["Mercantour National Park", "Official visitor information", "https://www.mercantour-parcnational.fr/en", "protected-area"], ["Valberg", "Astronomy and resort information", "https://www.valberg.com/", "official-destination"]],
    title: bi("Start with Valberg before considering a remote Alpine pass", "Mit Valberg beginnen, bevor ein abgelegener Alpenpass erwogen wird"),
    opening: bi("Alpes Azur Mercantour now covers a broad Alpine territory. Valberg provides services and astronomy interpretation; Col de la Cayolle is exposed, seasonal and unsuitable as an automatic darker alternative.", "Alpes Azur Mercantour umfasst ein großes Alpengebiet. Valberg bietet Dienste und Astronomievermittlung; Col de la Cayolle ist exponiert, saisonal und kein automatischer dunklerer Ersatz."),
    constraint: bi("Pass closures, mountain storms, cold and protected wildlife corridors make road status decisive.", "Passsperren, Berggewitter, Kälte und geschützte Wildtierkorridore machen den Straßenzustand entscheidend."),
    route: bi("Use Valberg as the default base and approach any pass only under explicit current access information.", "Nutze Valberg als Standardbasis und fahre einen Pass nur mit ausdrücklich aktueller Zugangsinformation an."),
    conduct: bi("Keep resort paths usable, avoid meadow parking and give nocturnal wildlife an undisturbed route.", "Halte Resortwege frei, parke nicht auf Wiesen und lasse nachtaktiven Tieren einen ungestörten Korridor."),
    fallback: bi("A closed pass leaves a complete village-based evening; it does not create a need for another mountain road.", "Ein geschlossener Pass lässt einen vollständigen Abend im Dorf zu und erzeugt keinen Bedarf nach einer weiteren Bergstraße."),
  },
  {
    id: "rhoen", name: "Rhön", countryCode: "DE", countryName: "Germany", continent: "europe", regions: ["hesse", "bavaria", "thuringia", "europe"], timezone: "Europe/Berlin", priority: 88, tags: ["dark-sky-reserve", "biosphere", "accessible"], affiliateQuery: "Rhön Germany",
    stay: ["fulda", "Fulda", 50.555, 9.681],
    sites: [["hohe-geba", "Hohe Geba star park area", 50.59, 10.273, 750, "dark-sky-viewpoint", "limited", 76], ["wasserkuppe", "Wasserkuppe visitor area", 50.498, 9.938, 950, "mountain-visitor-area", "limited", 66]],
    sources: [["DarkSky International", "Rhön Dark Sky Reserve", "https://darksky.org/places/rhon-dark-sky-reserve/", "nonprofit-certifier"], ["UNESCO Biosphere Reserve Rhön", "Sternenpark Rhön", "https://www.biosphaerenreservat-rhoen.de/natur/sternenpark", "protected-area"], ["Rhön Tourism", "Star park visitor information", "https://www.rhoen.info/sternenpark", "official-destination"]],
    title: bi("Use a named Rhön star place and leave the meadows dark", "Einen benannten Rhöner Sternenplatz nutzen und Wiesen dunkel lassen"),
    opening: bi("Rhön darkness is distributed across three core areas and many lived-in landscapes. Hohe Geba offers a recognisable star-park destination, while Wasserkuppe combines tourism, exposure and more light.", "Die Dunkelheit der Rhön verteilt sich auf drei Kernbereiche und viele bewohnte Landschaften. Hohe Geba ist ein erkennbares Sternenparkziel, während die Wasserkuppe Tourismus, Exposition und mehr Licht verbindet."),
    constraint: bi("Fog, snow, grazing land, private tracks and event traffic can make an apparently open hill unsuitable.", "Nebel, Schnee, Weideland, Privatwege und Veranstaltungsverkehr können einen scheinbar offenen Hügel ungeeignet machen."),
    route: bi("Choose an official observation place, arrive from Fulda before dusk and avoid hopping between the reserve's separate cores.", "Wähle einen offiziellen Beobachtungsplatz, komme vor der Dämmerung aus Fulda und wechsle nicht zwischen den getrennten Kernzonen."),
    conduct: bi("Stay on signed surfaces and shield light from farms, villages and grazing animals.", "Bleibe auf beschilderten Flächen und schirme Licht gegenüber Höfen, Dörfern und Weidetieren ab."),
    fallback: bi("Low cloud turns the evening into a return to Fulda, not a search along agricultural lanes.", "Tiefe Wolken machen den Abend zur Rückkehr nach Fulda und nicht zur Suche auf Wirtschaftswegen."),
  },
  {
    id: "winklmoosalm", name: "Winklmoosalm", countryCode: "DE", countryName: "Germany", continent: "europe", regions: ["bavaria", "europe"], timezone: "Europe/Berlin", priority: 87, tags: ["dark-sky-park", "alpine", "guided-programmes"], affiliateQuery: "Reit im Winkl Germany",
    stay: ["reit-im-winkl", "Reit im Winkl", 47.678, 12.47],
    sites: [["winklmoosalm-plateau", "Winklmoosalm visitor plateau", 47.657, 12.579, 1170, "mountain-visitor-area", "limited", 82], ["hemmersuppenalm", "Hemmersuppenalm visitor area", 47.67, 12.5, 1210, "mountain-visitor-area", "limited", 65]],
    sources: [["DarkSky International", "Winklmoosalm Dark Sky Park", "https://darksky.org/places/winklmoosalm-dark-sky-park/", "nonprofit-certifier"], ["Reit im Winkl Tourism", "Winklmoosalm star park", "https://www.reitimwinkl.de/sternenpark", "official-destination"], ["Reit im Winkl Tourism", "Current visitor information", "https://www.reitimwinkl.de/", "official-destination"]],
    title: bi("Match a Winklmoosalm night to the actual mountain operation", "Eine Winklmoosalm-Nacht an den tatsächlichen Bergbetrieb anpassen"),
    opening: bi("Winklmoosalm pairs very dark Alpine sky with a working pasture and tourism area. Guided astronomy dates, road arrangements and winter operations can all alter how visitors reach the plateau.", "Winklmoosalm verbindet sehr dunklen Alpenhimmel mit bewirtschafteter Alm und Tourismusgebiet. Geführte Astronomietermine, Straßenregelung und Winterbetrieb können die Anreise auf die Hochfläche verändern."),
    constraint: bi("Snow, wind, shuttle or toll-road rules and livestock prevent a one-size-fits-all arrival plan.", "Schnee, Wind, Shuttle- oder Mautstraßenregeln und Weidetiere verhindern einen einheitlichen Anreiseplan."),
    route: bi("Follow the published programme or current visitor route and establish the return before the last service ends.", "Folge dem veröffentlichten Programm oder dem aktuellen Besucherweg und kläre die Rückkehr vor dem Ende des letzten Dienstes."),
    conduct: bi("Keep pasture gates, tracks and hospitality access clear while using only minimal downward light.", "Halte Weidetore, Wege und Gastronomiezufahrten frei und nutze nur minimales nach unten gerichtetes Licht."),
    fallback: bi("When transport or weather is uncertain, observe lower near Reit im Winkl or postpone the ascent.", "Bei unsicherem Transport oder Wetter beobachte tiefer nahe Reit im Winkl oder verschiebe den Aufstieg."),
  },
  {
    id: "lauwersmeer", name: "Lauwersmeer", countryCode: "NL", countryName: "Netherlands", continent: "europe", regions: ["friesland", "groningen", "europe"], timezone: "Europe/Amsterdam", priority: 84, tags: ["dark-sky-park", "wetland", "accessible"], affiliateQuery: "Lauwersmeer Netherlands",
    stay: ["lauwersoog", "Lauwersoog", 53.404, 6.213],
    sites: [["activiteitencentrum-lauwersmeer", "Lauwersnest activity-centre area", 53.381, 6.211, 2, "visitor-centre-grounds", "limited", 78], ["dark-sky-platform-lauwersmeer", "Lauwersmeer night platform area", 53.36, 6.2, 1, "dark-sky-viewpoint", "limited", 72]],
    sources: [["DarkSky International", "Lauwersmeer National Park Dark Sky Park", "https://darksky.org/places/lauwersmeer-national-park-dark-sky-park/", "nonprofit-certifier"], ["National Park Lauwersmeer", "Official park information", "https://www.np-lauwersmeer.nl/", "protected-area"], ["Staatsbosbeheer", "Lauwersmeer visitor information", "https://www.staatsbosbeheer.nl/uit-in-de-natuur/locaties/lauwersmeer", "public-agency"]],
    title: bi("A wetland night from a designated Lauwersmeer platform", "Eine Feuchtgebietsnacht von einer ausgewiesenen Lauwersmeer-Plattform"),
    opening: bi("Lauwersmeer protects darkness in a low, open wetland used by large numbers of birds. Designated visitor areas are valuable because dikes, reeds and water make an arbitrary dark-looking edge a poor choice.", "Lauwersmeer schützt Dunkelheit in einem flachen offenen Feuchtgebiet mit vielen Vögeln. Ausgewiesene Besucherflächen sind wichtig, weil Deiche, Röhricht und Wasser einen beliebigen dunkel wirkenden Rand ungeeignet machen."),
    constraint: bi("Wind, flooding, bird restrictions, mosquitoes and unlit water boundaries control comfort and safety.", "Wind, Überflutung, Vogelschutz, Mücken und unbeleuchtete Wassergrenzen bestimmen Komfort und Sicherheit."),
    route: bi("Begin at the official activity-centre or platform information and walk only the route inspected before twilight.", "Beginne bei der offiziellen Information am Aktivitätszentrum oder der Plattform und gehe nur den vor der Dämmerung geprüften Weg."),
    conduct: bi("Remain quiet near roosting birds and keep every lamp away from reeds and open water.", "Bleibe nahe rastender Vögel ruhig und halte jedes Licht von Röhricht und offenem Wasser fern."),
    fallback: bi("Strong wind or a closed nature zone keeps the night in Lauwersoog without searching along the dike.", "Starker Wind oder eine geschlossene Naturzone hält die Nacht in Lauwersoog, ohne entlang des Deichs zu suchen."),
  },
  {
    id: "de-boschplaat", name: "De Boschplaat", countryCode: "NL", countryName: "Netherlands", continent: "europe", regions: ["terschelling", "europe"], timezone: "Europe/Amsterdam", priority: 86, tags: ["dark-sky-park", "island", "wetland"], affiliateQuery: "Terschelling Netherlands",
    stay: ["oosterend-terschelling", "Oosterend, Terschelling", 53.404, 5.377],
    sites: [["wierschuur-boschplaat", "Wierschuur parking area", 53.42, 5.44, 2, "nature-reserve-car-park", "limited", 76], ["panoramadune-oosterend", "Oosterend panorama dune", 53.407, 5.395, 12, "coastal-viewpoint", "limited", 68]],
    sources: [["DarkSky International", "De Boschplaat Dark Sky Park", "https://darksky.org/places/de-boschplaat-dark-sky-park/", "nonprofit-certifier"], ["Staatsbosbeheer", "Terschelling and De Boschplaat", "https://www.staatsbosbeheer.nl/uit-in-de-natuur/locaties/terschelling", "public-agency"], ["VVV Terschelling", "Dark Sky Terschelling", "https://www.vvvterschelling.nl/dark-sky-terschelling/", "official-destination"]],
    title: bi("Reach De Boschplaat by the route the island actually supports", "De Boschplaat auf dem tatsächlich vorgesehenen Inselweg erreichen"),
    opening: bi("De Boschplaat is an island nature reserve where eight night-viewing locations have been identified, but conservation closures still outrank that invitation. Wierschuur suits equipment access; the panorama dune is a walking or cycling experience.", "De Boschplaat ist ein Inselnaturreservat mit acht benannten Nachtplätzen, doch Natursperrungen stehen über dieser Einladung. Wierschuur eignet sich für Ausrüstung; die Panoramadüne ist ein Geh- oder Fahrraderlebnis."),
    constraint: bi("Tides, breeding closures, wind, darkness and limited vehicle access shape the real last kilometre.", "Gezeiten, Brutsperren, Wind, Dunkelheit und begrenzter Fahrzeugzugang formen den echten letzten Kilometer."),
    route: bi("Select the site by transport mode before leaving Oosterend and carry the same route offline for the return.", "Wähle den Ort vor der Abfahrt aus Oosterend nach Verkehrsmittel und speichere denselben Rückweg offline."),
    conduct: bi("Avoid dunes, nesting areas and stray light across the reserve, even when no other person is visible.", "Meide Dünen, Brutflächen und Streulicht im Reservat, auch wenn kein anderer Mensch sichtbar ist."),
    fallback: bi("Bad wind or a conservation closure keeps the session at the village edge rather than farther east.", "Schlechter Wind oder eine Natursperrung hält die Sitzung am Dorfrand statt weiter im Osten."),
  },
  {
    id: "mon-and-nyord", name: "Møn and Nyord", countryCode: "DK", countryName: "Denmark", continent: "europe", regions: ["zealand", "europe"], timezone: "Europe/Copenhagen", priority: 88, tags: ["dark-sky-park", "coast", "island"], affiliateQuery: "Mon Denmark",
    stay: ["stege", "Stege", 54.986, 12.285],
    sites: [["mons-klint-visitor-area", "Møns Klint visitor area", 54.966, 12.549, 110, "coastal-visitor-area", "limited", 78], ["nyord-village-edge", "Nyord village visitor area", 55.041, 12.195, 3, "coastal-viewpoint", "limited", 70]],
    sources: [["DarkSky International", "Møn and Nyord Dark Sky Park", "https://darksky.org/places/mon-and-nyord-dark-sky-park/", "nonprofit-certifier"], ["GeoCenter Møns Klint", "Official visitor information", "https://moensklint.dk/en/", "official-destination"], ["Visit South Zealand and Møn", "Dark Sky Møn", "https://www.southzealand-mon.com/darksky", "official-destination"]],
    title: bi("Choose the chalk-cliff visitor area or the quiet Nyord edge", "Zwischen Kreideküsten-Besucherplatz und ruhigem Nyord-Rand wählen"),
    opening: bi("Møn and Nyord combine a Dark Sky Park with lived-in islands and fragile coasts. Møns Klint has a defined visitor operation; Nyord asks for quieter movement near village and wetland.", "Møn und Nyord verbinden Dark Sky Park, bewohnte Inseln und empfindliche Küsten. Møns Klint besitzt einen definierten Besucherbetrieb; Nyord verlangt ruhigere Bewegung nahe Dorf und Feuchtgebiet."),
    constraint: bi("Cliff edges, seasonal opening, wind, wet paths and bird habitat rule out casual coastal wandering.", "Klippenkanten, saisonale Öffnung, Wind, nasse Wege und Vogellebensraum schließen beiläufiges Küstenwandern aus."),
    route: bi("Use one official visitor area, see the cliff boundary in daylight and return to Stege without adding the second island.", "Nutze eine offizielle Besucherfläche, erkenne die Klippengrenze bei Tageslicht und kehre ohne zweite Insel nach Stege zurück."),
    conduct: bi("Keep away from cliff edges and wetlands while shielding every lamp from homes and wildlife.", "Halte Abstand zu Klippen und Feuchtgebieten und schirme jedes Licht gegenüber Häusern und Wildtieren ab."),
    fallback: bi("Coastal wind makes a sheltered village session preferable to switching islands after dark.", "Küstenwind macht eine geschützte Dorfsitzung besser als einen Inselwechsel nach Einbruch der Dunkelheit."),
  },
  {
    id: "bukk", name: "Bükk National Park", countryCode: "HU", countryName: "Hungary", continent: "europe", regions: ["northern-hungary", "europe"], timezone: "Europe/Budapest", priority: 85, tags: ["dark-sky-park", "forest", "astronomy-centre"], affiliateQuery: "Bukk National Park Hungary",
    stay: ["miskolc", "Miskolc", 48.104, 20.791],
    sites: [["bukki-csillagda", "Bükki Csillagda visitor centre", 48.04, 20.529, 630, "astronomy-centre", "limited", 84], ["repashuta", "Répáshuta village visitor area", 48.05, 20.53, 520, "mountain-village", "limited", 66]],
    sources: [["DarkSky International", "Bükk National Park Dark Sky Park", "https://darksky.org/places/bukk-national-park-dark-sky-park/", "nonprofit-certifier"], ["Bükk National Park Directorate", "Official park information", "https://www.bnpi.hu/en", "protected-area"], ["Bükki Csillagda", "Astronomy centre programmes", "https://www.bukkicsillagda.hu/en", "science-institution"]],
    title: bi("Let Bükki Csillagda define the forest night", "Bükki Csillagda die Waldnacht bestimmen lassen"),
    opening: bi("Bükk is heavily forested, so a purpose-built astronomy centre is more useful than a random high point. Bükki Csillagda offers programmes and a known arrival; Répáshuta is a village base rather than a guaranteed observation field.", "Bükk ist stark bewaldet, deshalb ist ein gebautes Astronomiezentrum sinnvoller als ein beliebiger Hochpunkt. Bükki Csillagda bietet Programme und klare Ankunft; Répáshuta ist Dorfbasis und kein garantiertes Beobachtungsfeld."),
    constraint: bi("Programme hours, forest restrictions, snow and wildlife make independent night movement conditional.", "Programmzeiten, Waldregeln, Schnee und Wildtiere machen unabhängige Nachtbewegung bedingt."),
    route: bi("Reserve a centre programme when available and keep any independent viewing within a locally confirmed public area.", "Reserviere nach Möglichkeit ein Zentrumprogramm und halte unabhängige Beobachtung in einem lokal bestätigten öffentlichen Bereich."),
    conduct: bi("Forest tracks, caves and quiet villages remain free of headlights and off-trail exploration.", "Waldwege, Höhlen und ruhige Dörfer bleiben frei von Scheinwerfern und Erkundung abseits der Wege."),
    fallback: bi("A full programme or closed forest leaves an evening in Miskolc, not an improvised upland drive.", "Ein volles Programm oder geschlossener Wald lässt einen Abend in Miskolc statt einer improvisierten Höhenfahrt."),
  },
  {
    id: "albanya", name: "Albanyà", countryCode: "ES", countryName: "Spain", continent: "europe", regions: ["catalonia", "europe"], timezone: "Europe/Madrid", priority: 86, tags: ["dark-sky-park", "observatory", "mountain"], affiliateQuery: "Albanya Girona Spain",
    stay: ["albanya-village", "Albanyà", 42.305, 2.72],
    sites: [["bassegoda-observatory", "Bassegoda Park observatory", 42.313, 2.708, 240, "tourist-observatory", "limited", 86], ["coll-de-la-creu-albanya", "Coll de la Creu visitor area", 42.326, 2.69, 500, "mountain-viewpoint", "limited", 62]],
    sources: [["DarkSky International", "Albanyà Dark Sky Park", "https://darksky.org/places/albanya-dark-sky-park/", "nonprofit-certifier"], ["Bassegoda Park", "Albanyà Astronomical Observatory", "https://www.bassegodapark.com/en/observatori-astronomic-albanya/", "science-institution"], ["Albanyà municipality", "Official municipal information", "https://www.albanya.cat/", "public-agency"]],
    title: bi("Book Bassegoda or verify an independent Albanyà viewpoint", "Bassegoda buchen oder einen unabhängigen Albanyà-Aussichtspunkt prüfen"),
    opening: bi("Albanyà has formal astronomy at Bassegoda Park and several named independent viewpoints. Those are distinct products: one has programme control and facilities, the other needs explicit route and parking confirmation.", "Albanyà besitzt formelle Astronomie im Bassegoda Park und mehrere benannte unabhängige Aussichtspunkte. Das sind verschiedene Produkte: eines hat Programmsteuerung und Einrichtungen, das andere verlangt klare Routen- und Parkbestätigung."),
    constraint: bi("Booking, narrow roads, summer demand and forest-fire restrictions can change access with little room for improvisation.", "Buchung, schmale Straßen, Sommerandrang und Waldbrandregeln können den Zugang ohne viel Raum für Improvisation verändern."),
    route: bi("Use the observatory when a programme is booked; otherwise confirm one named viewpoint before leaving the village.", "Nutze bei Buchung das Observatorium; bestätige sonst einen benannten Aussichtspunkt vor der Abfahrt aus dem Dorf."),
    conduct: bi("Keep forest edges and campsites quiet, and never replace a full car park with roadside parking.", "Halte Waldränder und Campingplätze ruhig und ersetze einen vollen Parkplatz niemals durch Straßenrandparken."),
    fallback: bi("A booking or fire restriction problem keeps the evening in Albanyà rather than on an unsigned track.", "Ein Buchungs- oder Waldbrandproblem hält den Abend in Albanyà statt auf einem unbeschilderten Weg."),
  },
  {
    id: "iriomote-ishigaki", name: "Iriomote-Ishigaki", countryCode: "JP", countryName: "Japan", continent: "asia", regions: ["okinawa", "asia"], timezone: "Asia/Tokyo", priority: 92, tags: ["dark-sky-park", "island", "subtropical"], affiliateQuery: "Ishigaki Okinawa Japan",
    stay: ["ishigaki-city", "Ishigaki City", 24.34, 124.155],
    sites: [["kabira-bay-visitor-area", "Kabira Bay visitor area", 24.456, 124.143, 15, "coastal-visitor-area", "limited", 68], ["hoshizuna-beach-iriomote", "Hoshizuna Beach visitor area", 24.435, 123.775, 4, "beach", "limited", 64]],
    sources: [["DarkSky International", "Iriomote-Ishigaki National Park", "https://darksky.org/places/iriomote-ishigaki-national-park-dark-sky-park/", "nonprofit-certifier"], ["Ministry of the Environment Japan", "Iriomote-Ishigaki National Park", "https://www.env.go.jp/en/nature/nps/park/iriomote/", "public-agency"], ["Okinawa tourism authority", "Yaeyama Islands visitor information", "https://visitokinawajapan.com/destinations/yaeyama-islands/", "official-destination"]],
    title: bi("Treat Ishigaki and Iriomote as separate island nights", "Ishigaki und Iriomote als getrennte Inselnächte behandeln"),
    opening: bi("Iriomote-Ishigaki National Park spans multiple islands, sea and protected subtropical habitat. Kabira Bay and Hoshizuna Beach cannot be combined into one evening because ferries, local transport and wildlife boundaries separate them.", "Der Iriomote-Ishigaki-Nationalpark umfasst mehrere Inseln, Meer und geschützte subtropische Lebensräume. Kabira Bay und Hoshizuna Beach gehören wegen Fähren, Nahverkehr und Naturschutzgrenzen nicht in denselben Abend."),
    constraint: bi("Ferry schedules, typhoons, cloud, tides, sea turtles and the Iriomote cat demand island-specific planning.", "Fährzeiten, Taifune, Wolken, Gezeiten, Meeresschildkröten und die Iriomote-Katze verlangen inselspezifische Planung."),
    route: bi("Select the island first, check the last transport and use a recognised visitor area near the night's accommodation.", "Wähle zuerst die Insel, prüfe den letzten Transport und nutze eine anerkannte Besucherfläche nahe der Unterkunft."),
    conduct: bi("Keep beaches and forest roads dark, quiet and clear for protected nocturnal animals.", "Halte Strände und Waldstraßen dunkel, ruhig und frei für geschützte nachtaktive Tiere."),
    fallback: bi("Uncertain transport or storms keep the observation near lodging without a late coastal transfer.", "Unsicherer Transport oder Stürme halten die Beobachtung nahe der Unterkunft ohne späten Küstenwechsel."),
  },
  {
    id: "kozushima", name: "Kozushima", countryCode: "JP", countryName: "Japan", continent: "asia", regions: ["tokyo-islands", "asia"], timezone: "Asia/Tokyo", priority: 89, tags: ["dark-sky-park", "island", "coast"], affiliateQuery: "Kozushima Japan",
    stay: ["kozushima-village", "Kozushima Village", 34.205, 139.135],
    sites: [["yotane-hiroba", "Yotane Hiroba viewing area", 34.208, 139.151, 120, "dark-sky-viewpoint", "limited", 78], ["akasaki-promenade", "Akasaki promenade visitor area", 34.241, 139.121, 15, "coastal-viewpoint", "limited", 64]],
    sources: [["DarkSky International", "Kozushima Dark Sky Island", "https://darksky.org/places/kozushima-island-dark-sky-park/", "nonprofit-certifier"], ["Kozushima Tourism Association", "Official dark-sky island guide", "https://kozushima.com/star/english/", "official-destination"], ["Tokyo Metropolitan Government", "Kozushima island information", "https://www.gotokyo.org/en/destinations/izu-and-ogasawara-islands/kozushima-island/index.html", "public-agency"]],
    title: bi("Build a Kozushima night around island transport and one lookout", "Eine Kozushima-Nacht um Inseltransport und einen Aussichtspunkt bauen"),
    opening: bi("Kozushima's protected night begins inside an inhabited island with carefully changed public lighting. Yotane Hiroba is the clearer astronomy reference; Akasaki is a coastal visitor area with different surface and sea risks.", "Kozushimas geschützte Nacht beginnt auf einer bewohnten Insel mit bewusst angepasster Beleuchtung. Yotane Hiroba ist die klarere Astronomiereferenz; Akasaki ist eine Küstenbesucherfläche mit anderem Untergrund und Meeresrisiko."),
    constraint: bi("Boat or flight disruption, coastal wind, rain and limited night transport can isolate a poorly chosen site.", "Schiffs- oder Flugausfall, Küstenwind, Regen und begrenzter Nachtverkehr können einen schlecht gewählten Ort isolieren."),
    route: bi("Confirm local transport, reach one viewpoint before dark and leave enough time for the planned return to the village.", "Bestätige den Nahverkehr, erreiche einen Aussichtspunkt vor Dunkelheit und lasse genug Zeit für die geplante Rückkehr ins Dorf."),
    conduct: bi("Shield light from homes, nesting shores and other observers who rely on the island's careful lighting.", "Schirme Licht gegenüber Häusern, Brutküsten und anderen Beobachtern ab, die von der sorgfältigen Inselbeleuchtung profitieren."),
    fallback: bi("Transport uncertainty keeps the night within walking distance of lodging rather than at the far coast.", "Unsicherer Transport hält die Nacht in Gehweite der Unterkunft statt an der fernen Küste."),
  },
  {
    id: "om-dark-sky", name: "OM Dark Sky Park", countryCode: "GB", countryName: "United Kingdom", continent: "europe", regions: ["northern-ireland", "europe"], timezone: "Europe/London", priority: 86, tags: ["dark-sky-park", "observatory", "forest", "bookable-programmes"], affiliateQuery: "Davagh Forest Northern Ireland",
    stay: ["cookstown", "Cookstown", 54.647, -6.745],
    sites: [["om-observatory-terrace", "OM Observatory visitor terrace", 54.71022, -6.87889, 215, "observatory-visitor-centre", "limited", 86], ["beaghmore-stone-circles", "Beaghmore Stone Circles visitor area", 54.702, -6.939, 225, "archaeological-visitor-area", "limited", 64]],
    sources: [["DarkSky International", "OM Dark Sky Park and Observatory", "https://darksky.org/places/om-dark-sky-park-and-observatory-dark-sky-park/", "nonprofit-certifier"], ["OM Dark Sky Park and Observatory", "Plan your visit", "https://omdarksky.com/plan-your-visit/", "science-institution"], ["OM Dark Sky Park and Observatory", "Current programmes", "https://omdarksky.com/whats-on/", "science-institution"]],
    title: bi("A booked observing evening at OM in Davagh Forest", "Ein gebuchter Beobachtungsabend im OM im Davagh Forest"),
    opening: bi("OM Dark Sky Park combines a staffed observatory with Davagh Forest and an archaeological landscape. The visitor terrace is tied to published opening hours and programmes; Beaghmore Stone Circles is a separate heritage visit rather than an automatic second observing stop.", "Der OM Dark Sky Park verbindet ein betreutes Observatorium mit dem Davagh Forest und einer archäologischen Landschaft. Die Besucherterrasse folgt veröffentlichten Öffnungszeiten und Programmen; die Beaghmore Stone Circles sind ein eigener Kulturerbe-Besuch und kein automatischer zweiter Beobachtungshalt."),
    constraint: bi("Programme availability, booking, forest closures, rain, low cloud and an unlit rural return decide whether the evening works.", "Programmverfügbarkeit, Buchung, Waldsperren, Regen, tiefe Wolken und eine unbeleuchtete ländliche Rückfahrt entscheiden über den Abend."),
    route: bi("Choose a dated OM session, arrive while the visitor centre is staffed and keep the night within the published programme footprint.", "Wähle eine terminierte OM-Veranstaltung, komme während der betreuten Öffnung an und halte die Nacht innerhalb des veröffentlichten Programmbereichs."),
    conduct: bi("Keep red light low, follow staff directions and avoid extending an observatory visit onto unfamiliar forest paths after dark.", "Halte Rotlicht niedrig, folge den Anweisungen des Teams und verlängere den Observatoriumsbesuch nicht auf unbekannte Waldwege bei Dunkelheit."),
    fallback: bi("If weather or the programme cancels outdoor observing, use the staffed indoor experience or return to Cookstown.", "Wenn Wetter oder Programm die Außenbeobachtung absagen, nutze das betreute Innenangebot oder kehre nach Cookstown zurück."),
  },
  {
    id: "bulbjerg", name: "Bulbjerg", countryCode: "DK", countryName: "Denmark", continent: "europe", regions: ["north-jutland", "europe"], timezone: "Europe/Copenhagen", priority: 83, tags: ["dark-sky-park", "coast", "dunes"], affiliateQuery: "Thy Denmark",
    stay: ["lild-strand", "Lild Strand", 57.09, 8.96],
    sites: [["bulbjerg-cliff-lot", "Bulbjerg visitor parking area", 57.159, 9.014, 35, "coastal-car-park", "limited", 74], ["lild-strand-edge", "Lild Strand village edge", 57.089, 8.96, 5, "coastal-viewpoint", "limited", 66]],
    sources: [["DarkSky International", "Dark Sky Park Bulbjerg", "https://darksky.org/places/dark-sky-park-bulbjerg/", "nonprofit-certifier"], ["Danish Nature Agency", "Bulbjerg practical information", "https://naturstyrelsen.dk/find-et-naturomraade/naturguider/thy-og-vendsyssel/bulbjerg/praktisk", "public-agency"], ["Danish Nature Agency", "Bulbjerg visitor information", "https://naturstyrelsen.dk/find-et-naturomraade/naturguider/thy-og-vendsyssel/bulbjerg", "public-agency"]],
    title: bi("Keep Bulbjerg stargazing behind the cliff boundary", "Bulbjerg-Beobachtung hinter der Klippengrenze halten"),
    opening: bi("Bulbjerg combines deep coastal darkness with an exposed cliff and important bird habitat. The visitor parking area offers a defined landward position; Lild Strand provides a lower village-based alternative.", "Bulbjerg verbindet tiefe Küstendunkelheit mit exponierter Klippe und wichtigem Vogellebensraum. Der Besucherparkplatz bietet eine definierte landseitige Position; Lild Strand ist die tiefere dorfnahe Alternative."),
    constraint: bi("Cliff edges, wind, salt spray, breeding birds and Nordic summer brightness all narrow the useful window.", "Kliffkanten, Wind, Salzsprühnebel, Brutvögel und nordische Sommerhelligkeit engen das brauchbare Fenster ein."),
    route: bi("Inspect the cliff-side limits in daylight, remain landward and return directly to Lild Strand.", "Prüfe die Grenzen an der Klippe bei Tageslicht, bleibe landseitig und kehre direkt nach Lild Strand zurück."),
    conduct: bi("Do not approach nesting ledges or sweep the cliff and sea with lamps.", "Nähere dich keinen Brutvorsprüngen und leuchte Klippe oder Meer nicht mit Lampen ab."),
    fallback: bi("Strong onshore wind makes the sheltered village edge the complete plan, not a compromise.", "Starker auflandiger Wind macht den geschützten Dorfrand zum vollständigen Plan und nicht zum Kompromiss."),
  },
  {
    id: "bisei", name: "Bisei Town", countryCode: "JP", countryName: "Japan", continent: "asia", regions: ["okayama", "asia"], timezone: "Asia/Tokyo", priority: 86, tags: ["dark-sky-community", "observatory", "accessible"], affiliateQuery: "Okayama Japan",
    stay: ["ibara", "Ibara", 34.598, 133.463],
    sites: [["bisei-observatory", "Bisei Astronomical Observatory", 34.672, 133.544, 420, "public-observatory", "limited", 86], ["hoshizora-park-bisei", "Hoshizora Park visitor area", 34.681, 133.55, 430, "dark-sky-park", "limited", 72]],
    sources: [["DarkSky International", "Bisei Town Dark Sky Community", "https://darksky.org/places/bisei-town-ibara-city-dark-sky-community/", "nonprofit-certifier"], ["Bisei Astronomical Observatory", "Official visitor information", "https://www.bao.city.ibara.okayama.jp/?page_id=158", "science-institution"], ["Ibara City", "Bisei tourism information", "https://www.city.ibara.okayama.jp/", "public-agency"]],
    title: bi("Use Bisei's observatory network instead of guessing at a farm road", "Biseis Observatoriumsnetz statt eines geratenen Feldwegs nutzen"),
    opening: bi("Bisei is a rural community with decades of lighting policy and several astronomy facilities. The observatory provides the clearest visitor product; Hoshizora Park requires its own hours and transport check.", "Bisei ist eine ländliche Gemeinde mit jahrzehntelanger Lichtpolitik und mehreren Astronomieeinrichtungen. Das Observatorium bietet das klarste Besucherprodukt; Hoshizora Park verlangt eine eigene Prüfung von Zeiten und Verkehr."),
    constraint: bi("Programme schedules, language, rural transport and weather determine whether the evening works without a car-based search.", "Programmzeiten, Sprache, ländlicher Verkehr und Wetter bestimmen, ob der Abend ohne Suche per Auto funktioniert."),
    route: bi("Confirm the observatory session, save the Japanese address and complete the final approach in daylight.", "Bestätige den Observatoriumstermin, speichere die japanische Adresse und beende die letzte Anfahrt bei Tageslicht."),
    conduct: bi("Support the community's lighting work by keeping screens and vehicle lights controlled around homes.", "Unterstütze die Lichtarbeit der Gemeinde, indem du Displays und Fahrzeuglicht nahe Häusern kontrollierst."),
    fallback: bi("A closed programme keeps the night near Ibara accommodation, not on an unverified rural lane.", "Ein geschlossenes Programm hält die Nacht nahe der Unterkunft in Ibara und nicht auf einem ungeprüften Feldweg."),
  },
  {
    id: "minami-rokuroshi", name: "Minami-Rokuroshi", countryCode: "JP", countryName: "Japan", continent: "asia", regions: ["fukui", "asia"], timezone: "Asia/Tokyo", priority: 82, tags: ["urban-night-sky-place", "observatory", "highland"], affiliateQuery: "Ono Fukui Japan",
    stay: ["ono-city", "Ono City", 35.981, 136.487],
    sites: [["fukui-nature-center", "Fukui Nature Conservation Center", 36.025, 136.594, 550, "astronomy-centre", "limited", 84], ["rokuroshi-highland", "Rokuroshi Highland visitor area", 36.02, 136.6, 560, "mountain-visitor-area", "limited", 68]],
    sources: [["DarkSky International", "Minami-Rokuroshi Urban Night Sky Place", "https://darksky.org/places/minami-rokuroshi/", "nonprofit-certifier"], ["Fukui Nature Conservation Center", "Official centre information", "https://fncc.pref.fukui.lg.jp/", "public-agency"], ["Ono City", "Official visitor information", "https://www.city.ono.fukui.jp/", "public-agency"]],
    title: bi("A highland astronomy evening within reach of Ono City", "Ein Hochland-Astronomieabend in Reichweite von Ono City"),
    opening: bi("Minami-Rokuroshi demonstrates protected night experience near a city rather than remote wilderness. The Nature Conservation Center anchors interpretation; the surrounding highland remains a working public landscape.", "Minami-Rokuroshi zeigt geschützte Nachterfahrung nahe einer Stadt statt abgelegener Wildnis. Das Nature Conservation Center verankert die Vermittlung; das umliegende Hochland bleibt eine genutzte öffentliche Landschaft."),
    constraint: bi("Centre hours, snow, road conditions and highland fog can be more important than nominal darkness.", "Zentrumszeiten, Schnee, Straßenzustand und Hochlandnebel können wichtiger als die nominelle Dunkelheit sein."),
    route: bi("Start with the centre calendar and use an independent highland stop only where current local guidance allows it.", "Beginne mit dem Zentrumskalender und nutze einen unabhängigen Hochlandhalt nur dort, wo aktuelle lokale Hinweise ihn erlauben."),
    conduct: bi("Keep public roads clear and direct every lamp away from facilities, farms and woodland.", "Halte öffentliche Straßen frei und richte jedes Licht von Einrichtungen, Höfen und Wald weg."),
    fallback: bi("Fog or a closed centre returns the evening to Ono City without searching higher roads.", "Nebel oder ein geschlossenes Zentrum verlagern den Abend nach Ono City, ohne höhere Straßen abzusuchen."),
  },
  {
    id: "lapalala", name: "Lapalala Wilderness", countryCode: "ZA", countryName: "South Africa", continent: "africa", regions: ["limpopo", "africa"], timezone: "Africa/Johannesburg", priority: 94, tags: ["dark-sky-park", "private-reserve", "wildlife"], affiliateQuery: "Waterberg Limpopo South Africa",
    stay: ["lapalala-reserve", "Lapalala Wilderness Reserve", -23.81, 28.31],
    sites: [["noka-camp-lapalala", "Noka Camp guest area", -23.804, 28.322, 1120, "private-reserve-lodge", "limited", 88], ["melote-house-lapalala", "Melote House guest area", -23.82, 28.3, 1110, "private-reserve-lodge", "limited", 84]],
    sources: [["DarkSky International", "Lapalala Wilderness Nature Reserve", "https://darksky.org/places/lapalala-wilderness-nature-reserve/", "nonprofit-certifier"], ["Lapalala Wilderness Reserve", "Official reserve information", "https://www.lapalala.com/", "protected-area"], ["Lepogo Lodges", "Lapalala guest stays", "https://lepogolodges.com/", "official-destination"]],
    title: bi("Let the Lapalala lodge team control the night", "Das Lapalala-Lodge-Team die Nacht steuern lassen"),
    opening: bi("Lapalala protects a dark savanna shared with dangerous wildlife. Stargazing is an overnight guest experience at Noka Camp or Melote House, not an independent drive into the reserve.", "Lapalala schützt eine dunkle Savanne mit gefährlichen Wildtieren. Stargazing ist ein Übernachtungserlebnis für Gäste von Noka Camp oder Melote House und keine unabhängige Fahrt ins Reservat."),
    constraint: bi("Reservation, transfer, wildlife protocols and lodge operations are absolute requirements for access.", "Reservierung, Transfer, Wildtierprotokolle und Lodgebetrieb sind absolute Zugangsbedingungen."),
    route: bi("Book the lodge and transfer, follow the arrival briefing and observe only from the place selected by staff.", "Buche Lodge und Transfer, folge der Ankunftseinweisung und beobachte nur an dem vom Team gewählten Ort."),
    conduct: bi("Never leave the guest area, use playback or shine light toward animals without staff direction.", "Verlasse niemals den Gästebereich, spiele keine Tierlaute ab und leuchte ohne Anweisung nicht auf Tiere."),
    fallback: bi("If staff cancel outdoor activity, the indoor lodge plan is the only appropriate alternative.", "Wenn das Team Außenaktivität absagt, ist das Lodge-Innenprogramm die einzig angemessene Alternative."),
  },
];

if (candidates.length !== 25) throw new Error(`Catalog expansion requires 25 candidates, found ${candidates.length}`);

const idsFor = (item) => [`${item.id}-designation`, `${item.id}-access`, `${item.id}-visitor`];
const sourceRecords = (item) => item.sources.map(([publisher, title, url, authority], index) => ({ id: idsFor(item)[index], publisher, title, url, checkedAt: "2026-09-08", authority }));

function guideFor(item, index) {
  const ids = idsFor(item);
  const primary = item.sites[0][1];
  const secondary = item.sites[1][1];
  const base = item.stay[1];
  const sectionOrder = index % 3;
  const sections = [
    {
      id: `${item.id}-place`, heading: bi(`${primary} is the useful starting point`, `${primary} ist der sinnvolle Ausgangspunkt`), sourceIds: ids,
      paragraphs: {
        en: [`${item.opening.en} ${primary} is recommended because published visitor information gives the decision a defensible starting point. ${secondary} stays on the page to show how geography changes within the destination, not to encourage a second drive after dark.`, `${item.name} works best when the visitor decides how the vehicle, final walking line and return will function before considering equipment. The selected coordinates change the Sun, Moon, stars and local horizon calculation. They do not prove that a gate is open or describe cloud, smoke, buildings and temporary hazards.`],
        de: [`${item.opening.de} ${primary} wird empfohlen, weil veröffentlichte Besucherinformationen der Entscheidung einen belastbaren Ausgangspunkt geben. ${secondary} bleibt auf der Seite, um die geografischen Unterschiede des Ziels zu zeigen und nicht um nach Einbruch der Dunkelheit zu einer zweiten Fahrt anzuregen.`, `${item.name} funktioniert am besten, wenn Fahrzeug, letzter Gehweg und Rückkehr vor der Ausrüstungsfrage geklärt sind. Die gewählten Koordinaten verändern die Berechnung von Sonne, Mond, Sternen und lokalem Horizont. Sie beweisen weder ein offenes Tor noch beschreiben sie Wolken, Rauch, Gebäude oder vorübergehende Gefahren.`],
      },
    },
    {
      id: `${item.id}-limit`, heading: bi(`What can overrule a clear ${item.name} forecast`, `Was eine klare Prognose für ${item.name} aufheben kann`), sourceIds: ids,
      paragraphs: {
        en: [`${item.constraint.en} Read the managing authority's current notice together with the weather and the destination score. The score compares climatological months; it is not permission, a road report or a forecast for tonight. Any contradiction is resolved in favour of the current local rule.`, `${item.name} therefore needs a deliberate cancellation threshold. If legal parking, a safe surface, the return route or the current operating arrangement cannot be confirmed, do not convert uncertainty into an unofficial pull-out. A lower or shorter session near ${base} is a better result than an unsupported remote arrival.`],
        de: [`${item.constraint.de} Lies die aktuelle Mitteilung der Verwaltung gemeinsam mit Wetter und Destinationswert. Der Wert vergleicht klimatologische Monate; er ist weder Erlaubnis, Straßenbericht noch Vorhersage für heute Nacht. Jeder Widerspruch wird zugunsten der aktuellen lokalen Regel gelöst.`, `${item.name} braucht deshalb eine bewusste Absagegrenze. Lassen sich legales Parken, sicherer Untergrund, Rückweg oder aktuelle Betriebsregel nicht bestätigen, wird Unsicherheit nicht in eine inoffizielle Haltebucht übersetzt. Eine tiefere oder kürzere Sitzung nahe ${base} ist besser als eine ungesicherte abgelegene Ankunft.`],
      },
    },
    {
      id: `${item.id}-field`, heading: bi(`The quiet return from ${item.name}`, `Die ruhige Rückkehr aus ${item.name}`), sourceIds: ids,
      paragraphs: {
        en: [`${item.route.en} Use the remaining daylight to identify edges, signs, shared paths and the exact place where equipment can stand. Begin with naked-eye orientation and allow dark adaptation to do useful work before opening more cases or adding a screen.`, `${item.conduct.en} Pack while attention remains high, inspect the ground and follow the known return. ${item.fallback.en} This is part of the published plan rather than a failure. It protects the site, other visitors and the credibility of a guide designed for an ordinary night rather than an exceptional photograph.`],
        de: [`${item.route.de} Nutze das restliche Tageslicht, um Kanten, Schilder, gemeinsame Wege und den genauen Standort der Ausrüstung zu erkennen. Beginne mit Orientierung ohne Optik und lasse Dunkeladaption wirken, bevor weitere Koffer oder ein Display dazukommen.`, `${item.conduct.de} Packe bei guter Aufmerksamkeit, prüfe den Boden und folge dem bekannten Rückweg. ${item.fallback.de} Das ist Teil des veröffentlichten Plans und kein Scheitern. Es schützt den Ort, andere Gäste und die Glaubwürdigkeit eines Guides für eine gewöhnliche Nacht statt für ein Ausnahmefoto.`],
      },
    },
  ];
  if (sectionOrder === 1) sections.push(sections.shift());
  if (sectionOrder === 2) sections.unshift(sections.pop());
  const steps = [
    { id: `${item.id}-check`, timeHint: bi(`Before leaving ${base}`, `Vor der Abfahrt aus ${base}`), title: bi(`Open the current ${item.name} notices`, `Aktuelle Hinweise für ${item.name} öffnen`), body: bi(`${item.name} needs three checks on the travel day. Confirm the managing authority's access statement, the weather for the exact elevation and the return before departure. Save the source pages and directions offline. A historic designation describes protected darkness but cannot guarantee today's road, gate, programme or parking.`, `${item.name} verlangt am Reisetag drei Prüfungen. Bestätige Zugangsaussage der Verwaltung, Wetter für die genaue Höhe und Rückweg vor der Abfahrt. Speichere Quellseiten und Navigation offline. Eine historische Auszeichnung beschreibt geschützte Dunkelheit, garantiert aber weder heutige Straße noch Tor, Programm oder Parkplatz.`), sourceIds: ids },
    { id: `${item.id}-arrive`, timeHint: bi("Before sunset", "Vor Sonnenuntergang"), title: bi(`Read ${primary} while it is light`, `${primary} bei Licht lesen`), body: bi(`Reach ${primary} with enough daylight to find the legal vehicle position and safe observation footprint. Check signs and barriers before unloading. ${secondary} is not added merely because the first horizon is imperfect; it requires a different verified route and should be saved for another night.`, `Erreiche ${primary} mit genug Tageslicht für den legalen Fahrzeugplatz und die sichere Beobachtungsfläche. Prüfe Schilder und Schranken vor dem Ausladen. ${secondary} wird nicht ergänzt, nur weil der erste Horizont unvollkommen ist; der Ort verlangt eine andere bestätigte Route und bleibt einer weiteren Nacht vorbehalten.`), sourceIds: ids },
    { id: `${item.id}-observe`, timeHint: bi("After twilight", "Nach der Dämmerung"), title: bi(`Let the ${item.name} sky settle`, `Den Himmel über ${item.name} wirken lassen`), body: bi(`At ${primary}, spend the first dark interval without white light. Identify the open horizon and add binoculars, camera or telescope only when each item can stay clear of shared movement. ${item.conduct.en} The destination remains a habitat, workplace or community after the sky becomes dark.`, `An ${primary} vergeht der erste dunkle Abschnitt ohne Weißlicht. Bestimme den offenen Horizont und ergänze Fernglas, Kamera oder Teleskop nur, wenn jedes Teil gemeinsame Bewegungsflächen freihält. ${item.conduct.de} Das Ziel bleibt Lebensraum, Arbeitsplatz oder Gemeinde, nachdem der Himmel dunkel geworden ist.`), sourceIds: ids },
    { id: `${item.id}-leave`, timeHint: bi("At the planned finish", "Zur geplanten Endzeit"), title: bi(`Return directly to ${base}`, `Direkt nach ${base} zurückkehren`), body: bi(`End the ${item.name} session before cold, wind or fatigue changes judgement. Count small equipment, inspect the surface and use the route learned in daylight. ${item.fallback.en} Record any changed access detail for a future revision instead of trying to solve it through a late detour.`, `Beende die Sitzung in ${item.name}, bevor Kälte, Wind oder Müdigkeit das Urteil verändern. Zähle Kleinteile, prüfe die Fläche und nutze die bei Tageslicht gelernte Route. ${item.fallback.de} Notiere geänderte Zugangsdetails für eine spätere Überarbeitung, statt sie mit einem späten Umweg lösen zu wollen.`), sourceIds: ids },
  ];
  return {
    version: 1, destinationId: item.id, slug: item.id,
    seoTitle: bi(`${item.name} stargazing guide and observing sites`, `Stargazing-Guide ${item.name} und Beobachtungsorte`),
    seoDescription: bi(`Plan a sourced stargazing night in ${item.name} with two real sites, current access checks and a practical return route.`, `Plane eine belegte Beobachtungsnacht in ${item.name} mit zwei realen Orten, Zugangsprüfung und praktischem Rückweg.`),
    standfirst: bi(`${item.opening.en} ${item.constraint.en} The page separates astronomy calculated for each site from the live decisions that remain with the visitor and managing authority.`, `${item.opening.de} ${item.constraint.de} Die Seite trennt die für jeden Ort berechnete Astronomie von den aktuellen Entscheidungen, die bei Besuchern und Verwaltung bleiben.`),
    editorialAngle: bi(`${item.route.en} ${item.fallback.en} The result is one usable evening rather than a collection of attractive but incompatible map pins.`, `${item.route.de} ${item.fallback.de} Das Ergebnis ist ein brauchbarer Abend statt einer Sammlung schöner, aber unvereinbarer Kartenmarken.`),
    sections,
    tour: { title: item.title, summary: bi(`${item.route.en} ${item.constraint.en} The route fixes ${primary} as the night's decision point and keeps ${secondary} for a separate, fully checked occasion. ${item.fallback.en}`, `${item.route.de} ${item.constraint.de} Die Route legt ${primary} als Entscheidungspunkt der Nacht fest und bewahrt ${secondary} für einen getrennten, vollständig geprüften Anlass. ${item.fallback.de}`), duration: bi("One evening with daylight arrival and a direct return", "Ein Abend mit Ankunft bei Tageslicht und direkter Rückkehr"), suitability: bi(`For independent visitors who can verify the current ${item.name} access and manage the return from ${primary} without improvisation.`, `Für unabhängige Gäste, die den aktuellen Zugang in ${item.name} prüfen und die Rückkehr von ${primary} ohne Improvisation bewältigen können.`), sourceIds: ids, steps },
    fieldNotesTitle: bi(`Three limits specific to ${item.name}`, `Drei Grenzen speziell für ${item.name}`),
    fieldNotes: [
      { id: `${item.id}-access-note`, title: bi(`${item.name} access is dated information`, `Zugang in ${item.name} ist datierte Information`), body: bi(`${primary} is listed because a published authority supports its visitor role. Check that source again for the actual date. The coordinate drives the sky model but never grants entry, parking, camping or permission to pass a barrier.`, `${primary} ist aufgeführt, weil eine veröffentlichte Stelle seine Besucherrolle stützt. Prüfe diese Quelle erneut für das tatsächliche Datum. Die Koordinate steuert das Himmelsmodell, gewährt aber weder Zutritt, Parken, Camping noch das Passieren einer Schranke.`), sourceIds: ids },
      { id: `${item.id}-weather-note`, title: bi(`${item.name} has a real-night veto`, `${item.name} hat ein Veto der echten Nacht`), body: bi(`${item.constraint.en} Compare those conditions with live weather and local alerts rather than extending a climatological ranking into a promise. Postponement is the correct result whenever safe access and return do not agree.`, `${item.constraint.de} Vergleiche diese Bedingungen mit Live-Wetter und lokalen Meldungen, statt eine klimatologische Rangliste als Versprechen zu verlängern. Verschieben ist das richtige Ergebnis, sobald sicherer Zugang und Rückkehr nicht zusammenpassen.`), sourceIds: ids },
      { id: `${item.id}-light-note`, title: bi(`Light changes ${primary}`, `Licht verändert ${primary}`), body: bi(`${item.conduct.en} Red light should still be dim, brief and pointed downward. Prepare the cabin and phone before arrival so doors, screens and headlights do not reset other visitors' adaptation.`, `${item.conduct.de} Auch Rotlicht bleibt gedimmt, kurz und nach unten gerichtet. Bereite Innenraum und Telefon vor der Ankunft vor, damit Türen, Displays und Scheinwerfer die Dunkeladaption anderer nicht zurücksetzen.`), sourceIds: ids },
    ],
    faq: [
      { question: bi(`Is ${primary} guaranteed to be open at night?`, `Ist ${primary} nachts garantiert offen?`), answer: bi(`No permanent guarantee is implied. Consult the cited managing authority for the chosen date and confirm gates, parking, programmes, booking and emergency restrictions. ${item.fallback.en} Silence on an old page should never be interpreted as current permission.`, `Eine dauerhafte Garantie ist nicht gemeint. Prüfe bei der zitierten Verwaltung für das gewählte Datum Tore, Parken, Programme, Buchung und Notfallregeln. ${item.fallback.de} Schweigen auf einer alten Seite darf niemals als aktuelle Erlaubnis verstanden werden.`), sourceIds: ids },
      { question: bi(`Does the ${item.name} score describe tonight?`, `Beschreibt der Wert für ${item.name} die heutige Nacht?`), answer: bi(`The monthly score compares historical climate, darkness, elevation and reviewed access inputs. The sky panel calculates geometry for the selected site and time. Neither includes tonight's cloud, smoke, road surface, temporary closure or every local obstruction, so a live check remains necessary.`, `Der Monatswert vergleicht historisches Klima, Dunkelheit, Höhe und geprüfte Zugangsdaten. Das Himmelspanel berechnet die Geometrie für gewählten Ort und Zeit. Weder heutige Wolken, Rauch, Straßenoberfläche, temporäre Sperren noch jedes lokale Hindernis sind enthalten; eine Live-Prüfung bleibt nötig.`), sourceIds: ids },
    ],
    sources: sourceRecords(item), lastReviewedAt: "2026-09-08",
  };
}

function tourFor(item, index) {
  const ids = idsFor(item);
  const primary = item.sites[0][1];
  const secondary = item.sites[1][1];
  const base = item.stay[1];
  const blocks = [
    { id: `${item.id}-tour-place`, kind: "prose", heading: bi(`Why the route stops at ${primary}`, `Warum die Route an ${primary} endet`), paragraphs: { en: [`${item.opening.en} This route makes ${primary} the only observing stop so attention stays with the sky and the known return. ${secondary} is useful for a different date after its own current check.`, `${item.conduct.en} Begin with an empty-handed look at the horizon. Equipment is added only after the safe footprint, shared paths and final packing sequence are clear.`], de: [`${item.opening.de} Diese Route macht ${primary} zum einzigen Beobachtungshalt, damit die Aufmerksamkeit bei Himmel und bekanntem Rückweg bleibt. ${secondary} ist nach eigener aktueller Prüfung für ein anderes Datum nützlich.`, `${item.conduct.de} Beginne mit einem Blick ohne Ausrüstung auf den Horizont. Ausrüstung kommt erst hinzu, wenn sichere Fläche, gemeinsame Wege und letzte Packreihenfolge klar sind.`] }, sourceIds: ids },
    { id: `${item.id}-tour-timing`, kind: "schedule", heading: bi(`The usable sequence for ${item.name}`, `Die brauchbare Reihenfolge für ${item.name}`), introduction: bi("The route protects daylight on arrival and attention on departure.", "Die Route bewahrt Tageslicht bei Ankunft und Aufmerksamkeit bei Abfahrt."), items: [
      { time: bi("Before travel", "Vor der Fahrt"), title: bi("Confirm access and return", "Zugang und Rückkehr bestätigen"), body: bi(`${item.constraint.en} Open the current authority, weather and route information before leaving ${base}. Save the evidence and navigation offline.`, `${item.constraint.de} Öffne aktuelle Verwaltungs-, Wetter- und Routeninformationen vor der Abfahrt aus ${base}. Speichere Nachweis und Navigation offline.`), sourceIds: ids },
      { time: bi("Before sunset", "Vor Sonnenuntergang"), title: bi(`Settle at ${primary}`, `An ${primary} ankommen`), body: bi(`${item.route.en} Read signs, edges and the walking surface before unloading, then keep the vehicle in its legal position until departure.`, `${item.route.de} Lies Schilder, Kanten und Gehfläche vor dem Ausladen und lasse das Fahrzeug bis zur Abfahrt legal stehen.`), sourceIds: ids },
      { time: bi("After darkness", "Nach Einbruch der Dunkelheit"), title: bi("Observe without expanding the footprint", "Beobachten ohne die Fläche zu erweitern"), body: bi(`${item.conduct.en} Let the eyes adapt and add only equipment that can remain within the inspected area. Leave by the same route before fatigue builds.`, `${item.conduct.de} Lasse die Augen adaptieren und ergänze nur Ausrüstung innerhalb der geprüften Fläche. Fahre auf derselben Route ab, bevor Müdigkeit wächst.`), sourceIds: ids },
    ] },
    { id: `${item.id}-tour-decisions`, kind: "decisions", heading: bi(`Two outcomes are enough in ${item.name}`, `Zwei Ergebnisse genügen in ${item.name}`), introduction: bi("A supported night proceeds; an unsupported one stops.", "Eine bestätigte Nacht findet statt, eine unbestätigte endet."), items: [
      { label: bi(`${primary} is confirmed`, `${primary} ist bestätigt`), body: bi(`Arrive in daylight, remain at the selected site and return directly to ${base}. Do not add ${secondary} merely because time remains.`, `Komme bei Tageslicht, bleibe am gewählten Ort und kehre direkt nach ${base} zurück. Ergänze ${secondary} nicht nur wegen verbleibender Zeit.`), sourceIds: ids },
      { label: bi("A critical detail is missing", "Ein kritisches Detail fehlt"), body: bi(`${item.fallback.en} The safer decision is complete and does not need a replacement roadside stop.`, `${item.fallback.de} Die sicherere Entscheidung ist vollständig und braucht keinen Ersatzhalt am Straßenrand.`), sourceIds: ids },
    ] },
    { id: `${item.id}-tour-warning`, kind: "note", heading: bi(`The non-negotiable ${item.name} boundary`, `Die unverhandelbare Grenze in ${item.name}`), body: bi(`${item.constraint.en} This limit is checked before equipment leaves the vehicle and remains valid even under a geometrically clear sky. ${item.fallback.en}`, `${item.constraint.de} Diese Grenze wird geprüft, bevor Ausrüstung das Fahrzeug verlässt, und gilt auch bei geometrisch klarem Himmel. ${item.fallback.de}`), sourceIds: ids, tone: "warning" },
  ];
  const offset = index % blocks.length;
  const ordered = [...blocks.slice(offset), ...blocks.slice(0, offset)];
  return {
    version: 1, id: `${item.id}-one-site-night`, slug: `${item.id}-one-site-night`, destinationId: item.id, recommendedSiteId: item.sites[0][0],
    title: item.title,
    seoDescription: bi(`A sourced one-site route for ${item.name}, using ${primary}, daylight arrival and a verified return to ${base}.`, `Eine belegte Ein-Ort-Route für ${item.name} mit ${primary}, Tageslicht-Ankunft und bestätigter Rückkehr nach ${base}.`),
    standfirst: bi(`${item.route.en} ${item.constraint.en} This independent plan commits to ${primary}, leaves ${secondary} for another verified night and treats a calm return to ${base} as part of successful observing.`, `${item.route.de} ${item.constraint.de} Dieser unabhängige Plan legt sich auf ${primary} fest, bewahrt ${secondary} für eine andere bestätigte Nacht und versteht die ruhige Rückkehr nach ${base} als Teil einer erfolgreichen Beobachtung.`),
    facts: [
      { label: bi("Observe at", "Beobachten an"), value: bi(primary, primary), sourceIds: ids },
      { label: bi("Return base", "Rückkehrbasis"), value: bi(base, base), sourceIds: ids },
      { label: bi("Arrival rule", "Ankunftsregel"), value: bi("Before sunset after a same-day access check", "Vor Sonnenuntergang nach Zugangskontrolle am selben Tag"), sourceIds: ids },
      { label: bi("Separate alternative", "Getrennte Alternative"), value: bi(secondary, secondary), sourceIds: ids },
    ],
    blocks: ordered, sourceIds: ids, lastReviewedAt: "2026-09-08",
  };
}

const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const stays = read("data-config/sources/stay-areas.json");
const destinationImages = read("data-config/sources/destination-images.json");
const siteImages = read("data-config/sources/site-images.json");
const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const append = (array, item, key = "id") => { const existing = array.findIndex((value) => value[key] === item[key]); if (existing < 0) array.push(item); else array[existing] = item; };
const remove = (array, value, key = "id") => {
  const index = array.findIndex((item) => item[key] === value);
  if (index >= 0) array.splice(index, 1);
};

// The first research pass treated !Ae!Hai as separate from the existing
// Kalahari destination and overwrote its Twee Rivieren site. Restore that
// original record and replace the duplicate destination with OM Dark Sky Park.
remove(destinations, "aehai-kalahari");
remove(sites, "xaus-lodge");
append(sites, {
  id: "twee-rivieren-rest-camp", slug: "twee-rivieren-rest-camp", destinationId: "kalahari",
  name: "Twee Rivieren Rest Camp", lat: -26.4756, lon: 20.6133, elevationM: 880,
  siteType: "reserve-camp", publicAccess: "limited", accessScore: 68, active: true,
  priority: 96, certificationIds: [], notesSourceUrl: "https://www.sanparks.org/parks/kgalagadi",
  accessNotes: bi(
    "Twee Rivieren is a bookable SANParks rest camp in Kgalagadi. Night movement is restricted to designated camp areas; reservations, gate times, wildlife rules, and border procedures apply.",
    "Twee Rivieren ist ein buchbares SANParks-Restcamp im Kgalagadi. Nächtliche Bewegung ist auf ausgewiesene Campbereiche beschränkt; Reservierung, Torzeiten, Wildtierregeln und Grenzverfahren gelten.",
  ),
});
remove(stays, "twee-rivieren");
remove(destinationImages, "aehai-kalahari", "slug");
remove(siteImages, "xaus-lodge", "slug");
remove(guides, "aehai-kalahari", "destinationId");
remove(tours, "aehai-kalahari", "destinationId");

for (const [index, item] of candidates.entries()) {
  const observationSiteIds = item.sites.map((site) => site[0]);
  append(destinations, { id: item.id, slug: item.id, name: item.name, countryCode: item.countryCode, countryName: item.countryName, continent: item.continent, regionSlugs: item.regions, timezone: item.timezone, active: true, priority: item.priority, tags: item.tags, observationSiteIds, stayAreaIds: [item.stay[0]], affiliateQuery: item.affiliateQuery });
  for (const site of item.sites) {
    const [id, name, lat, lon, elevationM, siteType, publicAccess, accessScore] = site;
    append(sites, { id, slug: id, destinationId: item.id, name, lat, lon, elevationM, siteType, publicAccess, accessScore, active: true, priority: item.priority, certificationIds: [], notesSourceUrl: item.sources[1][2], accessNotes: bi(`Use only the current published visitor arrangement for ${name}. Confirm parking, booking, opening, hazards and the return before travel; this coordinate is not permission to enter or camp.`, `Nutze für ${name} nur die aktuell veröffentlichte Besucherregelung. Bestätige Parken, Buchung, Öffnung, Gefahren und Rückkehr vor der Fahrt; diese Koordinate ist keine Zutritts- oder Campingerlaubnis.`) });
    append(siteImages, { slug: id, status: "pending", overrideReason: "Awaiting a fully attributed CC0, CC BY, CC BY-SA, public-domain, or government-work image." }, "slug");
  }
  append(stays, { id: item.stay[0], destinationId: item.id, name: item.stay[1], lat: item.stay[2], lon: item.stay[3], affiliateQuery: `${item.stay[1]} ${item.countryName}`, observationSiteIds });
  append(destinationImages, { slug: item.id, status: "pending", overrideReason: "Awaiting a fully attributed CC0, CC BY, CC BY-SA, public-domain, or government-work image." }, "slug");
  append(guides, guideFor(item, index), "slug");
  append(tours, tourFor(item, index), "slug");
}

write("data-config/sources/destinations.json", destinations);
write("data-config/sources/observation-sites.json", sites);
write("data-config/sources/stay-areas.json", stays);
write("data-config/sources/destination-images.json", destinationImages);
write("data-config/sources/site-images.json", siteImages);
write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
console.log(`Expanded catalog to ${destinations.length} destinations, ${sites.length} sites, ${guides.length} guides and ${tours.length} tours.`);

export { candidates };
