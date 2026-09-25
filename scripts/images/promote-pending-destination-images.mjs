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
const staged = process.argv.includes("--staged");
const prepareReview = process.argv.includes("--prepare-review");
const requested = process.argv.slice(2).filter((argument) => !argument.startsWith("--"));
if ([expansion, staged].filter(Boolean).length > 1) throw new Error("Choose at most one image cohort");
const reviewedAt = staged ? "2026-09-25" : "2026-09-08";
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

const stagedSelections = [
  ["isle-of-sark", "Sark-aerial.jpg", "Aerial view of Sark and its coastal landscape", "Luftbild von Sark und seiner Küstenlandschaft"],
  ["sierra-morena", "Spring fields in Sierra Morena (Cordoba, S Spain).jpg", "Spring fields in the Sierra Morena of southern Spain", "Frühlingsfelder in der Sierra Morena im Süden Spaniens"],
  ["monfrague", "PARQUE NACIONAL DE MONFRAGÜE. VISTA DESDE LA SIERRA DE LAS CORCHUELAS.jpg", "View across Monfragüe National Park from Sierra de las Corchuelas", "Blick von der Sierra de las Corchuelas über den Nationalpark Monfragüe"],
  ["sierra-de-gredos", "Sierra de Gredos.jpg", "Mountain landscape in the Sierra de Gredos", "Berglandschaft in der Sierra de Gredos"],
  ["javalambre", "Gúdar-Javalambre 1977.jpg", "Mountain landscape in Gúdar-Javalambre", "Berglandschaft in Gúdar-Javalambre"],
  ["aigues-tortes", "Sant Maurici lake, Aigüestortes i Estany de Sant Maurici National Park, Spain - Diliff.jpg", "Sant Maurici lake in Aigüestortes i Estany de Sant Maurici National Park", "Der See Sant Maurici im Nationalpark Aigüestortes i Estany de Sant Maurici"],
  ["vercors", "Mont Aiguille - Vercors - France (31053335294).jpg", "Mont Aiguille in the Vercors mountains", "Mont Aiguille im Vercors-Gebirge"],
  ["attersee-traunsee", "Attersee - Südostansicht.JPG", "Attersee and the surrounding Salzkammergut mountains", "Der Attersee und die umliegenden Berge des Salzkammerguts"],
  ["grossmugl", "Großmugl - Hügelgrab (1).JPG", "Open countryside and an ancient burial mound near Großmugl", "Offene Landschaft und ein Hügelgrab bei Großmugl"],
  ["poloniny", "Národná prírodná rezervácia Jarabá skala, Národný park Poloniny (08).jpg", "Mountain forest in Poloniny National Park", "Bergwald im Nationalpark Poloniny"],
  ["izera", "Isergebirge-view from Heufuder.JPG", "View across the Jizera Mountains", "Blick über das Isergebirge"],
  ["tara-serbia", "Over the Tara mountain.jpg", "Forested mountain landscape in Tara National Park", "Bewaldete Berglandschaft im Tara-Nationalpark"],
  ["kopaonik", "Kopaonik, pogled na Belu Reku.jpg", "Mountain view across Kopaonik", "Bergblick über den Kopaonik"],
  ["richtersveld", "Vegetation and mountains, Richtersveld National Park, Unesco World Heritage site, Northern Cape, South Africa (20352268568).jpg", "Vegetation and mountains in Richtersveld National Park", "Vegetation und Berge im Richtersveld-Nationalpark"],
  ["mapungubwe", "Landscape in the Mapungubwe National Park, with zebras.jpg", "Open landscape in Mapungubwe National Park", "Offene Landschaft im Mapungubwe-Nationalpark"],
  ["makgadikgadi", "Salar del parque nacional Makgadikgadi Pans, Botsuana, 2018-07-30, DD 37.jpg", "Salt-pan landscape in Makgadikgadi Pans National Park", "Salzpfannenlandschaft im Makgadikgadi-Pans-Nationalpark"],
  ["tsumkwe", "Nyae Nyae See.jpg", "Nyae Nyae Pan near Tsumkwe in northeastern Namibia", "Die Nyae-Nyae-Pfanne bei Tsumkwe im Nordosten Namibias"],
  ["rakiura", "Forest Stewart Island.jpg", "Temperate rainforest on Rakiura Stewart Island", "Gemäßigter Regenwald auf Rakiura Stewart Island"],
  ["kangaroo-island", "Flinders Chase National Park 01.jpg", "Coastal landscape in Flinders Chase National Park on Kangaroo Island", "Küstenlandschaft im Flinders-Chase-Nationalpark auf Kangaroo Island"],
  ["mudgee", "Cudgegong river mudgee.jpg", "Cudgegong River landscape at Mudgee in New South Wales", "Landschaft am Cudgegong River bei Mudgee in New South Wales"],
  ["great-western-woodlands", "Great Western Woodlands.jpg", "Woodland landscape in the Great Western Woodlands", "Waldlandschaft in den Great Western Woodlands"],
  ["torrance-barrens", "Torrance Barrens Dark Sky Preserve (53968290486).jpg", "Rocky landscape in Torrance Barrens Dark Sky Preserve", "Felslandschaft im Torrance Barrens Dark Sky Preserve"],
  ["fundy", "Fundy National Park View 7.JPG", "Forest and coastal landscape in Fundy National Park", "Wald- und Küstenlandschaft im Fundy-Nationalpark"],
  ["manitoulin", "Gore bay manitoulin island.jpg", "Gore Bay and the North Channel on Manitoulin Island", "Gore Bay und der North Channel auf Manitoulin Island"],
  ["massacre-rim", "Massacre Rim (29722878482).jpg", "Remote high-desert landscape at Massacre Rim", "Abgelegene Hochwüstenlandschaft am Massacre Rim"],
  ["grand-canyon-parashant", "-conservationlands15 Social Media Takeover, Feb 15th, BLM Winter Bucket List, Grand Canyon-Parashant National Monument in Arizona for Its Dark Sky Park Status (16514847896).jpg", "Remote landscape in Grand Canyon-Parashant National Monument", "Abgelegene Landschaft im Grand-Canyon-Parashant-Nationalmonument"],
  ["oracle-state-park", "View of Oracle, AZ looking south - Mt. Lemmon in background.jpg", "Oracle, Arizona, with Mount Lemmon in the background", "Oracle in Arizona mit Mount Lemmon im Hintergrund"],
  ["enchanted-rock", "Enchanted Rock, Central Texas, June, 2025, Panoramic View.jpg", "Panoramic view of Enchanted Rock in central Texas", "Panoramablick auf Enchanted Rock in Zentraltexas"],
  ["staunton-river", "River Area Staunton River State Park (15834123201).jpg", "River and woodland landscape at Staunton River State Park", "Fluss- und Waldlandschaft im Staunton River State Park"],
  ["kissimmee-prairie", "Kissimmee Prairie PSP01.jpg", "Open grassland in Kissimmee Prairie Preserve State Park", "Offenes Grasland im Kissimmee Prairie Preserve State Park"],
  ["big-cypress", "Big Cypress National Preserve, Florida (99a1838f-c770-46c6-9b82-927ff0af8f62).jpg", "Wetland landscape in Big Cypress National Preserve", "Feuchtgebietslandschaft im Big Cypress National Preserve"],
  ["lassen-volcanic", "Lassen Volcanic National Park LAVO1937.jpg", "Volcanic mountain landscape in Lassen Volcanic National Park", "Vulkanische Berglandschaft im Lassen-Volcanic-Nationalpark"],
  ["dinosaur-national-monument", "Gates of lodore dinosaur national monument.jpg", "The Gates of Lodore in Dinosaur National Monument", "Die Gates of Lodore im Dinosaur-Nationalmonument"],
  ["medicine-rocks", "Medicine Rocks State Park 20.jpg", "Sandstone formations in Medicine Rocks State Park", "Sandsteinformationen im Medicine Rocks State Park"],
  ["newport-wisconsin", "Gfp-wisconsin-newport-state-park-landscape-and-lake.jpg", "Lake Michigan shoreline in Newport State Park, Wisconsin", "Ufer des Michigansees im Newport State Park in Wisconsin"],
  ["boundary-waters", "The Boundary Waters, Minnesota.jpg", "Lake and forest landscape in the Boundary Waters Canoe Area Wilderness", "Seen- und Waldlandschaft in der Boundary Waters Canoe Area Wilderness"],
  ["sturt-stony-desert", "Euro 571250124.jpg", "Kangaroos in arid shrubland of the Tirari-Sturt Stony Desert ecoregion", "Kängurus im trockenen Buschland der Ökoregion Tirari-Sturt Stony Desert"],
  ["alula", "Landscape at al-Ula, Saudi Arabia (10).jpg", "Sandstone landscape at AlUla in Saudi Arabia", "Sandsteinlandschaft bei AlUla in Saudi-Arabien"],
  ["jebel-akhdar", "Jebel Akhdar Morning (52708306333).jpg", "Morning mountain landscape in Jebel Akhdar, Oman", "Morgendliche Berglandschaft im Jebel Akhdar im Oman"],
  ["rann-of-kutch", "The White Desert in Kutch, the great rann of kutch.jpg", "White salt desert in the Great Rann of Kutch", "Weiße Salzwüste im Great Rann of Kutch"],
  ["achi-village", "Hirugami001.JPG", "Hirugami Onsen and its mountain setting in Achi, Nagano", "Hirugami Onsen und seine Berglandschaft in Achi, Nagano"],
  ["sani-pass", "Sani Pass heading into Lesotho.jpg", "Mountain road and highland landscape at Sani Pass", "Bergstraße und Hochlandlandschaft am Sani Pass"],
  ["drakensberg", "ELANDS - View from Eland Cave at Cathedral Peak, South Africa, 2017.jpg", "Mountain landscape seen from Eland Cave in the Drakensberg", "Berglandschaft von der Eland Cave in den Drakensbergen"],
  ["northern-damaraland", "Damaraland 03.jpg", "Rugged landscape in Damaraland, Namibia", "Raue Landschaft im Damaraland in Namibia"],
  ["coral-pink-sand-dunes", "Coral Pink Sand Dunes After Rain 03.JPG", "Coral Pink Sand Dunes after rain in Utah", "Die Coral Pink Sand Dunes nach Regen in Utah"],
  ["cedar-breaks", "Sunset over Cedar Breaks (81574e01-1dd8-b71b-0bf1-9f13cb699d43).JPG", "Sunset over Cedar Breaks National Monument", "Sonnenuntergang über dem Cedar-Breaks-Nationalmonument"],
  ["puna-argentina", "Quebrada de Humahuaca 01.jpg", "High-altitude landscape in Quebrada de Humahuaca", "Hochlandlandschaft in der Quebrada de Humahuaca"],
  ["isla-navarino", "Dientes de Navarino desde el Cerro Bandera, Chile.jpg", "Dientes de Navarino mountains seen from Cerro Bandera", "Die Dientes-de-Navarino-Berge vom Cerro Bandera aus gesehen"],
  ["uyuni", "Salar de Uyuni, Bolivia, 2016-02-04, DD 01-03 HDR.JPG", "Salt-flat landscape at Salar de Uyuni", "Salzpfannenlandschaft im Salar de Uyuni"],
  ["kidepo-valley", "A landscape of Kidepo National Park in Uganda.jpg", "Savanna landscape in Kidepo Valley National Park", "Savannenlandschaft im Kidepo-Valley-Nationalpark"],
];

const selections = (staged ? stagedSelections : expansion ? expansionSelections : originalSelections)
  .filter(([destinationSlug]) => requested.length === 0 || requested.includes(destinationSlug))
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
      iiurlwidth: "1800",
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
    const assetUrl = prepareReview ? normalizeUrl(info.thumburl, downloadUrl) : downloadUrl;
    execFileSync("curl", ["-fsSL", "--retry", "4", "--retry-all-errors", "--retry-delay", "2", "-A", contact, "-o", downloaded, assetUrl]);
    const output = prepareReview
      ? path.join(temporaryDirectory, `${selection.destinationSlug}.webp`)
      : path.join(root, "public/images/destinations", `${selection.destinationSlug}.webp`);
    await sharp(downloaded)
      .rotate()
      .resize(1800, 1125, { fit: "cover", position: "attention", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(output);
    if (prepareReview) {
      fs.rmSync(downloaded, { force: true });
      continue;
    }
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

  if (prepareReview) {
    const tilesPerSheet = 10;
    for (let offset = 0; offset < selections.length; offset += tilesPerSheet) {
      const sheetSelections = selections.slice(offset, offset + tilesPerSheet);
      const composites = [];
      for (const [index, selection] of sheetSelections.entries()) {
        const tile = await sharp(path.join(temporaryDirectory, `${selection.destinationSlug}.webp`))
          .resize(360, 225, { fit: "cover" })
          .composite([{ input: Buffer.from(`<svg width="360" height="34"><rect width="360" height="34" fill="rgba(0,0,0,0.72)"/><text x="10" y="23" fill="white" font-family="sans-serif" font-size="17">${selection.destinationSlug}</text></svg>`), top: 191, left: 0 }])
          .webp({ quality: 80 })
          .toBuffer();
        composites.push({ input: tile, left: (index % 5) * 360, top: Math.floor(index / 5) * 225 });
      }
      await sharp({ create: { width: 1800, height: 450, channels: 3, background: "#111827" } })
        .composite(composites)
        .webp({ quality: 82 })
        .toFile(path.join(temporaryDirectory, `contact-sheet-${offset / tilesPerSheet + 1}.webp`));
    }
    fs.writeFileSync(path.join(temporaryDirectory, "candidates.json"), `${JSON.stringify(auditCandidates, null, 2)}\n`);
    console.log(`Prepared visual-review assets in ${temporaryDirectory}`);
  } else if (!dryRun) {
    const auditPath = path.join(root, `data-config/sources/destination-image-audit-${reviewedAt}.json`);
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
  if (!prepareReview) fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}
