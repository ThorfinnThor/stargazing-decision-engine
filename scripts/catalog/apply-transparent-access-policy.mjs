import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const write = (file, value) => writeFileSync(resolve(root, file), `${JSON.stringify(value, null, 2)}\n`);

const policyIds = new Set([
  "sturt-stony-desert",
  "rann-of-kutch",
  "sani-pass",
  "drakensberg",
  "northern-damaraland",
  "isla-navarino",
  "uyuni",
  "kidepo-valley",
]);
const closedId = "sturt-stony-desert";
const reviewedAt = "2026-09-25";

const destinations = read("data-config/sources/destinations.json");
const sites = read("data-config/sources/observation-sites.json");
const guides = read("data-config/editorial/destination-guides.json");
const tours = read("data-config/editorial/location-tours.json");
const factualReviews = read("data-config/sources/staged-factual-reviews.json");

const contactCopy = {
  en: "This catalogue entry is a planning reference, not confirmation of public night access. Before booking or travel, contact the named operator or responsible authority yourself for the exact place, date, hours, access route, parking and return plan. If they do not confirm it, do not use this pin.",
  de: "Dieser Katalogeintrag ist eine Planungsreferenz und keine Bestätigung eines öffentlichen Nachtzugangs. Kontaktiere vor Buchung oder Anreise selbst den genannten Betreiber oder die zuständige Behörde und kläre den genauen Ort, das Datum, die Zeiten, Zufahrt, Parken und Rückkehr. Ohne konkrete Bestätigung darfst du diesen Pin nicht nutzen.",
};
const closureCopy = {
  en: "The public sources reviewed for this profile report the relevant park access closed until further notice. Do not travel to this pin unless Parks SA officially announces reopening. After reopening, verify the current route, campsite, conditions and night-use rules yourself before travel.",
  de: "Die für dieses Profil geprüften öffentlichen Quellen melden den betreffenden Parkzugang bis auf Weiteres als geschlossen. Reise nicht zu diesem Pin, solange Parks SA keine offizielle Wiederöffnung bekannt gibt. Prüfe nach einer Wiederöffnung Route, Campingplatz, Bedingungen und Regeln für die Nacht selbst vor der Anreise.",
};

const stalePatterns = [
  /\s*Keep inactive until[^.]*\./gi,
  /\s*Keep inactive and[^.]*\./gi,
  /\s*Inaktiv lassen, bis[^.]*\./gi,
  /\s*Inaktiv lassen und[^.]*\./gi,
  /\s*Keep image licen[cs]ing pending\./gi,
  /\s*Image licen[cs]e remains pending\./gi,
  /\s*Bildlizenz bleibt ungeprüft\./gi,
  /\s*Bildmaterial bleibt bis zur Lizenzprüfung vorgemerkt\./gi,
  /\s*imagery remains pending licence review\./gi,
  /\s*Climate\/darkness snapshots and imagery remain subject to their existing source and licence gates\./gi,
  /\s*Klima-\/Dunkelheitssnapshots sowie Bildmaterial bleiben ihren bestehenden Quellen- und Lizenzprüfungen unterworfen\./gi,
];

function cleanAccessNote(value) {
  const withoutDisclosure = value
    .replaceAll(contactCopy.en, "")
    .replaceAll(contactCopy.de, "")
    .replaceAll(closureCopy.en, "")
    .replaceAll(closureCopy.de, "");
  return stalePatterns.reduce((text, pattern) => text.replace(pattern, ""), withoutDisclosure).replace(/\s{2,}/g, " ").trim();
}

function replacePublicationLanguage(value) {
  return value
    .replaceAll("This staged guide", "This guide")
    .replaceAll("This staged plan", "This plan")
    .replaceAll("This staged route", "This route")
    .replaceAll("this staged itinerary", "this itinerary")
    .replaceAll("Dieser vorbereitete Guide", "Dieser Guide")
    .replaceAll("Dieser vorbereitete Plan", "Dieser Plan")
    .replaceAll("Diese vorbereitete Route", "Diese Route")
    .replaceAll("dieser vorbereiteten Route", "dieser Route")
    .replaceAll("Inactive candidate place", "Access-unverified reference place")
    .replaceAll("Inaktiver Kandidatenort", "Zugangsungeprüfter Referenzort")
    .replaceAll("Keep the candidate inactive until confirmed", "Do not travel until access is confirmed for your visit")
    .replaceAll("Kandidaten bis zur Bestätigung inaktiv lassen", "Nicht anreisen, bis der Zugang für den eigenen Besuch bestätigt ist")
    .replaceAll("remain inactive candidates", "are listed as access-unverified reference points")
    .replaceAll("bleiben inaktive Kandidaten", "werden als zugangsungeprüfte Referenzpunkte aufgeführt")
    .replaceAll("Both candidate sites remain inactive until the responsible authorities confirm the intended date, hour, access route and parking.", "The catalogue does not confirm public night access at either reference point. Before booking or travel, readers must contact the responsible operator or authority themselves about the intended date, hour, access route, parking and return.")
    .replaceAll("Beide Kandidaten bleiben inaktiv, bis die zuständigen Stellen Datum, Uhrzeit, Zugangsweg und Parken bestätigen.", "Der Katalog bestätigt für keinen der beiden Referenzpunkte einen öffentlichen Nachtzugang. Vor Buchung oder Anreise müssen Leserinnen und Leser selbst Betreiber oder zuständige Behörde nach Datum, Uhrzeit, Zufahrt, Parken und Rückkehr fragen.")
    .replaceAll("The catalogue therefore keeps both records inactive and treats their low access scores as an unresolved evidence gate, not a quality ranking.", "The catalogue therefore labels both records as access unverified and treats the missing access evidence as a warning, not a quality ranking or permission.")
    .replaceAll("Der Katalog hält beide Datensätze deshalb inaktiv und versteht die niedrigen Zugangswerte als offene Belegprüfung, nicht als Qualitätsrang.", "Der Katalog kennzeichnet beide Datensätze deshalb als zugangsungeprüft und behandelt den fehlenden Zugangsbeleg als Warnung, nicht als Qualitätsrang oder Erlaubnis.")
    .replaceAll("The staged records therefore remain candidates only.", "The catalogue records therefore remain reference points only and are not access or travel recommendations.")
    .replaceAll("Die Datensätze für Rann of Kutch bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Rann of Kutch bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Sani Pass bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Sani Pass bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Maloti-Drakensberg bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Maloti-Drakensberg bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Northern Damaraland bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Northern Damaraland bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Isla Navarino bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Isla Navarino bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Uyuni bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Uyuni bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Die Datensätze für Kidepo Valley bleiben deshalb ausschließlich inaktive Kandidaten.", "Die Datensätze für Kidepo Valley bleiben deshalb zugangsungeprüfte Referenzpunkte und sind keine Reiseempfehlungen.")
    .replaceAll("Both sites and the destination remain inactive; climate and darkness snapshots and exact guest-footprint confirmation are still pending.", "Both sites are published only as access-unverified reference points; the exact permitted guest footprint remains unconfirmed.")
    .replaceAll("both remain inactive pending direct resort instructions and fresh climate, darkness and elevation snapshots at the corrected coordinates.", "both remain access-unverified references until readers obtain current resort instructions for their own visit.")
    .replaceAll("Both sites remain inactive pending written property guidance and fresh real-data snapshots at the corrected coordinates.", "Both sites remain access-unverified references until readers obtain current property guidance for their own visit.")
    .replaceAll("both sites and all associated images remain inactive/pending.", "both sites remain access-unverified reference points.")
    .replaceAll("both sites and all related imagery remain inactive/pending.", "both sites remain access-unverified reference points.")
    .replaceAll("mapped station and observation stop remain inactive catalogue records", "mapped station and observation stop are catalogue reference records")
    .replaceAll("kartierten Datensätze für Bahnhof und Beobachtungshalt bleiben inaktiv", "kartierten Datensätze für Bahnhof und Beobachtungshalt sind Katalogreferenzen")
    .replaceAll("staged catalogue coordinate", "catalogue reference coordinate")
    .replaceAll("staged coordinate", "catalogue reference coordinate")
    .replaceAll("staged coordinates", "catalogue reference coordinates")
    .replaceAll("staged approach coordinate", "catalogue reference coordinate")
    .replaceAll("vorgemerkte Koordinate", "Katalog-Referenzkoordinate")
    .replaceAll("vorgemerkten Kartenpunkte", "Katalog-Referenzpunkte")
    .replaceAll("vorbereiteten Kartenpunkte", "Katalog-Referenzpunkte");
}

function rewriteStrings(value) {
  if (typeof value === "string") return replacePublicationLanguage(value);
  if (Array.isArray(value)) return value.map(rewriteStrings);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, rewriteStrings(nested)]));
}

for (const review of factualReviews.records) {
  if (!policyIds.has(review.destinationId)) continue;
  review.publicationDecision = {
    mode: "transparent-unverified-access",
    decidedAt: reviewedAt,
    disclosureRequired: true,
    currentClosure: review.destinationId === closedId,
    readerAction: review.destinationId === closedId ? closureCopy : contactCopy,
  };
}

for (const site of sites) {
  if (!policyIds.has(site.destinationId)) continue;
  site.publicAccess = site.destinationId === closedId ? "no" : "unknown";
  site.accessScore = site.destinationId === closedId ? 0 : null;
  const disclosure = site.destinationId === closedId ? closureCopy : contactCopy;
  site.accessNotes = {
    en: `${cleanAccessNote(site.accessNotes?.en ?? "")} ${disclosure.en}`.trim(),
    de: `${cleanAccessNote(site.accessNotes?.de ?? "")} ${disclosure.de}`.trim(),
  };
}

for (let index = 0; index < guides.length; index += 1) {
  const guide = guides[index];
  if (policyIds.has(guide.destinationId)) {
    const destination = destinations.find((item) => item.id === guide.destinationId);
    const name = destination?.name ?? guide.destinationId;
    guide.seoDescription = guide.destinationId === closedId ? {
      en: `${name} sky-data reference with a current closure warning; not a travel or access recommendation.`,
      de: `${name} als Himmelsdaten-Referenz mit aktueller Sperrungswarnung; keine Reise- oder Zugangsempfehlung.`,
    } : {
      en: `${name} sky-data reference with transparent limits: public sources do not confirm usable night access.`,
      de: `${name} als Himmelsdaten-Referenz mit transparenter Grenze: Öffentliche Quellen bestätigen keinen nutzbaren Nachtzugang.`,
    };
    guide.standfirst = guide.destinationId === closedId ? {
      en: `${name} is listed so readers can compare real climate, darkness and elevation data, not as a travel recommendation. The reviewed public sources report the relevant park access closed until further notice. Do not travel to either reference point unless Parks SA officially announces reopening; after reopening, verify the exact route, campsite, date, hours and night-use rules yourself before making plans.`,
      de: `${name} wird aufgeführt, damit reale Klima-, Dunkelheits- und Höhendaten vergleichbar sind, nicht als Reiseempfehlung. Die geprüften öffentlichen Quellen melden den betreffenden Parkzugang bis auf Weiteres als geschlossen. Reise zu keinem Referenzpunkt, solange Parks SA keine offizielle Wiederöffnung bekannt gibt; prüfe danach genaue Route, Campingplatz, Datum, Zeiten und Regeln für die Nacht selbst, bevor du planst.`,
    } : {
      en: `${name} is listed so readers can compare real climate, darkness and elevation data, not because public night access has been confirmed. The reviewed public sources do not establish an independently usable after-dark observing place. Before booking or travel, contact the named operator or responsible authority yourself about the exact place, date, hours, access route, parking and return. Without specific confirmation, do not use either reference pin.`,
      de: `${name} wird aufgeführt, damit reale Klima-, Dunkelheits- und Höhendaten vergleichbar sind, nicht weil ein öffentlicher Nachtzugang bestätigt wäre. Die geprüften öffentlichen Quellen belegen keinen selbstständig nutzbaren Beobachtungsort nach Einbruch der Dunkelheit. Kontaktiere vor Buchung oder Anreise selbst den genannten Betreiber oder die zuständige Behörde und kläre genauen Ort, Datum, Zeiten, Zufahrt, Parken und Rückkehr. Ohne konkrete Bestätigung darfst du keinen Referenz-Pin nutzen.`,
    };
    guide.lastReviewedAt = reviewedAt;
  }
  guides[index] = rewriteStrings(guide);
}

for (let index = 0; index < tours.length; index += 1) {
  if (policyIds.has(tours[index].destinationId)) tours[index].lastReviewedAt = reviewedAt;
  tours[index] = rewriteStrings(tours[index]);
}

write("data-config/sources/observation-sites.json", sites);
write("data-config/editorial/destination-guides.json", guides);
write("data-config/editorial/location-tours.json", tours);
write("data-config/sources/staged-factual-reviews.json", factualReviews);
console.log(`Applied transparent unverified-access publication policy to ${policyIds.size} destinations.`);
