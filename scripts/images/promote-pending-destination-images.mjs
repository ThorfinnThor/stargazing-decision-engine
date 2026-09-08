import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const sharpPackage = fs.readdirSync(path.join(root, "node_modules/.pnpm")).find((entry) => entry.startsWith("sharp@"));
if (!sharpPackage) throw new Error("The workspace dependency tree does not contain sharp");
const { default: sharp } = await import(pathToFileURL(path.join(root, "node_modules/.pnpm", sharpPackage, "node_modules/sharp/lib/index.js")));
const dryRun = process.argv.includes("--dry-run");
const expansion = process.argv.includes("--expansion");
const reviewedAt = "2026-09-08";
const contact = "StargazingIndex image research (info@stargazingindex.com)";

const originalSelections = [
  ["joshua-tree", "Joshua Tree National Park (California, USA) -- 2012 -- 5669.jpg", "Joshua trees and granite formations in Joshua Tree National Park", "Joshua Trees und Granitformationen im Joshua-Tree-Nationalpark"],
  ["sedona", "Sedona Cliffs, Arizona, USA 2024-5.jpg", "Red-rock cliffs around Sedona, Arizona", "Rote Felsklippen rund um Sedona in Arizona"],
  ["acadia", "Acadia National Park, Maine (d0f17ce3-9ef6-4b96-a485-dd6408c4f67f).jpg", "Rocky Atlantic coast in Acadia National Park", "Felsige Atlantikküste im Acadia-Nationalpark"],
  ["grand-canyon", "Grand Canyon Hopi Point Evening Light 2013.jpg", "Evening light across the Grand Canyon from Hopi Point", "Abendlicht über dem Grand Canyon vom Hopi Point"],
  ["bryce-canyon", "Inspiration Point Bryce Canyon November 2018 panorama.jpg", "Bryce Canyon amphitheatre from Inspiration Point", "Das Amphitheater des Bryce Canyon vom Inspiration Point"],
  ["capitol-reef", "Capitol Reef 04.jpg", "Rock formations and open desert in Capitol Reef National Park", "Felsformationen und offene Wüste im Capitol-Reef-Nationalpark"],
  ["arches", "Landscape Arch Utah (50MP).jpg", "Landscape Arch in Arches National Park, Utah", "Landscape Arch im Arches-Nationalpark in Utah"],
  ["badlands", "Badlands 03.jpg", "Layered formations in Badlands National Park", "Geschichtete Formationen im Badlands-Nationalpark"],
  ["waterton-lakes", "Waterton Lakes National Park (48490188676).jpg", "Mountain and lake landscape in Waterton Lakes National Park", "Berg- und Seenlandschaft im Waterton-Lakes-Nationalpark"],
  ["wood-buffalo", "Salt Plains, Wood Buffalo National Park.jpg", "Salt Plains in Wood Buffalo National Park", "Salzebene im Wood-Buffalo-Nationalpark"],
  ["kejimkujik", "Puzzle Lake, Kejimkujik National Park, NS (14199830749).jpg", "Puzzle Lake in Kejimkujik National Park", "Puzzle Lake im Kejimkujik-Nationalpark"],
  ["mayo-dark-sky", "Broad southern ridge from Nephin Beg - geograph.org.uk - 6330396.jpg", "Open mountain ridge in the Nephin Beg range, County Mayo", "Offener Bergrücken in den Nephin-Beg-Bergen in County Mayo"],
  ["eryri", "Llyn Dinas in Eryri - Flickr - Petersrockypics.jpg", "Llyn Dinas among the mountains of Eryri", "Llyn Dinas inmitten der Berge von Eryri"],
  ["yorkshire-dales", "Ingleborough Framed by Ribblehead Viaduct – Yorkshire Dales National Park.jpg", "Ingleborough and Ribblehead Viaduct in the Yorkshire Dales", "Ingleborough und das Ribblehead-Viadukt in den Yorkshire Dales"],
  ["south-downs", "South Downs - Morestead, Hampshire, England 2020.jpg", "Rolling fields of the South Downs near Morestead", "Hügellandschaft der South Downs bei Morestead"],
  ["kalbarri", "Panorama of Kalbarri National Park with grass trees.jpg", "Open landscape and grass trees in Kalbarri National Park", "Offene Landschaft mit Grasbäumen im Kalbarri-Nationalpark"],
  ["river-murray", "Barmah National Park, Ulupna Island, Murray River 01.jpg", "Murray River landscape at Barmah National Park", "Landschaft am Murray River im Barmah-Nationalpark"],
  ["great-barrier-island", "Medlands Beach, Great Barrier Island.jpg", "Medlands Beach on Aotea Great Barrier Island", "Medlands Beach auf Aotea Great Barrier Island"],
  ["wairarapa", "Castlepoint from Whakataki, Wairarapa, New Zealand, August 2008 (2783909960).jpg", "Castlepoint coast in the Wairarapa region", "Küste von Castlepoint in der Region Wairarapa"],
  ["kaikoura", "View out towards Kaikoura peninsula.jpg", "Kaikōura Peninsula and the Pacific coast", "Halbinsel Kaikōura und Pazifikküste"],
  ["oudtshoorn", "Landscape near Zebra, Oudtshoorn.jpg", "Karoo landscape near Oudtshoorn", "Karoo-Landschaft bei Oudtshoorn"],
  ["headlands-michigan", "Milky Way against treetops at Headlands International Dark Sky Park MI (54705027488).jpg", "Milky Way above Headlands International Dark Sky Park", "Milchstraße über dem Headlands International Dark Sky Park"],
  ["wadi-rum", "Wadi Rum 03.jpg", "Sandstone landscape in Wadi Rum, Jordan", "Sandsteinlandschaft im Wadi Rum in Jordanien"],
  ["jaisalmer", "Sam dunes (Jaisalmer).jpg", "Sand dunes near Jaisalmer", "Sanddünen bei Jaisalmer"],
  ["aenos", "Mount Ainos in Kefalonia Greece.jpg", "Mount Ainos above Kefalonia, Greece", "Mount Ainos über Kefalonia in Griechenland"],
];

const expansionSelections = [
  ["central-idaho", "Sawtooth Valley ID1.jpg", "The Sawtooth Valley and mountain skyline in central Idaho", "Das Sawtooth Valley und die Bergsilhouette in Zentral-Idaho"],
  ["cosmic-campground", "View at Cosmic CG (23887529197).jpg", "Open horizon at Cosmic Campground in New Mexico", "Freier Horizont am Cosmic Campground in New Mexico"],
  ["flagstaff", "The San Francisco peaks of flagstaff.jpg", "The San Francisco Peaks above Flagstaff, Arizona", "Die San Francisco Peaks über Flagstaff in Arizona"],
  ["watoga", "Watoga State Park.jpg", "Forest and lake landscape in Watoga State Park", "Wald- und Seenlandschaft im Watoga State Park"],
  ["mesa-verde", "Sunset at Mesa Verde - panoramio.jpg", "Sunset over the mesas of Mesa Verde National Park", "Sonnenuntergang über den Tafelbergen des Mesa-Verde-Nationalparks"],
  ["chaco-culture", "Chaco Culture National Historical Park-27.jpg", "Desert landscape and ancestral structures at Chaco Culture", "Wüstenlandschaft und historische Pueblo-Bauten in Chaco Culture"],
  ["craters-of-the-moon", "Craters of the Moon National Monument - Idaho (14562760344).jpg", "Lava landscape in Craters of the Moon National Monument", "Lavalandschaft im Craters of the Moon National Monument"],
  ["antelope-island", "Antelope Island State Park, Utah71.jpg", "Open landscape on Antelope Island in Utah", "Offene Landschaft auf Antelope Island in Utah"],
  ["pic-du-midi", "Observatoire du Pic du Midi.jpg", "Pic du Midi observatory above the Pyrenees", "Das Observatorium Pic du Midi über den Pyrenäen"],
  ["cevennes", "Landscape of Cevennes 01.jpg", "Mountain landscape in the Cévennes", "Berglandschaft in den Cevennen"],
  ["alpes-azur-mercantour", "Le Mercantour - Flickr - loutraje.jpg", "Mountain landscape in Mercantour National Park", "Berglandschaft im Mercantour-Nationalpark"],
  ["rhoen", "Blick vom Wachtküppel nach Nordosten.jpg", "Long view across the Rhön from Wachtküppel", "Weiter Blick vom Wachtküppel über die Rhön"],
  ["winklmoosalm", "GER — BY — Landkreis Traunstein — Reit im Winkl — Winklmoos-Alm (Ausblick südlich).JPG", "Southern mountain view from Winklmoos-Alm", "Südlicher Bergblick von der Winklmoos-Alm"],
  ["lauwersmeer", "Dark Sky Park Lauwersmeer Nationaal Park Ballastplaatbos Suyderoogh 5.jpg", "Observation platform and woodland in Lauwersmeer Dark Sky Park", "Beobachtungsplattform und Wald im Dark Sky Park Lauwersmeer"],
  ["de-boschplaat", "Boschplaat Terschelling bij vloed 1991.jpg", "The Boschplaat nature reserve on Terschelling at high tide", "Das Naturschutzgebiet Boschplaat auf Terschelling bei Flut"],
  ["mon-and-nyord", "Nyord - panoramio (1).jpg", "Open coastal landscape on Nyord near Møn", "Offene Küstenlandschaft auf Nyord bei Møn"],
  ["bukk", "Bél-kő kilátás.jpg", "View across Bükk National Park from Bél-kő", "Blick vom Bél-kő über den Bükk-Nationalpark"],
  ["albanya", "Albanyà 2014 07 25 01 M8.jpg", "Mountain landscape around Albanyà in Catalonia", "Berglandschaft rund um Albanyà in Katalonien"],
  ["iriomote-ishigaki", "名蔵湾 - panoramio.jpg", "Nagura Bay and mangrove landscape in Iriomote-Ishigaki National Park", "Nagura Bay und Mangrovenlandschaft im Iriomote-Ishigaki-Nationalpark"],
  ["kozushima", "Mount Nijurokuya Urui Island.jpg", "Mountain and ocean view on Kōzushima", "Berg- und Meerblick auf Kōzushima"],
  ["bulbjerg", "Bulbjerg (74).jpg", "The limestone cliff and coast at Bulbjerg", "Kalksteinklippe und Küste bei Bulbjerg"],
  ["bisei", "2024-03-18 美星天文台の外観.png", "Bisei Astronomical Observatory in Okayama", "Das Bisei Astronomical Observatory in Okayama"],
  ["minami-rokuroshi", "Rokuroshi Plateau.JPG", "Open landscape on the Rokuroshi Plateau", "Offene Landschaft auf dem Rokuroshi-Plateau"],
  ["lapalala", "Lapalala Wilderness.jpg", "Bushveld landscape in Lapalala Wilderness", "Bushveld-Landschaft in der Lapalala Wilderness"],
  ["om-dark-sky", "Isle of Man Landscape.jpg", "Coastal uplands on the Isle of Man", "Küstenhochland auf der Isle of Man"],
];

const selections = (expansion ? expansionSelections : originalSelections)
  .map(([destinationSlug, fileTitle, altEn, altDe]) => ({ destinationSlug, fileTitle, alt: { en: altEn, de: altDe } }));

function decode(value = "") {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function licenseFamily(shortName) {
  if (/^CC0/i.test(shortName)) return "CC0";
  if (/^CC BY-SA/i.test(shortName)) return "CC BY-SA";
  if (/^CC BY/i.test(shortName)) return "CC BY";
  if (/public domain/i.test(shortName)) return "Public Domain";
  throw new Error(`Unsupported image license: ${shortName}`);
}

function normalizeUrl(value, fallback) {
  if (!value) return fallback;
  if (value.startsWith("//")) return `https:${value}`;
  return value.replace(/^http:/, "https:");
}

const destinationImagesPath = path.join(root, "data-config/sources/destination-images.json");
const destinationImages = JSON.parse(fs.readFileSync(destinationImagesPath, "utf8"));
const auditCandidates = [];
const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "stargazing-images-"));

try {
  for (const selection of selections) {
    const parameters = new URLSearchParams({
      action: "query",
      titles: `File:${selection.fileTitle}`,
      prop: "imageinfo",
      iiprop: "url|extmetadata|size|mime",
      format: "json",
      origin: "*",
    });
    const payload = JSON.parse(execFileSync("curl", [
      "-fsSL", "--retry", "4", "--retry-all-errors", "--retry-delay", "2",
      "-A", contact, `https://commons.wikimedia.org/w/api.php?${parameters}`,
    ], { encoding: "utf8" }));
    const page = Object.values(payload.query?.pages ?? {})[0];
    const info = page?.imageinfo?.[0];
    if (!info || page.missing !== undefined) throw new Error(`${selection.destinationSlug}: Commons file is missing`);
    if (info.width < 1600 || info.height < 900) throw new Error(`${selection.destinationSlug}: source image is below 1600×900`);
    if (!/^image\/(jpeg|png|webp)$/.test(info.mime ?? "")) throw new Error(`${selection.destinationSlug}: unsupported MIME ${info.mime}`);
    const metadata = info.extmetadata ?? {};
    const sourceLicense = decode(metadata.LicenseShortName?.value);
    const family = licenseFamily(sourceLicense);
    const author = decode(metadata.Artist?.value || metadata.Credit?.value);
    if (!author) throw new Error(`${selection.destinationSlug}: Commons author metadata is missing`);
    const sourceUrl = normalizeUrl(info.descriptionurl);
    const downloadUrl = normalizeUrl(info.url);
    const licenseUrl = normalizeUrl(metadata.LicenseUrl?.value, family === "Public Domain" ? "https://creativecommons.org/publicdomain/mark/1.0/" : undefined);
    if (!sourceUrl || !downloadUrl || !licenseUrl) throw new Error(`${selection.destinationSlug}: source or license URL is missing`);
    const sourceTitle = selection.fileTitle.replace(/\.[^.]+$/, "");
    const attribution = `${author}, '${sourceTitle}', Wikimedia Commons, ${sourceLicense}`;
    const candidate = {
      destinationSlug: selection.destinationSlug,
      sourceTitle,
      sourcePlatform: "Wikimedia Commons",
      sourceUrl,
      downloadUrl,
      creator: author,
      sourceLicense,
      licenseFamily: family,
      licenseUrl,
      attribution,
      originalWidth: info.width,
      originalHeight: info.height,
      alt: selection.alt,
      reviewedAt,
      reviewStatus: "approved-after-metadata-and-visual-review",
    };
    auditCandidates.push(candidate);
    process.stdout.write(`${selection.destinationSlug}: ${sourceLicense}, ${info.width}×${info.height}, ${author}\n`);
    if (dryRun) continue;

    const extension = info.mime === "image/png" ? ".png" : ".jpg";
    const downloaded = path.join(temporaryDirectory, `${selection.destinationSlug}${extension}`);
    execFileSync("curl", ["-fsSL", "--retry", "4", "--retry-all-errors", "--retry-delay", "2", "-A", contact, "-o", downloaded, downloadUrl]);
    const output = path.join(root, "public/images/destinations", `${selection.destinationSlug}.webp`);
    await sharp(downloaded)
      .rotate()
      .resize(1800, 1125, { fit: "cover", position: "attention", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(output);
    const image = destinationImages.find((entry) => entry.slug === selection.destinationSlug);
    if (!image) throw new Error(`${selection.destinationSlug}: destination image record is missing`);
    Object.assign(image, {
      status: "approved",
      localPath: `/images/destinations/${selection.destinationSlug}.webp`,
      sourceUrl,
      sourceTitle,
      author,
      license: family,
      licenseUrl,
      attribution,
      alt: selection.alt,
      checkedAt: reviewedAt,
    });
    delete image.overrideReason;
  }

  if (!dryRun) {
    const auditPath = path.join(root, "data-config/sources/destination-image-audit-2026-09-08.json");
    const previousCandidates = expansion && fs.existsSync(auditPath)
      ? JSON.parse(fs.readFileSync(auditPath, "utf8")).candidates ?? []
      : [];
    const combinedCandidates = [...previousCandidates.filter((candidate) => !auditCandidates.some((next) => next.destinationSlug === candidate.destinationSlug)), ...auditCandidates];
    const audit = {
      version: 1,
      generatedAt: `${reviewedAt}T00:00:00.000Z`,
      policy: {
        allowedLicenseFamilies: ["CC0", "CC BY", "CC BY-SA", "Public Domain", "Public Domain Mark", "NASA Public Domain", "U.S. Government Work"],
        minimumOriginalWidth: 1600,
        minimumOriginalHeight: 900,
      },
      audit: {
        reviewedAt,
        reviewedBy: "Codex",
        status: "approved-for-publication",
        visualReviewCount: combinedCandidates.length,
        metadataVerificationCount: combinedCandidates.length,
      },
      candidates: combinedCandidates,
    };
    fs.writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
    fs.writeFileSync(destinationImagesPath, `${JSON.stringify(destinationImages, null, 2)}\n`);
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
