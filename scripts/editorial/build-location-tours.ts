import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide, LocationTour, ObservationSite } from "../../lib/data/types.js";
import { locationTourWordCount, validateLocationTours } from "../../lib/editorial/location-tours.js";
import { publicPath, readJson, root, writeJson } from "../pipeline/io.js";

const destinations = readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json"));
const sites = readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json"));
const guides = readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json"));
const tours = readJson<LocationTour[]>(resolve(root, "data-config/editorial/location-tours.json"));
validateLocationTours({ tours, destinations, sites, guides });

writeJson(publicPath("editorial/location-tours/index.json"), tours);
for (const tour of tours) writeJson(publicPath(`editorial/location-tours/${tour.slug}.json`), tour);
console.log(`Built ${tours.length} location tours (${tours.reduce((sum, tour) => sum + locationTourWordCount(tour, "en") + locationTourWordCount(tour, "de"), 0)} bilingual words).`);
