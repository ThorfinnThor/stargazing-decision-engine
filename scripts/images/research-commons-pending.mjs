import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const destinations = JSON.parse(fs.readFileSync(path.join(root, "data-config/sources/destinations.json"), "utf8"));
const images = JSON.parse(fs.readFileSync(path.join(root, "data-config/sources/destination-images.json"), "utf8"));
const pending = new Set(images.filter((image) => image.status === "pending").map((image) => image.slug));
const requested = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
const summaryOnly = process.argv.includes("--summary");
const selected = destinations.filter((destination) => pending.has(destination.slug) && (requested.length === 0 || requested.includes(destination.slug)));
const queryOverrides = {
  "central-idaho": "Sawtooth National Recreation Area Idaho landscape",
  "cosmic-campground": "Gila National Forest New Mexico landscape",
  flagstaff: "Flagstaff Arizona San Francisco Peaks landscape",
  watoga: "Pocahontas County West Virginia landscape",
  "mesa-verde": "Mesa Verde National Park landscape",
  "chaco-culture": "Chaco Culture National Historical Park",
  "craters-of-the-moon": "Craters of the Moon National Monument Idaho",
  "antelope-island": "Antelope Island Utah landscape",
  "pic-du-midi": "Pic du Midi de Bigorre observatory",
  cevennes: "Cévennes National Park landscape",
  "alpes-azur-mercantour": "Mercantour National Park landscape",
  rhoen: "Biosphere Reserve Rhön landscape",
  winklmoosalm: "Winklmoosalm Reit im Winkl landscape",
  lauwersmeer: "Lauwersmeer National Park landscape",
  "de-boschplaat": "Boschplaat Terschelling landscape",
  "mon-and-nyord": "Møn Nyord Denmark landscape",
  bukk: "Bükk National Park Hungary landscape",
  albanya: "Albanyà Girona Spain landscape",
  "iriomote-ishigaki": "Iriomote Ishigaki National Park landscape",
  kozushima: "Kōzushima Tokyo island landscape",
  bulbjerg: "Bulbjerg Denmark coast",
  bisei: "Bisei Okayama Japan landscape",
  "minami-rokuroshi": "Rokuroshi Plateau Fukui Japan",
  lapalala: "Lapalala Wilderness South Africa landscape",
  "om-dark-sky": "Isle of Man landscape",
  acadia: "Acadia National Park Maine coast",
  "great-barrier-island": "Aotea Great Barrier Island New Zealand",
  "headlands-michigan": "Headlands International Dark Sky Park Michigan",
  kejimkujik: "Kejimkujik National Park Nova Scotia",
  "mayo-dark-sky": "Wild Nephin National Park Mayo Ireland",
  "wood-buffalo": "Wood Buffalo National Park Salt Plains Canada",
  wairarapa: "Castlepoint Wairarapa New Zealand",
  aenos: "Mount Ainos Kefalonia Greece",
  "isle-of-sark": "Sark Channel Islands landscape",
  "sierra-morena": "Sierra Morena Spain landscape",
  monfrague: "Monfragüe National Park landscape",
  "sierra-de-gredos": "Sierra de Gredos landscape",
  javalambre: "Sierra de Javalambre landscape",
  "aigues-tortes": "Aigüestortes i Estany de Sant Maurici National Park landscape",
  vercors: "Vercors France landscape",
  "attersee-traunsee": "Attersee Traunsee Salzkammergut landscape",
  grossmugl: "Großmugl Weinviertel Austria landscape",
  poloniny: "Poloniny National Park landscape",
  izera: "Jizera Mountains landscape",
  "tara-serbia": "Tara National Park Serbia landscape",
  kopaonik: "Kopaonik National Park landscape",
  richtersveld: "Richtersveld National Park landscape",
  mapungubwe: "Mapungubwe National Park landscape",
  makgadikgadi: "Makgadikgadi Pans landscape",
  tsumkwe: "Nyae Nyae Tsumkwe Namibia landscape",
  rakiura: "Rakiura Stewart Island New Zealand landscape",
  "kangaroo-island": "Kangaroo Island South Australia landscape",
  mudgee: "Mudgee New South Wales vineyard landscape",
  "great-western-woodlands": "Great Western Woodlands Western Australia landscape",
  "torrance-barrens": "Torrance Barrens Dark Sky Preserve",
  fundy: "Fundy National Park New Brunswick landscape",
  manitoulin: "Manitoulin Island Ontario landscape",
  "massacre-rim": "Massacre Rim Nevada landscape",
  "grand-canyon-parashant": "Grand Canyon Parashant National Monument landscape",
  "oracle-state-park": "Oracle State Park Arizona landscape",
  "enchanted-rock": "Enchanted Rock State Natural Area landscape",
  "staunton-river": "Staunton River State Park Virginia landscape",
  "kissimmee-prairie": "Kissimmee Prairie Preserve State Park landscape",
  "big-cypress": "Big Cypress National Preserve landscape",
  "lassen-volcanic": "Lassen Volcanic National Park landscape",
  "dinosaur-national-monument": "Dinosaur National Monument landscape",
  "medicine-rocks": "Medicine Rocks State Park Montana landscape",
  "newport-wisconsin": "Newport State Park Wisconsin landscape",
  "boundary-waters": "Boundary Waters Canoe Area Wilderness Minnesota landscape",
  "sturt-stony-desert": "Sturt Stony Desert Australia landscape",
  alula: "AlUla Saudi Arabia landscape",
  "jebel-akhdar": "Jebel Akhdar Oman landscape",
  "rann-of-kutch": "Great Rann of Kutch white desert landscape",
  "achi-village": "Achi Nagano Japan landscape",
  "sani-pass": "Sani Pass Lesotho landscape",
  drakensberg: "uKhahlamba Drakensberg Park landscape",
  "northern-damaraland": "Damaraland Namibia landscape",
  "coral-pink-sand-dunes": "Coral Pink Sand Dunes State Park landscape",
  "cedar-breaks": "Cedar Breaks National Monument landscape",
  "puna-argentina": "Quebrada de Humahuaca Argentina landscape",
  "isla-navarino": "Navarino Island Puerto Williams landscape",
  uyuni: "Salar de Uyuni Bolivia landscape",
  "kidepo-valley": "Kidepo Valley National Park landscape",
};

const allowedLicenses = /^(CC0|CC BY(?:-SA)?(?: 1\.0| 2\.0| 2\.5| 3\.0| 4\.0)?|Public domain)$/i;

for (const destination of selected) {
  if (destination !== selected[0]) await new Promise((resolve) => setTimeout(resolve, 1600));
  const parameters = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: queryOverrides[destination.slug] ?? `${destination.name} ${destination.countryName} landscape`,
    gsrnamespace: "6",
    gsrlimit: "10",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size|mime",
    iiurlwidth: "640",
    format: "json",
    origin: "*",
  });
  const payload = JSON.parse(execFileSync("curl", [
    "-fsSL",
    "--retry", "4",
    "--retry-all-errors",
    "--retry-delay", "2",
    "-A", "StargazingIndex image research (info@stargazingindex.com)",
    `https://commons.wikimedia.org/w/api.php?${parameters}`,
  ], { encoding: "utf8" }));
  const candidates = Object.values(payload.query?.pages ?? {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      const metadata = info?.extmetadata ?? {};
      return {
        slug: destination.slug,
        title: page.title?.replace(/^File:/, ""),
        width: info?.width,
        height: info?.height,
        mime: info?.mime,
        license: metadata.LicenseShortName?.value,
        licenseUrl: metadata.LicenseUrl?.value,
        artist: metadata.Artist?.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        sourceUrl: info?.descriptionurl,
        downloadUrl: info?.url,
        thumbUrl: info?.thumburl,
      };
    })
    .filter((candidate) => /^image\/(jpeg|png|webp)$/.test(candidate.mime ?? ""))
    .filter((candidate) => candidate.width >= 1600 && candidate.height >= 900 && allowedLicenses.test(candidate.license ?? ""));
  const outputCandidates = summaryOnly
    ? candidates.map(({ title, width, height, license, artist }) => ({ title, width, height, license, artist }))
    : candidates;
  process.stdout.write(`${JSON.stringify({ destination: destination.name, slug: destination.slug, candidates: outputCandidates })}\n`);
}
