export interface CopernicusDemConfig {
  dataset: "COP-DEM_GLO-30-DGED";
  resolutionM: 30;
  resolutionArcSeconds: 1;
  verticalDatum: "EGM2008";
  s3: {
    endpoint: string;
    bucket: string;
    prefix: string;
    publicFallbackEndpoint: string;
    publicFallbackBucket: string;
    publicFallbackPrefix: string;
  };
  tileKeyTemplate: string;
  neighborhoodsKm: number[];
  validElevationRangeM: [number, number];
  requirePointData: boolean;
}

export interface DemNeighborhoodMetric {
  radiusKm: number;
  elevationM: number | null;
  validSampleCount: number;
}

export interface DemSnapshot {
  siteId: string;
  source: "copernicus-dem-glo-30";
  dataset: "COP-DEM_GLO-30-DGED";
  modelType: "DSM";
  resolutionM: 30;
  resolutionArcSeconds: 1;
  verticalDatum: "EGM2008";
  requestedPoint: [number, number];
  tile: string;
  sourceObject: string;
  publicFallback: boolean;
  elevationM: number | null;
  neighborhoods: DemNeighborhoodMetric[];
  noDataPolicy: "masked-or-nodata-values-excluded";
  coverage: number;
  warnings: string[];
  retrievedAt: string;
}
