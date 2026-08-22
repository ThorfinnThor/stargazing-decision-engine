export type BlackMarbleRingId = "0to2" | "2to10" | "10to30" | "30to75";

export interface BlackMarbleRingConfig {
  id: BlackMarbleRingId;
  minKm: number;
  maxKm: number;
  upperInclusive: boolean;
  statistic: "median" | "mean";
  alanWeight: number;
}

export interface BlackMarbleConfig {
  product: "VNP46A4";
  collectionVersion: "2";
  resolutionArcSeconds: 15;
  availableFromYear: number;
  baselineYearCount: 3;
  maxRadiusKm: 75;
  layer: {
    radiance: "AllAngle_Composite_Snow_Free";
    quality: "AllAngle_Composite_Snow_Free_Quality";
    acceptedQualityValues: number[];
  };
  rings: BlackMarbleRingConfig[];
  coverageWarningMin: number;
  coverageErrorMin: number;
  coverageOverrides: Array<{
    siteId: string;
    minimumCoverage: number;
    reason: string;
    reviewedAt: string;
  }>;
}

export interface BlackMarblePixel {
  lat: number;
  lon: number;
  radiance: number | null;
  quality: number;
}

export interface BlackMarbleExtractedYear {
  year: number;
  product: "VNP46A4";
  collectionVersion: "2";
  sourceFiles: string[];
  pixels: BlackMarblePixel[];
}

export interface BlackMarbleYearRingMetric {
  year: number;
  radiance: number | null;
  coverage: number;
  validPixelCount: number;
  totalPixelCount: number;
}

export interface BlackMarbleRingMetric extends Omit<BlackMarbleRingConfig, "alanWeight"> {
  alanWeight: number;
  radiance: number | null;
  coverage: number;
  years: BlackMarbleYearRingMetric[];
}

export interface BlackMarbleSnapshot {
  siteId: string;
  source: "VNP46A4";
  collectionVersion: "2";
  radianceLayer: "AllAngle_Composite_Snow_Free";
  qualityLayer: "AllAngle_Composite_Snow_Free_Quality";
  units: "nW/cm2/sr";
  blackMarbleYears: number[];
  baselineOverrideUsed: boolean;
  coverageOverrideUsed: boolean;
  rings: BlackMarbleRingMetric[];
  radiance0to2: number | null;
  radiance2to10: number | null;
  radiance10to30: number | null;
  radiance30to75: number | null;
  alanExposure: number | null;
  darknessScore: number | null;
  coverage: number;
  warnings: string[];
  retrievedAt: string;
}
