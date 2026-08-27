export type SkyLocation = {
  id: string;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  siteId: string;
  siteName: string;
  label: string;
  lat: number;
  lon: number;
  elevationM: number | null;
  timeZone: string;
  limitingMagnitude?: number;
};

export type SkyClock = { mode: "live" } | { mode: "fixed"; instantIso: string; previewId?: string };

export type NightPreview = {
  id: string;
  destinationId: string;
  destinationSlug: string;
  siteId: string;
  instantIso: string;
  sunAltitudeDeg: number;
  minimumVisibleStarCount: number;
  generatedAt: string;
  generatorVersion: string;
};

export type HomepageSkyCandidate = {
  id: string;
  destinationHref: string;
  location: SkyLocation;
  previewIds: string[];
};

export type HomepageSkySelection =
  | { mode: "live-night"; candidateId: string; selectedAtIso: string; sunAltitudeDegAtSelection: number }
  | { mode: "night-preview"; candidateId: string; previewId: string; instantIso: string };

export type HorizontalPosition = { altitudeDeg: number; azimuthDeg: number; aboveHorizon: boolean };

export type CatalogStar = {
  id: number;
  xEqj: number;
  yEqj: number;
  zEqj: number;
  magnitude: number;
  colorIndex: number | null;
};

export type SkyCultureId = "western";

export type ConstellationLinePath = {
  starIds: number[];
  weight: "normal" | "thin" | "bold";
};

export type ConstellationDefinition = {
  id: string;
  skyCulture: SkyCultureId;
  iauAbbreviation: string;
  names: { de: string; en: string; latin?: string };
  linePaths: ConstellationLinePath[];
  labelAnchorStarId?: number;
  explanationId: string;
};

export type ProjectedConstellationPoint = { xNormalized: number; yNormalized: number };

export type ProjectedConstellationPath = {
  constellationId: string;
  points: ProjectedConstellationPoint[];
  weight: "normal" | "thin" | "bold";
};

export type VisibleConstellation = {
  id: string;
  iauAbbreviation: string;
  visibilityState: "partly-visible" | "recognizable";
  score: number;
  visibleAnchorCount: number;
  totalAnchorCount: number;
  visibleAnchorRatio: number;
  visibleSegmentFraction: number;
  centerAltitudeDeg: number;
  centerAzimuthDeg: number;
  labelXNormalized: number | null;
  labelYNormalized: number | null;
  projectedPaths: ProjectedConstellationPath[];
};

export type ConstellationSummary = {
  constellationId: string;
  name: string;
  visibilityState: VisibleConstellation["visibilityState"];
  directionLabel: string;
  altitudeLabel: string;
  recognitionHint: string;
  shortDescription: string;
};

export type ConstellationCopy = {
  id: string;
  name: { de: string; en: string };
  shortDescription: { de: string; en: string };
  recognitionHint: { de: string; en: string };
  culturalNote?: { de: string; en: string };
  factSources: string[];
  lastReviewedAt: string;
};

export type ProjectedStar = {
  id: number;
  xNormalized: number;
  yNormalized: number;
  altitudeDeg: number;
  azimuthDeg: number;
  magnitude: number;
  colorIndex: number | null;
  opacity: number;
  radiusFactor: number;
};

export type MoonSkyState = HorizontalPosition & {
  phaseDeg: number;
  illuminatedFraction: number;
  brightLimbScreenAngleRad: number | null;
  xNormalized: number | null;
  yNormalized: number | null;
};

export type SkyCondition = "daylight" | "civil-twilight" | "nautical-twilight" | "astronomical-twilight" | "night";

export type SkySnapshot = {
  locationId: string;
  instantIso: string;
  sun: HorizontalPosition;
  moon: MoonSkyState;
  stars: ProjectedStar[];
  constellations: VisibleConstellation[];
  effectiveLimitingMagnitude: number;
  skyCondition: SkyCondition;
};

export type BrightStarCatalog = {
  version: 2;
  source: {
    name: string;
    version: string;
    url: string;
    sourceCommit: string;
    license: "CC BY-SA 4.0";
    licenseUrl: string;
    upstreamSha256: string;
    magnitudeCutoff: number;
    constellationAnchorMagnitudeCeiling: number;
    idSystem: "HIP";
    generatedAt: string;
  };
  stars: Array<[number, number, number, number, number, number | null]>;
};

export type ConstellationDatasetFile = {
  version: 1;
  skyCulture: "western";
  source: {
    name: string;
    url: string;
    sourceCommit: string;
    license: "CC BY-SA 4.0";
    licenseUrl: string;
    upstreamSha256: string;
    generatedAt: string;
  };
  constellations: ConstellationDefinition[];
};

export type NightPreviewFile = {
  version: 1;
  generatedAt: string;
  generatorVersion: string;
  previews: NightPreview[];
};
