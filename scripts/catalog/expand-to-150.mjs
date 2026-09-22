import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const write = (file, value) => fs.writeFileSync(path.join(root, file), `${JSON.stringify(value, null, 2)}\n`);
const bi = (en, de) => ({ en, de });

// A deliberately small, source-led record for each new destination. Coordinates
// identify the named visitor area; they are never used as a substitute for
// current opening, parking, camping, or permit information.
const candidates = [
  ["isle-of-sark", "Isle of Sark", "GB", "United Kingdom", "europe", ["channel-islands", "europe"], "Europe/Guernsey", 86, ["island", "dark-sky-community", "coastal"], "Isle of Sark Channel Islands", ["sark", "Sark", 49.43, -2.36], [["sark-lighthouse", "Sark Lighthouse approach", 49.43, -2.36, 90, "coastal-viewpoint", "limited", 70], ["sark-windmill", "Sark Windmill lane", 49.43, -2.35, 70, "rural-lane", "limited", 64]], ["https://darksky.org/places/sark-dark-sky-community/", "https://www.sark.co.uk/travel", "https://sark.co.uk/getting-around/"], "island darkness and a short return", "Inselhimmel und kurzer Rückweg"],
  ["sierra-morena", "Sierra Morena", "ES", "Spain", "europe", ["andalusia", "europe"], "Europe/Madrid", 88, ["starlight-reserve", "mountains", "rural"], "Sierra Morena Spain stargazing", ["almaden-de-la-plata", "Almadén de la Plata", 37.874, -6.08], [["sierra-morena-almadén", "Observatorio Astronómico de Almadén de la Plata", 37.86471, -6.14661, 412, "public-observatory", "limited", 20, "https://www.almadendelaplata.es/es/temas/turismo/observatorio-astronomico/", "The municipal page identifies the observatory at Mirador de La Traviesa, but the operator currently redirects astronomy activities elsewhere. Arrange a visit directly and confirm this site is operating before travel; this coordinate does not grant independent access.", "Die Gemeindeseite verortet das Observatorium am Mirador de La Traviesa, doch der Betreiber verweist astronomische Aktivitäten derzeit an einen anderen Ort. Vereinbare einen Besuch direkt und bestätige vor der Fahrt den Betrieb; diese Koordinate gewährt keinen selbstständigen Zutritt."], ["sierra-morena-constantina", "Castillo de Constantina", 37.87335, -5.6228, 620, "historic-site", "limited", 20, "https://www.constantina.org/es/actualidad/eventos/Observacion-Astronomica-en-el-Castillo-de-Constantina/", "The municipal page documents a registration-only astronomy event at the castle on 4 July 2024. It does not establish routine night access. Use this site only for a newly announced municipal event whose meeting point and access have been confirmed.", "Die Gemeindeseite dokumentiert am 4. Juli 2024 eine anmeldepflichtige Astronomieveranstaltung auf der Burg. Daraus folgt kein regulärer Nachtzugang. Nutze den Ort nur für eine neu angekündigte kommunale Veranstaltung mit bestätigtem Treffpunkt und Zugang."]], ["https://www.andalucia.org/actividades-y-atracciones/astroturismo-turismo-de-estrella/reserva-starlight-de-sierra-morena/", "https://www.almadendelaplata.es/es/temas/turismo/observatorio-astronomico/", "https://www.almadendelaplata.es/es/temas/turismo/la-traviesa/", "https://www.xn--asociacionastronomicadeespaa-oyc.es/Observatorio-Astronomico-de-Almaden-de-la-Plata%2C-Sevilla/", "https://www.constantina.org/es/actualidad/eventos/Observacion-Astronomica-en-el-Castillo-de-Constantina/", "https://patricia.dipusevilla.es/ver-punto/es/01924e2c-b988-7723-8be2-c6a80751e360"], "a confirmation-first plan using only a currently announced programme", "Ein bestätigungsbasierter Plan ausschließlich mit aktuell angekündigtem Programm", { accessMode: "programme-only", sourceAuthorities: ["official-destination", "public-agency", "public-agency", "official-destination", "public-agency", "public-agency"] }],
  ["monfrague", "Monfragüe", "ES", "Spain", "europe", ["extremadura", "europe"], "Europe/Madrid", 87, ["national-park", "dark-sky", "river"], "Monfrague National Park Spain", ["torrejón-el-rubio", "Torrejón el Rubio", 39.85, -5.98], [["monfrague-castillo", "Castillo de Monfragüe", 39.82815, -6.05149, 458, "historic-site", "limited", 58, "https://turismomonfrague.es/imprescindible/castillo-de-monfrague/", "The reserve tourism authority names the castle as a stargazing location and describes a roughly 20-minute walk from the designated parking area followed by stairs. Confirm current park notices before travel, arrive in daylight and use only the signed route; the coordinate grants neither vehicle access to the castle nor permission to camp.", "Die Tourismusverwaltung der Biosphärenreserve nennt die Burg als Sternbeobachtungsort und beschreibt vom ausgewiesenen Parkplatz einen etwa 20-minütigen Fußweg mit anschließendem Treppenabschnitt. Prüfe vor der Fahrt aktuelle Parkhinweise, komme bei Tageslicht an und nutze ausschließlich den ausgeschilderten Weg; die Koordinate gewährt weder Fahrzeugzugang zur Burg noch eine Campingerlaubnis."], ["monfrague-salto-gitano", "Salto del Gitano", 39.82855, -6.05783, 236, "park-viewpoint", "limited", 62, "https://turismomonfrague.es/imprescindible/salto-del-gitano/", "The reserve tourism authority names Salto del Gitano as a stargazing location and describes access by road or a signed walk from Villarreal de San Carlos. It is also a sensitive wildlife viewpoint beside a public road: use only designated parking, keep light and noise minimal, and recheck current park notices before a night visit.", "Die Tourismusverwaltung der Biosphärenreserve nennt Salto del Gitano als Sternbeobachtungsort und beschreibt die Anfahrt über die Straße oder einen ausgeschilderten Fußweg ab Villarreal de San Carlos. Der Ort ist zugleich ein sensibler Wildtier-Aussichtspunkt an einer öffentlichen Straße: Nutze nur ausgewiesene Parkflächen, minimiere Licht und Lärm und prüfe vor einem Nachtbesuch aktuelle Parkhinweise."]], ["https://turismomonfrague.es/astroturismo/", "https://turismomonfrague.es/imprescindible/castillo-de-monfrague/", "https://turismomonfrague.es/imprescindible/salto-del-gitano/", "https://www.miteco.gob.es/content/dam/miteco/es/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/normas_tcm30-67044.pdf", "https://www.miteco.gob.es/en/parques-nacionales-oapn/red-parques-nacionales/parques-nacionales/monfrague/guia-visitante/itinerarios.html"], "a plan built around one verified park viewpoint per evening; wildlife-first light discipline is required.", "Ein Plan mit einem verifizierten Parkaussichtspunkt pro Abend; wildtiergerechte Lichtdisziplin ist Pflicht.", { checkedAt: "2026-09-17", sourceAuthorities: ["public-agency", "public-agency", "public-agency", "public-agency", "public-agency"], sourceTitles: ["Monfragüe Biosphere Reserve: Astrotourism", "Monfragüe Biosphere Reserve: Castillo de Monfragüe", "Monfragüe Biosphere Reserve: Salto del Gitano", "Monfragüe National Park visitor rules", "Monfragüe National Park visitor itineraries"] }],
  ["sierra-de-gredos", "Sierra de Gredos", "ES", "Spain", "europe", ["castile-and-leon", "europe"], "Europe/Madrid", 85, ["mountain", "starlight", "highland"], "Sierra de Gredos Spain astronomy", ["navarredonda-de-gredos", "Navarredonda de Gredos", 40.36, -5.13], [["gredos-navarredonda-mirador", "Mirador Estelar de Navarredonda de Gredos", 40.36303, -5.12396, 1598, "dark-sky-viewpoint", "limited", 74, "https://navarredondadegredos.net/observacion-astronomica-en-el-mirador-estelar-de-navarredonda-de-gredos-el-dia-1-de-agosto-de-2025-a-las-2300h/", "The provincial tourism authority lists Navarredonda in its purpose-built stellar-viewpoint network, with a stable platform, parking, fencing and access directions. The municipality also documents a 23:00 astronomy event at this named viewpoint. Recheck local signs and current notices before an independent visit; the coordinate does not authorize camping.", "Die Tourismusbehörde der Provinz führt Navarredonda in ihrem Netz angelegter Sternen-Aussichtspunkte mit stabiler Plattform, Parkplatz, Einfriedung und Wegweisung. Die Gemeinde dokumentiert zudem eine Astronomieveranstaltung um 23:00 Uhr an diesem benannten Aussichtspunkt. Prüfe vor einem selbstständigen Besuch örtliche Schilder und aktuelle Hinweise erneut; die Koordinate erlaubt kein Camping."], ["gredos-hoyos-mirador", "Mirador Estelar de Hoyos del Espino", 40.35239, -5.16424, 1520, "dark-sky-viewpoint", "limited", 72, "https://ayuntamientohoyosdelespino.es/fiestas-patronales-hoyos-del-espino-2026/", "The provincial tourism authority lists Hoyos del Espino in its purpose-built stellar-viewpoint network, and the municipality documents a 22:30 astronomy event at Mirador Estelar Mesegosillo (Las Cocinillas). That event confirms night use of the named facility, not unrestricted parking or camping; follow current signs and municipal notices.", "Die Tourismusbehörde der Provinz führt Hoyos del Espino in ihrem Netz angelegter Sternen-Aussichtspunkte, und die Gemeinde dokumentiert um 22:30 Uhr eine Astronomieveranstaltung am Mirador Estelar Mesegosillo (Las Cocinillas). Die Veranstaltung bestätigt die nächtliche Nutzung des benannten Ortes, aber weder uneingeschränktes Parken noch Camping; beachte aktuelle Schilder und kommunale Hinweise."]], ["https://www.turismoavila.com/web/descubrir_avila/visor/index.php?iid=5b2136a6c4120-97", "https://www.turismoavila.com/web/multimedia/folletos/Miradores_Estelares_Cielo_Oscuro.pdf", "https://www.turismocastillayleon.com/en/nature/astrotourism/dark-skies-gredos-iruelas", "https://www.diputacionavila.es/noticias/el-parque-regional-de-gredos-obtiene-la-renovacion-del-certificado-de-reserva-starlight-para-cuatro-anos-mas.html", "https://navarredondadegredos.net/observacion-astronomica-en-el-mirador-estelar-de-navarredonda-de-gredos-el-dia-1-de-agosto-de-2025-a-las-2300h/", "https://ayuntamientohoyosdelespino.es/fiestas-patronales-hoyos-del-espino-2026/"], "a village-based night at a purpose-built stellar viewpoint; mountain weather and local signs decide whether the plan runs.", "Eine dorfnahe Nacht an einem angelegten Sternen-Aussichtspunkt; Bergwetter und örtliche Hinweise entscheiden über die Durchführung.", { checkedAt: "2026-09-17", sourceAuthorities: ["public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency"], sourceTitles: ["Ávila Tourism: Dark Skies in northern Gredos", "Ávila Tourism: Dark Skies stellar-viewpoint network", "Castile and León Tourism: Dark skies in Gredos and Iruelas", "Ávila Provincial Council: renewed Sierra de Gredos Starlight certification", "Navarredonda municipality: astronomy at the stellar viewpoint", "Hoyos del Espino municipality: astronomy at Mirador Estelar Mesegosillo"] }],
  ["javalambre", "Javalambre", "ES", "Spain", "europe", ["aragon", "europe"], "Europe/Madrid", 89, ["mountain", "observatory", "rural"], "Javalambre Teruel Spain", ["arcos-de-las-salinas", "Arcos de las Salinas", 40.02, -1.00], [["javalambre-galactica", "Galáctica astronomy centre", 39.9991162, -1.0407695, 1126, "public-observatory", "limited", 64, "https://galactica.org.es/prepara-tu-visita/", "The official visitor page confirms bookable nighttime telescope activities and onsite parking. Use this site only with a dated reservation or published programme; weather may cancel the observation, and the coordinate grants neither access outside the booking nor permission to camp.", "Die offizielle Besuchsseite bestätigt buchbare nächtliche Teleskopaktivitäten und einen Parkplatz vor Ort. Nutze diesen Ort nur mit datierter Reservierung oder veröffentlichtem Programm; das Wetter kann die Beobachtung absagen, und die Koordinate gewährt weder Zugang außerhalb der Buchung noch eine Campingerlaubnis."], ["javalambre-oaj-guided-visit", "Observatorio Astrofísico de Javalambre guided visit", 40.0412972, -1.0164167, 1957, "public-observatory", "limited", 20, "https://oaj.cefca.es/oaj_visits/visits", "CEFCA publishes the summit coordinate and 1,957-metre elevation and directs public visits through Galáctica. Galáctica states that this is an outreach tour, not direct observing. Use only a booked guided visit and its official access instructions; do not treat the research observatory or its gate as an independent night-observing site.", "CEFCA veröffentlicht die Gipfelkoordinate und 1.957 Meter Höhe und verweist öffentliche Besuche an Galáctica. Galáctica erklärt, dass dies eine Wissensführung und keine direkte Beobachtung ist. Nutze ausschließlich eine gebuchte Führung mit deren offiziellen Zufahrtshinweisen; behandle weder das Forschungsobservatorium noch sein Tor als selbstständigen Nachtbeobachtungsplatz."]], ["https://galactica.org.es/prepara-tu-visita/", "https://galactica.org.es/actividades/", "https://galactica.org.es/sobre-nosotros/", "https://oaj.cefca.es/oaj_visits/visits", "https://oajweb.cefca.es/oaj/principal", "https://experiencias.turismodearagon.com/portfolio/noches-galacticas/"], "a booked Galáctica observing programme, with the OAJ kept as a separate guided science visit rather than an independent night site.", "Ein gebuchtes Beobachtungsprogramm bei Galáctica; der OAJ bleibt eine getrennte Wissenschaftsführung und kein selbstständiger Nachtplatz.", { accessMode: "programme-only", checkedAt: "2026-09-17", sourceAuthorities: ["public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency"], sourceTitles: ["Galáctica: Prepare your visit", "Galáctica: Current activity calendar", "Galáctica: Facilities and nighttime amphitheatre", "OAJ: Guided visits", "OAJ: Observatory purpose and Starlight core", "Tourism of Aragón: Noches Galácticas"], programmeDetailEn: "Galáctica is usable only with a current activity booking; the OAJ is a separate guided science visit and explicitly not a direct observing session. Neither booking authorizes access to the other venue.", programmeDetailDe: "Galáctica ist nur mit aktueller Aktivitätsbuchung nutzbar; der OAJ ist eine getrennte Wissenschaftsführung und ausdrücklich keine direkte Beobachtungssitzung. Keine Buchung erlaubt den Zugang zum jeweils anderen Ort." }],
  ["aigues-tortes", "Aigüestortes", "ES", "Spain", "europe", ["catalonia", "europe"], "Europe/Madrid", 84, ["national-park", "mountain", "lake", "starlight"], "Aiguestortes National Park Spain", ["boi", "Boí", 42.5222, 0.834], [["aigues-boi-taull-starlight", "Mirador dels estels de Boí Taüll", 42.4793803, 0.8666296, 2049, "dark-sky-viewpoint", "limited", 72, "https://www.vallboi.cat/en/starlight-destination", "The official Vall de Boí page locates this Starlight viewpoint on the accessible walkway from the ski station's P2 car park, with a planisphere for independent interpretation and observing events on selected dates. The coordinate is the mapped P2 arrival area: follow the signed walkway, recheck station notices and do not treat parking as camping permission.", "Die offizielle Seite der Vall de Boí verortet diesen Starlight-Aussichtspunkt am barrierefreien Zugangssteg vom Parkplatz P2 der Skistation; eine Planisphäre ermöglicht selbstständige Orientierung, an ausgewählten Terminen finden Beobachtungsveranstaltungen statt. Die Koordinate bezeichnet den kartierten Ankunftsbereich P2: Folge dem ausgeschilderten Steg, prüfe aktuelle Stationshinweise und verstehe Parken nicht als Campingerlaubnis."], ["aigues-sant-quirc-astronomical", "Mirador astronòmic de Sant Quirc", 42.4951864, 0.8111783, 1491, "dark-sky-viewpoint", "limited", 56, "https://www.vallboi.cat/en/viewpoint/sant-quirc-de-durro-hermitages-viewpoint", "The official destination recommends Sant Quirc for its astronomical interpretation table and publishes the viewpoint coordinate. Its dedicated access page says the only independent approach is a roughly 20-minute walk from the parking area at Durro's entrance; taxi access can be arranged. Arrive in daylight, use the signed path and do not assume vehicle access to the hermitage.", "Die offizielle Destination empfiehlt Sant Quirc wegen seiner astronomischen Orientierungstafel und veröffentlicht die Koordinate des Aussichtspunkts. Die eigene Zugangsseite nennt als einzigen selbstständigen Zugang einen etwa 20-minütigen Fußweg vom Parkplatz am Ortseingang von Durro; eine Taxifahrt kann vereinbart werden. Komme bei Tageslicht, nutze den ausgeschilderten Weg und setze keine Fahrzeugzufahrt zur Einsiedelei voraus."]], ["https://www.vallboi.cat/en/starlight-destination", "https://www.vallboi.cat/en/viewpoint/sant-quirc-de-durro-hermitages-viewpoint", "https://pirineu365.cat/estiu/boitaull/estacio/", "https://pirineu365.cat/wp-content/uploads/2026/05/BT_Planol-estiu-2026.pdf", "https://parcsnaturals.gencat.cat/en/xarxa-de-parcs/aiguestortes/gaudeix-del-parc/com-accedir-hi/", "https://parcsnaturals.gencat.cat/en/xarxa-de-parcs/aiguestortes/coneix-la-nostra-feina/normativa/"], "one verified astronomical viewpoint per night from Boí, without treating restricted park roads as observing access.", "Ein verifizierter astronomischer Aussichtspunkt pro Nacht ab Boí, ohne beschränkte Parkstraßen als Beobachtungszufahrt zu behandeln.", { checkedAt: "2026-09-17", sourceAuthorities: ["official-destination", "official-destination", "public-agency", "public-agency", "public-agency", "public-agency"], sourceTitles: ["Vall de Boí: Starlight Destination and astronomical viewpoints", "Vall de Boí: Sant Quirc de Durro viewpoint access", "Boí Taüll: official station information", "Boí Taüll: official 2026 station map", "Aigüestortes National Park: access and transport", "Aigüestortes National Park: regulations"] }],
  ["vercors", "Vercors", "FR", "France", "europe", ["auvergne-rhone-alpes", "europe"], "Europe/Paris", 84, ["regional-park", "mountain", "dark-sky-reserve"], "Vercors France stargazing", ["gresse-en-vercors", "Gresse-en-Vercors", 44.902, 5.567], [["vercors-trieves-observatory", "Observatoire d'astronomie du Trièves", 44.90013, 5.554026, 1260, "public-observatory", "limited", 64, "https://www.trieves-vercors.fr/activites/culture-et-patrimoine/524177_observatoire-dastronomie-du-trieves/", "The Trièves tourism office publishes the observatory's exact coordinate, visitor entrance and dated public sessions with telescope observing. Attend only during a currently listed public session or after direct group confirmation; follow the entrance directions behind Résidence Les Dolomites and do not infer independent access outside the programme.", "Das Tourismusbüro Trièves veröffentlicht die genaue Koordinate, den Besuchereingang und datierte öffentliche Termine mit Teleskopbeobachtung. Besuche den Ort nur zu einem aktuell aufgeführten öffentlichen Termin oder nach direkter Gruppenbestätigung; folge der Zugangsbeschreibung hinter der Résidence Les Dolomites und leite außerhalb des Programms keinen selbstständigen Zutritt ab."], ["vercors-moulins-mure-event", "Moulins de la Mure astronomy event", 44.914771, 5.379652, 1087, "event-venue", "limited", 36, "https://www.vercors-drome.com/sejour-vacances-vercors/7922765_11eme-nuit-des-etoiles-moulins-de-la-mure/", "Vercors Drôme Tourisme documents the 2026 Nuit des étoiles at this exact coordinate, including evening constellation interpretation and weather fallback. That dated listing does not establish routine night access: use the mills only when a new event is published and follow its current meeting, parking and weather instructions.", "Vercors Drôme Tourisme dokumentiert die Nuit des étoiles 2026 an dieser genauen Koordinate einschließlich abendlicher Sternbildführung und Schlechtwetteralternative. Dieser datierte Eintrag begründet keinen regulären Nachtzugang: Nutze die Mühlen nur bei einer neu veröffentlichten Veranstaltung und befolge deren aktuelle Treffpunkt-, Park- und Wetterhinweise."]], ["https://www.parc-du-vercors.fr/cielnocturne", "https://www.trieves-vercors.fr/activites/culture-et-patrimoine/524177_observatoire-dastronomie-du-trieves/", "https://www.trieves-vercors.fr/en/trieves-highlights/gresse-en-vercors/524177_trieves-astronomy-observatory/", "https://www.trieves-vercors.fr/wp-content/uploads/2026/01/gressehiver26-web.pdf", "https://www.vercors-drome.com/sejour-vacances-vercors/7922765_11eme-nuit-des-etoiles-moulins-de-la-mure/"], "a programme-led astronomy night at one confirmed venue, never a generic reserve map pin", "Eine programmgebundene Astronomienacht an einem bestätigten Ort statt an einem beliebigen Kartenpunkt der Reserve", { accessMode: "programme-only", checkedAt: "2026-09-17", sourceAuthorities: ["public-agency", "official-destination", "official-destination", "official-destination", "official-destination"], sourceTitles: ["Vercors Regional Natural Park: International Dark Sky Reserve", "Trièves tourism: Observatoire d'astronomie du Trièves", "Trièves tourism: Trièves Astronomy Observatory", "Trièves tourism: official Gresse-en-Vercors winter map 2025–2026", "Vercors Drôme Tourism: 2026 Nuit des étoiles at Moulins de la Mure"], programmeDetailEn: "The Trièves observatory is usable only during a currently published public session or after direct group confirmation. Moulins de la Mure is a separate dated event venue and must not be treated as routinely open at night.", programmeDetailDe: "Das Observatoire du Trièves ist nur während eines aktuell veröffentlichten öffentlichen Termins oder nach direkter Gruppenbestätigung nutzbar. Die Moulins de la Mure sind ein getrennter, datierter Veranstaltungsort und dürfen nicht als regulär nachts geöffnet behandelt werden." }],
  ["attersee-traunsee", "Attersee-Traunsee", "AT", "Austria", "europe", ["upper-austria", "europe"], "Europe/Vienna", 80, ["dark-sky-park", "lake", "accessible"], "Attersee Traunsee dark sky Austria", ["weyregg-am-attersee", "Weyregg am Attersee", 47.90, 13.57], [["attersee-dixi-stargazing", "Tauchplatz Dixi Sternderl-schau’n site", 47.864608, 13.563412, 470, "lakeside-viewpoint", "limited", 70, "https://www.sternenpark-attersee-traunsee.at/themen/sternderl-schauen/", "The Sternenpark authority explicitly designates Tauchplatz Dixi for stargazing and names its public car park and WC. The tourism authority lists the dive site as open year-round with 20 spaces. Use only the designated parking and established visitor footprint, keep clear of diving operations, follow current signs and leave no trace; neither the coordinate nor parking permits camping or fire.", "Die Sternenpark-Verwaltung weist den Tauchplatz Dixi ausdrücklich zum Sternderschauen aus und nennt den öffentlichen Parkplatz sowie das WC. Die Tourismusbehörde führt den Tauchplatz ganzjährig mit 20 Stellplätzen. Nutze nur den ausgewiesenen Parkplatz und die bestehende Besucherfläche, halte Tauchbetrieb frei, beachte aktuelle Schilder und hinterlasse keine Spuren; weder Koordinate noch Parkplatz erlauben Camping oder Feuer."], ["attersee-taferlklaussee", "Taferlklaussee Sternderl-schau’n site", 47.843838, 13.626818, 780, "mountain-lake", "limited", 64, "https://www.sternenpark-attersee-traunsee.at/themen/sternderl-schauen/", "The Sternenpark authority explicitly designates Taferlklaussee for stargazing and directs visitors to the lake hiking car park or Hochlecken car park. The coordinate is the officially published meeting point at the Taferlklausstube parking area; follow the signed route to the designated viewing place, respect the nature reserve and current notices, and do not infer camping, fire or vehicle access beyond the car park.", "Die Sternenpark-Verwaltung weist den Taferlklaussee ausdrücklich zum Sternderschauen aus und verweist auf den Wanderparkplatz am See oder den Hochleckenparkplatz. Die Koordinate ist der offiziell veröffentlichte Treffpunkt am Parkplatz der Taferlklausstube; folge der ausgeschilderten Route zum ausgewiesenen Schauplatz, beachte Naturschutzgebiet und aktuelle Hinweise und leite daraus weder Camping, Feuer noch eine Fahrzeugzufahrt über den Parkplatz hinaus ab."]], ["https://www.sternenpark-attersee-traunsee.at/themen/sternderl-schauen/", "https://attersee-attergau.salzkammergut.at/erleben/top-ausflugsziele/sternenpark-attersee-traunsee.html", "https://attersee-attergau.salzkammergut.at/oesterreich-poi/detail/430000495/taucheinstiegstelle-dixi-pfahlbauhaus-unter-wasser-und-unterwasserkrippe.html", "https://attersee-attergau.salzkammergut.at/fileadmin/user_upload/attersee-attergau/kataloge/pdfdateien/Abenteuer_Pfahlbau_unter_Wasser.pdf", "https://traunsee-almtal.salzkammergut.at/oesterreich-tour/detail/430006480/wohlfuehlweg-taferlklaussee.html", "https://attersee-attergau.salzkammergut.at/oesterreich-poi/detail/430027875/sternenpark-attersee-traunsee-1-sternenpark-oesterreichs.html", "https://attersee-attergau.salzkammergut.at/en/oesterreich-stadt-ort/detail/430001294/weyregg-am-attersee.html"], "one officially designated lakeside site per evening, with fog, shared visitor space and reserve rules deciding whether the plan runs", "Ein offiziell ausgewiesener Seeplatz pro Abend; Nebel, gemeinsam genutzte Besucherfläche und Schutzgebietsregeln entscheiden über die Durchführung", { checkedAt: "2026-09-17", sourceAuthorities: ["official-destination", "official-destination", "official-destination", "official-destination", "official-destination", "official-destination", "official-destination"], sourceTitles: ["Sternenpark Attersee-Traunsee: designated stargazing places", "Attersee-Attergau Tourism: Sternenpark visitor guidance", "Attersee-Attergau Tourism: Tauchplatz Dixi access and facilities", "Attersee-Attergau Tourism: Dixi coordinate reference", "Traunsee-Almtal Tourism: Taferlklaussee visitor route", "Attersee-Attergau Tourism: Sternenpark visitor rules", "Attersee-Attergau Tourism: Weyregg visitor base"] }],
  ["grossmugl", "Großmugl", "AT", "Austria", "europe", ["lower-austria", "europe"], "Europe/Vienna", 78, ["dark-sky-community", "rural", "accessible"], "Grossmugl Austria dark sky", ["grossmugl", "Großmugl", 48.494389, 16.233833], [["grossmugl-sternenwiese", "Sternenwiese at Leeberg", 48.5, 16.233, 250, "dark-sky-field", "yes", 76, "https://www.grossmugl.gv.at/Sternenweg_-_Themenwanderweg", "The municipality and the Star Walk visitor guide identify the Sternenwiese and Sternenrast at Leeberg as the public observing endpoint of the signed 1.5-kilometre trail. Park at the documented trailhead by Hauptstraße 46 and allow about 20 minutes each way on mostly unlit field paths. Use firm footwear and low red light, remain on the established route, respect farmland and wildlife, and do not infer vehicle access or camping at the observing field.", "Die Gemeinde und die Besucherinformation des Sternenwegs weisen Sternenwiese und Sternenrast beim Leeberg als öffentlichen Beobachtungsendpunkt des ausgeschilderten 1,5-Kilometer-Wegs aus. Parke am dokumentierten Startpunkt bei Hauptstraße 46 und plane auf überwiegend unbeleuchteten Feldwegen etwa 20 Minuten je Richtung ein. Nutze feste Schuhe und schwaches Rotlicht, bleibe auf dem bestehenden Weg, respektiere Landwirtschaft und Tierwelt und leite daraus weder eine Fahrzeugzufahrt noch Camping an der Beobachtungswiese ab."], ["grossmugl-sternenweg-events", "Sternenweg Station 1 guided walks", 48.494389, 16.233833, 225, "event-meeting-point", "limited", 60, "https://starlightoasis.kuffner-sternwarte.at/veranstaltungen.php", "The Kuffner Observatory association publishes dated 2026 star walks meeting at Station 1, Hauptstraße 46, with weather cancellations announced on the event page. Use this record only for a currently published guided walk and its stated meeting time. The coordinate is the meeting point, not an independent observing field; outside a programme, follow the separately documented public Star Walk and its current conditions.", "Der Verein Kuffner-Sternwarte veröffentlicht datierte Sternwanderungen 2026 mit Treffpunkt Station 1, Hauptstraße 46; wetterbedingte Absagen werden auf der Veranstaltungsseite bekanntgegeben. Nutze diesen Datensatz nur für eine aktuell veröffentlichte Führung zur angegebenen Treffzeit. Die Koordinate bezeichnet den Treffpunkt und kein selbstständiges Beobachtungsfeld; außerhalb eines Programms gilt der getrennt dokumentierte öffentliche Sternenweg mit seinen aktuellen Bedingungen."]], ["https://www.grossmugl.gv.at/Sternenweg_-_Themenwanderweg", "https://sternenweg-grossmugl.at/", "https://project-nightflight.net/sternenweg%20grossmugl%20besucherinfo.pdf", "https://www.noemuseen.at/museum/detail/sternenweg-grossmugl/", "https://starlightoasis.kuffner-sternwarte.at/", "https://starlightoasis.kuffner-sternwarte.at/veranstaltungen.php", "https://geminiden.kuffner-sternwarte.at/", "https://hms.sternhell.at/lightwiki/index.php?title=Gro%C3%9Fmugl"], "a walk from the documented village trailhead to one maintained public observing field, with guided events treated as a separate programme", "Ein Fußweg vom dokumentierten Startpunkt im Ort zu einem gepflegten öffentlichen Beobachtungsfeld; geführte Veranstaltungen bleiben ein getrenntes Programm", { checkedAt: "2026-09-17", sourceAuthorities: ["public-agency", "official-destination", "official-destination", "public-agency", "science-institution", "science-institution", "science-institution", "science-institution"], sourceTitles: ["Großmugl municipality: Sternenweg themes trail", "Sternenweg Großmugl: official visitor site", "Project Nightflight: Sternenweg visitor information", "Museumsmanagement Niederösterreich: Sternenweg visitor listing", "Kuffner Observatory association: Sternlichtoase Großmugl", "Kuffner Observatory association: 2026 star walks", "Kuffner Observatory association: maintained Großmugl observing fields", "Kuffner Observatory lightwiki: Leeberg observing coordinate"] }],
  ["poloniny", "Poloniny", "SK", "Slovakia", "europe", ["presov", "europe"], "Europe/Bratislava", 86, ["dark-sky-park", "carpathians", "forest"], "Poloniny Dark Sky Park Slovakia", ["runina", "Runina", 49.073369, 22.405239], [["poloniny-runina-centre", "Runina village centre by the church", 49.073369, 22.405239, 550, "village-centre", "limited", 68, "https://www.obecrunina.sk/podstranka.php?stranka=turistika-a-zaujimavosti", "The municipality states that astronomical observing is possible directly in Runina and that its public lighting is switched off at 21:00 and not used in summer. The national park also names the village centre as an undisturbed public observing location. Use the public village-space and bus-stop area by the church, keep clear of homes and religious activity, minimise light and noise, and do not treat nearby meadows, trails or parking as permission to enter private land or camp.", "Die Gemeinde erklärt, dass astronomische Beobachtung direkt in Runina möglich ist und die öffentliche Beleuchtung um 21:00 Uhr ausgeschaltet sowie im Sommer gar nicht eingeschaltet wird. Auch der Nationalpark nennt das Ortszentrum als ungestörten öffentlichen Beobachtungsort. Nutze den öffentlichen Dorf- und Bushaltestellenbereich bei der Kirche, halte Abstand zu Wohnhäusern und religiöser Nutzung, minimiere Licht und Lärm und verstehe benachbarte Wiesen, Wege oder Parkflächen nicht als Erlaubnis für Privatgrund oder Camping."], ["poloniny-kolonica-observatory", "Astronomical Observatory on Kolonica Saddle", 48.935194, 22.273722, 431, "public-observatory", "limited", 60, "https://www.astrokolonica.sk/rezervacny-kalendar-3/", "The observatory publishes this exact venue coordinate and offers bookable evening telescope programmes, with an indoor planetarium substitute when outdoor observing conditions fail. Attend only with a current reservation or a dated public programme and follow the operator's arrival instructions. The site is a working scientific facility, so the coordinate grants no independent after-hours access, parking or camping.", "Das Observatorium veröffentlicht für diesen Veranstaltungsort genaue Koordinaten und bietet buchbare abendliche Teleskopprogramme an; bei ungeeigneten Außenbedingungen wird im Planetarium ein Ersatzprogramm durchgeführt. Besuche den Ort nur mit aktueller Reservierung oder zu einem datierten öffentlichen Programm und befolge die Anreisehinweise des Betreibers. Der Ort ist eine aktive wissenschaftliche Einrichtung; die Koordinate gewährt daher keinen selbstständigen Zugang außerhalb der Zeiten sowie keine Park- oder Campingerlaubnis."]], ["https://www.obecrunina.sk/podstranka.php?stranka=turistika-a-zaujimavosti", "https://obecrunina.sk/podstranka?stranka=2673", "https://www.nppoloniny.sk/bebuilder-7209/", "https://www.nppoloniny.sk/sprava-np-2/park-tmavej-oblohy-poloniny/", "https://www.nppoloniny.sk/navstevnici/", "https://www.nppoloniny.sk/navstevnici/navstevny-poriadok/", "https://www.astrokolonica.sk/astronomicke-observatorium-na-kolonickom-sedle/", "https://www.astrokolonica.sk/ponuka-podujati-denna-exkurzia/", "https://www.astrokolonica.sk/rezervacny-kalendar-3/", "https://astronomy.science.upjs.sk/observatory/"], "one quiet independent village-centre session in Runina, with Kolonica kept as a separately booked observatory programme", "Eine ruhige, selbstständige Beobachtung im Ortszentrum von Runina; Kolonica bleibt ein getrennt zu buchendes Observatoriumsprogramm", { checkedAt: "2026-09-18", sourceAuthorities: ["public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "science-institution", "science-institution", "science-institution", "science-institution"], sourceTitles: ["Runina municipality: night-sky observing in the village", "Runina municipality: village elevation and location", "Poloniny National Park: public night-sky observing locations", "Poloniny National Park: Dark Sky Park", "Poloniny National Park: visitor conservation code", "Poloniny National Park: current visitor rules", "Vihorlat Observatory: Kolonica Saddle observatory", "Vihorlat Observatory: visitor tours and evening programme", "Vihorlat Observatory: booking calendar and venue coordinate", "Pavol Jozef Šafárik University: Kolonica observatory coordinate"] }],
  [
    "izera", "Izera Dark-Sky Park", "PL", "Poland", "europe", ["lower-silesia", "europe"],
    "Europe/Warsaw", 85, ["dark-sky-park", "mountain", "forest"], "Izera Dark Sky Park Poland",
    ["orle", "Orle", 50.815139, 15.382861],
    [
      [
        "izera-orle-astronomy-workshop", "Orle astronomy workshop venue", 50.815139, 15.382861, 820,
        "event-venue", "limited", 56,
        "https://turystyczna.szklarskaporeba.pl/en/1725-szklarskaporeba-astronomiczny-dzien-w-izerskim-parku-ciemnego-nieba",
        "The official Szklarska Poręba page documents night-sky observing at Orle, the exact coordinate and an elevation of 820 metres. Use this record only for a newly published programme and confirmed participation. The organiser states that Orle is reached from Jakuszyce on foot, by bicycle or by car only for overnight guests; arrange accommodation or the guided return in advance and do not infer general vehicle access, camping or an independent night trail.",
        "Die offizielle Seite von Szklarska Poręba dokumentiert Nachtbeobachtung in Orle, die genaue Koordinate und 820 Meter Höhe. Nutze diesen Datensatz nur für ein neu veröffentlichtes Programm mit bestätigter Teilnahme. Laut Veranstalter wird Orle von Jakuszyce zu Fuß, mit dem Fahrrad oder mit dem Auto ausschließlich für Übernachtungsgäste erreicht; kläre Unterkunft oder geführte Rückkehr vorab und leite daraus weder allgemeine Fahrzeugzufahrt, Camping noch eine selbstständige Nachtwanderung ab.",
      ],
      [
        "izera-izerska-laka-events", "Izerska Łąka astronomy events", 50.9278741, 15.314116, 467,
        "environmental-education-centre", "limited", 52,
        "https://stacjakultury.swieradowzdroj.pl/izerska-laka/",
        "The municipal education centre uses its telescopes for night observing only on designated dates. Its rules prohibit unaffiliated visitors anywhere on the property outside opening hours, and the municipality's dated 2026 astronomy evening required registration. Attend only a newly published event or directly confirmed group session, follow the organiser's parking instructions and leave when the programme ends; the coordinate is not permission for independent after-hours use.",
        "Das kommunale Bildungszentrum setzt seine Teleskope nur an festgelegten Terminen für Nachtbeobachtungen ein. Die Hausordnung verbietet unbeteiligten Personen den Aufenthalt auf dem gesamten Gelände außerhalb der Öffnungszeiten, und der datierte Astronomieabend 2026 der Gemeinde war anmeldepflichtig. Besuche den Ort nur zu einer neu veröffentlichten Veranstaltung oder einer direkt bestätigten Gruppensitzung, befolge die Parkhinweise des Veranstalters und verlasse das Gelände nach Programmende; die Koordinate erlaubt keine selbstständige Nutzung außerhalb der Zeiten.",
      ],
    ],
    [
      "https://ciemneniebo.pl/obszary-ochrony-ciemnego-nieba-w-polsce-cn-000/cn-003-dolina-izery",
      "https://swieradowzdroj.pl/en/2703-swieradowzdroj-izera-dark-sky-park",
      "https://swieradowzdroj.pl/upload/pdf/8214/2v-10-grudnia-niezbednik-turystyczny-2026.pdf",
      "https://turystyczna.szklarskaporeba.pl/50-szklarskaporeba-stacja-turystyczna-orle",
      "https://turystyczna.szklarskaporeba.pl/47-szklarskaporeba-astrosciezka-w-izerach",
      "https://turystyczna.szklarskaporeba.pl/en/1725-szklarskaporeba-astronomiczny-dzien-w-izerskim-parku-ciemnego-nieba",
      "https://stacjakultury.swieradowzdroj.pl/izerska-laka/",
      "https://stacjakultury.swieradowzdroj.pl/izerska-laka/regulamin/",
      "https://stacjakultury.swieradowzdroj.pl/izerska-laka/kontakt-i-dojazd/",
      "https://swieradowzdroj.pl/8494-swieradowzdroj-gwiazdy-na-izerskiej-lace",
    ],
    "a registered astronomy programme at Orle with accommodation or the guided return fixed before dark; Izerska Łąka remains a separate event-only alternative",
    "Ein angemeldetes Astronomieprogramm in Orle mit vor Einbruch der Dunkelheit geklärter Unterkunft oder geführter Rückkehr; Izerska Łąka bleibt eine getrennte Veranstaltungsalternative",
    {
      accessMode: "programme-only",
      checkedAt: "2026-09-18",
      sourceAuthorities: ["science-institution", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency"],
      sourceTitles: ["Ciemne Niebo: active Izera Dark-Sky Park protection area", "Świeradów-Zdrój: Izera Dark-Sky Park access", "Świeradów-Zdrój: 2026 visitor guide and signed park route", "Szklarska Poręba: Orle visitor access", "Szklarska Poręba: Izera astronomy trail", "Szklarska Poręba: astronomy day and night observing at Orle", "Izerska Łąka: astronomy facilities and designated dates", "Izerska Łąka: property and after-hours rules", "Izerska Łąka: booking and arrival address", "Świeradów-Zdrój: dated 2026 Izerska Łąka astronomy evening"],
      programmeDetailEn: "Orle is usable for this catalogue only with a newly published astronomy programme and a confirmed overnight or guided return plan; driving into the settlement is restricted to overnight guests. Izerska Łąka is a separate municipal venue usable only during a published event or confirmed group session.",
      programmeDetailDe: "Orle ist für diesen Katalog nur mit neu veröffentlichtem Astronomieprogramm und bestätigter Übernachtungs- oder geführter Rückkehrplanung nutzbar; die Zufahrt in die Siedlung ist Übernachtungsgästen vorbehalten. Izerska Łąka ist ein getrennter kommunaler Ort, der nur während einer veröffentlichten Veranstaltung oder bestätigten Gruppensitzung genutzt werden darf.",
    },
  ],
  [
    "tara-serbia",
    "Tara National Park",
    "RS",
    "Serbia",
    "europe",
    ["western-serbia", "europe"],
    "Europe/Belgrade",
    82,
    ["national-park", "forest", "river"],
    "Tara National Park Serbia",
    ["bajina-basta", "Bajina Bašta", 43.97, 19.57],
    [
      ["tara-zelenika-viewpoint", "Zelenika viewpoint", 43.9563893, 19.4079615, 555, "park-viewpoint", "limited", 20, "https://www.nptara.rs/za-posetioce/turizam-i-rekreacija/vidikovci.html", "The National Park authority identifies Zelenika as an equipped, road-adjacent visitor viewpoint and publishes its 555-metre elevation. The reviewed material does not identify it as an astronomy site or confirm after-dark parking and use. Treat it only as a candidate pending explicit current confirmation from the park; the coordinate grants no night access or camping permission.", "Die Nationalparkverwaltung führt Zelenika als ausgestatteten, straßennahen Besucher-Aussichtspunkt und veröffentlicht 555 Meter Höhe. Die geprüften Unterlagen weisen ihn weder als Astronomieort aus noch bestätigen sie Parken und Nutzung nach Einbruch der Dunkelheit. Behandle ihn nur als Kandidaten bis zur ausdrücklichen aktuellen Bestätigung des Parks; die Koordinate gewährt weder Nachtzugang noch Campingerlaubnis."],
      ["tara-oslusa-viewpoint", "Osluša viewpoint", 43.9390556, 19.4710556, 964, "park-viewpoint", "limited", 20, "https://www.nptara.rs/za-posetioce/turizam-i-rekreacija/vidikovci.html", "The National Park authority identifies Osluša as an arranged viewpoint at 964 metres reached along the E7 walking corridor or the Visoka Tara cycling route. The reviewed material does not establish independent astronomy use after dark. Use it only after the park confirms the intended date, hour, approach and parking; remain on marked routes and designated visitor places.", "Die Nationalparkverwaltung führt Osluša als angelegten Aussichtspunkt auf 964 Metern, erreichbar über den E7-Wanderkorridor oder die Radroute Visoka Tara. Die geprüften Unterlagen belegen keine selbstständige astronomische Nutzung nach Einbruch der Dunkelheit. Nutze ihn nur, wenn der Park Datum, Uhrzeit, Zugang und Parken bestätigt; bleibe auf markierten Routen und ausgewiesenen Besucherflächen."],
    ],
    [
      "https://www.nptara.rs/za-posetioce/turizam-i-rekreacija/vidikovci.html",
      "https://www.nptara.rs/za-posetioce/opste-informacije/planirajte-posetu.html",
      "https://www.nptara.rs/za-posetioce/nacionalni-park/pravila-ponasanja.html",
      "https://nptara.rs/images/download/Dokumenta/Pravilnik-o-unutrasnjem-redu-i-cuvarskoj-slubi.pdf",
      "https://www.nptara.rs/za-posetioce/turizam-i-rekreacija/edukativne-staze.html",
      "https://www.nptara.rs/vesti/825-presuda-za-divljanje-kvadom-u-np-tara.html"
    ],
    "two official visitor viewpoints retained only as candidates until the park confirms astronomy use after dark",
    "Zwei offizielle Besucher-Aussichtspunkte bleiben nur Kandidaten, bis der Park die astronomische Nutzung nach Einbruch der Dunkelheit bestätigt",
    {
      accessMode: "confirmation-only",
      checkedAt: "2026-09-18",
      sourceAuthorities: ["public-agency", "public-agency", "public-agency", "public-agency", "public-agency", "public-agency"],
      sourceTitles: ["Tara National Park: official viewpoints", "Tara National Park: plan your visit", "Tara National Park: visitor conduct rules", "Tara National Park: internal order and ranger-service rulebook", "Tara National Park: educational trails", "Tara National Park: traffic-ban enforcement at Banjska stena"],
      confirmationDetailEn: "Zelenika and Osluša are real, officially described visitor viewpoints, but none of the reviewed park pages confirms astronomy use after dark. Neither place is a usable catalogue recommendation until the National Park confirms the intended date, hour, access route and parking in writing.",
      confirmationDetailDe: "Zelenika und Osluša sind reale, offiziell beschriebene Besucher-Aussichtspunkte, doch keine der geprüften Parkseiten bestätigt eine astronomische Nutzung nach Einbruch der Dunkelheit. Keiner der Orte ist eine nutzbare Katalogempfehlung, bis der Nationalpark Datum, Uhrzeit, Zugangsweg und Parken schriftlich bestätigt.",
    },
  ],
  [
    "kopaonik",
    "Kopaonik",
    "RS",
    "Serbia",
    "europe",
    ["central-serbia", "europe"],
    "Europe/Belgrade",
    79,
    ["mountain", "national-park", "highland"],
    "Kopaonik National Park Serbia",
    ["kopaonik-konaci", "Konaci, Kopaonik", 43.2852725, 20.8088404],
    [
      ["kopaonik-pancic-summit", "Pančićev vrh summit", 43.26932, 20.82346, 2017, "mountain", "limited", 20, "https://npkopaonik.rs/turistickakarta.pdf", "The National Park tourist map and Serbia's ski-resort operator identify Pančićev vrh as the 2,017-metre summit reached by marked routes and a scheduled chairlift. The reviewed material does not establish independent astronomy access after dark, while ski runs and maintenance operations occupy the approach. Keep this record inactive and use it only if the park and ski operator explicitly confirm a dated observing arrangement, route and return.", "Die touristische Nationalparkkarte und der serbische Skigebietsbetreiber führen Pančićev vrh als 2.017 Meter hohen Gipfel, erreichbar über markierte Wege und eine fahrplanabhängige Sesselbahn. Die geprüften Unterlagen belegen keinen selbstständigen Astronomiezugang nach Einbruch der Dunkelheit; zugleich belegen Skipisten und Wartungsbetrieb den Zugangsbereich. Halte den Datensatz inaktiv und nutze ihn nur, wenn Park und Skibetreiber einen datierten Beobachtungsrahmen, Weg und Rückweg ausdrücklich bestätigen."],
      ["kopaonik-suncana-lower-station", "Sunčana dolina lower station", 43.2815602, 20.7964588, 1604, "ski-area", "limited", 20, "https://www.openstreetmap.org/node/1619592268", "This point is the mapped lower station of the Sunčana dolina chairlift; a reviewed elevation lookup returned 1,604 metres. Official ski-resort pages establish it as operating ski infrastructure, not an astronomy venue, and publish status-dependent access. Keep it inactive unless the operator confirms a specific observing event, safe parking and separation from lighting and maintenance machinery.", "Dieser Punkt ist die kartierte Talstation der Sesselbahn Sunčana dolina; eine geprüfte Höhenabfrage ergab 1.604 Meter. Offizielle Skigebietsseiten belegen aktive Ski-Infrastruktur mit statusabhängigem Zugang, keinen Astronomieort. Halte ihn inaktiv, sofern der Betreiber nicht eine konkrete Beobachtungsveranstaltung, sicheres Parken und die Trennung von Beleuchtung und Wartungsmaschinen bestätigt."],
    ],
    [
      "https://npkopaonik.rs/pravila-ponasanja/",
      "https://npkopaonik.rs/pesacke-ture/",
      "https://npkopaonik.rs/turistickakarta.pdf",
      "https://npkopaonik.rs/rezervati-prirode/suvo-rudiste/",
      "https://www.skijalistasrbije.rs/en/about-ski-resort-kopaonik",
      "https://www.skijalistasrbije.rs/sr/prohodnost-staza-i-rad-zicara-kopaonik",
      "https://www.skijalistasrbije.rs/en/node/894",
      "https://www.rts.rs/lat/magazin/nauka/4919343/perseidi-meteorkse-kise-posmatranje.html?print=true"
    ],
    "two real mountain facilities retained only as candidates until the park and ski operator confirm a safe astronomy arrangement",
    "Zwei reale Berganlagen bleiben nur Kandidaten, bis Park und Skibetreiber einen sicheren Astronomierahmen bestätigen",
    {
      accessMode: "confirmation-only",
      checkedAt: "2026-09-18",
      sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "public-agency", "public-agency", "public-agency", "public-agency"],
      sourceTitles: ["Kopaonik National Park: visitor conduct rules", "Kopaonik National Park: hiking trails and safety guidance", "Kopaonik National Park: official tourist map", "Kopaonik National Park: Suvo Rudište nature reserve", "Ski Resorts of Serbia: Kopaonik resort infrastructure", "Ski Resorts of Serbia: live lift and run status", "Ski Resorts of Serbia: Pančićev vrh panoramic lift", "RTS Science: astronomy guidance and Kopaonik infrastructure assessment"],
      confirmationDetailEn: "Pančićev vrh and the Sunčana dolina lower station are real, mapped mountain facilities, but none of the reviewed sources establishes them as independent astronomy venues. The summit approach crosses protected and operational terrain, and the ski area has lighting and overnight maintenance. Neither record is a usable recommendation until the National Park and ski operator confirm a dated event, route, parking and safe separation from operations.",
      confirmationDetailDe: "Pančićev vrh und die Talstation Sunčana dolina sind reale, kartierte Berganlagen, doch keine geprüfte Quelle weist sie als selbstständig nutzbare Astronomieorte aus. Der Gipfelzugang führt durch geschütztes und betrieblich genutztes Gelände; im Skigebiet kommen Beleuchtung und nächtliche Wartung hinzu. Keiner der Datensätze ist nutzbar, bis Nationalpark und Skibetreiber eine datierte Veranstaltung, Weg, Parkplatz und sichere Trennung vom Betrieb bestätigen.",
    },
  ],
  ["richtersveld", "Richtersveld", "ZA", "South Africa", "africa", ["northern-cape", "africa"], "Africa/Johannesburg", 90, ["national-park", "desert", "remote"], "Richtersveld National Park South Africa", ["sendelingsdrif", "Sendelingsdrif", -28.50, 17.07], [["richtersveld-potjiespram", "Potjiespram campsite", -28.38, 17.08, 410, "campground", "limited", 58], ["richtersveld-de-hoop", "De Hoop access area", -28.44, 17.02, 480, "desert-viewpoint", "limited", 54]], ["https://www.sanparks.org/parks/richtersveld", "https://www.sanparks.org/", "https://www.southafrica.net/"], "a remote desert night that starts with supplies", "Eine abgelegene Wüstennacht, die mit Vorräten beginnt"],
  ["mapungubwe", "Mapungubwe", "ZA", "South Africa", "africa", ["limpopo", "africa"], "Africa/Johannesburg", 84, ["national-park", "archaeology", "savanna"], "Mapungubwe National Park South Africa", ["mapungubwe", "Mapungubwe", -22.20, 29.39], [["mapungubwe-confluence", "Confluence viewpoint", -22.25, 29.40, 480, "park-viewpoint", "limited", 58], ["mapungubwe-camp", "Mapungubwe camp area", -22.24, 29.42, 520, "campground", "limited", 62]], ["https://www.sanparks.org/parks/mapungubwe", "https://www.sanparks.org/", "https://www.limpopo.gov.za/"], "a heritage landscape with no off-road shortcut", "Eine Kulturlandschaft ohne Abkürzung abseits der Straße"],
  ["makgadikgadi", "Makgadikgadi Pans", "BW", "Botswana", "africa", ["central-district", "africa"], "Africa/Gaborone", 88, ["salt-pan", "remote", "desert"], "Makgadikgadi Pans Botswana", ["nata", "Nata", -20.21, 25.19], [["nata-bird-sanctuary", "Nata sanctuary area", -20.23, 25.23, 930, "salt-pan", "limited", 52], ["makgadikgadi-kubu", "Kubu Island approach", -20.90, 24.60, 900, "salt-pan", "limited", 44]], ["https://www.botswanatourism.co.bw/", "https://www.gov.bw/", "https://botswanatourism.co.bw/index.php/explore/makgadikgadi-pans-game-reserve"], "a salt-pan night planned around water and road conditions", "Eine Salzpfannen-Nacht rund um Wasser und Straßenbedingungen"],
  ["tsumkwe", "Tsumkwe", "NA", "Namibia", "africa", ["otjozondjupa", "africa"], "Africa/Windhoek", 87, ["remote", "community", "savanna"], "Tsumkwe Namibia stargazing", ["tsumkwe", "Tsumkwe", -19.60, 20.50], [["tsumkwe-community", "Tsumkwe community area", -19.60, 20.50, 1110, "community-area", "limited", 48], ["naye-naye", "Naye-Naye access", -19.72, 20.74, 1090, "savanna-viewpoint", "limited", 42]], ["https://visitnamibia.com.na/2022/03/north-eastern-region/", "https://www.meft.gov.na/", "https://www.nacso.org.na/"], "a community-led plan where local permission comes first", "Ein gemeinschaftsbasierter Plan, bei dem Zustimmung zuerst kommt"],
  ["rakiura", "Rakiura Stewart Island", "NZ", "New Zealand", "oceania", ["southland", "oceania"], "Pacific/Auckland", 89, ["dark-sky-sanctuary", "island", "coastal"], "Rakiura Stewart Island Dark Sky", ["oban-rakiura", "Oban", -46.90, 168.13], [["oban-bay", "Oban shoreline", -46.90, 168.13, 20, "coastal-viewpoint", "limited", 66], ["rakiura-horseshoe", "Horseshoe Bay", -46.88, 168.08, 15, "beach", "limited", 60]], ["https://rakiura.org.nz/", "https://www.doc.govt.nz/rakiura", "https://www.newzealand.com/int/stewart-island/"], "an island night limited by ferry and weather decisions", "Eine Inselnacht, begrenzt durch Fähre und Wetter"],
  ["kangaroo-island", "Kangaroo Island", "AU", "Australia", "oceania", ["south-australia", "oceania"], "Australia/Adelaide", 83, ["island", "coastal", "wildlife"], "Kangaroo Island South Australia stargazing", ["kingscote", "Kingscote", -35.66, 137.64], [["kangaroo-west-bay", "West Bay area", -35.99, 136.59, 20, "coastal-viewpoint", "limited", 58], ["kangaroo-flinders", "Flinders Chase area", -35.96, 136.68, 100, "national-park", "limited", 54]], ["https://www.parks.sa.gov.au/parks/kangaroo-island", "https://www.southaustralia.com/places-to-go/kangaroo-island", "https://www.environment.sa.gov.au/"], "a wildlife island night with a single settled base", "Eine Wildnisinsel-Nacht mit fester Basis"],
  ["mudgee", "Mudgee", "AU", "Australia", "oceania", ["new-south-wales", "oceania"], "Australia/Sydney", 80, ["rural", "vineyards", "accessible"], "Mudgee New South Wales stargazing", ["mudgee", "Mudgee", -32.59, 149.59], [["mudgee-observatory", "Mudgee region observatory area", -32.55, 149.56, 470, "rural-viewpoint", "limited", 62], ["gulgong", "Gulgong outskirts", -32.36, 149.53, 500, "rural-viewpoint", "limited", 58]], ["https://www.visitmudgeeregion.com.au/", "https://www.nationalparks.nsw.gov.au/", "https://www.environment.nsw.gov.au/"], "a dry inland evening without a long second drive", "Ein trockener Inlandabend ohne zweite lange Fahrt"],
  ["great-western-woodlands", "Great Western Woodlands", "AU", "Australia", "oceania", ["western-australia", "oceania"], "Australia/Perth", 90, ["remote", "woodland", "desert"], "Great Western Woodlands Western Australia", ["kalgoorlie", "Kalgoorlie", -30.75, 121.47], [["great-western-boorabbin", "Boorabbin woodland area", -31.18, 120.08, 430, "woodland", "limited", 44], ["great-western-holland", "Holland Track area", -31.45, 121.00, 390, "remote-road", "limited", 38]], ["https://www.dpaw.wa.gov.au/", "https://www.australiasgoldenoutback.com/", "https://www.wa.gov.au/service/environment"], "a supply-led outback night with no casual detour", "Eine vorratsorientierte Outback-Nacht ohne beiläufigen Umweg"],
  ["torrance-barrens", "Torrance Barrens", "CA", "Canada", "north-america", ["ontario", "north-america"], "America/Toronto", 82, ["dark-sky-reserve", "wetland", "accessible"], "Torrance Barrens Dark Sky Reserve Ontario", ["gravenhurst", "Gravenhurst", 44.92, -79.38], [["torrance-barrens-main", "Torrance Barrens conservation reserve", 44.91, -79.56, 260, "conservation-reserve", "limited", 64], ["torrance-barrens-boardwalk", "Torrance Barrens boardwalk", 44.90, -79.57, 260, "boardwalk", "limited", 56]], ["https://www.ontario.ca/page/torrance-barrens-conservation-reserve-management-statement", "https://www.ontario.ca/page/crown-land-use-policy-atlas", "https://darksky.org/places/torrance-barrens-dark-sky-reserve/"], "a wetland reserve where the boardwalk is the boundary", "Ein Feuchtgebiet, dessen Steg die Grenze bildet"],
  ["fundy", "Fundy National Park", "CA", "Canada", "north-america", ["new-brunswick", "north-america"], "America/Moncton", 81, ["national-park", "coast", "forest"], "Fundy National Park stargazing Canada", ["alma-new-brunswick", "Alma", 45.60, -64.95], [["fundy-headquarters", "Fundy park headquarters", 45.59, -64.95, 35, "park-campus", "limited", 58], ["fundy-point-wolfe", "Point Wolfe area", 45.82, -65.00, 80, "coastal-viewpoint", "limited", 52]], ["https://parks.canada.ca/pn-np/nb/fundy", "https://parks.canada.ca/voyage-travel", "https://tourismnewbrunswick.ca/listing/fundy-national-park"], "a tidal coast plan that does not chase clearings", "Ein Gezeitenküstenplan, der keiner Lichtung hinterherfährt"],
  ["manitoulin", "Manitoulin Island", "CA", "Canada", "north-america", ["ontario", "north-america"], "America/Toronto", 80, ["island", "lake", "rural"], "Manitoulin Island Ontario stargazing", ["little-current", "Little Current", 45.98, -81.92], [["manitoulin-meldrum", "Meldrum Bay area", 45.93, -83.12, 180, "lakeshore", "limited", 56], ["manitoulin-shearer", "Sheguiandah area", 45.78, -81.92, 190, "rural-viewpoint", "limited", 58]], ["https://www.ontarioparks.com/", "https://www.destinationontario.com/en-ca/cities-towns/manitoulin-island", "https://www.manitoulin-island.com/"], "an island itinerary tied to the ferry timetable", "Eine Inselroute, die am Fährplan hängt"],
  ["massacre-rim", "Massacre Rim", "US", "United States", "north-america", ["nevada", "north-america"], "America/Los_Angeles", 91, ["dark-sky-sanctuary", "desert", "remote"], "Massacre Rim Dark Sky Sanctuary Nevada", ["denio", "Denio", 41.73, -118.63], [["massacre-rim-viewpoint", "Massacre Rim access area", 41.58, -119.02, 1700, "desert-viewpoint", "limited", 40], ["denio-outskirts", "Denio outskirts", 41.73, -118.63, 1320, "rural-viewpoint", "limited", 46]], ["https://darksky.org/places/massacre-rim-dark-sky-sanctuary/", "https://www.blm.gov/massacre-rim-dark-sky-sanctuary", "https://www.blm.gov/office/winnemucca-district-office"], "a remote Nevada plan that begins with fuel and water", "Ein abgelegener Nevada-Plan, der mit Kraftstoff und Wasser beginnt"],
  ["grand-canyon-parashant", "Grand Canyon-Parashant", "US", "United States", "north-america", ["arizona", "north-america"], "America/Phoenix", 90, ["national-monument", "desert", "remote"], "Grand Canyon Parashant National Monument stargazing", ["mesquite", "Mesquite", 36.81, -114.07], [["parashant-tuweep", "Tuweep overlook area", 36.28, -113.08, 1450, "rim-viewpoint", "limited", 34], ["parashant-mount-trumbull", "Mount Trumbull area", 36.42, -113.03, 1500, "desert-viewpoint", "limited", 40]], ["https://www.blm.gov/national-conservation-lands/arizona/grandcanyon-parashant", "https://www.nps.gov/para/index.htm", "https://www.nps.gov/para/planyourvisit/brochure.htm"], "a high-clearance route with no improvised second site", "Eine Route für hohe Bodenfreiheit ohne improvisierten Zweitort"],
  ["oracle-state-park", "Oracle State Park", "US", "United States", "north-america", ["arizona", "north-america"], "America/Phoenix", 78, ["dark-sky-park", "desert", "accessible"], "Oracle State Park Arizona dark sky", ["oracle", "Oracle", 32.61, -110.77], [["oracle-state-park", "Oracle State Park Kannally Ranch", 32.61, -110.77, 1370, "state-park", "limited", 62], ["oracle-charouleau", "Charouleau Gap area", 32.62, -110.82, 1300, "desert-viewpoint", "limited", 52]], ["https://azstateparks.com/oracle", "https://azstateparks.com/", "https://darksky.org/places/oracle-state-park-dark-sky-park/"], "an accessible Arizona park with a clear closing-time check", "Ein zugänglicher Arizona-Park mit klarer Schließzeitprüfung"],
  ["enchanted-rock", "Enchanted Rock", "US", "United States", "north-america", ["texas", "north-america"], "America/Chicago", 77, ["state-park", "granite", "hill-country"], "Enchanted Rock State Natural Area stargazing", ["fredericksburg", "Fredericksburg", 30.28, -98.87], [["enchanted-rock-summit", "Enchanted Rock summit area", 30.51, -98.82, 556, "granite-dome", "limited", 48], ["enchanted-rock-camp", "Enchanted Rock campground", 30.50, -98.82, 430, "campground", "limited", 58]], ["https://www.traveltexas.com/articles/post/unforgettable-texas-landscapes/", "https://www.visitfredericksburgtx.com/things-to-do/outdoors/enchanted-rock/", "https://darksky.org/places/enchanted-rock-state-natural-area/"], "a granite park where the summit is not the default", "Ein Granitpark, in dem der Gipfel nicht der Standard ist"],
  ["staunton-river", "Staunton River State Park", "US", "United States", "north-america", ["virginia", "north-america"], "America/New_York", 79, ["dark-sky-park", "river", "campground"], "Staunton River State Park Virginia astronomy", ["scottsburg", "Scottsburg", 36.78, -78.79], [["staunton-river-park", "Staunton River observing field", 36.78, -78.79, 120, "state-park", "limited", 66], ["staunton-river-camp", "Staunton River campground", 36.79, -78.80, 115, "campground", "limited", 62]], ["https://www.dcr.virginia.gov/state-parks/staunton-river", "https://www.dcr.virginia.gov/", "https://darksky.org/places/staunton-river-state-park/"], "a river park night that stays within the campground loop", "Eine Flussparknacht innerhalb der Campingrunde"],
  ["kissimmee-prairie", "Kissimmee Prairie", "US", "United States", "north-america", ["florida", "north-america"], "America/New_York", 76, ["dark-sky-park", "prairie", "wetland"], "Kissimmee Prairie Preserve State Park stargazing", ["okeechobee", "Okeechobee", 27.24, -80.83], [["kissimmee-prairie-north", "Kissimmee Prairie north entrance", 27.46, -81.02, 20, "prairie", "limited", 54], ["kissimmee-prairie-camp", "Kissimmee Prairie campground", 27.43, -81.01, 18, "campground", "limited", 58]], ["https://floridastateparks.org/parks-and-trails/kissimmee-prairie-preserve-state-park", "https://floridastateparks.org/", "https://darksky.org/places/kissimmee-prairie-preserve-state-park/"], "a flat prairie where weather and insects set the pace", "Eine flache Prärie, in der Wetter und Insekten das Tempo setzen"],
  ["big-cypress", "Big Cypress", "US", "United States", "north-america", ["florida", "north-america"], "America/New_York", 74, ["dark-sky-park", "wetland", "wildlife"], "Big Cypress National Preserve stargazing", ["ochopee", "Ochopee", 25.85, -81.39], [["big-cypress-wagonwheel", "Wagonwheel Road area", 25.89, -81.35, 3, "wetland-road", "limited", 46], ["big-cypress-camp", "Midway campground", 25.76, -81.08, 4, "campground", "limited", 52]], ["https://www.nps.gov/bicy/index.htm", "https://www.nps.gov/bicy/planyourvisit/conditions.htm", "https://darksky.org/places/big-cypress-national-preserve/"], "a humid preserve where wildlife rules outweigh convenience", "Ein feuchtes Schutzgebiet, in dem Wildtierregeln Vorrang haben"],
  ["lassen-volcanic", "Lassen Volcanic", "US", "United States", "north-america", ["california", "north-america"], "America/Los_Angeles", 84, ["national-park", "volcanic", "mountain"], "Lassen Volcanic National Park stargazing", ["mineral", "Mineral", 40.35, -121.61], [["lassen-manazanita", "Manzanita Lake area", 40.53, -121.58, 1780, "lake-viewpoint", "limited", 62], ["lassen-summit", "Lassen summit road area", 40.49, -121.51, 2600, "mountain-road", "limited", 38]], ["https://www.nps.gov/lavo/index.htm", "https://www.nps.gov/lavo/planyourvisit/conditions.htm", "https://darksky.org/places/lassen-volcanic-national-park/"], "a lake-level plan that respects the snow line", "Ein Plan auf Seehöhe, der die Schneegrenze respektiert"],
  ["dinosaur-national-monument", "Dinosaur National Monument", "US", "United States", "north-america", ["utah", "colorado", "north-america"], "America/Denver", 83, ["national-monument", "desert", "river"], "Dinosaur National Monument stargazing", ["vernal", "Vernal", 40.46, -109.54], [["dinosaur-jensen", "Jensen visitor area", 40.37, -109.35, 1760, "river-viewpoint", "limited", 58], ["dinosaur-harpers", "Harpers Corner road area", 40.48, -109.16, 1950, "rim-viewpoint", "limited", 48]], ["https://www.nps.gov/dino/index.htm", "https://www.nps.gov/dino/planyourvisit/conditions.htm", "https://darksky.org/places/dinosaur-national-monument/"], "a canyon road that needs daylight reconnaissance", "Eine Canyonstraße, die bei Tageslicht erkundet werden muss"],
  ["medicine-rocks", "Medicine Rocks", "US", "United States", "north-america", ["montana", "north-america"], "America/Denver", 82, ["state-park", "prairie", "dark-sky"], "Medicine Rocks State Park Montana stargazing", ["baker-montana", "Baker", 46.37, -104.77], [["medicine-rocks-park", "Medicine Rocks State Park", 46.06, -104.50, 1000, "prairie-rock", "limited", 54], ["medicine-rocks-camp", "Medicine Rocks campground", 46.06, -104.50, 1000, "campground", "limited", 58]], ["https://stateparks.mt.gov/medicine-rocks/", "https://stateparks.mt.gov/", "https://darksky.org/places/medicine-rocks-state-park/"], "a prairie stop where wind changes the comfort calculation", "Ein Präriehalt, an dem Wind den Komfort bestimmt"],
  ["newport-wisconsin", "Newport State Park", "US", "United States", "north-america", ["wisconsin", "north-america"], "America/Chicago", 78, ["dark-sky-park", "lake", "forest"], "Newport State Park Wisconsin stargazing", ["ellison-bay", "Ellison Bay", 45.25, -87.07], [["newport-porte-des-morts", "Newport shoreline", 45.25, -86.96, 185, "lakeshore", "limited", 62], ["newport-campground", "Newport campground", 45.25, -86.97, 185, "campground", "limited", 58]], ["https://dnr.wisconsin.gov/topic/parks/newport", "https://dnr.wisconsin.gov/", "https://darksky.org/places/newport-state-park/"], "a Lake Michigan shore plan with no beach-hopping", "Ein Lake-Michigan-Uferplan ohne Strandhopping"],
  ["boundary-waters", "Boundary Waters", "US", "United States", "north-america", ["minnesota", "north-america"], "America/Chicago", 86, ["wilderness", "lake", "canoe"], "Boundary Waters Canoe Area Wilderness stargazing", ["ely", "Ely", 47.90, -91.87], [["boundary-waters-moose-lake", "Moose Lake entry area", 48.01, -91.50, 430, "wilderness-entry", "limited", 42], ["boundary-waters-seagull", "Seagull Lake entry", 48.12, -90.99, 440, "wilderness-entry", "limited", 38]], ["https://www.fs.usda.gov/recarea/superior/recarea/?recid=36910", "https://www.fs.usda.gov/superior", "https://www.fs.usda.gov/visit/know-before-you-go"], "a permit-led wilderness night with no roadside fallback", "Eine erlaubnisgebundene Wildnisnacht ohne Straßenfallback"],
  ["sturt-stony-desert", "Sturt Stony Desert", "AU", "Australia", "oceania", ["south-australia", "oceania"], "Australia/Adelaide", 88, ["desert", "remote", "outback"], "Sturt Stony Desert South Australia", ["innamincka", "Innamincka", -27.75, 140.73], [["sturt-stony-innamincka", "Innamincka Regional Reserve", -27.75, 140.73, 25, "desert", "limited", 42], ["sturt-stony-cooper", "Cooper Creek area", -27.55, 140.75, 20, "river-desert", "limited", 40]], ["https://www.parks.sa.gov.au/parks/innamincka-regional-reserve", "https://www.parks.sa.gov.au/", "https://www.environment.sa.gov.au/"], "a desert plan where water and tyre checks come first", "Ein Wüstenplan, bei dem Wasser und Reifen zuerst geprüft werden"],
  ["alula", "AlUla", "SA", "Saudi Arabia", "asia", ["al-madinah", "asia"], "Asia/Riyadh", 84, ["desert", "heritage", "guided"], "AlUla Saudi Arabia stargazing", ["alula", "AlUla", 26.61, 37.92], [["alula-harrat", "Harrat viewpoint", 26.65, 37.88, 900, "desert-viewpoint", "limited", 52], ["alula-hegra", "Hegra visitor area", 26.80, 37.96, 700, "heritage-site", "limited", 42]], ["https://www.experiencealula.com/en", "https://www.rcu.gov.sa/en", "https://darksky.org/"], "a heritage desert evening that follows the operator plan", "Ein Kulturerbe-Abend in der Wüste nach Betreiberplan"],
  ["jebel-akhdar", "Jebel Akhdar", "OM", "Oman", "asia", ["ad-dakhiliyah", "asia"], "Asia/Muscat", 86, ["mountain", "desert", "remote"], "Jebel Akhdar Oman stargazing", ["nizwa", "Nizwa", 22.93, 57.53], [["jebel-akhdar-diana", "Diana's Point", 23.07, 57.66, 2000, "mountain-viewpoint", "limited", 46], ["jebel-akhdar-saiq", "Saiq plateau", 23.08, 57.65, 1900, "plateau", "limited", 52]], ["https://experienceoman.om/", "https://www.ea.gov.om/en/authority-services/service-catalogue/service-catalogue/entry-permit-to-jabal-akhdar-scenic-reserve", "https://www.rop.gov.om/"], "a mountain night that needs a four-wheel-drive decision", "Eine Bergnacht, die eine Allradentscheidung verlangt"],
  ["rann-of-kutch", "Rann of Kutch", "IN", "India", "asia", ["gujarat", "asia"], "Asia/Kolkata", 84, ["salt-desert", "seasonal", "remote"], "Rann of Kutch Gujarat India stargazing", ["bhuj", "Bhuj", 23.24, 69.67], [["rann-dhordo", "Dhordo white desert", 23.84, 69.57, 15, "salt-desert", "limited", 48], ["rann-kalo-dungar", "Kalo Dungar area", 23.82, 69.58, 460, "hill-viewpoint", "limited", 44]], ["https://www.gujarattourism.com/", "https://www.gujarattourism.com/kutch-zone/kutch/great-rann-of-kutch.html", "https://www.incredibleindia.gov.in/en/gujarat"], "a seasonal salt desert where permits set the route", "Eine saisonale Salzwüste, deren Route Genehmigungen bestimmen"],
  ["achi-village", "Achi Village", "JP", "Japan", "asia", ["nagano", "asia"], "Asia/Tokyo", 82, ["dark-sky-community", "mountain", "village"], "Achi Village Japan stargazing", ["achi", "Achi", 35.44, 137.72], [["achi-heavens-sonohara", "Sonohara night-tour area", 35.43, 137.70, 1400, "mountain-resort", "limited", 58], ["achi-village", "Achi village outskirts", 35.45, 137.71, 600, "village-viewpoint", "limited", 62]], ["https://sva.jp/", "https://www.vill.achi.lg.jp/", "https://www.go-nagano.net/en/"], "a booked ropeway experience rather than an improvised summit", "Ein gebuchtes Seilbahnerlebnis statt eines improvisierten Gipfels"],
  ["sani-pass", "Sani Pass", "LS", "Lesotho", "africa", ["mokhotlong", "africa"], "Africa/Maseru", 87, ["mountain", "highland", "remote"], "Sani Pass Lesotho stargazing", ["mokhotlong", "Mokhotlong", -29.29, 29.07], [["sani-pass-border", "Sani Pass upper road", -29.59, 29.29, 2874, "mountain-pass", "limited", 34], ["sani-top", "Sani Top area", -29.59, 29.29, 2874, "mountain-viewpoint", "limited", 30]], ["https://www.visitlesotho.org.ls/gallery_item/sani-pass", "https://www.gov.ls/", "https://www.sanparks.org/parks/maloti-drakensberg"], "a border road whose daylight rule is non-negotiable", "Eine Grenzstraße mit unverhandelbarer Tageslichtregel"],
  ["drakensberg", "Maloti-Drakensberg", "ZA", "South Africa", "africa", ["kwazulu-natal", "africa"], "Africa/Johannesburg", 85, ["mountain", "world-heritage", "highland"], "Maloti Drakensberg South Africa stargazing", ["underberg", "Underberg", -29.79, 29.51], [["drakensberg-giants-castle", "Giants Castle area", -29.40, 29.46, 1700, "mountain-valley", "limited", 48], ["drakensberg-camp", "Didima camp area", -28.68, 28.99, 1500, "campground", "limited", 56]], ["https://www.sanparks.org/parks/maloti-drakensberg", "https://www.kznwildlife.com/", "https://whc.unesco.org/en/list/985/"], "a highland camp plan with weather as the final veto", "Ein Hochland-Campingplan mit Wetter als letztem Veto"],
  ["northern-damaraland", "Northern Damaraland", "NA", "Namibia", "africa", ["kunene", "africa"], "Africa/Windhoek", 89, ["desert", "remote", "geology"], "Northern Damaraland Namibia stargazing", ["sesfontein", "Sesfontein", -19.13, 13.62], [["damaraland-twyfelfontein", "Twyfelfontein area", -20.59, 14.37, 700, "desert-heritage", "limited", 44], ["damaraland-palmwag", "Palmwag concession", -19.88, 13.95, 900, "desert-camp", "limited", 42]], ["https://visitnamibia.com.na/2022/02/damaraland-kaokoland/", "https://www.meft.gov.na/", "https://www.nacso.org.na/"], "a concession night that follows camp rules, not the map", "Eine Konzessionsnacht nach Campregeln und nicht nach der Karte"],
  ["coral-pink-sand-dunes", "Coral Pink Sand Dunes", "US", "United States", "north-america", ["utah", "north-america"], "America/Denver", 76, ["state-park", "desert", "accessible"], "Coral Pink Sand Dunes Utah stargazing", ["kanab", "Kanab", 37.04, -112.53], [["coral-pink-park", "Coral Pink Sand Dunes State Park", 37.04, -112.71, 1820, "sand-dunes", "limited", 56], ["coral-pink-camp", "Coral Pink campground", 37.04, -112.71, 1820, "campground", "limited", 58]], ["https://stateparks.utah.gov/parks/coral-pink/", "https://stateparks.utah.gov/", "https://darksky.org/places/coral-pink-sand-dunes-state-park/"], "a dune park where walking distance changes after sunset", "Ein Dünenpark, in dem sich Gehstrecken nach Sonnenuntergang ändern"],
  ["cedar-breaks", "Cedar Breaks", "US", "United States", "north-america", ["utah", "north-america"], "America/Denver", 81, ["national-monument", "highland", "snow"], "Cedar Breaks National Monument stargazing", ["cedar-city", "Cedar City", 37.68, -113.06], [["cedar-breaks-sunset", "Sunset View Overlook", 37.63, -112.84, 3150, "rim-viewpoint", "limited", 42], ["cedar-breaks-camp", "Point Supreme area", 37.63, -112.84, 3150, "rim-viewpoint", "limited", 38]], ["https://www.nps.gov/cebr/index.htm", "https://www.nps.gov/cebr/planyourvisit/conditions.htm", "https://darksky.org/places/cedar-breaks-national-monument/"], "a high rim that may close long before dark", "Ein hoher Rand, der lange vor Dunkelheit schließen kann"],
  ["puna-argentina", "Puna de Atacama", "AR", "Argentina", "south-america", ["jujuy", "south-america"], "America/Argentina/Jujuy", 90, ["high-altitude", "desert", "remote"], "Puna de Atacama Argentina stargazing", ["purmamarca", "Purmamarca", -23.75, -65.50], [["puna-salinas", "Salinas Grandes access", -23.65, -65.00, 3450, "salt-flat", "limited", 42], ["puna-humahuaca", "Quebrada highland area", -23.20, -65.35, 3000, "highland", "limited", 46]], ["https://www.argentina.gob.ar/ambiente", "https://www.jujuy.gob.ar/", "https://www.argentina.gob.ar/parquesnacionales/ecorregiones/puna"], "a thin-air night where acclimatisation is part of the route", "Eine Nacht in dünner Luft, bei der Akklimatisation dazugehört"],
  ["isla-navarino", "Isla Navarino", "CL", "Chile", "south-america", ["magallanes", "south-america"], "America/Punta_Arenas", 86, ["island", "subantarctic", "remote"], "Isla Navarino Chile stargazing", ["puerto-williams", "Puerto Williams", -54.93, -67.61], [["navarino-puerto-williams", "Puerto Williams waterfront", -54.93, -67.61, 10, "waterfront", "limited", 58], ["navarino-dientes", "Dientes de Navarino approach", -54.98, -67.55, 250, "mountain-approach", "limited", 40]], ["https://www.conaf.cl/parques-nacionales/", "https://www.sernatur.cl/", "https://www.gob.cl/en/"], "a subantarctic night that stays close to the settlement", "Eine subantarktische Nacht nahe der Siedlung"],
  ["uyuni", "Uyuni", "BO", "Bolivia", "south-america", ["potosi", "south-america"], "America/La_Paz", 88, ["salt-flat", "high-altitude", "remote"], "Uyuni Bolivia stargazing", ["uyuni", "Uyuni", -20.46, -66.83], [["uyuni-salt-flat", "Salar de Uyuni access", -20.13, -67.49, 3650, "salt-flat", "limited", 38], ["uyuni-tahua", "Tahúa lakeshore", -20.08, -66.50, 3700, "highland-lake", "limited", 34]], ["https://www.turismoyculturas.gob.bo/", "https://boliviatravel.gob.bo/salar-de-uyuni-y-lagunade-colores/", "https://www.sernap.gob.bo/"], "a salt-flat plan that requires a local driver and route", "Ein Salzpfannenplan mit lokalem Fahrer und fester Route"],
  ["kidepo-valley", "Kidepo Valley", "UG", "Uganda", "africa", ["karamoja", "africa"], "Africa/Kampala", 84, ["national-park", "savanna", "remote"], "Kidepo Valley National Park Uganda stargazing", ["kitgum", "Kitgum", 3.30, 32.88], [["kidepo-narus", "Narus valley camp", 3.93, 33.88, 950, "savanna-camp", "limited", 42], ["kidepo-kanangorok", "Kanangorok hot springs area", 4.14, 33.86, 1200, "savanna-viewpoint", "limited", 34]], ["https://ugandawildlife.org/national-parks/kidepo-valley-national-park/", "https://ugandawildlife.org/", "https://www.tourism.go.ug/"], "a wildlife reserve night that stays with the camp team", "Eine Wildnisnacht, die beim Campteam bleibt"],
];

const richtersveldIndex = candidates.findIndex(([id]) => id === "richtersveld");
candidates[richtersveldIndex] = [
  "richtersveld",
  "Richtersveld",
  "ZA",
  "South Africa",
  "africa",
  ["northern-cape", "africa"],
  "Africa/Johannesburg",
  90,
  ["national-park", "desert", "remote"],
  "Richtersveld National Park South Africa",
  ["sendelingsdrif", "Sendelingsdrift", -28.1252333, 16.8916],
  [
    ["richtersveld-potjiespram", "Potjiespram Camp Site", -28.0747, 16.96315, 42, "campground", "limited", 58, "https://www.sanparks.org/parks/ai-ais-richtersveld/travel/gps-waypoints", "SANParks lists Potjiespram at S 28°04.482′, E 16°57.789′ and describes it as a bookable Orange River campsite. The 42-metre elevation is a reviewed lookup that the catalogue DEM pipeline must replace or confirm. Stargaze only from the assigned camping footprint after a daylight arrival; park rules prohibit night driving, off-route driving and camping outside designated areas.", "SANParks führt Potjiespram bei S 28°04,482′, E 16°57,789′ und beschreibt es als buchbaren Campingplatz am Oranje. Die Höhe von 42 Metern stammt aus einer geprüften Abfrage und muss durch die DEM-Pipeline des Katalogs ersetzt oder bestätigt werden. Beobachte nur innerhalb der zugewiesenen Campingfläche nach Ankunft bei Tageslicht; die Parkregeln verbieten Nachtfahrten, Fahrten abseits der Wege und Camping außerhalb ausgewiesener Flächen."],
    ["richtersveld-de-hoop", "De Hoop Camp Site", -28.1836833, 17.1780333, 81, "campground", "limited", 54, "https://www.sanparks.org/parks/ai-ais-richtersveld/travel/gps-waypoints", "SANParks lists De Hoop at S 28°11.021′, E 17°10.682′ and the park management plan identifies it as a designated campsite. The 81-metre elevation is a reviewed lookup that the catalogue DEM pipeline must replace or confirm. Use it only with a current overnight booking, arrive before dark and remain inside the camping footprint until daylight travel resumes.", "SANParks führt De Hoop bei S 28°11,021′, E 17°10,682′; der Parkmanagementplan weist den Ort als Campingplatz aus. Die Höhe von 81 Metern stammt aus einer geprüften Abfrage und muss durch die DEM-Pipeline des Katalogs ersetzt oder bestätigt werden. Nutze ihn nur mit aktueller Übernachtungsbuchung, komme vor Dunkelheit an und bleibe innerhalb der Campingfläche, bis Fahrten bei Tageslicht wieder erlaubt sind."],
  ],
  [
    "https://www.sanparks.org/parks/ai-ais-richtersveld/travel/gps-waypoints",
    "https://www.sanparks.org/parks/ai-ais-richtersveld/accommodation",
    "https://www.sanparks.org/travel/guide/10-amazing-experiences-in-ai-ais-richtersveld-transfrontier-park",
    "https://www.sanparks.org/parks/ai-ais-richtersveld/useful-information/visitor-tips",
    "https://www.sanparks.org/parks/ai-ais-richtersveld/travel/how-to-get-there",
    "https://www.sanparks.org/parks/ai-ais-richtersveld/travel/entrance-gate",
    "https://www.sanparks.org/wp-content/uploads/2021/06/richtersveld-park-management-plan.pdf",
  ],
  "a booked-campsite stargazing night with no driving after dark",
  "Eine Sternbeobachtungsnacht am gebuchten Campingplatz ohne Fahrt nach Einbruch der Dunkelheit",
  {
    accessMode: "camp-only",
    checkedAt: "2026-09-21",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["SANParks: official Richtersveld GPS waypoints", "SANParks: Richtersveld accommodation and campsites", "SANParks: Richtersveld stargazing experience", "SANParks: Richtersveld visitor tips", "SANParks: access and internal-road rules", "SANParks: entrance gate and current-time warning", "SANParks: Richtersveld Park Management Plan 2018–2028"],
    campDetailEn: "SANParks explicitly promotes stargazing in Richtersveld and identifies Potjiespram and De Hoop as designated campsites. The usable plan is therefore an overnight booking, daylight arrival and observation inside the assigned camping footprint, not a drive to a viewpoint after dark. A second camp requires a separate daylight transfer and booking.",
    campDetailDe: "SANParks bewirbt Sternbeobachtung im Richtersveld ausdrücklich und weist Potjiespram sowie De Hoop als Campingplätze aus. Der nutzbare Plan besteht deshalb aus Übernachtungsbuchung, Ankunft bei Tageslicht und Beobachtung innerhalb der zugewiesenen Campingfläche – nicht aus einer Fahrt zu einem Aussichtspunkt nach Einbruch der Dunkelheit. Ein zweiter Campingplatz erfordert eine getrennte Tagesetappe und Buchung.",
  },
];

const mapungubweIndex = candidates.findIndex(([id]) => id === "mapungubwe");
candidates[mapungubweIndex] = [
  "mapungubwe",
  "Mapungubwe",
  "ZA",
  "South Africa",
  "africa",
  ["limpopo", "africa"],
  "Africa/Johannesburg",
  84,
  ["national-park", "archaeology", "savanna"],
  "Mapungubwe National Park South Africa",
  ["mapungubwe-main-gate", "Mapungubwe Main Gate Reception", -22.2436111, 29.4005556],
  [
    ["mapungubwe-leokwe-rest-camp", "Leokwe Rest Camp", -22.2177486, 29.3648104, 544, "rest-camp", "limited", 20, "https://www.openstreetmap.org/node/2117424196", "SANParks identifies Leokwe as Mapungubwe's main bookable rest camp, while the mapped facility is at -22.2177486, 29.3648104. A reviewed elevation lookup returned 544 metres and must be replaced or confirmed by the catalogue DEM pipeline. Leokwe is unfenced, dangerous animals may move through camp and current SANParks notices warn of renovation disruption. No reviewed source confirms independent astronomy use, so keep this candidate inactive unless the park gives dated instructions for observing inside the accommodation footprint.", "SANParks führt Leokwe als buchbares Haupt-Restcamp von Mapungubwe; die kartierte Anlage liegt bei -22,2177486, 29,3648104. Eine geprüfte Höhenabfrage ergab 544 Meter und muss durch die DEM-Pipeline des Katalogs ersetzt oder bestätigt werden. Leokwe ist nicht eingezäunt, gefährliche Tiere können das Camp durchqueren und aktuelle SANParks-Hinweise warnen vor Renovierungsstörungen. Keine geprüfte Quelle bestätigt selbstständige astronomische Nutzung; halte den Kandidaten inaktiv, sofern der Park keine datierten Anweisungen für Beobachtung innerhalb der Unterkunftsfläche erteilt."],
    ["mapungubwe-mazhou-campsite", "Mazhou Camp Site", -22.187385, 29.2012847, 528, "campground", "limited", 20, "https://www.openstreetmap.org/node/4357227138", "SANParks identifies Mazhou as a bookable campsite in Mapungubwe's western section, while the mapped facility is at -22.187385, 29.2012847. A reviewed elevation lookup returned 528 metres and must be replaced or confirmed by the catalogue DEM pipeline. Visitors check in at the main gate and must drive outside the park to reach the western section; dangerous animals occur around camps and renovations may disrupt Mazhou. Keep it inactive unless SANParks confirms a current booking and astronomy use inside the assigned campsite footprint.", "SANParks führt Mazhou als buchbaren Campingplatz im Westteil von Mapungubwe; die kartierte Anlage liegt bei -22,187385, 29,2012847. Eine geprüfte Höhenabfrage ergab 528 Meter und muss durch die DEM-Pipeline des Katalogs ersetzt oder bestätigt werden. Gäste melden sich am Haupttor an und müssen den Park verlassen, um den Westteil zu erreichen; gefährliche Tiere kommen an Camps vor und Renovierungen können Mazhou beeinträchtigen. Halte den Ort inaktiv, sofern SANParks nicht eine aktuelle Buchung und astronomische Nutzung innerhalb der zugewiesenen Campingfläche bestätigt."],
  ],
  [
    "https://www.sanparks.org/parks/mapungubwe",
    "https://www.sanparks.org/parks/mapungubwe/accommodation",
    "https://www.sanparks.org/parks/mapungubwe/useful-information/visitor-tips",
    "https://www.sanparks.org/parks/mapungubwe/travel/how-to-get-there",
    "https://www.sanparks.org/parks/mapungubwe/what-to-do/facilities",
    "https://www.sanparks.org/parks/mapungubwe/explore/heritage/confluence-viewpoint",
    "https://www.sanparks.org/parks/mapungubwe/travel/gps-waypoints",
    "https://www.sanparks.org/wp-content/uploads/2021/06/mapungubwe_approved_plans.pdf",
  ],
  "two real overnight facilities retained only pending explicit park confirmation of astronomy use",
  "Zwei reale Übernachtungsanlagen bleiben nur bis zur ausdrücklichen Parkbestätigung astronomischer Nutzung erhalten",
  {
    accessMode: "confirmation-only",
    checkedAt: "2026-09-21",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["SANParks: Mapungubwe overview and renovation notice", "SANParks: Mapungubwe accommodation", "SANParks: Mapungubwe visitor and wildlife safety", "SANParks: Mapungubwe access and western-section route", "SANParks: Mapungubwe facilities and operating hours", "SANParks: Confluence Viewpoint", "SANParks: Mapungubwe GPS waypoints", "SANParks: Mapungubwe Integrated Management Plan 2019–2029"],
    confirmationDetailEn: "Leokwe and Mazhou are real, bookable overnight facilities, but no reviewed SANParks source identifies either as an astronomy venue or confirms independent observing after dark. Leokwe is unfenced, dangerous wildlife can move through camps, and a current notice warns that renovations may disrupt both facilities. The Confluence Viewpoint is retained only as a documented daytime attraction and is removed from the observation-site candidates.",
    confirmationDetailDe: "Leokwe und Mazhou sind reale, buchbare Übernachtungsanlagen, doch keine geprüfte SANParks-Quelle weist einen der Orte als Astronomieplatz aus oder bestätigt selbstständige Beobachtung nach Einbruch der Dunkelheit. Leokwe ist nicht eingezäunt, gefährliche Wildtiere können Camps durchqueren und ein aktueller Hinweis warnt vor möglichen Renovierungsstörungen an beiden Anlagen. Der Confluence Viewpoint bleibt ausschließlich als dokumentierte Tagesattraktion erhalten und wird aus den Beobachtungsplatz-Kandidaten entfernt.",
    confirmationWarningEn: "Do not treat a Leokwe or Mazhou accommodation booking as permission to set up astronomy equipment outdoors. Ask Mapungubwe National Park to confirm the named camp, date, safe footprint, lighting rules and wildlife instructions in writing; otherwise postpone without driving to Confluence or another viewpoint after dark.",
    confirmationWarningDe: "Behandle eine Unterkunftsbuchung für Leokwe oder Mazhou nicht als Erlaubnis, draußen Astronomieausrüstung aufzubauen. Lass dir von Mapungubwe National Park benanntes Camp, Datum, sichere Fläche, Lichtregeln und Wildtierhinweise schriftlich bestätigen; andernfalls verschiebe, ohne nach Einbruch der Dunkelheit zum Confluence Viewpoint oder einem anderen Aussichtspunkt zu fahren.",
  },
];

const fundyIndex = candidates.findIndex(([id]) => id === "fundy");
candidates[fundyIndex] = [
  "fundy",
  "Fundy National Park",
  "CA",
  "Canada",
  "north-america",
  ["new-brunswick", "north-america"],
  "America/Moncton",
  81,
  ["national-park", "coast", "forest"],
  "Fundy National Park stargazing Canada",
  ["alma-new-brunswick", "Alma", 45.60, -64.95],
  [
    ["fundy-chignecto-campground", "Chignecto Campground", 45.604208, -64.983783, 287, "campground", "limited", 64, "https://parks.canada.ca/pn-np/nb/fundy/activ/camping/chignecto", "Parks Canada publishes this exact campground coordinate and recommends Chignecto as the overnight base for a Fundy stargazing stay. The catalogue's Copernicus GLO-30 snapshot measures 286.667 metres at the requested point. Reserve the campsite, check the operating season and current park notices, and do not treat the booking as permission to observe outside the assigned campground footprint after hours.", "Parks Canada veröffentlicht diese genaue Campingplatzkoordinate und empfiehlt Chignecto als Übernachtungsbasis für einen Sternbeobachtungsaufenthalt im Fundy-Nationalpark. Der Copernicus-GLO-30-Snapshot des Katalogs misst am abgefragten Punkt 286,667 Meter. Reserviere den Stellplatz, prüfe Saison und aktuelle Parkhinweise und behandle die Buchung nicht als Erlaubnis, außerhalb der zugewiesenen Campingfläche nach Betriebsschluss zu beobachten."],
    ["fundy-wolfe-lake-viewing-area", "Wolfe Lake viewing area", 45.660629, -65.138197, 300, "lake-viewpoint", "limited", 60, "https://parks.canada.ca/voyage-travel/hebergement-accommodation/etoile-camping-star", "Parks Canada specifically recommends viewing the sky above Wolfe Lake; the coordinate is the published Wolfe Lake visitor footprint beside the lake, not an invitation to enter shoreline terrain. The catalogue's Copernicus GLO-30 snapshot measures 300.364 metres at the requested point. Check current opening and road notices, arrive in daylight, use only established parking and visitor surfaces, and return to the booked overnight base without improvising a second stop.", "Parks Canada empfiehlt ausdrücklich die Beobachtung des Himmels über dem Wolfe Lake; die Koordinate bezeichnet die veröffentlichte Besucherfläche am See und keine Einladung, Ufergelände zu betreten. Der Copernicus-GLO-30-Snapshot des Katalogs misst am abgefragten Punkt 300,364 Meter. Prüfe aktuelle Öffnungs- und Straßenhinweise, komme bei Tageslicht an, nutze nur bestehende Park- und Besucherflächen und kehre ohne improvisierten zweiten Halt zur gebuchten Übernachtungsbasis zurück."],
  ],
  [
    "https://parks.canada.ca/voyage-travel/hebergement-accommodation/etoile-camping-star",
    "https://parks.canada.ca/pn-np/nb/fundy/activ/camping/chignecto",
    "https://parks.canada.ca/pn-np/nb/fundy/visit/centre",
    "https://parks.canada.ca/pn-np/nb/fundy/activ/chaises-chairs",
    "https://parks.canada.ca/pn-np/nb/fundy/visit/heures-hours",
    "https://parks.canada.ca/pn-np/nb/fundy/visit",
  ],
  "a booked Chignecto base with one separately checked Wolfe Lake viewing visit",
  "Eine gebuchte Basis in Chignecto mit einem getrennt geprüften Beobachtungsbesuch am Wolfe Lake",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["Parks Canada: camp among the stars at Fundy", "Parks Canada: Chignecto Campground", "Parks Canada: Wolfe Lake Visitor Centre", "Parks Canada: Wolfe Lake visitor coordinate", "Parks Canada: hours of operation", "Parks Canada: current conditions and closures"],
  },
];

const dinosaurIndex = candidates.findIndex(([id]) => id === "dinosaur-national-monument");
candidates[dinosaurIndex] = [
  "dinosaur-national-monument",
  "Dinosaur National Monument",
  "US",
  "United States",
  "north-america",
  ["utah", "colorado", "north-america"],
  "America/Denver",
  83,
  ["national-monument", "desert", "river"],
  "Dinosaur National Monument stargazing",
  ["vernal", "Vernal", 40.46, -109.54],
  [
    ["dinosaur-split-mountain-night-sky", "Split Mountain night-sky viewing area", 40.438961, -109.252451, 1462, "dark-sky-viewpoint", "limited", 66, "https://www.nps.gov/thingstodo/splitmountainstargazing.htm", "The National Park Service identifies a designated stargazing spot near Split Mountain Campground, and its published event coordinate places non-camper arrival at the adjacent day-use area. The catalogue's Copernicus GLO-30 snapshot measures 1,462.048 metres at the requested point. Check current road and campground conditions, use the signed viewing and parking footprint, and do not infer camping from attendance at the viewing area.", "Der National Park Service weist nahe dem Split Mountain Campground einen vorgesehenen Sternbeobachtungsplatz aus; die veröffentlichte Veranstaltungskoordinate führt Besucher ohne Campingbuchung zum benachbarten Tagesbereich. Der Copernicus-GLO-30-Snapshot des Katalogs misst am abgefragten Punkt 1.462,048 Meter. Prüfe aktuelle Straßen- und Campingplatzbedingungen, nutze die ausgeschilderte Beobachtungs- und Parkfläche und leite aus dem Besuch keine Campingerlaubnis ab."],
    ["dinosaur-echo-park-campground", "Echo Park Campground", 40.5208089, -108.9932317, 1552, "campground", "limited", 54, "https://www.nps.gov/dino/planyourvisit/echo-park.htm", "The National Park Service explicitly lists both camping and stargazing at Echo Park; the mapped campground coordinate identifies the developed overnight facility. The catalogue's Copernicus GLO-30 snapshot measures 1,551.513 metres at the requested point. Reach the booked camp in daylight, obey high-clearance and wet-road restrictions, remain within the campground footprint after dark and cancel rather than attempting the access road in unsuitable conditions.", "Der National Park Service nennt am Echo Park ausdrücklich Camping und Sternbeobachtung; die kartierte Campingplatzkoordinate bezeichnet die ausgebaute Übernachtungsanlage. Der Copernicus-GLO-30-Snapshot des Katalogs misst am abgefragten Punkt 1.551,513 Meter. Erreiche das gebuchte Camp bei Tageslicht, beachte Vorschriften zu Bodenfreiheit und nasser Straße, bleibe nach Einbruch der Dunkelheit innerhalb der Campingfläche und sage ab, statt die Zufahrt bei ungeeigneten Bedingungen zu versuchen."],
  ],
  [
    "https://www.nps.gov/thingstodo/splitmountainstargazing.htm",
    "https://www.nps.gov/planyourvisit/event-details.htm?id=39E9C035-FF7F-DBC8-EC2D555DE2FE4E4F",
    "https://www.nps.gov/dino/planyourvisit/echo-park.htm",
    "https://home.nps.gov/dino/planyourvisit/conditions.htm",
    "https://www.nps.gov/dino/learn/management/dinocompendium.htm",
  ],
  "one official night-sky footprint per evening, with Echo Park requiring a separate booked daylight approach",
  "Eine offizielle Nachtbeobachtungsfläche pro Abend; Echo Park erfordert eine getrennte, gebuchte Anfahrt bei Tageslicht",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["National Park Service: Split Mountain stargazing", "National Park Service: Split Mountain night-sky event and coordinate", "National Park Service: Echo Park camping and stargazing", "National Park Service: current conditions", "National Park Service: monument compendium and campground rules"],
  },
];

const enchantedRockIndex = candidates.findIndex(([id]) => id === "enchanted-rock");
candidates[enchantedRockIndex] = [
  "enchanted-rock",
  "Enchanted Rock",
  "US",
  "United States",
  "north-america",
  ["texas", "north-america"],
  "America/Chicago",
  77,
  ["state-park", "granite", "hill-country"],
  "Enchanted Rock State Natural Area stargazing",
  ["fredericksburg", "Fredericksburg", 30.28, -98.87],
  [
    ["enchanted-rock-loop-trail-d2", "Loop Trail south trailhead day-use area (D2)", 30.4986160149212, -98.8184177520007, 433, "trailhead-day-use", "limited", 64, "https://tpwd.texas.gov/state-parks/enchanted-rock/trails-info", "Texas Parks and Wildlife maps this day-use footprint at the south side of the Loop Trail. The park is open until 10 p.m., but the entrance gate closes earlier, and every trail except the Loop Trail closes shortly after sunset. Check current capacity and closure notices, arrive before the gate closes, remain on the Loop Trail and developed D2 surface, and never continue toward the summit after its trail closes.", "Texas Parks and Wildlife kartiert diese Tagesfläche an der Südseite des Loop Trail. Der Park ist bis 22 Uhr geöffnet, das Einfahrtstor schließt jedoch früher, und alle Wege außer dem Loop Trail schließen kurz nach Sonnenuntergang. Prüfe aktuelle Kapazitäts- und Sperrhinweise, komme vor Torschluss an, bleibe auf dem Loop Trail und der ausgebauten D2-Fläche und gehe nach Wegschluss niemals weiter in Richtung Gipfel."],
    ["enchanted-rock-walk-in-tent-sites", "Walk-in tent sites", 30.4963306133242, -98.822661387928, 435, "campground", "limited", 62, "https://tpwd.texas.gov/state-parks/enchanted-rock/fees-facilities/campsites", "The official park GIS and camping map place the walk-in tent-site area at this coordinate. An overnight reservation provides a legal base but does not reopen the summit or other closed trails. Book the site, obtain late-arrival instructions and the gate code before the office closes when needed, observe only from the assigned campsite or open Loop Trail footprint, and follow quiet and light rules.", "Das offizielle Park-GIS und die Campingkarte verorten den Bereich der begehbaren Zeltplätze an dieser Koordinate. Eine Übernachtungsbuchung schafft eine legale Basis, öffnet aber weder den Gipfel noch andere geschlossene Wege. Buche den Platz, hole bei Bedarf vor Büroschluss Hinweise zur späten Ankunft und den Torcode ein, beobachte nur vom zugewiesenen Stellplatz oder vom geöffneten Loop Trail und beachte Ruhe- und Lichtregeln."],
  ],
  [
    "https://tpwd.texas.gov/state-parks/enchanted-rock",
    "https://tpwd.texas.gov/state-parks/enchanted-rock/trails-info",
    "https://tpwd.texas.gov/state-parks/enchanted-rock/more-info/dark-skies",
    "https://tpwd.texas.gov/publications/pwdpubs/media/park_maps/pwd_mp_p4507_119e.pdf",
    "https://services1.arcgis.com/1mtXwieMId59thmg/arcgis/rest/services/Texas_State_Parks_Public_Areas/FeatureServer",
  ],
  "an open Loop Trail footprint or a booked campsite, never the closed summit route.",
  "Eine geöffnete Fläche am Loop Trail oder ein gebuchter Campingplatz, niemals die geschlossene Gipfelroute.",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "public-agency"],
    sourceTitles: ["Texas Parks and Wildlife: Enchanted Rock hours and gate rules", "Texas Parks and Wildlife: Enchanted Rock trail closures", "Texas Parks and Wildlife: dark skies and star parties", "Texas Parks and Wildlife: official camping and trail map", "Texas Parks and Wildlife GIS: public day-use and camping areas"],
  },
];

const kissimmeePrairieIndex = candidates.findIndex(([id]) => id === "kissimmee-prairie");
candidates[kissimmeePrairieIndex] = [
  "kissimmee-prairie",
  "Kissimmee Prairie",
  "US",
  "United States",
  "north-america",
  ["florida", "north-america"],
  "America/New_York",
  76,
  ["dark-sky-park", "prairie", "wetland"],
  "Kissimmee Prairie Preserve State Park stargazing",
  ["okeechobee", "Okeechobee", 27.24, -80.83],
  [
    ["kissimmee-astronomy-pad-a", "Astronomy Pad A", 27.5854220514553, -81.0457665490602, 19, "astronomy-pad", "limited", 68, "https://www.floridastateparks.org/learn/dark-sky-designation", "Florida State Parks identifies the astronomy pads as reservable night-observing facilities, and the official accommodation GIS maps Pad A at this coordinate. Reserve the pad, contact the ranger station, arrive before sunset and the gate closure, use only red-spectrum lighting after dark, and do not light a fire. A pad reservation does not authorize entry into other closed preserve areas.", "Florida State Parks weist die Astronomy Pads als buchbare Nachtbeobachtungsanlagen aus; das offizielle Unterkunfts-GIS kartiert Pad A an dieser Koordinate. Reserviere den Platz, kontaktiere die Rangerstation, komme vor Sonnenuntergang und Torschluss an, verwende nach Einbruch der Dunkelheit nur rotes Licht und entzünde kein Feuer. Eine Pad-Reservierung erlaubt keinen Zutritt zu anderen geschlossenen Bereichen des Schutzgebiets."],
    ["kissimmee-entrance-pavilion", "Entrance-kiosk viewing pavilion", 27.5394789831591, -81.0218868135205, 22, "entrance-viewing-area", "limited", 62, "https://www.floridastateparks.org/learn/dark-sky-designation", "Florida State Parks directs visitors without a campsite, astronomy-pad reservation or eligible after-hours permit to the grass and small pavilion immediately right of the entrance kiosk. The official park GIS places that pavilion here. Park outside the closed gate as directed, pay the applicable entry fee, bring red lighting, water and a toilet plan because the current guidance says no bathrooms are available, and do not pass the gate after it closes.", "Florida State Parks verweist Besucher ohne Camping- oder Astronomy-Pad-Buchung und ohne berechtigte Nachtgenehmigung auf die Wiese und den kleinen Pavillon unmittelbar rechts am Eingangskiosk. Das offizielle Park-GIS verortet diesen Pavillon hier. Parke wie vorgeschrieben außerhalb des geschlossenen Tors, entrichte den fälligen Eintritt, bringe rotes Licht, Wasser und einen Toilettenplan mit, da die aktuellen Hinweise keine Toiletten zusichern, und passiere das Tor nach Schließung nicht."],
  ],
  [
    "https://www.floridastateparks.org/learn/dark-sky-designation",
    "https://www.floridastateparks.org/parks-and-trails/kissimmee-prairie-preserve-state-park",
    "https://www.floridastateparks.org/sites/default/files/media/file/Kissimmee%20Prairie%20Brochure.pdf",
    "https://services1.arcgis.com/nRHtyn3uE1kyzoYc/ArcGIS/rest/services/Overnight_Accommodations_Statewide_Clean/FeatureServer/0",
    "https://services1.arcgis.com/nRHtyn3uE1kyzoYc/arcgis/rest/services/PBS_POI_Statewide/FeatureServer/0",
  ],
  "a reserved astronomy pad or the separately documented entrance-kiosk fallback.",
  "Ein reservierter Astronomy Pad oder die getrennt dokumentierte Ausweichfläche am Eingangskiosk.",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "public-agency", "public-agency"],
    sourceTitles: ["Florida State Parks: dark-sky access and lighting rules", "Florida State Parks: Kissimmee Prairie Preserve", "Florida State Parks: official preserve brochure", "Florida State Parks GIS: astronomy-pad accommodations", "Florida State Parks GIS: entrance pavilion and parking"],
  },
];

const medicineRocksIndex = candidates.findIndex(([id]) => id === "medicine-rocks");
candidates[medicineRocksIndex] = [
  "medicine-rocks",
  "Medicine Rocks",
  "US",
  "United States",
  "north-america",
  ["montana", "north-america"],
  "America/Denver",
  82,
  ["state-park", "prairie", "dark-sky"],
  "Medicine Rocks State Park Montana stargazing",
  ["baker-montana", "Baker", 46.37, -104.77],
  [
    ["medicine-rocks-night-sky-trail", "Night Sky Trail", 46.0462234527945, -104.467333269572, 1031, "dark-sky-trail", "limited", 62, "https://fwp.mt.gov/medicine-rocks", "Montana FWP publishes the Night Sky Trail as a final public trail and holds guided viewing events from its signed parking and viewing area. This marker lies on the official trail geometry; it is not a substitute for the signed event meeting point. Day use ends at 10 p.m., so use the trail independently only within current park hours, or follow staff instructions during a dated event, and check closures before travel.", "Montana FWP veröffentlicht den Night Sky Trail als endgültig freigegebenen öffentlichen Weg und veranstaltet geführte Beobachtungen ab dem ausgeschilderten Parkplatz und Beobachtungsbereich. Diese Markierung liegt auf der offiziellen Weggeometrie; sie ersetzt nicht den ausgeschilderten Veranstaltungstreffpunkt. Die Tagesnutzung endet um 22 Uhr. Nutze den Weg selbstständig nur innerhalb der aktuellen Parkzeiten oder folge bei einer datierten Veranstaltung den Anweisungen des Personals und prüfe vor der Anreise Sperrungen."],
    ["medicine-rocks-campsite-1", "Campsite 1", 46.0417955583512, -104.468172965914, 1050, "campground", "limited", 60, "https://fwp.mt.gov/medicine-rocks", "The official Montana FWP facilities layer maps Campsite 1 at this coordinate, one of eight first-come sites. Camping is available year-round subject to current restrictions, but the campsite is a separate overnight footprint and not the Night Sky Trail viewing area. Confirm availability and closures, remain within the assigned campsite after day-use hours, keep lighting low and respect campground quiet hours.", "Der offizielle Anlagen-Datensatz von Montana FWP kartiert Campsite 1 an dieser Koordinate; es ist einer von acht Plätzen nach dem Prinzip der ersten Ankunft. Camping ist vorbehaltlich aktueller Einschränkungen ganzjährig möglich, doch der Stellplatz ist eine eigene Übernachtungsfläche und nicht der Beobachtungsbereich des Night Sky Trail. Bestätige Verfügbarkeit und Sperrungen, bleibe nach Ende der Tagesnutzung auf dem zugewiesenen Stellplatz, halte die Beleuchtung niedrig und beachte die Ruhezeiten."],
  ],
  [
    "https://fwp.mt.gov/medicine-rocks",
    "https://fwp.mt.gov/binaries/content/assets/fwp/gisresources/parktrailmaps/medicine_rocks_trail_map.pdf",
    "https://services3.arcgis.com/Cdxz8r11hT0MGzg1/arcgis/rest/services/FWPLND_TRAILS_STATEPARKS_PUBLIC/FeatureServer/0",
    "https://services3.arcgis.com/Cdxz8r11hT0MGzg1/ArcGIS/rest/services/FWPLND_STATEPARKS_FACILITIES_PTS/FeatureServer/0",
    "https://fwp.mt.gov/stateparks/fees-and-general-information",
  ],
  "the official Night Sky Trail within park hours or a separate first-come campsite.",
  "Der offizielle Night Sky Trail innerhalb der Parkzeiten oder ein getrennter Stellplatz nach dem Prinzip der ersten Ankunft.",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "public-agency", "public-agency", "protected-area"],
    sourceTitles: ["Montana FWP: Medicine Rocks hours, camping and night-sky events", "Montana FWP: official Medicine Rocks trail map", "Montana FWP GIS: public Night Sky Trail geometry", "Montana FWP GIS: campsite facilities", "Montana FWP: state-park fees and general rules"],
  },
];

const bigCypressIndex = candidates.findIndex(([id]) => id === "big-cypress");
candidates[bigCypressIndex] = [
  "big-cypress",
  "Big Cypress",
  "US",
  "United States",
  "north-america",
  ["florida", "north-america"],
  "America/New_York",
  74,
  ["dark-sky-park", "wetland", "wildlife"],
  "Big Cypress National Preserve stargazing",
  ["ochopee", "Ochopee", 25.85, -81.39],
  [
    ["big-cypress-seagrape-night-sky-program", "Seagrape Drive night-sky programme area", 25.900808, -81.325929, 8, "ranger-program-area", "limited", 68, "https://www.nps.gov/bicy/planyourvisit/astronomy-programs.htm", "The National Park Service publishes its current winter astronomy programmes at the south end of Seagrape Drive, east of the Nathaniel P. Reed Visitor Center; an official event record maps this programme footprint at the coordinate shown. Use it only for a currently listed programme, follow ranger parking and boundary instructions, bring a chair and insect protection, use red light only, leave pets at home and accept weather cancellation. The marker does not authorize independent use of another day-use area after closing.", "Der National Park Service veröffentlicht seine aktuellen Winter-Astronomieprogramme am südlichen Ende der Seagrape Drive östlich des Nathaniel P. Reed Visitor Center; ein offizieller Veranstaltungseintrag kartiert die Programmfläche an der angegebenen Koordinate. Nutze sie nur für ein aktuell aufgeführtes Programm, folge den Ranger-Anweisungen zu Parkplatz und Grenze, bringe Sitzgelegenheit und Insektenschutz mit, verwende ausschließlich rotes Licht, lasse Haustiere zu Hause und akzeptiere wetterbedingte Absagen. Die Markierung erlaubt keine selbstständige Nutzung eines anderen Tagesbereichs nach dessen Schließung."],
    ["big-cypress-midway-campground", "Midway Campground", 25.851926, -80.989444, 6, "campground", "limited", 60, "https://home.nps.gov/bicy/planyourvisit/midway-campground.htm", "The National Park Service publishes this exact Midway Campground coordinate and identifies the campground as open year-round, subject to current conditions and a Recreation.gov reservation. Use only the assigned campsite as the overnight footprint, keep lighting and noise low during quiet hours, do not move to a day-use boardwalk after closing, and follow all wildlife, water and fire restrictions. A campsite booking is separate from the Seagrape astronomy programme.", "Der National Park Service veröffentlicht diese genaue Koordinate des Midway Campground und weist den Campingplatz vorbehaltlich aktueller Bedingungen und einer Reservierung über Recreation.gov als ganzjährig geöffnet aus. Nutze ausschließlich den zugewiesenen Stellplatz als Übernachtungsfläche, halte Licht und Lärm während der Ruhezeiten niedrig, wechsle nach Schließung nicht zu einem Tages-Boardwalk und beachte alle Wildtier-, Wasser- und Feuerregeln. Eine Campingbuchung ist vom Astronomieprogramm an der Seagrape Drive getrennt."],
  ],
  [
    "https://www.nps.gov/thingstodo/stargazing-in-big-cypress.htm",
    "https://www.nps.gov/bicy/planyourvisit/astronomy-programs.htm",
    "https://www.nps.gov/planyourvisit/event-details.htm?id=141B4EE7-DF23-54A4-6C48051AD9F08A0D",
    "https://home.nps.gov/bicy/planyourvisit/midway-campground.htm",
    "https://www.recreation.gov/camping/campgrounds/246892",
    "https://www.nps.gov/bicy/learn/management/big-cypress-superintendent-compendium.htm",
  ],
  "an official ranger programme or a separately booked campsite, never an improvised boardwalk stop.",
  "Ein offizielles Rangerprogramm oder ein getrennt gebuchter Campingplatz, niemals ein improvisierter Halt an einem Boardwalk.",
  {
    accessMode: "programme-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "public-agency", "protected-area"],
    sourceTitles: ["National Park Service: stargazing in Big Cypress", "National Park Service: current astronomy programmes", "National Park Service: official Seagrape programme footprint", "National Park Service: Midway Campground", "Recreation.gov: Midway reservations and campground rules", "National Park Service: current Big Cypress compendium"],
    programmeDetailEn: "Seagrape Drive is usable only for a currently published ranger programme and its instructions. Midway Campground is a separate reservable overnight footprint; neither arrangement authorizes entry to another closed day-use area.",
    programmeDetailDe: "Die Seagrape Drive ist nur im Rahmen eines aktuell veröffentlichten Rangerprogramms und dessen Anweisungen nutzbar. Der Midway Campground ist eine getrennte, buchbare Übernachtungsfläche; keiner der beiden Rahmen erlaubt den Zutritt zu einem anderen geschlossenen Tagesbereich.",
  },
];

const kangarooIslandIndex = candidates.findIndex(([id]) => id === "kangaroo-island");
candidates[kangarooIslandIndex] = [
  "kangaroo-island",
  "Kangaroo Island",
  "AU",
  "Australia",
  "oceania",
  ["south-australia", "oceania"],
  "Australia/Adelaide",
  83,
  ["island", "coastal", "wildlife"],
  "Kangaroo Island South Australia stargazing",
  ["kingscote", "Kingscote", -35.66, 137.64],
  [
    ["kangaroo-west-bay-campground", "West Bay Campground", -35.888775, 136.552813, 15, "campground", "limited", 46, "https://www.parks.sa.gov.au/parks/flinders-chase-national-park/booking/65342", "Parks SA identifies West Bay as a small bookable campground reached by 4WD, and the official georeferenced campground map places its footprint at this representative coordinate. Book before travel, verify that West Bay Road remains open after rain, arrive in daylight, keep the vehicle parked for the complete dark interval and observe only beside the assigned site. Do not drive to park attractions after dark; wildlife is active at dawn, dusk and night.", "Parks SA weist West Bay als kleinen buchbaren Campingplatz mit 4WD-Zufahrt aus; die offizielle georeferenzierte Campingkarte verortet seine Fläche an dieser repräsentativen Koordinate. Buche vor der Fahrt, bestätige nach Regen die Öffnung der West Bay Road, komme bei Tageslicht an, lasse das Fahrzeug während der gesamten Dunkelphase stehen und beobachte nur neben dem zugewiesenen Platz. Fahre nach Einbruch der Dunkelheit keine Parkattraktionen an; Wildtiere sind in Dämmerung und Nacht aktiv."],
    ["kangaroo-rocky-river-campground", "Rocky River Campground", -35.9522, 136.732703, 40, "campground", "limited", 62, "https://www.parks.sa.gov.au/parks/flinders-chase-national-park/booking/63689", "Parks SA lists Rocky River as a bookable campground with allocated sites, toilets and showers; the official georeferenced campground map places its footprint at this representative coordinate. Book and arrive during daylight, settle at the assigned site and keep the vehicle there until daylight returns. This is a separate overnight option, not a second stop after West Bay, and park fire, generator, wildlife and temporary-closure rules remain controlling.", "Parks SA führt Rocky River als buchbaren Campingplatz mit zugewiesenen Stellplätzen, Toiletten und Duschen; die offizielle georeferenzierte Campingkarte verortet seine Fläche an dieser repräsentativen Koordinate. Buche und komme bei Tageslicht an, richte dich am zugewiesenen Platz ein und lasse das Fahrzeug bis zur Rückkehr des Tageslichts dort stehen. Dies ist eine getrennte Übernachtungsoption und kein zweiter Halt nach West Bay; Feuer-, Generator-, Wildtier- und temporäre Sperrregeln des Parks bleiben maßgeblich."],
  ],
  [
    "https://www.parks.sa.gov.au/parks/flinders-chase-national-park",
    "https://www.parks.sa.gov.au/parks/flinders-chase-national-park/accommodation",
    "https://www.parks.sa.gov.au/insider-tips/stargazing-in-south-australia",
    "https://www.parks.sa.gov.au/parks/flinders-chase-national-park/booking/63689",
    "https://www.parks.sa.gov.au/parks/flinders-chase-national-park/booking/65342",
    "https://cdn.environment.sa.gov.au/parks/docs/flinders-chase-national-park/Flinders_Chase_NP_Rocky_River_campground_optimised.pdf",
    "https://cdn.environment.sa.gov.au/parks/docs/flinders-chase-national-park/flinders-chase-west-bay-campground-map.pdf",
  ],
  "one booked Flinders Chase campsite for the complete night, with arrival and onward travel in daylight.",
  "Ein gebuchter Campingplatz in Flinders Chase für die vollständige Nacht, mit Ankunft und Weiterfahrt bei Tageslicht.",
  {
    accessMode: "camp-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["Parks SA: Flinders Chase hours, conditions and safety", "Parks SA: Flinders Chase accommodation", "Parks SA: stargazing in South Australia", "Parks SA: Rocky River Campground booking", "Parks SA: West Bay Campground booking", "Parks SA: official Rocky River campground map", "Parks SA: official West Bay campground map"],
    campDetailEn: "Parks SA explicitly promotes stargazing in Flinders Chase and identifies West Bay and Rocky River as bookable campgrounds. The usable plan is one overnight booking, daylight arrival and observing beside the assigned campsite, with the vehicle left parked until daylight returns. The second campground requires another booking and a separate daylight journey.",
    campDetailDe: "Parks SA bewirbt Sternbeobachtung in Flinders Chase ausdrücklich und weist West Bay sowie Rocky River als buchbare Campingplätze aus. Der nutzbare Plan besteht aus einer Übernachtungsbuchung, Ankunft bei Tageslicht und Beobachtung neben dem zugewiesenen Stellplatz; das Fahrzeug bleibt bis zur Rückkehr des Tageslichts stehen. Der zweite Campingplatz erfordert eine weitere Buchung und eine getrennte Tagesfahrt.",
    campArrivalRuleEn: "Reach the booked campsite in daylight and before any current arrival cutoff",
    campArrivalRuleDe: "Den gebuchten Campingplatz bei Tageslicht und vor der aktuellen Ankunftsfrist erreichen",
    campRouteRationaleEn: "The one-camp design protects dark adaptation and avoids a wildlife-sensitive transfer after dark.",
    campRouteRationaleDe: "Das Ein-Camp-Design schützt die Dunkeladaption und vermeidet eine wildtiersensible Fahrt nach Einbruch der Dunkelheit.",
    campFinishWarningEn: "The itinerary deliberately excludes driving between campgrounds or attractions after dark.",
    campFinishWarningDe: "Die Route schließt Fahrten zwischen Campingplätzen oder Attraktionen nach Einbruch der Dunkelheit bewusst aus.",
  },
];

const sturtStonyDesertIndex = candidates.findIndex(([id]) => id === "sturt-stony-desert");
candidates[sturtStonyDesertIndex] = [
  "sturt-stony-desert",
  "Sturt Stony Desert",
  "AU",
  "Australia",
  "oceania",
  ["south-australia", "oceania"],
  "Australia/Adelaide",
  88,
  ["desert", "remote", "outback"],
  "Sturt Stony Desert South Australia",
  ["innamincka", "Innamincka", -27.75, 140.73],
  [
    ["innamincka-cullyamurra-waterhole-campground", "Cullyamurra Waterhole Campground", -27.70194, 140.838605, 47, "campground", "limited", 36, "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve/booking/73138", "Parks SA identifies Cullyamurra Waterhole as a named bookable campground about 16 kilometres northeast of Innamincka, with high-clearance 4WD access and long-drop toilets; the official georeferenced reserve map places the campground at this coordinate. Do not travel to or use it while the flooding closure published on 4 August 2026 remains in force. Only after Parks SA explicitly reopens the route and campground may a booked visitor arrive in daylight, remain within one assigned camp for the whole night and leave after daylight, with water, communications, road, fire, flood, falling-branch and dingo precautions confirmed.", "Parks SA weist Cullyamurra Waterhole als benannten buchbaren Campingplatz etwa 16 Kilometer nordöstlich von Innamincka mit Zufahrt für hochgelegte Allradfahrzeuge und Plumpsklos aus; die offizielle georeferenzierte Reservatskarte verortet den Campingplatz an dieser Koordinate. Fahre den Ort nicht an und nutze ihn nicht, solange die am 4. August 2026 veröffentlichte Flutsperre gilt. Erst nach ausdrücklicher Wiederöffnung von Strecke und Campingplatz durch Parks SA darf ein gebuchter Gast bei Tageslicht ankommen, die ganze Nacht in einem zugewiesenen Camp bleiben und erst bei Tageslicht weiterfahren; Wasser, Kommunikation sowie Straßen-, Feuer-, Flut-, Astbruch- und Dingoschutz müssen bestätigt sein."],
    ["innamincka-policemans-waterhole-campground", "Policemans Waterhole Campground", -27.758895, 140.703828, 41, "campground", "limited", 40, "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve/booking/73141", "Parks SA identifies Policemans Waterhole as a named bookable campground about two kilometres southwest of Innamincka via Fifteen Mile Track, requiring a high-clearance 4WD; the official georeferenced reserve map places it at this coordinate. Do not travel to or use it while the flooding closure published on 4 August 2026 remains in force. After an explicit reopening, book first, reach one assigned camp in daylight, keep the west gate clear, remain there throughout the dark interval and depart after daylight only after renewed road, water, communications, fire, flood and wildlife checks.", "Parks SA weist Policemans Waterhole als benannten buchbaren Campingplatz etwa zwei Kilometer südwestlich von Innamincka über den Fifteen Mile Track aus; erforderlich ist ein hochgelegtes Allradfahrzeug, und die offizielle georeferenzierte Reservatskarte verortet ihn an dieser Koordinate. Fahre den Ort nicht an und nutze ihn nicht, solange die am 4. August 2026 veröffentlichte Flutsperre gilt. Buche erst nach ausdrücklicher Wiederöffnung, erreiche ein zugewiesenes Camp bei Tageslicht, halte das Westtor frei, bleibe während der Dunkelphase dort und fahre erst bei Tageslicht nach erneuter Prüfung von Straße, Wasser, Kommunikation, Feuer, Flut und Wildtieren weiter."],
  ],
  [
    "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve",
    "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve/accommodation",
    "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve/booking/73138",
    "https://www.parks.sa.gov.au/parks/innamincka-regional-reserve/booking/73141",
    "https://cdn.environment.sa.gov.au/parks/docs/innamincka-regional-reserve/Innamincka-Surrounds.pdf",
    "https://cdn.environment.sa.gov.au/parks/docs/innamincka-regional-reserve/Innamincka-Regional-Reserve.pdf",
    "https://www.parks.sa.gov.au/know-before-you-go/closures-and-alerts/malkumba-coongie-lakes-national-park-and-innamincka-regional-reserve-2",
    "https://www.parks.sa.gov.au/know-before-you-go/desert-parks-bulletin-2",
  ],
  "two verified bookable campgrounds that remain unusable until the current flood closure is explicitly lifted.",
  "Zwei verifizierte buchbare Campingplätze, die bis zur ausdrücklichen Aufhebung der aktuellen Flutsperre unbenutzbar bleiben.",
  {
    accessMode: "confirmation-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area", "protected-area"],
    sourceTitles: ["Parks SA: Innamincka Regional Reserve", "Parks SA: Innamincka accommodation", "Parks SA: Cullyamurra Waterhole booking", "Parks SA: Policemans Waterhole booking", "Parks SA: official Innamincka surrounds map", "Parks SA: official regional-reserve map", "Parks SA: current flooding closure", "Parks SA: current Desert Parks Bulletin"],
    confirmationDetailEn: "Cullyamurra Waterhole and Policemans Waterhole are exact named bookable campgrounds, but the Parks SA notice published on 4 August 2026 closes the relevant reserve areas because of major flooding until further notice. Neither record is usable until Parks SA explicitly reopens its road and campground and current booking, road, flood, fire, water and communications checks all pass.",
    confirmationDetailDe: "Cullyamurra Waterhole und Policemans Waterhole sind genau verortete, benannte und buchbare Campingplätze. Der am 4. August 2026 veröffentlichte Hinweis von Parks SA sperrt die betroffenen Reservatsbereiche jedoch wegen schwerer Überschwemmungen bis auf Weiteres. Keiner der Datensätze ist nutzbar, bevor Parks SA Straße und Campingplatz ausdrücklich wieder öffnet und aktuelle Prüfungen von Buchung, Straße, Flut, Feuer, Wasser und Kommunikation vollständig bestanden sind.",
    confirmationWarningEn: "Do not begin an observing or camping visit while the current flooding closure remains. After reopening, use one booked campground only, arrive and depart in daylight, and do not drive between camps after dark.",
    confirmationWarningDe: "Beginne keinen Beobachtungs- oder Campingbesuch, solange die aktuelle Flutsperre gilt. Nutze nach der Wiederöffnung nur einen gebuchten Campingplatz, komme und fahre bei Tageslicht und wechsle nach Einbruch der Dunkelheit nicht zwischen Camps.",
  },
];

const isleOfSarkIndex = candidates.findIndex(([id]) => id === "isle-of-sark");
candidates[isleOfSarkIndex] = [
  "isle-of-sark",
  "Isle of Sark",
  "GB",
  "United Kingdom",
  "europe",
  ["channel-islands", "europe"],
  "Europe/Guernsey",
  86,
  ["island", "dark-sky-community", "coastal"],
  "Isle of Sark Channel Islands",
  ["sark", "Sark", 49.43, -2.36],
  [
    ["sark-dachinger-observatory", "Dachinger Observatory", 49.432552, -2.361605, 90, "public-observatory", "limited", 68, "https://www.sark.co.uk/nature/dark-skies", "Sark's official visitor service directs visitors to contact the Visitor Centre to book the island observatory, while its current community page says the Sark Astronomy Society offers telescope sessions at the Dachinger Observatory throughout the year for a minimum donation. Use this exact observatory only after the Visitor Centre or Society confirms a dated session and meeting instructions. Walk the public lanes carefully, carry a low red light and do not infer access to neighbouring land outside the guided programme.", "Der offizielle Besucherdienst von Sark verweist für Buchungen des Inselobservatoriums an das Visitor Centre; die aktuelle Gemeinschaftsseite erklärt zudem, dass die Sark Astronomy Society ganzjährig Teleskopsitzungen am Dachinger Observatory gegen eine Mindestspende anbietet. Nutze dieses genau verortete Observatorium nur nach Bestätigung eines datierten Termins und der Treffpunktanweisung durch Visitor Centre oder Society. Gehe vorsichtig auf den öffentlichen Wegen, nutze schwaches rotes Licht und leite aus dem Programm keinen Zutritt zu benachbartem Gelände ab."],
    ["sark-la-valette-campsite", "La Valette Campsite", 49.435751, -2.348015, 50, "campground", "limited", 62, "https://www.sark.co.uk/properties/la-valette-campsite", "Sark's official accommodation listing identifies La Valette as a permitted family campsite and explicitly promotes lying on its grass at night to view the constellations. Book the campsite directly, confirm the assigned field and current facilities, arrive before dark and observe only within the booked camping footprint. The nearby public northeast walking route helps identify the area in daylight but does not turn the lighthouse lookout or coastal paths into campsite overflow after dark.", "Das offizielle Unterkunftsverzeichnis von Sark weist La Valette als genehmigten Familiencampingplatz aus und empfiehlt ausdrücklich, nachts auf seiner Wiese die Sternbilder zu betrachten. Buche den Campingplatz direkt, bestätige zugewiesenes Feld und aktuelle Einrichtungen, komme vor Dunkelheit an und beobachte nur innerhalb der gebuchten Campingfläche. Die nahe öffentliche Nordost-Wanderroute hilft bei der Orientierung am Tag, macht aber weder den Leuchtturm-Aussichtspunkt noch die Küstenwege nachts zu einer Erweiterung des Campingplatzes."],
  ],
  [
    "https://www.sark.co.uk/nature/dark-skies",
    "https://www.sark.co.uk/attractions",
    "https://www.sark.co.uk/post/join-in-with-the-locals",
    "https://www.sark.co.uk/properties/la-valette-campsite",
    "https://www.sark.co.uk/walking-trails/northeast-route",
  ],
  "a booked observatory session or a separately booked campsite field, reached on Sark's public lanes.",
  "Eine gebuchte Observatoriumssitzung oder ein getrennt gebuchtes Campingfeld, erreichbar über Sarks öffentliche Wege.",
  {
    accessMode: "programme-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["official-destination", "official-destination", "official-destination", "official-destination", "official-destination"],
    sourceTitles: ["Sark Visitor Centre: dark skies and observatory booking", "Sark Visitor Centre: Sark Observatory", "Sark Visitor Centre: year-round Dachinger sessions", "Sark Visitor Centre: La Valette Campsite", "Sark Visitor Centre: northeast public walking route"],
    programmeDetailEn: "The Dachinger Observatory is usable only for a session confirmed through the Visitor Centre or Sark Astronomy Society. La Valette is a separate bookable campsite whose official listing explicitly supports stargazing from its grass; neither arrangement grants access to the other place or to private coastal land.",
    programmeDetailDe: "Das Dachinger Observatory ist nur für einen durch Visitor Centre oder Sark Astronomy Society bestätigten Termin nutzbar. La Valette ist ein getrennt buchbarer Campingplatz, dessen offizieller Eintrag Sternbeobachtung auf der Wiese ausdrücklich vorsieht; keiner der beiden Rahmen gewährt Zugang zum anderen Ort oder zu privatem Küstenland.",
  },
];

const achiVillageIndex = candidates.findIndex(([id]) => id === "achi-village");
candidates[achiVillageIndex] = [
  "achi-village",
  "Achi Village",
  "JP",
  "Japan",
  "asia",
  ["nagano", "asia"],
  "Asia/Tokyo",
  82,
  ["dark-sky-community", "mountain", "village"],
  "Achi Village Japan stargazing",
  ["achi", "Achi", 35.44, 137.72],
  [
    ["achi-heavens-sonohara-summit-event-site", "Heavens Sonohara summit Night Tour venue", 35.455138, 137.642326, 1400, "booked-night-tour", "limited", 68, "https://sva.jp/night_tour/", "The official 2026–2027 Night Tour uses the Heavens Sonohara summit venue at 1,400 metres, reached only by the 2.5-kilometre gondola from the published base address. Buy a date-specific ticket, navigate to the base rather than attempting to drive to the summit, follow the operator's zone and light-down instructions and use the returning gondola at the programme finish. Weather can move interpretation indoors or cancel operation, and the coordinate does not authorize independent mountain access.", "Die offizielle Night Tour 2026–2027 nutzt das 1.400 Meter hohe Gipfelgelände von Heavens Sonohara, das ausschließlich mit der 2,5 Kilometer langen Gondel von der veröffentlichten Taladresse erreicht wird. Kaufe ein datiertes Ticket, navigiere zur Talstation statt zum Gipfel zu fahren, folge den Zonen- und Licht-aus-Anweisungen des Betreibers und nutze zum Programmende die Talgondel. Wetter kann die Erklärung nach innen verlegen oder den Betrieb absagen; die Koordinate erlaubt keinen selbstständigen Bergzugang."],
    ["achi-namiai-park-observing-field", "Namiai Park observing field", 35.353776, 137.668207, 1200, "booked-stargazing-park", "limited", 64, "https://namiai-park.com/", "Namiai Park publishes its exact address and embedded map position, daily opening to 22:00 and a guided stargazing session held every day, with indoor interpretation in rain. Pay the required admission or reserve a private observing deck, use the official parking and field only during current opening hours, and follow staff instructions for arrival, lighting, photography and departure. This is a separate facility from Heavens Sonohara and requires its own current arrangement.", "Namiai Park veröffentlicht genaue Adresse und eingebettete Kartenposition, tägliche Öffnung bis 22 Uhr und eine täglich stattfindende geführte Sternbeobachtung mit Innenprogramm bei Regen. Entrichte den erforderlichen Eintritt oder reserviere ein privates Beobachtungsdeck, nutze offiziellen Parkplatz und Beobachtungsfeld nur während der aktuellen Öffnungszeiten und folge den Personalhinweisen zu Ankunft, Licht, Fotografie und Abfahrt. Dies ist eine von Heavens Sonohara getrennte Anlage mit eigenem aktuellem Rahmen."],
  ],
  [
    "https://sva.jp/night_tour/",
    "https://info.sva.jp/information/night_tour_2026/",
    "https://sva.jp/access",
    "https://namiai-park.com/",
    "https://namiai-park.com/price/",
    "https://db.go-nagano.net/topics_detail6/id=5071",
  ],
  "one current booked programme, using either the summit gondola venue or Namiai Park and never an improvised village edge.",
  "Ein aktuelles gebuchtes Programm entweder am Gondel-Gipfelgelände oder im Namiai Park, niemals ein improvisierter Dorfrand.",
  {
    accessMode: "programme-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["official-destination", "official-destination", "official-destination", "official-destination", "official-destination", "public-agency"],
    sourceTitles: ["Star Village Achi: Night Tour 2026–2027", "Star Village Achi: current Night Tour announcement", "Star Village Achi: official access and gondola directions", "Namiai Park: current programme, hours and exact map", "Namiai Park: admission and deck booking", "Nagano official tourism: Namiai Park"],
    programmeDetailEn: "Heavens Sonohara is a date-specific ticketed gondola programme at its 1,400-metre summit venue. Namiai Park is a separate staffed facility with required admission or deck booking and current hours to 22:00. A booking for one venue grants no access to the other.",
    programmeDetailDe: "Heavens Sonohara ist ein datiertes Gondelprogramm mit Ticket am 1.400 Meter hohen Gipfelgelände. Namiai Park ist eine getrennte betreute Anlage mit erforderlichem Eintritt oder Deckbuchung und aktuellen Öffnungszeiten bis 22 Uhr. Eine Buchung für einen Ort gewährt keinen Zugang zum anderen.",
  },
];

const alulaIndex = candidates.findIndex(([id]) => id === "alula");
candidates[alulaIndex] = [
  "alula",
  "AlUla",
  "SA",
  "Saudi Arabia",
  "asia",
  ["al-madinah", "asia"],
  "Asia/Riyadh",
  84,
  ["desert", "heritage", "guided", "dark-sky-park"],
  "AlUla Saudi Arabia stargazing",
  ["alula", "AlUla", 26.61, 37.92],
  [
    ["alula-harrat-viewpoint", "Harrat Viewpoint", 26.6323669, 37.8966321, 1219, "desert-viewpoint", "limited", 64, "https://www.experiencealula.com/en/places-to-go/harrat-viewpoint", "Experience AlUla maps this exact visitor viewpoint, states that it is 1,219 metres above sea level and currently opens from 14:00 to 22:00 with free parking, free entry and no booking requirement. The page explicitly describes naked-eye stars and onsite telescopes. Recheck the official page on the day, arrive while the route is clear, observe only inside the managed viewpoint footprint and finish before closing; the listing does not authorize camping or access beyond the visitor area.", "Experience AlUla kartiert diesen genauen Besucher-Aussichtspunkt, nennt 1.219 Meter Höhe und aktuell eine Öffnung von 14 bis 22 Uhr mit kostenlosem Parkplatz, freiem Eintritt und ohne Buchungspflicht. Die Seite beschreibt ausdrücklich Sterne mit bloßem Auge und Teleskope vor Ort. Prüfe die offizielle Seite am Besuchstag erneut, komme bei übersichtlicher Zufahrt an, beobachte nur innerhalb der betreuten Aussichtspunktfläche und beende den Besuch vor Schließung; der Eintrag erlaubt weder Camping noch Zugang außerhalb des Besucherbereichs."],
    ["alula-gharameel-tour-departure", "Husaak Adventure Centre — Gharameel tour departure", 26.676728, 37.9083988, 980, "tour-departure", "limited", 20, "https://www.experiencealula.com/en/things-to-do/experiences/stargazing-at-gharameel", "Experience AlUla maps this exact Husaak Adventure Centre arrival point for its guided Gharameel stargazing experience. It is a meeting and parking point, not the remote observing camp. The operator provides the 4×4 transfer to and from Gharameel; independent access is not supported. The current page says booking is coming back soon, so do not travel for the experience until a date-specific e-ticket is available. Then arrive at least 15 minutes early with ID, follow the guide, accept weather or visibility changes and return only with the included transport.", "Experience AlUla kartiert diesen genauen Ankunftspunkt am Husaak Adventure Centre für das geführte Gharameel-Sternbeobachtungserlebnis. Er ist Treff- und Parkplatz, nicht das abgelegene Beobachtungscamp. Der Betreiber stellt den Allradtransfer nach Gharameel und zurück; eine selbstständige Zufahrt ist nicht vorgesehen. Die aktuelle Seite meldet, dass die Buchung bald zurückkehrt. Fahre deshalb erst mit verfügbarem datiertem E-Ticket zum Erlebnis. Sei dann mindestens 15 Minuten vorher mit Ausweis vor Ort, folge dem Guide, akzeptiere Änderungen durch Wetter oder Sicht und kehre ausschließlich mit dem enthaltenen Transfer zurück."],
  ],
  [
    "https://www.experiencealula.com/en/places-to-go/harrat-viewpoint",
    "https://www.experiencealula.com/en/things-to-do/experiences/stargazing-at-gharameel",
    "https://www.experiencealula.com/en/places-to-go/husaak-adventures",
    "https://www.experiencealula.com/en/about/features/dark-sky-designation-in-alula",
  ],
  "an evening at the managed Harrat Viewpoint, with the guided Gharameel experience kept as a separately booked operator transfer.",
  "Ein Abend am betreuten Harrat Viewpoint; das geführte Gharameel-Erlebnis bleibt ein getrennt gebuchter Betreibertransfer.",
  {
    checkedAt: "2026-09-22",
    sourceAuthorities: ["official-destination", "official-destination", "official-destination", "official-destination"],
    sourceTitles: ["Experience AlUla: Harrat Viewpoint", "Experience AlUla: Stargazing at Gharameel", "Experience AlUla: Husaak Adventures", "Experience AlUla: Dark Sky designation"],
  },
];

const mudgeeIndex = candidates.findIndex(([id]) => id === "mudgee");
candidates[mudgeeIndex] = [
  "mudgee",
  "Mudgee",
  "AU",
  "Australia",
  "oceania",
  ["new-south-wales", "oceania"],
  "Australia/Sydney",
  80,
  ["rural", "vineyards", "accessible", "programme-only"],
  "Mudgee New South Wales stargazing",
  ["mudgee", "Mudgee", -32.59, 149.59],
  [
    ["mudgee-observatory-booked-session", "Mudgee Observatory booked session", -32.6321512, 149.4914588, 620, "public-observatory", "limited", 62, "https://www.visitmudgeeregion.com.au/products/mudgee-observatory", "Mudgee Region Tourism and the observatory identify the public facility at 961 Old Grattai Road; the operator's published coordinate and the mapped observatory feature support this exact visitor point. Both day and night visits require advance booking, and the session time varies by season. Do not arrive for independent observing or infer access from the map. Confirm the date, start and finish, parking and weather decision directly, then use only the equipment and grounds included in that session.", "Mudgee Region Tourism und das Observatorium weisen die öffentliche Anlage an 961 Old Grattai Road aus; die veröffentlichte Betreiberkoordinate und das kartierte Observatoriumsobjekt stützen diesen genauen Besucherpunkt. Tages- und Nachtbesuche erfordern eine Vorabbuchung, die Sitzungszeit ändert sich mit der Jahreszeit. Fahre nicht zur selbstständigen Beobachtung an und leite aus der Karte keinen Zutritt ab. Bestätige Datum, Beginn, Ende, Parkplatz und Wetterentscheidung direkt und nutze dann nur die in der Sitzung vorgesehenen Geräte und Flächen."],
    ["mudgee-grattai-grove-stay", "Grattai Grove booked accommodation", -32.6338509, 149.505875, 650, "booked-accommodation", "limited", 56, "https://www.visitmudgeeregion.com.au/products/grattai-grove", "Mudgee Region Tourism publishes this exact property coordinate and explicitly tells overnight guests they can stargaze and see the Milky Way after nightfall. Grattai Grove confirms two bookable accommodation options, the 809 Old Grattai Road address, signed onsite parking and wildlife on the twilight and night approach. This is not a public viewpoint: book the accommodation first, obtain the host's current instructions and observe only from the assigned private stay footprint without entering farm paddocks, roads or the observatory next door.", "Mudgee Region Tourism veröffentlicht diese genaue Grundstückskoordinate und erklärt ausdrücklich, dass Übernachtungsgäste nach Einbruch der Dunkelheit Sterne und Milchstraße beobachten können. Grattai Grove bestätigt zwei buchbare Unterkünfte, die Adresse 809 Old Grattai Road, ausgeschilderte Parkplätze auf dem Gelände und Wildtiere auf der Zufahrt bei Dämmerung und Nacht. Dies ist kein öffentlicher Aussichtspunkt: Buche zuerst die Unterkunft, hole aktuelle Gastgeberhinweise ein und beobachte nur innerhalb der zugewiesenen privaten Unterkunftsfläche, nicht auf Weiden, Straßen oder am benachbarten Observatorium."],
  ],
  [
    "https://www.visitmudgeeregion.com.au/products/mudgee-observatory",
    "https://www.mudgeeobservatory.com.au/",
    "https://www.mudgeeobservatory.com.au/fees.html",
    "https://www.openstreetmap.org/node/8598919118",
    "https://www.visitmudgeeregion.com.au/products/grattai-grove",
    "https://grattaigrove.com.au/",
    "https://grattaigrove.com.au/contact-and-directions",
  ],
  "one advance-booked observatory session or a separate night within booked Grattai Grove accommodation, never an improvised Gulgong stop.",
  "Eine vorab gebuchte Observatoriumssitzung oder eine getrennte Nacht in gebuchter Unterkunft bei Grattai Grove, niemals ein improvisierter Halt in Gulgong.",
  {
    accessMode: "programme-only",
    checkedAt: "2026-09-22",
    sourceAuthorities: ["official-destination", "official-operator", "official-operator", "open-geodata", "official-destination", "official-operator", "official-operator"],
    sourceTitles: ["Mudgee Region Tourism: Mudgee Observatory", "Mudgee Observatory: visitor sessions", "Mudgee Observatory: fees, booking and location", "OpenStreetMap: mapped Mudgee Observatory visitor feature", "Mudgee Region Tourism: Grattai Grove", "Grattai Grove: accommodation", "Grattai Grove: contact and night-driving directions"],
    programmeDetailEn: "Mudgee Observatory is usable only for an advance-booked seasonal session. Grattai Grove is a separate private accommodation whose official destination listing explicitly supports stargazing by overnight guests. A booking for either place grants no access to the other, and neither supports an unplanned roadside or paddock fallback.",
    programmeDetailDe: "Das Mudgee Observatory ist ausschließlich mit vorab gebuchter saisonaler Sitzung nutzbar. Grattai Grove ist eine getrennte Privatunterkunft, deren offizieller Destinationseintrag Sternbeobachtung für Übernachtungsgäste ausdrücklich vorsieht. Eine Buchung für einen Ort gewährt keinen Zugang zum anderen; keiner erlaubt einen ungeplanten Straßenrand- oder Weide-Ausweichort.",
    programmeStandfirstSuffixEn: "The programme and accommodation records confirm who may be onsite; they do not grant access without the corresponding booking or current host instructions.",
    programmeStandfirstSuffixDe: "Programm- und Unterkunftseinträge bestätigen, wer vor Ort sein darf; ohne die zugehörige Buchung und aktuelle Gastgeberanweisung gewähren sie keinen Zugang.",
  },
];

const punaArgentinaIndex = candidates.findIndex(([id]) => id === "puna-argentina");
candidates[punaArgentinaIndex] = [
  "puna-argentina",
  "Quebrada de Humahuaca",
  "AR",
  "Argentina",
  "south-america",
  ["jujuy", "south-america"],
  "America/Argentina/Jujuy",
  90,
  ["highland", "guided", "rail"],
  "Quebrada de Humahuaca Jujuy stargazing",
  ["san-salvador-de-jujuy", "San Salvador de Jujuy", -24.1858, -65.2995],
  [
    ["puna-posta-hornillos-guided-observation", "Posta de Hornillos guided observation stop", -23.6546204, -65.4314311, 2300, "event-venue", "limited", 68, "https://trensolar.com.ar/cielo-en-movimiento/", "The official Cielo en Movimiento itinerary names Posta de Hornillos as the 21:05 observing stop, with guided astronomy through professional telescopes followed by dinner. This coordinate identifies the mapped historic Posta, but it does not grant independent access. Use it only inside a dated Cielo en Movimiento booking, arrive with the included operator itinerary and leave with the scheduled return; do not drive to the site or remain after the group departs.", "Der offizielle Ablauf von Cielo en Movimiento nennt die Posta de Hornillos als Beobachtungshalt um 21:05 Uhr, mit geführter Astronomie an professionellen Teleskopen und anschließendem Abendessen. Diese Koordinate bezeichnet die kartierte historische Posta, gewährt aber keinen selbstständigen Zugang. Nutze sie ausschließlich im Rahmen einer datierten Cielo-en-Movimiento-Buchung, komme mit dem enthaltenen Betreiberablauf an und fahre mit der vorgesehenen Rückfahrt ab; fahre den Ort nicht selbstständig an und bleibe nicht nach Abfahrt der Gruppe."],
    ["puna-tumbaya-solar-train-boarding", "Tumbaya Solar Train boarding station", -23.8534632, -65.4652744, 2099, "tour-departure", "limited", 20, "https://trensolar.com.ar/cielo-en-movimiento/", "The current official itinerary brings booked passengers by included road transfer from San Salvador de Jujuy or Salta to Tumbaya, where reception is scheduled for 19:20 and the guided train departs at 20:05. This record is an operational boarding point, not a second observing site. Follow the ticket's meeting point and operator transfer; do not substitute an independent arrival, platform visit or night session.", "Der aktuelle offizielle Ablauf bringt gebuchte Gäste mit enthaltenem Straßentransfer ab San Salvador de Jujuy oder Salta nach Tumbaya. Dort sind der Empfang um 19:20 Uhr und die Abfahrt des geführten Zuges um 20:05 Uhr vorgesehen. Dieser Datensatz ist ein betrieblicher Einstiegsort und kein zweiter Beobachtungsplatz. Folge Treffpunkt und Betreibertransfer des Tickets; ersetze sie nicht durch eine selbstständige Anfahrt, einen Bahnsteigbesuch oder eine Nachtsitzung."],
  ],
  [
    "https://trensolar.com.ar/cielo-en-movimiento/",
    "https://prensa.jujuy.gob.ar/tren-solar/cielo-movimiento-el-tren-solar-presenta-la-experiencia-nocturna-mas-innovadora-del-norte-argentino-n123764",
    "https://www.turismo.jujuy.gob.ar/evento/tren-solar-experiencia-cielo-en-movimiento-volcan-8/",
    "https://trensolar.com.ar/inicio/",
    "https://www.openstreetmap.org/way/298017385",
    "https://www.openstreetmap.org/node/11627187728",
  ],
  "one date-specific Solar Train itinerary whose included transfers connect the city meeting point, Tumbaya boarding and the guided Posta de Hornillos observation; neither mapped programme point is an independent night venue.",
  "Ein datiertes Solarzug-Programm, dessen enthaltene Transfers den Stadttreffpunkt, den Einstieg in Tumbaya und die geführte Beobachtung an der Posta de Hornillos verbinden; keiner der kartierten Programmpunkte ist ein selbstständiger Nachtort.",
  {
    accessMode: "programme-only",
    linkedProgramme: true,
    checkedAt: "2026-09-22",
    sourceAuthorities: ["official-operator", "public-agency", "official-destination", "official-operator", "open-geodata", "open-geodata"],
    sourceTitles: ["Tren Solar: Cielo en Movimiento 2026 itinerary and booking", "Government of Jujuy: Cielo en Movimiento dates, inclusions and return", "Jujuy Tourism: 26 September Cielo en Movimiento event", "Tren Solar: official route, ticketing and contacts", "OpenStreetMap: Posta de Hornillos", "OpenStreetMap: Tumbaya station"],
    programmeDetailEn: "Cielo en Movimiento is one linked, ticketed itinerary rather than two interchangeable venues. The operator currently publishes bookable 26 September departures, city meeting times, included transfer to Tumbaya, the Posta de Hornillos telescope session, dinner and a 23:30 return. The mapped station and observation stop remain inactive catalogue records and grant no independent access.",
    programmeDetailDe: "Cielo en Movimiento ist ein zusammenhängender Ablauf mit Ticket und keine Auswahl aus zwei austauschbaren Orten. Der Betreiber veröffentlicht derzeit buchbare Abfahrten am 26. September, Stadttreffzeiten, den enthaltenen Transfer nach Tumbaya, die Teleskopsitzung an der Posta de Hornillos, Abendessen und die Rückfahrt um 23:30 Uhr. Die kartierten Datensätze für Bahnhof und Beobachtungshalt bleiben inaktiv und gewähren keinen selbstständigen Zugang.",
    programmeStandfirstSuffixEn: "The current operator page supplies the complete transport and return chain; a booking is still required, and cancellation or changed ticket instructions override this guide.",
    programmeStandfirstSuffixDe: "Die aktuelle Betreiberseite belegt die vollständige Transport- und Rückkehrkette; eine Buchung bleibt erforderlich, und Absage oder geänderte Tickethinweise haben Vorrang vor diesem Guide.",
  },
];

const copernicusElevationOverrides = new Map([
  ["puna-posta-hornillos-guided-observation", 2368],
  ["puna-tumbaya-solar-train-boarding", 2096],
  ["mudgee-observatory-booked-session", 602],
  ["mudgee-grattai-grove-stay", 639],
  ["alula-harrat-viewpoint", 1162],
  ["alula-gharameel-tour-departure", 738],
  ["sark-dachinger-observatory", 104],
  ["sark-la-valette-campsite", 96],
  ["achi-heavens-sonohara-summit-event-site", 1406],
  ["achi-namiai-park-observing-field", 1177],
  ["big-cypress-seagrape-night-sky-program", 1],
  ["big-cypress-midway-campground", 3],
  ["kangaroo-west-bay-campground", 26],
  ["kangaroo-rocky-river-campground", 61],
  ["innamincka-cullyamurra-waterhole-campground", 51],
  ["innamincka-policemans-waterhole-campground", 47],
]);
const currentlyClosedSiteIds = new Set([
  "innamincka-cullyamurra-waterhole-campground",
  "innamincka-policemans-waterhole-campground",
]);
for (const item of candidates) {
  for (const site of item[11]) {
    if (copernicusElevationOverrides.has(site[0])) site[4] = copernicusElevationOverrides.get(site[0]);
    if (currentlyClosedSiteIds.has(site[0])) {
      site[6] = "no";
      site[7] = 0;
    }
  }
}

const stagedReviewBatch = read("scripts/catalog/staged-factual-review-batch-2026-09-21.json");
if (stagedReviewBatch.records.length !== 36) {
  throw new Error(`Expected 36 factual reviews in the combined batch, found ${stagedReviewBatch.records.length}`);
}
const stagedReviewsByDestination = new Map(stagedReviewBatch.records.map((record) => [record.destinationId, record]));
for (const item of candidates) {
  const review = stagedReviewsByDestination.get(item[0]);
  if (!review) continue;
  const options = item[15] ?? {};
  options.checkedAt = review.reviewedAt;
  if (review.status === "changes-required") {
    const reason = review.requiredChanges.map((change) => change.reason).join(" ");
    options.accessMode = "confirmation-only";
    options.confirmationDetailEn = `${review.verifiedFindings.join(" ")} The staged records therefore remain candidates only.`;
    options.confirmationDetailDe = `Die geprüften Primärquellen zu ${item[1]} belegen die Region oder Anlage, aber nicht den derzeitigen vollständigen Nachtzugang für beide vorbereiteten Kartenpunkte. Die Datensätze für ${item[1]} bleiben deshalb ausschließlich inaktive Kandidaten.`;
    options.confirmationWarningEn = `${reason} Until that evidence is recorded for ${item[1]}, do not begin an observing visit, add a roadside fallback or infer permission from darkness alone.`;
    options.confirmationWarningDe = `Vor einer Beobachtungsfahrt nach ${item[1]} müssen der genaue Ort, Datum und Uhrzeit, Zufahrt, Parken, Abschluss der Nacht sowie alle Betreiber-, Genehmigungs- und Sicherheitsregeln schriftlich bestätigt sein. Fehlt diese Bestätigung für ${item[1]}, wird verschoben.`;
  }
  item[15] = options;
}

if (candidates.length !== 50) throw new Error(`Expected 50 new destinations, found ${candidates.length}`);

const sourceRecords = (item) => item[12].map((url, index) => ({
  id: `${item[0]}-source-${index + 1}`,
  title: item[15]?.sourceTitles?.[index] ?? `${item[1]} source ${index + 1}`,
  url,
  publisher: new URL(url).hostname.replace(/^www\./, ""),
  checkedAt: item[15]?.checkedAt ?? (item[0] === "sierra-morena" ? "2026-09-17" : "2026-09-16"),
  authority: item[15]?.sourceAuthorities?.[index] ?? (index === 0 ? "official-destination" : "public-agency"),
}));

const makeGuide = (item, index) => {
  const [id, name, countryCode, countryName, continent, regions, timezone, priority, tags, affiliateQuery, stay, sites, urls, angleEn, angleDe, options = {}] = item;
  const angleEnglish = angleEn.charAt(0).toUpperCase() + angleEn.slice(1);
  const angleGerman = angleDe.charAt(0).toUpperCase() + angleDe.slice(1);
  const primary = sites[0][1];
  const secondary = sites[1][1];
  const base = stay[1];
  const sourceIds = urls.map((_, n) => `${id}-source-${n + 1}`);
  const programmeOnly = options.accessMode === "programme-only";
  const confirmationOnly = options.accessMode === "confirmation-only";
  const campOnly = options.accessMode === "camp-only";
  const sections = [
    { id: `${id}-where`, heading: bi(`Where this ${name} plan really happens`, `Wo dieser ${name}-Plan wirklich stattfindet`), paragraphs: { en: [`${name} is best treated as a defined travel area rather than a promise attached to every dark patch on a map. ${primary} is the practical first choice because it gives the evening a named footprint, an approach that can be checked in daylight and a clear point at which to stop unloading. ${angleEnglish} Visitors should read the current authority notice before travel because a designation, a photograph or a familiar map label does not grant tonight's access.`, `${secondary} remains useful as a separate option, not as an automatic second stop. Its surface, road, gate, weather exposure and local rules can differ from ${primary}. Keeping the two decisions apart makes the route easier to cancel safely when the first check fails and avoids turning a good climatological ranking into an unsafe itinerary.`], de: [`${name} sollte als klar umrissene Reisezone verstanden werden und nicht als Versprechen für jeden dunklen Kartenfleck. ${primary} ist die praktische erste Wahl, weil der Abend dort eine benannte Fläche, eine bei Tageslicht prüfbare Zufahrt und einen klaren Punkt zum Ausladen erhält. ${angleGerman} Prüfe die aktuelle Verwaltungsinformation vor der Fahrt, denn Auszeichnung, Foto oder Kartenname gewähren keinen heutigen Zugang.`, `${secondary} bleibt eine getrennte Möglichkeit und kein automatischer zweiter Halt. Fläche, Straße, Tor, Wetter und lokale Regeln können sich von ${primary} unterscheiden. Die Trennung macht eine sichere Absage leichter, wenn die erste Prüfung scheitert, und verhindert, dass eine gute Klimareihung zu einer riskanten Route wird.`] }, sourceIds },
    { id: `${id}-conditions`, heading: bi(`Conditions that decide a ${name} night`, `Bedingungen, die eine ${name}-Nacht entscheiden`), paragraphs: { en: [`The useful forecast is the one for the actual elevation and exposed terrain, not for ${base} alone. Clouds, wind, humidity, smoke, snow, insects or heat can change the experience within a short distance. Treat the monthly score as a comparison of historical inputs and use the live forecast and current notices as the go or no-go decision.`, `Access has an equally practical veto. Check opening hours, permits, reservations, road restrictions, seasonal services and the return before leaving ${base}. Save the relevant pages offline. If the authority is silent about the intended hour, the responsible interpretation is uncertainty, not permission. A short session at a confirmed place is more useful than a longer drive built on an assumption.`], de: [`Die brauchbare Prognose gilt für die tatsächliche Höhe und das exponierte Gelände und nicht nur für ${base}. Wolken, Wind, Feuchte, Rauch, Schnee, Insekten oder Hitze können das Erlebnis auf kurzer Strecke verändern. Der Monatswert vergleicht historische Eingaben. Live-Wetter und aktuelle Hinweise entscheiden über Start oder Verschiebung.`, `Auch der Zugang hat ein praktisches Veto. Prüfe Öffnung, Genehmigungen, Reservierungen, saisonale Dienste, Straßenregeln und Rückweg vor der Abfahrt aus ${base}. Speichere die Seiten offline. Schweigt die Verwaltung zur geplanten Uhrzeit, bedeutet das Unsicherheit und keine Erlaubnis. Eine kurze Sitzung an bestätigtem Ort ist besser als eine längere Fahrt auf Annahmen.`] }, sourceIds },
    { id: `${id}-equipment`, heading: bi(`A workable kit for ${name}`, `Eine brauchbare Ausrüstung für ${name}`), paragraphs: { en: [`Keep the equipment proportionate to the access model at ${primary}. A red light should be dim and pointed down, a phone should be prepared before the dark interval and every loose item should have a place in the vehicle. In remote, high, wet or wildlife-sensitive settings, warmth, water, navigation and a charged backup matter before optical ambition.`, `At ${primary}, the surface is part of the equipment decision. A tripod, telescope or camera is only an advantage when it can be carried and packed without widening the footprint or blocking other users. Observe first with unaided eyes, then add the instrument that fits the confirmed space at ${name}. Leave enough attention for signs, weather changes and the return.`], de: [`Halte die Ausrüstung an das Zugangsmodell von ${primary} angepasst. Rotlicht bleibt gedimmt und zeigt nach unten. Bereite das Telefon vor der Dunkelheit vor und gib jedem Kleinteil einen festen Platz im Fahrzeug. In abgelegener, hoher, nasser oder wildsensibler Umgebung zählen Wärme, Wasser, Navigation und Reserveenergie vor optischem Ehrgeiz.`, `An ${primary} gehört die Fläche zur Ausrüstungsentscheidung. Stativ, Teleskop oder Kamera helfen nur, wenn sie getragen und gepackt werden können, ohne die Fläche zu vergrößern oder andere Nutzer zu behindern. Beobachte zuerst mit bloßem Auge und ergänze erst dann das Gerät, das zur bestätigten Fläche in ${name} passt. Aufmerksamkeit für Schilder, Wetter und Rückweg bleibt nötig.`] }, sourceIds },
    { id: `${id}-route`, heading: bi(`The one-evening route from ${base}`, `Die Ein-Abend-Route ab ${base}`), paragraphs: { en: [`Leave ${base} with the access page, weather check and return route already available offline. Reach ${primary} before sunset, read the signs and surface while there is light, and place the vehicle only where the current rule permits. Do not add ${secondary} because the first stop feels imperfect; a second site belongs to another confirmed evening.`, `After twilight, let adaptation settle before judging the sky. Keep light, voices and movement inside the established footprint, and record any changed detail for a later revision. End before fatigue, cold or wind turns a small uncertainty into a driving problem. The successful outcome is a calm return to ${base}, not the maximum number of map pins.`], de: [`Verlasse ${base} erst, wenn Zugangsseite, Wetterprüfung und Rückweg offline bereitstehen. Erreiche ${primary} vor Sonnenuntergang, lies Schilder und Untergrund bei Licht und stelle das Fahrzeug nur nach aktueller Regel ab. Ergänze ${secondary} nicht, nur weil der erste Ort unvollkommen wirkt; der zweite Ort gehört in einen anderen bestätigten Abend.`, `Lass die Augen nach der Dämmerung anpassen, bevor du den Himmel beurteilst. Halte Licht, Stimmen und Bewegung innerhalb der bestehenden Fläche und notiere jede Änderung für eine spätere Überarbeitung. Beende den Abend, bevor Müdigkeit, Kälte oder Wind eine kleine Unsicherheit zum Fahrproblem machen. Ein ruhiger Rückweg nach ${base} zählt mehr als viele Kartenmarken.`] }, sourceIds },
  ];
  if (confirmationOnly) {
    sections[0] = {
      id: `${id}-where`,
      heading: bi(`Why ${primary} and ${secondary} are candidates only`, `Warum ${primary} und ${secondary} nur Kandidaten sind`),
      paragraphs: {
        en: [
          `${primary} and ${secondary} are named visitor places or facilities documented by the reviewed sources. Those sources establish their identities and daytime visitor or operational context; the supporting location and elevation records identify the catalogue points, but none establishes astronomy use after dark. The catalogue therefore keeps both records inactive and treats their low access scores as an unresolved evidence gate, not a quality ranking.`,
          options.confirmationWarningEn ?? `Do not travel to ${primary} or ${secondary} for observing until the responsible authority confirms the intended date, hour, access route and parking. In ${name}, a familiar summit, ski slope or scenic viewpoint is not a substitute: marked routes, traffic controls, operating machinery and wildlife-sensitive terrain can make a casual night visit an unsafe inference from a daytime attraction.`,
        ],
        de: [
          `${primary} und ${secondary} sind benannte Besucherorte oder Anlagen, die durch die geprüften Quellen dokumentiert sind. Diese Quellen belegen Identität und Besucher- oder Betriebsrahmen am Tag; ergänzende Orts- und Höhenbelege bestimmen die Katalogpunkte, aber keine Quelle belegt eine astronomische Nutzung nach Einbruch der Dunkelheit. Der Katalog hält beide Datensätze deshalb inaktiv und versteht die niedrigen Zugangswerte als offene Belegprüfung, nicht als Qualitätsrang.`,
          options.confirmationWarningDe ?? `Fahre ${primary} oder ${secondary} nicht zur Beobachtung an, bevor die zuständige Verwaltung Datum, Uhrzeit, Zugangsweg und Parken bestätigt. In ${name} dient ein bekannter Gipfel, eine Skipiste oder ein Aussichtspunkt nicht als Ersatz: markierte Wege, Verkehrsregeln, Betriebsmaschinen und wildtiersensibles Gelände können einen beiläufigen Nachtbesuch zu einer unsicheren Ableitung aus einer Tagesattraktion machen.`,
        ],
      },
      sourceIds,
    };
    sections[3] = {
      id: `${id}-route`,
      heading: bi(`The current ${name} result is postponement`, `Das aktuelle ${name}-Ergebnis ist Verschiebung`),
      paragraphs: {
        en: [
          `The reviewed sources support daytime reconnaissance and a direct enquiry to the responsible authorities, not an independent observing itinerary. Ask specifically whether astronomy use is allowed at ${primary} or ${secondary} after dark, where a vehicle may legally remain and whether a ranger, permit, operating restriction or current closure changes the plan.`,
          `Until that answer is recorded, keep equipment packed and use ${base} only as the enquiry and planning base. A clear forecast, a map pin or an attractive viewpoint photograph cannot replace permission. No roadside, meadow or forest-track fallback is added when confirmation is absent.`,
        ],
        de: [
          `Die geprüften Quellen tragen eine Erkundung bei Tageslicht und eine direkte Anfrage an die zuständigen Stellen, aber keine selbstständige Beobachtungsroute. Frage ausdrücklich, ob ${primary} oder ${secondary} nach Einbruch der Dunkelheit astronomisch genutzt werden darf, wo ein Fahrzeug rechtmäßig stehen kann und ob Rangerbegleitung, Genehmigung, Betriebsbeschränkung oder aktuelle Sperrung den Plan verändern.`,
          `Bis diese Antwort dokumentiert ist, bleibt die Ausrüstung verpackt und ${base} dient nur als Anfrage- und Planungsbasis. Klare Prognose, Kartenpin oder attraktives Aussichtsfoto ersetzen keine Erlaubnis. Ohne Bestätigung wird kein Straßenrand-, Wiesen- oder Waldweg-Ausweichort ergänzt.`,
        ],
      },
      sourceIds,
    };
  }
  if (campOnly) {
    sections[3] = {
      id: `${id}-route`,
      heading: bi(`The booked-camp night at ${primary}`, `Die gebuchte Campingnacht an ${primary}`),
      paragraphs: {
        en: [
          `Complete reception, permits and the overnight booking before leaving ${base}. Reach ${primary} in daylight, use only the assigned camping footprint and settle the vehicle for the night. ${secondary} is a separate overnight choice for another booking, not a second stop after sunset.`,
          `After twilight, observe beside the booked camp without moving the vehicle or expanding into the road, riverbank or desert. Pack equipment at the campsite, sleep there and resume travel only after daylight and a fresh road check. In ${name}, a safe night ends at the same booked camp where it began.`,
        ],
        de: [
          `Erledige Rezeption, Genehmigungen und Übernachtungsbuchung, bevor du ${base} verlässt. Erreiche ${primary} bei Tageslicht, nutze nur die zugewiesene Campingfläche und lasse das Fahrzeug für die Nacht stehen. ${secondary} ist eine getrennte Übernachtungswahl für eine andere Buchung und kein zweiter Halt nach Sonnenuntergang.`,
          `Beobachte nach der Dämmerung neben dem gebuchten Camp, ohne das Fahrzeug zu bewegen oder dich auf Straße, Flussufer oder Wüste auszudehnen. Packe die Ausrüstung am Campingplatz, übernachte dort und fahre erst bei Tageslicht und nach neuer Straßenprüfung weiter. In ${name} endet eine sichere Nacht am selben gebuchten Camp, an dem sie begann.`,
        ],
      },
      sourceIds,
    };
  }
  if (index % 2) sections.reverse();
  const guide = {
    version: 1, destinationId: id, slug: id,
    seoTitle: bi(`${name} stargazing guide and observing sites`, `Stargazing-Guide ${name} und Beobachtungsorte`),
    seoDescription: confirmationOnly
      ? bi(`Review the evidence gap for astronomy access at ${name}; both documented places remain inactive candidates.`, `Prüfe die Beleglücke für Astronomiezugang in ${name}; beide dokumentierten Orte bleiben inaktive Kandidaten.`)
      : programmeOnly
      ? bi(`Plan a source-led ${name} astronomy visit only after a current programme and access are confirmed.`, `Plane einen quellenbasierten Astronomiebesuch in ${name} nur nach Bestätigung eines aktuellen Programms und Zugangs.`)
      : campOnly
      ? bi(`Plan a booked-campsite stargazing night in ${name} with daylight travel and no driving after dark.`, `Plane eine gebuchte Campingnacht zur Sternbeobachtung in ${name} mit Fahrten nur bei Tageslicht.`)
      : bi(`Plan a source-led stargazing night in ${name} with ${primary}, access checks and a practical return route.`, `Plane eine quellenbasierte Beobachtungsnacht in ${name} mit ${primary}, Zugangsprüfung und sicherem Rückweg.`),
    standfirst: confirmationOnly
      ? bi(`${name} has real, documented visitor places or facilities, but the reviewed sources do not confirm astronomy use after dark. This staged guide records the evidence gap rather than turning a daytime attraction or operating facility into a night recommendation. Both candidate sites remain inactive until the responsible authorities confirm the intended date, hour, access route and parking.`, `${name} besitzt reale, dokumentierte Besucherorte oder Anlagen, doch die geprüften Quellen bestätigen keine astronomische Nutzung nach Einbruch der Dunkelheit. Dieser vorbereitete Guide dokumentiert die Beleglücke, statt aus einer Tagesattraktion oder Betriebsanlage eine Nachtempfehlung zu machen. Beide Kandidaten bleiben inaktiv, bis die zuständigen Stellen Datum, Uhrzeit, Zugangsweg und Parken bestätigen.`)
      : programmeOnly
      ? bi(`${name} has documented astronomy venues, but the reviewed pages do not establish a current independent night-observing site. This staged guide starts with a programme or operator confirmation and treats postponement as the only valid outcome when that confirmation is absent. ${options.programmeStandfirstSuffixEn ?? "A regional Starlight designation confirms sky quality, not tonight's admission, parking or programme."}`, `${name} besitzt dokumentierte Astronomieorte, doch die geprüften Seiten belegen keinen aktuell selbstständig nutzbaren Nachtbeobachtungsplatz. Dieser vorbereitete Guide beginnt mit der Bestätigung durch Programm oder Betreiber und sieht ohne diese Bestätigung ausschließlich eine Verschiebung vor. ${options.programmeStandfirstSuffixDe ?? "Eine regionale Starlight-Auszeichnung bestätigt die Himmelsqualität, aber weder heutigen Zutritt noch Parkplatz oder Programm."}`)
      : campOnly
      ? bi(`${name} supports stargazing only as an overnight campsite plan. Book ${primary} or ${secondary}, complete reception and permits, and arrive before dark because internal travel at night is prohibited. Observe inside the assigned camping footprint, keep the vehicle settled and leave after daylight. The coordinate identifies the camp; it never replaces a booking or current park instruction.`, `${name} trägt Sternbeobachtung nur als Übernachtungsplan am Campingplatz. Buche ${primary} oder ${secondary}, erledige Rezeption und Genehmigungen und komme vor Dunkelheit an, denn interne Fahrten bei Nacht sind verboten. Beobachte innerhalb der zugewiesenen Campingfläche, lasse das Fahrzeug stehen und fahre erst bei Tageslicht ab. Die Koordinate bezeichnet das Camp; sie ersetzt weder Buchung noch aktuelle Parkanweisung.`)
      : bi(`${name} rewards a specific plan. ${angleEnglish} This guide separates the named observing places from the live decisions that remain with visitors and the managing authority. It is written for a real evening, including the point at which postponing is the correct decision, and keeps the practical return visible throughout the planning.`, `${name} belohnt einen konkreten Plan. ${angleGerman} Dieser Guide trennt benannte Beobachtungsorte von den aktuellen Entscheidungen der Gäste und der zuständigen Verwaltung. Er beschreibt einen echten Abend einschließlich des Punkts, an dem Verschieben die richtige Entscheidung ist, und hält den praktischen Rückweg während der Planung sichtbar.`),
    editorialAngle: confirmationOnly
      ? bi(options.confirmationDetailEn, options.confirmationDetailDe)
      : programmeOnly
      ? bi(options.programmeDetailEn ?? `${angleEnglish}. ${primary} is usable only after the operator confirms that activities have returned there; ${secondary} is usable only for a newly announced municipal event.`, options.programmeDetailDe ?? `${angleGerman}. ${primary} ist nur nutzbar, wenn der Betreiber die Rückkehr der Aktivitäten dorthin bestätigt; ${secondary} nur im Rahmen einer neu angekündigten kommunalen Veranstaltung.`)
      : campOnly
      ? bi(options.campDetailEn, options.campDetailDe)
      : bi(`${angleEnglish} The route keeps ${primary} as the decision point, treats ${secondary} as a separate option and makes the return part of a successful night.`, `${angleGerman} Die Route macht ${primary} zum Entscheidungspunkt, behandelt ${secondary} als getrennte Option und versteht die Rückkehr als Teil einer gelungenen Nacht.`),
    sections,
  tour: { title: bi(`${name}: ${angleEnglish}`, `${name}: ${angleGerman}`), summary: confirmationOnly ? bi(`Do not travel to either listed candidate for astronomy until the responsible authorities confirm the intended date, hour, access route and parking. The current complete result is postponement without adding an unverified fallback. Keep both candidate records inactive and leave observing equipment packed while that evidence is absent.`, `Fahre keinen der aufgeführten Kandidaten zur Astronomie an, bis die zuständigen Stellen Datum, Uhrzeit, Zugangsweg und Parken bestätigen. Das derzeit vollständige Ergebnis ist Verschiebung ohne ungeprüften Ausweichort. Halte beide Kandidatendatensätze inaktiv und die Beobachtungsausrüstung verpackt, solange dieser Beleg fehlt.`) : programmeOnly ? bi(`Do not travel to either listed venue without a current programme or direct operator confirmation. If ${primary} is confirmed, use it as the only stop from ${base}; otherwise postpone instead of substituting an unverified roadside location.`, `Fahre keinen der aufgeführten Orte ohne aktuelles Programm oder direkte Betreiberbestätigung an. Ist ${primary} bestätigt, nutze es als einzigen Halt ab ${base}; andernfalls verschiebe, statt einen ungeprüften Straßenrandplatz zu ersetzen. Plane keine spontane Ausweichfahrt im Dunkeln.`) : bi(`Use ${primary} as the fixed evening stop from ${base}. ${angleEnglish} Current access, weather and return checks still decide whether the plan runs. The route deliberately avoids a second late drive and treats a calm return as part of the observing experience.`, `Nutze ${primary} als festen Abendhalt ab ${base}. ${angleGerman} Aktuelle Zugangs-, Wetter- und Rückwegprüfungen entscheiden dennoch über die Durchführung. Die Route vermeidet bewusst eine zweite späte Fahrt und versteht die ruhige Rückkehr als Teil des Beobachtungserlebnisses.`), duration: bi("One evening with daylight arrival and a direct return", "Ein Abend mit Ankunft bei Tageslicht und direkter Rückkehr"), suitability: confirmationOnly ? bi(`Not yet an independent observing itinerary. It becomes usable only after explicit current confirmation from the responsible authorities for a named place and a defined date and access plan.`, `Noch keine selbstständig nutzbare Beobachtungsroute. Sie wird erst nach ausdrücklicher aktueller Bestätigung der zuständigen Stellen für einen benannten Ort sowie einen festgelegten Termin und Zugangsplan nutzbar.`) : programmeOnly ? bi(`Only for visitors holding a current booking or explicit operator confirmation for the named venue, with transport and return agreed in advance; this is not an independent-access itinerary.`, `Nur für Gäste mit aktueller Buchung oder ausdrücklicher Betreiberbestätigung für den benannten Ort sowie vorab geklärter An- und Rückfahrt; dies ist keine Route für selbstständigen Zugang.`) : bi(`For independent visitors who can verify current ${name} access, keep equipment within the confirmed footprint and return without improvisation.`, `Für unabhängige Gäste, die den aktuellen Zugang in ${name} prüfen, die Ausrüstung innerhalb der bestätigten Fläche halten und ohne Improvisation zurückkehren können.`), sourceIds, steps: [
      { id: `${id}-check`, timeHint: bi(`Before leaving ${base}`, `Vor der Abfahrt aus ${base}`), title: bi("Confirm access, weather and return", "Zugang, Wetter und Rückweg bestätigen"), body: bi(`Open the current authority pages for ${name}, check the exact elevation and save directions offline. A dark-sky label does not confirm today's gate, road or reservation. Also note who to contact when an on-site notice changes the plan.`, `Öffne die aktuellen Verwaltungsseiten für ${name}, prüfe die genaue Höhe und speichere die Navigation offline. Ein Dark-Sky-Label bestätigt weder heutiges Tor, Straße noch Reservierung. Notiere außerdem, wen du bei einer Änderung vor Ort kontaktieren kannst.`), sourceIds },
      { id: `${id}-arrive`, timeHint: confirmationOnly ? bi("Only after written authority confirmation", "Nur nach schriftlicher Behörden- oder Betreiberbestätigung") : programmeOnly ? bi("At the booked arrival time", "Zur gebuchten Ankunftszeit") : bi("Before sunset", "Vor Sonnenuntergang"), title: confirmationOnly ? bi("Keep the candidate inactive until confirmed", "Kandidaten bis zur Bestätigung inaktiv lassen") : programmeOnly ? bi(`Check in at ${primary}`, `An ${primary} einchecken`) : bi(`Settle at ${primary}`, `An ${primary} ankommen`), body: confirmationOnly ? bi(`Do not begin an observing visit. Record the responsible authorities' answer for ${primary} or ${secondary}, including the allowed date and hour, route, parking and any ranger, permit or operating requirement. Without that complete answer, remain in ${base} and postpone.`, `Beginne keinen Beobachtungsbesuch. Dokumentiere die Antwort der zuständigen Stellen für ${primary} oder ${secondary} einschließlich erlaubtem Datum und Uhrzeit, Weg, Parkplatz sowie möglicher Ranger-, Genehmigungs- oder Betriebsvorgaben. Ohne vollständige Antwort bleibst du in ${base} und verschiebst.`) : programmeOnly ? bi(`Follow the booking instructions for ${primary}, use only the assigned arrival route and parking, and keep ${secondary} for a separately booked visit. A reservation for one venue grants no access to the other.`, `Folge den Buchungshinweisen für ${primary}, nutze nur die zugewiesene Anfahrt und den vorgesehenen Parkplatz und bewahre ${secondary} für einen separat gebuchten Besuch. Eine Reservierung für einen Ort gewährt keinen Zugang zum anderen.`) : bi(`Use daylight to read signs, identify the legal footprint and place the vehicle once. Keep ${secondary} for a separately checked visit. Do not unload until the route back is still obvious.`, `Nutze das Tageslicht für Schilder, legale Fläche und einmaliges Abstellen. Bewahre ${secondary} für einen separat geprüften Besuch. Lade erst aus, wenn der Rückweg weiterhin eindeutig ist. So bleibt die Abfahrt auch bei Dunkelheit verständlich.`), sourceIds },
      { id: `${id}-observe`, timeHint: bi("After twilight", "Nach der Dämmerung"), title: confirmationOnly ? bi("Observe only inside the confirmed arrangement", "Nur im bestätigten Rahmen beobachten") : bi("Observe without expanding the footprint", "Beobachten ohne die Fläche zu erweitern"), body: confirmationOnly ? bi(`This step is unavailable until confirmation is documented. If the park later approves it, follow that exact arrangement, keep light and noise minimal, remain on marked routes and designated places, and accept any same-day closure as final.`, `Dieser Schritt ist nicht verfügbar, bis die Bestätigung dokumentiert ist. Stimmt der Park später zu, folge genau diesem Rahmen, minimiere Licht und Lärm, bleibe auf markierten Routen und ausgewiesenen Flächen und akzeptiere jede tagesaktuelle Sperrung als endgültig.`) : programmeOnly ? bi(`Follow staff instructions and remain inside the booked programme footprint. Keep personal light low, do not interfere with instruments or other visitors, and accept the operator's weather decision. Use only equipment covered by the booking and leave exactly as instructed when the programme ends.`, `Folge den Anweisungen des Personals und bleibe innerhalb der gebuchten Programmfläche. Halte eigenes Licht niedrig, störe weder Instrumente noch andere Gäste und akzeptiere die Wetterentscheidung des Betreibers. Nutze nur von der Buchung abgedeckte Ausrüstung und verlasse den Ort zum Programmende genau nach Anweisung.`) : bi(`Let adaptation settle, keep light low and add only equipment that remains clear of shared movement and the route back to ${base}. Recheck wind, temperature and nearby activity before extending the session.`, `Lass die Augen anpassen, halte Licht niedrig und ergänze nur Ausrüstung ohne Behinderung gemeinsamer Wege und des Rückwegs nach ${base}. Prüfe Wind, Temperatur und Aktivität in der Nähe erneut, bevor du die Sitzung verlängerst.`), sourceIds },
      { id: `${id}-leave`, timeHint: bi("At the planned finish", "Zur geplanten Endzeit"), title: bi(`Return directly to ${base}`, `Direkt nach ${base} zurückkehren`), body: bi(`Count equipment, inspect the surface and leave before fatigue or changing weather makes a late detour tempting. A direct return is the final part of the plan, not an afterthought once the sky has been good.`, `Zähle die Ausrüstung, prüfe den Untergrund und fahre ab, bevor Müdigkeit oder Wetter einen späten Umweg verlockend machen. Die direkte Rückkehr ist der letzte Teil des Plans und kein nachträglicher Gedanke. Sie schützt Urteilskraft und einen einfachen nächsten Morgen.`), sourceIds },
    ] },
    fieldNotesTitle: bi(`Three limits specific to ${name}`, `Drei Grenzen speziell für ${name}`),
    fieldNotes: [
      { id: `${id}-access-note`, title: bi(`${name} access is dated information`, `Zugang in ${name} ist datierte Information`), body: bi(`${primary} is listed because an official source describes the visitor context. Recheck that source for the chosen date; the coordinate never grants entry, parking, camping or permission to cross a barrier.`, `${primary} ist aufgeführt, weil eine offizielle Quelle den Besucherrahmen beschreibt. Prüfe sie für das gewählte Datum erneut; die Koordinate gewährt weder Zutritt, Parken, Camping noch das Passieren einer Schranke.`), sourceIds },
      { id: `${id}-weather-note`, title: bi(`${name} has a live-weather veto`, `${name} hat ein Veto des Live-Wetters`), body: bi(`The monthly comparison cannot include every cloud, smoke, closure or local obstruction. Postpone whenever safe access and a calm return do not agree.`, `Der Monatsvergleich enthält nicht jede Wolke, jeden Rauch, jede Sperrung oder jedes lokale Hindernis. Verschiebe, sobald sicherer Zugang und ruhige Rückkehr nicht zusammenpassen.`), sourceIds },
      { id: `${id}-light-note`, title: bi(`Light changes ${primary}`, `Licht verändert ${primary}`), body: bi(`Prepare screens and vehicle lights before arrival. Use the lowest practical red-light level and keep it brief, downward and away from other observers.`, `Bereite Displays und Fahrzeuglicht vor der Ankunft vor. Nutze die niedrigste praktische Rotlichtstufe kurz, nach unten und weg von anderen Beobachtern. So bleibt die Dunkeladaption der Gruppe erhalten und der Ort ruhig.`), sourceIds },
    ],
    faq: [
      { question: bi(`Is ${primary} guaranteed to be open at night?`, `Ist ${primary} nachts garantiert offen?`), answer: bi(`No. Check the cited authority for the date, opening hours, permits, parking and temporary restrictions. If the answer is unclear, do not infer permission. A safe alternative is postponement rather than a late roadside search.`, `Nein. Prüfe die zitierte Verwaltung für Datum, Öffnung, Genehmigungen, Parken und temporäre Regeln. Bei Unklarheit darfst du keine Erlaubnis ableiten. Sicherer ist Verschieben statt eine späte Suche am Straßenrand.`), sourceIds },
      { question: bi(`Does the ${name} score describe tonight?`, `Beschreibt der Wert für ${name} die heutige Nacht?`), answer: bi(`It compares historical climate, darkness, elevation and reviewed access inputs. It does not include tonight's clouds, smoke, road surface or every local closure, so a live check remains necessary before you leave the accommodation.`, `Er vergleicht historische Eingaben zu Klima, Dunkelheit, Höhe und Zugang. Heutige Wolken, Rauch, Straßenoberfläche und jede lokale Sperrung fehlen; eine Live-Prüfung bleibt vor der Abfahrt von der Unterkunft nötig.`), sourceIds },
    ],
    sources: sourceRecords(item), lastReviewedAt: options.checkedAt ?? (id === "sierra-morena" ? "2026-09-17" : "2026-09-16"),
  };
  if (confirmationOnly) {
    guide.tour.duration = bi("No observing visit until a dated access and finish plan is confirmed", "Kein Beobachtungsbesuch bis zur Bestätigung eines datierten Zugangs- und Abschlussplans");
    const arriveStep = guide.tour.steps.find((step) => step.id === `${id}-arrive`);
    arriveStep.body = bi(`Do not begin an observing visit. Record the responsible authorities' answer for ${primary} or ${secondary}, including the allowed date and hour, route, parking and any ranger, permit or operating requirement. Without that complete answer, do not depart from ${base} toward either candidate; postpone.`, `Beginne keinen Beobachtungsbesuch. Dokumentiere die Antwort der zuständigen Stellen für ${primary} oder ${secondary} einschließlich erlaubtem Datum und Uhrzeit, Weg, Parkplatz sowie möglicher Ranger-, Genehmigungs- oder Betriebsvorgaben. Ohne vollständige Antwort fahre von ${base} keinen der Kandidaten an, sondern verschiebe.`);
    const observeStep = guide.tour.steps.find((step) => step.id === `${id}-observe`);
    observeStep.body = bi(`This step is unavailable until confirmation is documented. If the responsible authorities later approve it, follow that exact arrangement, keep light and noise minimal, remain inside the confirmed footprint and accept any same-day closure as final.`, `Dieser Schritt ist nicht verfügbar, bis die Bestätigung dokumentiert ist. Stimmen die zuständigen Stellen später zu, folge genau diesem Rahmen, minimiere Licht und Lärm, bleibe innerhalb der bestätigten Fläche und akzeptiere jede tagesaktuelle Sperrung als endgültig.`);
    const leaveStep = guide.tour.steps.find((step) => step.id === `${id}-leave`);
    leaveStep.timeHint = bi("Only as specified by the confirmed arrangement", "Nur wie im bestätigten Rahmen festgelegt");
    leaveStep.title = bi("Follow the confirmed finish plan", "Dem bestätigten Abschlussplan folgen");
    leaveStep.body = bi(`Do not infer a night drive, walking return or overnight stay from the map. The dated authority response must state how the visit ends; follow that instruction exactly, account for every item and add no unverified detour or fallback.`, `Leite aus der Karte weder Nachtfahrt noch Fußrückweg oder Übernachtung ab. Die datierte Antwort der zuständigen Stelle muss festlegen, wie der Besuch endet; folge dieser Anweisung genau, prüfe jedes Ausrüstungsteil und ergänze weder ungeprüften Umweg noch Ausweichort.`);
  }
  if (options.linkedProgramme) {
    guide.seoTitle = bi(`${name} Solar Train stargazing guide`, `Solarzug-Stargazing-Guide ${name}`);
    guide.seoDescription = bi(`Plan the booked Cielo en Movimiento route from the city transfer through Tumbaya to guided telescope observing at Posta de Hornillos.`, `Plane die gebuchte Route Cielo en Movimiento vom Stadttransfer über Tumbaya bis zur geführten Teleskopbeobachtung an der Posta de Hornillos.`);
    guide.standfirst = bi(`Cielo en Movimiento is a single date-specific Solar Train programme, not independent access to two night sites. A current ticket includes the city transfer, Tumbaya reception and boarding, guided telescope observing at Posta de Hornillos, dinner and the scheduled return. Recheck the ticket and operator page before departure; cancellation or changed instructions end or replace this plan.`, `Cielo en Movimiento ist ein einzelnes datiertes Solarzug-Programm und kein selbstständiger Zugang zu zwei Nachtorten. Ein aktuelles Ticket umfasst den Stadttransfer, Empfang und Einstieg in Tumbaya, geführte Teleskopbeobachtung an der Posta de Hornillos, Abendessen und die vorgesehene Rückfahrt. Prüfe Ticket und Betreiberseite vor der Abfahrt erneut; Absage oder geänderte Anweisungen beenden oder ersetzen diesen Plan.`);
    guide.sections = [
      { id: `${id}-where`, heading: bi("The linked route, not two independent sites", "Die verbundene Route statt zweier unabhängiger Orte"), paragraphs: { en: [`The official operator currently publishes bookable departures for 26 September. Passengers meet at 18:00 in San Salvador de Jujuy or 16:00 in Salta, then use the included road transfer to Tumbaya. Reception is scheduled for 19:20 and the guided Solar Train departs at 20:05.`, `Posta de Hornillos is the documented observing stop, reached at 21:05 for guided work with professional telescopes. Tumbaya station is recorded only to make the transport chain explicit; it is not an alternative observing recommendation, and neither coordinate permits an independent night visit.`], de: [`Der offizielle Betreiber veröffentlicht derzeit buchbare Abfahrten am 26. September. Gäste treffen sich um 18:00 Uhr in San Salvador de Jujuy oder um 16:00 Uhr in Salta und nutzen anschließend den enthaltenen Straßentransfer nach Tumbaya. Der Empfang ist für 19:20 Uhr, die Abfahrt des geführten Solarzugs für 20:05 Uhr vorgesehen.`, `Die Posta de Hornillos ist der dokumentierte Beobachtungshalt und wird um 21:05 Uhr für eine geführte Sitzung mit professionellen Teleskopen erreicht. Der Bahnhof Tumbaya ist nur erfasst, um die Transportkette eindeutig zu machen; er ist keine alternative Beobachtungsempfehlung, und keine der Koordinaten erlaubt einen selbstständigen Nachtbesuch.`] }, sourceIds },
      { id: `${id}-conditions`, heading: bi("Booking, weather and altitude controls", "Buchungs-, Wetter- und Höhenkontrollen"), paragraphs: { en: [`Use only a live date-specific booking from the official Cielo en Movimiento page. Check the ticket's city meeting point and time, dietary instructions, clothing advice and any weather message immediately before departure. If the operator cancels or changes the route, do not substitute a private drive to Tumbaya or Posta de Hornillos.`, `The published rail points are roughly 2,100 to 2,300 metres above sea level, below the discarded 3,450-metre Salinas Grandes pin but still high enough for some visitors to notice exertion, cold or dehydration. The operator advises warm clothing, comfortable footwear and water. Anyone with altitude or health concerns should obtain personal medical advice before booking; this guide does not turn those general precautions into a medical clearance.`], de: [`Nutze ausschließlich eine aktuelle datierte Buchung auf der offiziellen Seite von Cielo en Movimiento. Prüfe unmittelbar vor der Abfahrt den Stadttreffpunkt und die Uhrzeit des Tickets, Ernährungshinweise, Kleidungsempfehlung und jede Wettermeldung. Sagt der Betreiber ab oder ändert die Route, ersetze das Programm nicht durch eine Privatfahrt nach Tumbaya oder zur Posta de Hornillos.`, `Die veröffentlichten Bahnpunkte liegen ungefähr 2.100 bis 2.300 Meter hoch und damit unter dem verworfenen Salinas-Grandes-Pin auf 3.450 Metern; manche Gäste können Anstrengung, Kälte oder Flüssigkeitsmangel dennoch bemerken. Der Betreiber empfiehlt warme Kleidung, bequemes Schuhwerk und Wasser. Wer Höhen- oder Gesundheitsbedenken hat, sollte vor der Buchung persönlichen medizinischen Rat einholen; dieser Guide macht aus allgemeinen Vorsichtsmaßnahmen keine medizinische Freigabe.`] }, sourceIds },
      { id: `${id}-equipment`, heading: bi("What to bring to the operator-led night", "Was in die betreute Nacht gehört"), paragraphs: { en: [`Bring the current ticket, warm layers, comfortable footwear and a water bottle. The programme supplies the transport chain, specialist guidance, a planisphere kit and professional telescopes; do not plan around carrying an independent telescope through the train itinerary unless the operator explicitly approves it.`, `Keep white light and phone screens controlled during the observing segment and follow the astronomy and Andean-cosmovision specialists. The historic Posta, train and shared dinner remain managed group spaces after dark, so the useful kit is compact and subordinate to staff instructions.`], de: [`Nimm das aktuelle Ticket, warme Schichten, bequemes Schuhwerk und eine Wasserflasche mit. Das Programm stellt die Transportkette, Fachführung, ein Planisphären-Set und professionelle Teleskope; plane nicht mit einem eigenen Teleskop im Zugablauf, sofern der Betreiber es nicht ausdrücklich erlaubt.`, `Kontrolliere während der Beobachtung Weißlicht und Telefondisplays und folge den Fachleuten für Astronomie und andine Kosmovision. Historische Posta, Zug und gemeinsames Abendessen bleiben nach Einbruch der Dunkelheit betreute Gruppenbereiche; sinnvolle Ausrüstung ist deshalb kompakt und den Teamanweisungen untergeordnet.`] }, sourceIds },
      { id: `${id}-route`, heading: bi("The complete booked sequence", "Der vollständige gebuchte Ablauf"), paragraphs: { en: [`Meet at the city location printed on the ticket and use the included transfer to Tumbaya. After the 19:20 reception and briefing, board the guided train for the scheduled 20:05 departure and remain with the programme through arrival at Posta de Hornillos, telescope observing, dinner and the group photograph.`, `The operator schedules departure from the experience at 23:30 and return transport to San Salvador de Jujuy and Salta. Stay with that return rather than arranging an improvised road pickup or remaining at the Posta. A complete night ends at the booked city destination with every passenger and item accounted for.`], de: [`Triff dich an dem auf dem Ticket genannten Stadtort und nutze den enthaltenen Transfer nach Tumbaya. Steige nach Empfang und Einweisung um 19:20 Uhr zur vorgesehenen Abfahrt um 20:05 Uhr in den geführten Zug und bleibe bis zur Ankunft an der Posta de Hornillos, Teleskopbeobachtung, Abendessen und Gruppenfoto im Programm.`, `Der Betreiber sieht das Ende des Erlebnisses um 23:30 Uhr und den Rücktransfer nach San Salvador de Jujuy und Salta vor. Bleibe bei dieser Rückfahrt, statt eine improvisierte Straßenabholung zu organisieren oder an der Posta zurückzubleiben. Eine vollständige Nacht endet am gebuchten Stadtziel mit allen Gästen und Ausrüstungsteilen.`] }, sourceIds },
    ];
    guide.tour.title = bi("Quebrada de Humahuaca: Cielo en Movimiento by Solar Train", "Quebrada de Humahuaca: Cielo en Movimiento mit dem Solarzug");
    guide.tour.summary = bi(`Book one current Cielo en Movimiento departure and follow its complete transport chain: city meeting point, included transfer to Tumbaya, guided Solar Train to Posta de Hornillos, telescope observing and dinner, then the scheduled 23:30 return. Do not treat either mapped point as an independent site.`, `Buche eine aktuelle Abfahrt von Cielo en Movimiento und folge der vollständigen Transportkette: Stadttreffpunkt, enthaltener Transfer nach Tumbaya, geführter Solarzug zur Posta de Hornillos, Teleskopbeobachtung und Abendessen sowie die vorgesehene Rückfahrt um 23:30 Uhr. Behandle keinen der kartierten Punkte als selbstständigen Ort.`);
    guide.tour.duration = bi("One booked evening with included outward and return transfers", "Ein gebuchter Abend mit enthaltenem Hin- und Rücktransfer");
    guide.tour.suitability = bi("Only for holders of a current Cielo en Movimiento ticket who can use the published meeting time, group transport and operator-led return. It is not an independent-access itinerary.", "Nur für Gäste mit aktuellem Cielo-en-Movimiento-Ticket, die veröffentlichte Treffzeit, Gruppentransport und betreute Rückfahrt nutzen können. Dies ist keine Route für selbstständigen Zugang.");
    const [checkStep, arriveStep, observeStep, leaveStep] = guide.tour.steps;
    checkStep.timeHint = bi("Before the ticket's city meeting time", "Vor der Stadttreffzeit des Tickets");
    checkStep.title = bi("Reconfirm the booking and meeting point", "Buchung und Treffpunkt erneut bestätigen");
    checkStep.body = bi("Open the current ticket and operator page. Confirm the departure date, San Salvador de Jujuy or Salta meeting point, weather status, dietary needs and included return before leaving accommodation. An absent or cancelled booking means postponement, not a private drive to the rail corridor.", "Öffne das aktuelle Ticket und die Betreiberseite. Bestätige Abfahrtsdatum, Treffpunkt in San Salvador de Jujuy oder Salta, Wetterstatus, Ernährungsbedarf und enthaltene Rückfahrt vor dem Verlassen der Unterkunft. Eine fehlende oder abgesagte Buchung bedeutet Verschiebung und keine Privatfahrt an die Bahnstrecke.");
    arriveStep.timeHint = bi("18:00 from Jujuy or 16:00 from Salta; Tumbaya reception 19:20", "18:00 ab Jujuy oder 16:00 ab Salta; Empfang in Tumbaya 19:20");
    arriveStep.title = bi("Use the included transfer and board at Tumbaya", "Enthaltenen Transfer nutzen und in Tumbaya einsteigen");
    arriveStep.body = bi("Meet at the city point stated on the ticket, travel with the included passenger transport and follow the reception and boarding instructions at Tumbaya. Do not use the station coordinate to arrange independent access or a separate platform visit.", "Triff dich an dem auf dem Ticket genannten Stadtpunkt, fahre mit dem enthaltenen Personentransport und folge in Tumbaya den Empfangs- und Einstiegsanweisungen. Nutze die Bahnhofskoordinate weder für selbstständigen Zugang noch für einen getrennten Bahnsteigbesuch außerhalb des gebuchten Ablaufs.");
    observeStep.timeHint = bi("From the scheduled 21:05 arrival at Posta de Hornillos", "Ab der vorgesehenen Ankunft um 21:05 an der Posta de Hornillos");
    observeStep.title = bi("Observe only inside the guided Posta programme", "Nur im geführten Posta-Programm beobachten");
    observeStep.body = bi("Remain with the specialists for telescope observing, Andean sky interpretation and dinner. Follow light, movement and weather instructions and do not leave the managed footprint or turn the historic site into an independent observing stop.", "Bleibe für Teleskopbeobachtung, Deutung des andinen Himmels und Abendessen bei den Fachleuten. Befolge Licht-, Bewegungs- und Wetteranweisungen und verlasse weder die betreute Fläche noch mache aus dem historischen Ort einen selbstständigen Beobachtungshalt.");
    leaveStep.timeHint = bi("Scheduled return from 23:30", "Vorgesehene Rückfahrt ab 23:30");
    leaveStep.title = bi("Return with the booked transport", "Mit dem gebuchten Transport zurückkehren");
    leaveStep.body = bi("Leave with the group and use the included return to the booked city. Do not remain at Posta de Hornillos, arrange an informal pickup or add another night stop after the programme.", "Fahre mit der Gruppe ab und nutze die enthaltene Rückfahrt in die gebuchte Stadt. Bleibe nicht an der Posta de Hornillos, organisiere keine informelle Abholung und ergänze nach dem Programm keinen weiteren Nachtstopp.");
  }
  if (campOnly) {
    guide.standfirst = bi(`Use ${primary} or ${secondary} only as a booked overnight base, arrive in daylight and observe inside the assigned camping footprint. ${options.campFinishWarningEn ?? "Internal travel at night remains prohibited."} The coordinate never replaces a booking, vehicle requirement or current park instruction. Recheck the reservation, road, weather, fire and emergency conditions immediately before departure.`, `Nutze ${primary} oder ${secondary} ausschließlich als gebuchte Übernachtungsbasis, komme bei Tageslicht an und beobachte innerhalb der zugewiesenen Campingfläche. ${options.campFinishWarningDe ?? "Interne Fahrten bei Nacht bleiben verboten."} Die Koordinate ersetzt weder Buchung noch Fahrzeuganforderung oder aktuelle Parkanweisung. Prüfe Reservierung, Straße, Wetter, Feuerlage und Notfallbedingungen unmittelbar vor der Abfahrt erneut.`);
    guide.tour.summary = bi(`Use one booked campsite for the complete ${name} night. Finish reception and permits, arrive at ${primary} before dark, keep the vehicle parked and observe only inside the assigned camping footprint. Sleep at the same camp and resume travel after daylight; ${secondary} belongs to another booking and daylight transfer.`, `Nutze einen gebuchten Campingplatz für die vollständige ${name}-Nacht. Erledige Rezeption und Genehmigungen, erreiche ${primary} vor Dunkelheit, lasse das Fahrzeug stehen und beobachte nur innerhalb der zugewiesenen Campingfläche. Übernachte am selben Camp und fahre erst bei Tageslicht weiter; ${secondary} gehört zu einer anderen Buchung und Tagesetappe.`);
    guide.tour.duration = bi("One booked overnight with daylight arrival and departure", "Eine gebuchte Übernachtung mit An- und Abfahrt bei Tageslicht");
    guide.tour.suitability = bi(`Only for overnight guests with a current campsite booking, the required vehicle, supplies and permits. It is not a drive-in viewpoint plan. ${options.campFinishWarningEn ?? "No travel between camps is permitted after dark."}`, `Nur für Übernachtungsgäste mit aktueller Campingbuchung, vorgeschriebenem Fahrzeug, Vorräten und Genehmigungen. Dies ist kein Aussichtspunkt zum nächtlichen Anfahren. ${options.campFinishWarningDe ?? "Fahrten zwischen Camps sind nach Einbruch der Dunkelheit unzulässig."}`);
    const arriveStep = guide.tour.steps.find((step) => step.id === `${id}-arrive`);
    arriveStep.body = bi(`Reach ${primary} before the park's overnight-arrival cutoff and before dark. Complete the booking check, read the assigned boundary and settle the vehicle once. Do not add ${secondary}; it requires its own booking and a separate daylight transfer.`, `Erreiche ${primary} vor der Ankunftsfrist für Übernachtungsgäste und vor Dunkelheit. Schließe die Buchungsprüfung ab, lies die zugewiesene Grenze und stelle das Fahrzeug einmalig ab. Ergänze ${secondary} nicht; dafür sind eine eigene Buchung und getrennte Tagesetappe nötig.`);
    const observeStep = guide.tour.steps.find((step) => step.id === `${id}-observe`);
    observeStep.body = bi(`Observe beside the booked camp, keep light and noise low and remain inside the assigned footprint. Do not move the vehicle, enter the access road or create an informal riverbank or desert site. Pack every item at the camp before sleeping there.`, `Beobachte neben dem gebuchten Camp, halte Licht und Lärm niedrig und bleibe innerhalb der zugewiesenen Fläche. Bewege das Fahrzeug nicht, befahre keine Zufahrt und richte keinen informellen Platz am Flussufer oder in der Wüste ein. Packe jedes Teil am Camp ein, bevor du dort übernachtest.`);
    const leaveStep = guide.tour.steps.find((step) => step.id === `${id}-leave`);
    leaveStep.timeHint = bi("After daylight returns", "Nach Rückkehr des Tageslichts");
    leaveStep.title = bi(`Leave ${primary} in daylight`, `${primary} bei Tageslicht verlassen`);
    leaveStep.body = bi(`Sleep at the booked campsite and resume travel only after daylight, a fresh road-condition check and complete packing. Report as required at reception or headquarters. ${options.campFinishWarningEn ?? "Never turn the campsite observation into an unauthorised night drive."}`, `Übernachte am gebuchten Campingplatz und fahre erst bei Tageslicht, nach neuer Straßenprüfung und vollständigem Packen weiter. Melde dich wie vorgeschrieben an Rezeption oder Parkzentrale. ${options.campFinishWarningDe ?? "Aus der Beobachtung am Camp darf niemals eine unerlaubte Nachtfahrt werden."}`);
  }
  return guide;
};

const makeTour = (item, index) => {
  const guide = makeGuide(item, index);
  const [id, name, , , , , , , , , stay, sites] = item;
  const options = item[15] ?? {};
  const sourceIds = guide.sources.map((source) => source.id);
  const primary = sites[0][1];
  const base = stay[1];
  const programmeOnly = item[15]?.accessMode === "programme-only";
  const confirmationOnly = item[15]?.accessMode === "confirmation-only";
  const campOnly = item[15]?.accessMode === "camp-only";
  const tour = { version: 1, id: `${id}-one-site-night`, slug: `${id}-one-site-night`, destinationId: id, recommendedSiteId: sites[0][0], title: guide.tour.title, seoDescription: guide.seoDescription, standfirst: guide.standfirst, facts: [
    { label: confirmationOnly ? bi("Candidate viewpoint", "Kandidaten-Aussichtspunkt") : bi("Observe at", "Beobachten an"), value: bi(primary, primary), sourceIds },
    { label: bi("Return base", "Rückkehrbasis"), value: bi(base, base), sourceIds },
    { label: bi("Arrival rule", "Ankunftsregel"), value: confirmationOnly ? bi("No observing visit until the National Park confirms date, hour, route and parking", "Kein Beobachtungsbesuch, bis der Nationalpark Datum, Uhrzeit, Weg und Parken bestätigt") : programmeOnly ? bi("At the booked time using the operator's instructions", "Zur gebuchten Zeit nach Betreiberanweisung") : bi("Before sunset after a same-day access check", "Vor Sonnenuntergang nach Zugangskontrolle am selben Tag"), sourceIds },
    { label: bi("Separate alternative", "Getrennte Alternative"), value: bi(sites[1][1], sites[1][1]), sourceIds },
  ], blocks: [
    { id: `${id}-route-place`, kind: "prose", heading: bi(`Why this route stops at ${primary}`, `Warum diese Route an ${primary} endet`), paragraphs: { en: [`${guide.editorialAngle.en} The single-stop design protects attention, dark adaptation and the known return to ${base}.`, `Read signs and boundaries before unloading. A named place is useful only when its current visitor arrangement is understood.`], de: [`${guide.editorialAngle.de} Das Ein-Ort-Design schützt Aufmerksamkeit, Dunkeladaption und die bekannte Rückkehr nach ${base}.`, `Lies Schilder und Grenzen vor dem Ausladen. Ein benannter Ort hilft nur, wenn seine aktuelle Besucherregelung verstanden ist.`] }, sourceIds },
    { id: `${id}-route-timing`, kind: "schedule", heading: bi(`The sequence for ${name}`, `Die Reihenfolge für ${name}`), introduction: bi("Daylight arrival protects the night that follows.", "Ankunft bei Tageslicht schützt die folgende Nacht."), items: guide.tour.steps.slice(0, 3).map((step) => ({ time: step.timeHint, title: step.title, body: step.body, sourceIds })) },
    { id: `${id}-route-decision`, kind: "decisions", heading: bi(`Two outcomes are enough in ${name}`, `Zwei Ergebnisse genügen in ${name}`), introduction: bi("A supported night proceeds; an unsupported one stops.", "Eine bestätigte Nacht findet statt, eine unbestätigte endet."), items: [
      { label: confirmationOnly ? bi("The park confirms the complete arrangement", "Der Park bestätigt den vollständigen Rahmen") : bi("Access and return are confirmed", "Zugang und Rückkehr sind bestätigt"), body: confirmationOnly ? bi(`Record the dated confirmation before this candidate can become a usable route; until then no observing visit starts.`, `Dokumentiere die datierte Bestätigung, bevor dieser Kandidat zu einer nutzbaren Route werden kann; bis dahin beginnt kein Beobachtungsbesuch.`) : bi(`Stay at ${primary}, keep the vehicle settled and return to ${base} by the route learned in daylight.`, `Bleibe an ${primary}, lasse das Fahrzeug stehen und kehre auf der bei Tageslicht erlernten Route nach ${base} zurück.`), sourceIds },
      { label: bi("A critical detail is missing", "Ein kritisches Detail fehlt"), body: bi("Postpone without adding an unverified roadside stop. That is a complete and responsible result.", "Verschiebe ohne unbestätigten Straßenhalt. Das ist ein vollständiges und verantwortungsvolles Ergebnis."), sourceIds },
    ] },
    { id: `${id}-route-warning`, kind: "note", heading: bi(`The non-negotiable ${name} boundary`, `Die unverhandelbare Grenze in ${name}`), body: bi(`Current authority rules take precedence over a clear sky, an attractive photograph or an old map pin.`, `Aktuelle Verwaltungsregeln haben Vorrang vor klarem Himmel, attraktivem Foto oder altem Kartenpin.`), sourceIds, tone: "warning" },
  ], sourceIds, lastReviewedAt: item[15]?.checkedAt ?? (id === "sierra-morena" ? "2026-09-17" : "2026-09-16") };
  if (confirmationOnly) {
    tour.facts[0] = { label: bi("Inactive candidate place", "Inaktiver Kandidatenort"), value: bi(primary, primary), sourceIds };
    tour.facts[1] = { label: bi("Enquiry and planning base", "Anfrage- und Planungsbasis"), value: bi(base, base), sourceIds };
    tour.facts[2] = { label: bi("Start rule", "Startregel"), value: bi("No observing visit until the responsible authorities confirm date, hour, footprint and finish plan", "Kein Beobachtungsbesuch, bis die zuständigen Stellen Datum, Uhrzeit, Fläche und Abschlussplan bestätigen"), sourceIds };
    tour.blocks[0].paragraphs = {
      en: [`${guide.editorialAngle.en} The single-candidate design prevents an unverified second stop and leaves the finish or overnight arrangement to the dated authority response.`, `Read the confirmed boundary before unloading. A named place becomes usable only when its current astronomy arrangement and safe finish are both documented.`],
      de: [`${guide.editorialAngle.de} Das Ein-Kandidaten-Design verhindert einen ungeprüften zweiten Halt und überlässt Abschluss oder Übernachtung der datierten Behörden- oder Betreiberantwort.`, `Lies die bestätigte Grenze vor dem Ausladen. Ein benannter Ort wird erst nutzbar, wenn sowohl sein aktueller Astronomierahmen als auch ein sicherer Abschluss dokumentiert sind.`],
    };
  }
  if (options.linkedProgramme) {
    tour.facts = [
      { label: bi("Guided observing stop", "Geführter Beobachtungshalt"), value: bi(primary, primary), sourceIds },
      { label: bi("Rail boarding point", "Einstiegspunkt Bahn"), value: bi(sites[1][1], sites[1][1]), sourceIds },
      { label: bi("Start rule", "Startregel"), value: bi("Current Cielo en Movimiento ticket and the city transfer printed on it", "Aktuelles Cielo-en-Movimiento-Ticket und der darauf angegebene Stadttransfer"), sourceIds },
      { label: bi("Return", "Rückfahrt"), value: bi("Included operator return scheduled from 23:30", "Enthaltene Betreiberrückfahrt, vorgesehen ab 23:30"), sourceIds },
    ];
    tour.blocks[0] = { id: `${id}-route-place`, kind: "prose", heading: bi("Why both map points form one programme", "Warum beide Kartenpunkte ein Programm bilden"), paragraphs: { en: [`${guide.editorialAngle.en}`, `Posta de Hornillos is the recommended catalogue point because observing happens there. Tumbaya is recorded only as the staffed boarding link in the same booking, not as a fallback or second night site.`], de: [`${guide.editorialAngle.de}`, `Die Posta de Hornillos ist der empfohlene Katalogpunkt, weil dort beobachtet wird. Tumbaya ist ausschließlich als betreuter Einstieg derselben Buchung erfasst und weder Ausweich- noch zweiter Nachtort.`] }, sourceIds };
    tour.blocks[1].introduction = bi("The current operator timetable defines every transfer and stop.", "Der aktuelle Betreiberfahrplan bestimmt jeden Transfer und Halt.");
    tour.blocks[1].items = guide.tour.steps.map((step) => ({ time: step.timeHint, title: step.title, body: step.body, sourceIds }));
    tour.blocks[2] = { id: `${id}-route-decision`, kind: "decisions", heading: bi("Two outcomes are enough", "Zwei Ergebnisse genügen"), introduction: bi("A live booking runs as published; an unsupported trip does not start.", "Eine aktuelle Buchung läuft wie veröffentlicht; eine unbelegte Fahrt beginnt nicht."), items: [
      { label: bi("Ticket, weather and transfers are confirmed", "Ticket, Wetter und Transfers sind bestätigt"), body: bi("Follow the operator from the city meeting point through Tumbaya and Posta de Hornillos to the included return. No independent access or extra stop is added.", "Folge dem Betreiber vom Stadttreffpunkt über Tumbaya und die Posta de Hornillos bis zur enthaltenen Rückfahrt. Es wird weder selbstständiger Zugang noch ein Zusatzhalt ergänzt."), sourceIds },
      { label: bi("The booking or an itinerary link is missing", "Buchung oder ein Ablaufglied fehlt"), body: bi("Postpone. Do not drive to Tumbaya, Volcán or Posta de Hornillos as a substitute for the cancelled or incomplete programme.", "Verschiebe. Fahre nicht ersatzweise nach Tumbaya, Volcán oder zur Posta de Hornillos, wenn das Programm abgesagt oder unvollständig ist."), sourceIds },
    ] };
    tour.blocks[3] = { id: `${id}-route-warning`, kind: "note", heading: bi("The non-negotiable programme boundary", "Die unverhandelbare Programmgrenze"), body: bi("The coordinates document the itinerary; only the current ticket and operator instructions authorize participation and define the return.", "Die Koordinaten dokumentieren den Ablauf; nur aktuelles Ticket und Betreiberanweisungen erlauben die Teilnahme und bestimmen die Rückfahrt."), sourceIds, tone: "warning" };
  }
  if (campOnly) {
    tour.facts[0] = { label: bi("Booked campsite", "Gebuchter Campingplatz"), value: bi(primary, primary), sourceIds };
    tour.facts[1] = { label: bi("Reception and permit base", "Rezeptions- und Genehmigungsbasis"), value: bi(base, base), sourceIds };
    tour.facts[2] = { label: bi("Arrival rule", "Ankunftsregel"), value: bi(options.campArrivalRuleEn ?? "Complete reception and reach the booked camp before 16:00 and before dark", options.campArrivalRuleDe ?? "Rezeption erledigen und das gebuchte Camp vor 16 Uhr sowie vor Dunkelheit erreichen"), sourceIds };
    tour.blocks[0].paragraphs = {
      en: [`${guide.editorialAngle.en} ${options.campRouteRationaleEn ?? "The one-camp design protects dark adaptation and complies with the prohibition on night driving."}`, `Read the assigned campsite boundary before unloading. The vehicle remains parked from the daylight arrival until travel resumes after sunrise.`],
      de: [`${guide.editorialAngle.de} ${options.campRouteRationaleDe ?? "Das Ein-Camp-Design schützt die Dunkeladaption und entspricht dem Verbot von Nachtfahrten."}`, `Lies die Grenze der zugewiesenen Campingfläche vor dem Ausladen. Das Fahrzeug bleibt von der Ankunft bei Tageslicht bis zur Weiterfahrt nach Sonnenaufgang stehen.`],
    };
    tour.blocks[2].items[0] = { label: bi("Booking, daylight arrival and roads are confirmed", "Buchung, Tageslichtankunft und Straßen sind bestätigt"), body: bi(`Stay at ${primary}, keep the vehicle parked throughout the dark interval and depart only after daylight.`, `Bleibe an ${primary}, lasse das Fahrzeug während der gesamten Dunkelphase stehen und fahre erst bei Tageslicht ab.`), sourceIds };
  }
  return tour;
};

const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const stays = read("data-config/sources/stay-areas.json");
const destinationImages = read("data-config/sources/destination-images.json");
const siteImages = read("data-config/sources/site-images.json");
const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const factualReviews = read("data-config/sources/staged-factual-reviews.json");
const obsoleteStayIds = new Set(["constantina", "espot", "vassieux-en-vercors", "unterach", "kolbasov", "izerska-hala", "kopaonik", "mapungubwe", "purmamarca"]);
for (let index = stays.length - 1; index >= 0; index -= 1) {
  if (obsoleteStayIds.has(stays[index].id) && ["sierra-morena", "aigues-tortes", "vercors", "attersee-traunsee", "poloniny", "izera", "kopaonik", "mapungubwe", "puna-argentina"].includes(stays[index].destinationId)) stays.splice(index, 1);
}
const obsoleteSiteIds = new Set(["garganta-de-los-infernós", "guisando-gredos", "javalambre-observatory-road", "arcos-salinas-viewpoint", "aigues-estany-sant-maurici", "boi-valley", "col-de-la-machine", "vassieux-plateau", "attersee-nussdorf", "traunsee-altaussee", "grossmugl-starwalk", "leiserberge", "poloniny-runina", "poloniny-topola", "izerska-hala", "stóg-izerski", "tara-mitrovac", "tara-banjica", "kopaonik-pancic", "kopaonik-sunacana", "mapungubwe-confluence", "mapungubwe-camp", "fundy-headquarters", "fundy-point-wolfe", "dinosaur-jensen", "dinosaur-harpers", "enchanted-rock-summit", "enchanted-rock-camp", "kissimmee-prairie-north", "kissimmee-prairie-camp", "medicine-rocks-park", "medicine-rocks-camp", "big-cypress-wagonwheel", "big-cypress-camp", "kangaroo-west-bay", "kangaroo-flinders", "sturt-stony-innamincka", "sturt-stony-cooper", "sark-lighthouse", "sark-windmill", "achi-heavens-sonohara", "achi-village", "alula-harrat", "alula-hegra", "mudgee-observatory", "gulgong", "puna-salinas", "puna-humahuaca"]);
for (const records of [sites, siteImages]) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (obsoleteSiteIds.has(records[index].id ?? records[index].slug)) records.splice(index, 1);
  }
}
const upsert = (array, item, key = "id") => {
  const index = array.findIndex((value) => value[key] === item[key]);
  if (index < 0) array.push(item); else array[index] = item;
};

for (const review of stagedReviewBatch.records) {
  upsert(factualReviews.records, review, "destinationId");
}

for (const [index, item] of candidates.entries()) {
  const [id, name, countryCode, countryName, continent, regions, timezone, priority, tags, affiliateQuery, stay, itemSites] = item;
  const observationSiteIds = itemSites.map((site) => site[0]);
  upsert(destinations, { id, slug: id, name, countryCode, countryName, continent, regionSlugs: regions, timezone, active: false, priority, tags, observationSiteIds, stayAreaIds: [stay[0]], affiliateQuery });
  for (const [siteId, siteName, lat, lon, elevationM, siteType, publicAccess, accessScore, notesSourceUrl, accessNoteEn, accessNoteDe] of itemSites) {
    upsert(sites, { id: siteId, slug: siteId, destinationId: id, name: siteName, lat, lon, elevationM, siteType, publicAccess, accessScore, active: false, priority, certificationIds: [], notesSourceUrl: notesSourceUrl ?? item[12][0], accessNotes: bi(accessNoteEn ?? `Use only the current published visitor arrangement for ${siteName}. Confirm opening, parking, hazards, permits and the return before travel; this coordinate is not permission to enter or camp.`, accessNoteDe ?? `Nutze für ${siteName} nur die aktuell veröffentlichte Besucherregelung. Bestätige Öffnung, Parken, Gefahren, Genehmigungen und Rückkehr vor der Fahrt; diese Koordinate ist keine Zutritts- oder Campingerlaubnis.`) });
    upsert(siteImages, { slug: siteId, status: "pending", overrideReason: "Awaiting a fully attributed CC0, CC BY, CC BY-SA, public-domain, or government-work image." }, "slug");
  }
  upsert(stays, { id: stay[0], destinationId: id, name: stay[1], lat: stay[2], lon: stay[3], affiliateQuery: `${stay[1]} ${countryName}`, observationSiteIds });
  upsert(destinationImages, { slug: id, status: "pending", overrideReason: "Awaiting a fully attributed CC0, CC BY, CC BY-SA, public-domain, or government-work image." }, "slug");
  upsert(guides, makeGuide(item, index), "slug");
  upsert(tours, makeTour(item, index), "slug");
}

write("data-config/sources/destinations.json", destinations);
write("data-config/sources/observation-sites.json", sites);
write("data-config/sources/stay-areas.json", stays);
write("data-config/sources/destination-images.json", destinationImages);
write("data-config/sources/site-images.json", siteImages);
write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
write("data-config/sources/staged-factual-reviews.json", factualReviews);
console.log(`Expanded catalog to ${destinations.length} destinations, ${sites.length} sites, ${guides.length} guides and ${tours.length} tours.`);
