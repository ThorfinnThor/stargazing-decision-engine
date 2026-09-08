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
const reviewedAt = "2026-09-08";
const contact = "StargazingIndex image research (info@stargazingindex.com)";

const selections = [
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
].map(([destinationSlug, fileTitle, altEn, altDe]) => ({ destinationSlug, fileTitle, alt: { en: altEn, de: altDe } }));

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
        visualReviewCount: selections.length,
        metadataVerificationCount: selections.length,
      },
      candidates: auditCandidates,
    };
    fs.writeFileSync(path.join(root, "data-config/sources/destination-image-audit-2026-09-08.json"), `${JSON.stringify(audit, null, 2)}\n`);
    fs.writeFileSync(destinationImagesPath, `${JSON.stringify(destinationImages, null, 2)}\n`);
  }
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
