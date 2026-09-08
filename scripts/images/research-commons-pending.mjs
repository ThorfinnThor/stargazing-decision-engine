import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const destinations = JSON.parse(fs.readFileSync(path.join(root, "data-config/sources/destinations.json"), "utf8"));
const images = JSON.parse(fs.readFileSync(path.join(root, "data-config/sources/destination-images.json"), "utf8"));
const pending = new Set(images.filter((image) => image.status === "pending").map((image) => image.slug));
const requested = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
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
    iiprop: "url|extmetadata|size",
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
        license: metadata.LicenseShortName?.value,
        licenseUrl: metadata.LicenseUrl?.value,
        artist: metadata.Artist?.value?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
        sourceUrl: info?.descriptionurl,
        downloadUrl: info?.url,
        thumbUrl: info?.thumburl,
      };
    })
    .filter((candidate) => candidate.width >= 1600 && candidate.height >= 900 && allowedLicenses.test(candidate.license ?? ""));
  process.stdout.write(`${JSON.stringify({ destination: destination.name, slug: destination.slug, candidates })}\n`);
}
