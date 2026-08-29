import { resolve } from "node:path";

import type { Destination, DestinationEditorialGuide, LocationTour, ObservationSite } from "../../lib/data/types.js";
import { validateLocationTours } from "../../lib/editorial/location-tours.js";
import { readJson, root } from "../pipeline/io.js";

validateLocationTours({
  tours: readJson<LocationTour[]>(resolve(root, "data-config/editorial/location-tours.json")),
  destinations: readJson<Destination[]>(resolve(root, "data-config/sources/destinations.json")),
  sites: readJson<ObservationSite[]>(resolve(root, "data-config/sources/observation-sites.json")),
  guides: readJson<DestinationEditorialGuide[]>(resolve(root, "data-config/editorial/destination-guides.json")),
});
console.log("Location tours validated.");
