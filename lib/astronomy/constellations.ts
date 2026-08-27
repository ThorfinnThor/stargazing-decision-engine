import constellationJson from "../../public/data/stargazing/astronomy/constellation-lines-western.json";
import type { ConstellationDatasetFile } from "./types";

const dataset = constellationJson as ConstellationDatasetFile;

export const westernConstellationMetadata = dataset.source;
export const westernConstellations = dataset.constellations;

