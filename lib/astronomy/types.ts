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
  effectiveLimitingMagnitude: number;
  skyCondition: SkyCondition;
};

export type BrightStarCatalog = {
  version: 1;
  source: {
    name: string;
    version: string;
    url: string;
    sourceCommit: string;
    license: "CC BY-SA 4.0";
    licenseUrl: string;
    upstreamSha256: string;
    magnitudeCutoff: number;
    generatedAt: string;
  };
  stars: Array<[number, number, number, number, number, number | null]>;
};

export type NightPreviewFile = {
  version: 1;
  generatedAt: string;
  generatorVersion: string;
  previews: NightPreview[];
};
