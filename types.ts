export type CurvePoint = readonly [input: number, score: number];

export interface ScoreWeights {
  version: number;
  skyQuality: { clearSky: number; darkness: number; dew: number; elevation: number };
  tripComfort: { temperature: number; wind: number; rain: number; access: number };
  stargazingTrip: { skyQuality: number; tripComfort: number };
  confidence: {
    era5Completeness: number;
    blackMarbleCoverage: number;
    blackMarbleBaseline: number;
    era5GridDistance: number;
    demAvailability: number;
    siteMetadata: number;
  };
}

export interface CloudScoreConfig {
  version: number;
  clearNightWeight: number;
  clearHourWeight: number;
  clearNightCurve: CurvePoint[];
  clearHourCurve: CurvePoint[];
}

export interface SingleCurveConfig { version: number; curve: CurvePoint[] }

export interface WindScoreConfig {
  version: number;
  meanWindWeight: number;
  highWindProbabilityWeight: number;
  meanWindCurve: CurvePoint[];
  highWindProbabilityCurve: CurvePoint[];
}

export interface ConfidenceConfig {
  version: number;
  era5GridDistanceCurveKm: CurvePoint[];
  levels: { highMinimum: number; moderateMinimum: number };
}

export interface SiteScoreConfig {
  weights: ScoreWeights;
  cloud: CloudScoreConfig;
  dew: SingleCurveConfig;
  elevation: SingleCurveConfig;
  temperature: SingleCurveConfig;
  wind: WindScoreConfig;
  rain: SingleCurveConfig;
  confidence: ConfidenceConfig;
}
