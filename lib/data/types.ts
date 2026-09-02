/** Framework-independent contracts shared by ETL scripts and Next.js. */

export type MonthNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type PublicAccess = "yes" | "limited" | "unknown" | "no";
export type ConfidenceLevel = "high" | "moderate" | "low";
export type ScoreDataStatus = "real" | "seed";

export interface Destination {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  countryName: string;
  continent: string;
  regionSlugs: string[];
  timezone: string;
  active: boolean;
  priority: number;
  tags: string[];
  observationSiteIds: string[];
  stayAreaIds: string[];
  affiliateQuery: string;
}

export type LocalizedEditorialText = { en: string; de: string };

export interface DestinationEditorialSource {
  id: string;
  publisher: string;
  title: string;
  url: string;
  checkedAt: string;
  authority: "official-destination" | "public-agency" | "protected-area" | "science-institution" | "nonprofit-certifier";
}

export interface DestinationEditorialSection {
  id: string;
  heading: LocalizedEditorialText;
  paragraphs: { en: string[]; de: string[] };
  sourceIds: string[];
}

export interface DestinationTourStep {
  id: string;
  timeHint: LocalizedEditorialText;
  title: LocalizedEditorialText;
  body: LocalizedEditorialText;
  sourceIds: string[];
}

export interface DestinationEditorialGuide {
  version: 1;
  destinationId: string;
  slug: string;
  seoTitle: LocalizedEditorialText;
  seoDescription: LocalizedEditorialText;
  standfirst: LocalizedEditorialText;
  editorialAngle: LocalizedEditorialText;
  sections: DestinationEditorialSection[];
  tour: {
    title: LocalizedEditorialText;
    summary: LocalizedEditorialText;
    duration: LocalizedEditorialText;
    suitability: LocalizedEditorialText;
    sourceIds: string[];
    steps: DestinationTourStep[];
  };
  fieldNotesTitle: LocalizedEditorialText;
  fieldNotes: Array<{
    id: string;
    title: LocalizedEditorialText;
    body: LocalizedEditorialText;
    sourceIds: string[];
  }>;
  faq: Array<{
    question: LocalizedEditorialText;
    answer: LocalizedEditorialText;
    sourceIds: string[];
  }>;
  sources: DestinationEditorialSource[];
  lastReviewedAt: string;
}

export interface LocationTourFact {
  label: LocalizedEditorialText;
  value: LocalizedEditorialText;
  sourceIds: string[];
}

export type LocationTourBlock =
  | {
      id: string;
      kind: "prose";
      heading: LocalizedEditorialText;
      paragraphs: { en: string[]; de: string[] };
      sourceIds: string[];
    }
  | {
      id: string;
      kind: "schedule";
      heading: LocalizedEditorialText;
      introduction?: LocalizedEditorialText;
      items: Array<{
        time: LocalizedEditorialText;
        title: LocalizedEditorialText;
        body: LocalizedEditorialText;
        sourceIds: string[];
      }>;
    }
  | {
      id: string;
      kind: "decisions";
      heading: LocalizedEditorialText;
      introduction?: LocalizedEditorialText;
      items: Array<{
        label: LocalizedEditorialText;
        body: LocalizedEditorialText;
        sourceIds: string[];
      }>;
    }
  | {
      id: string;
      kind: "note";
      heading: LocalizedEditorialText;
      body: LocalizedEditorialText;
      sourceIds: string[];
      tone: "practical" | "warning" | "context";
    };

export interface LocationTour {
  version: 1;
  id: string;
  slug: string;
  destinationId: string;
  recommendedSiteId: string;
  title: LocalizedEditorialText;
  seoDescription: LocalizedEditorialText;
  standfirst: LocalizedEditorialText;
  facts: LocationTourFact[];
  blocks: LocationTourBlock[];
  sourceIds: string[];
  lastReviewedAt: string;
}

export interface ObservationSite {
  id: string;
  slug: string;
  destinationId: string;
  name: string;
  lat: number;
  lon: number;
  elevationM: number | null;
  siteType: string;
  publicAccess: PublicAccess;
  accessScore: number | null;
  active: boolean;
  priority: number;
  certificationIds: string[];
  notesSourceUrl?: string | null;
  accessNotes?: { en: string; de: string } | null;
}

export type Site = ObservationSite;

export interface StayArea {
  id: string;
  destinationId: string;
  name: string;
  lat: number;
  lon: number;
  affiliateQuery: string;
  observationSiteIds: string[];
}

export interface OriginCity {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  lat: number;
  lon: number;
  active: boolean;
  maxShortTripKm: number;
}

export type AffiliatePartnerType = "hotel" | "activity" | "camping" | "car_rental" | "gear";

export interface AffiliateDestinationSearchVariant {
  id: string;
  queryTemplate: string;
}

export interface AffiliateWidgetConfig {
  type: "activities";
  enabled: boolean;
  campaign: string;
  scriptUrl: string;
  frameUrl: string;
  itemCount: number;
  destinationScope: "all-active" | "selected";
  destinationIds?: string[];
}

export interface AffiliatePartner {
  id: string;
  name: string;
  type: AffiliatePartnerType;
  enabled: boolean;
  affiliateId: string;
  destinationSearchEnabled: boolean;
  destinationSearchVariants?: AffiliateDestinationSearchVariant[];
  widget?: AffiliateWidgetConfig;
  urlTemplate: string | null;
  allowedHosts: string[];
  requiredQueryParameters: string[];
  disclosure: { en: string; de: string };
}

export interface AffiliateConfig {
  version: 1;
  partners: AffiliatePartner[];
}

export interface AstroshopProductMatch {
  guideSlug: string;
  productName: string;
  path: string;
  checkedAt: string;
}

export interface AffiliateActivityOffer {
  id: string;
  partnerId: string;
  destinationId: string;
  locationTourSlugs: string[];
  enabled: boolean;
  title: LocalizedEditorialText;
  description: LocalizedEditorialText;
  urlTemplate: string;
  lastReviewedAt: string;
}

export interface AffiliateActivityOfferConfig {
  version: 1;
  offers: AffiliateActivityOffer[];
}

export interface PublishedAffiliateActivityOffer {
  id: string;
  partnerId: string;
  partnerName: string;
  destinationId: string;
  locationTourSlugs: string[];
  title: LocalizedEditorialText;
  description: LocalizedEditorialText;
  redirectPath: string;
  lastReviewedAt: string;
}

export interface PublishedAffiliateDestinationSearch {
  partnerId: string;
  partnerName: string;
  destinationId: string;
  destinationSlug: string;
  variantId: string;
  redirectPath: string;
}

export interface GearCategory {
  id: string;
  slug: string;
  name: { en: string; de: string };
  description: { en: string; de: string };
}

export interface GearGuideItem {
  name: { en: string; de: string };
  whyItMatters: { en: string; de: string };
  coreSpecs: Record<string, string>;
  localizedCoreSpecs?: { en: Record<string, string>; de: Record<string, string> };
  pros: { en: string[]; de: string[] };
  cons: { en: string[]; de: string[] };
  recommendationBasis: "specification_analysis";
  partnerSearchQuery: string;
  affiliatePartnerId: string | null;
  source?: {
    publisher: string;
    title: string;
    url: string;
    checkedAt: string;
  };
}

export interface GearGuide {
  slug: string;
  title: { en: string; de: string };
  category: string;
  summary: { en: string; de: string };
  decisionSummary: { en: string; de: string };
  audience: { en: string; de: string };
  buyingCriteria: Array<{ en: string; de: string }>;
  items: GearGuideItem[];
  tradeoffs: { en: string[]; de: string[] };
  faq: Array<{ question: { en: string; de: string }; answer: { en: string; de: string } }>;
  affiliateDisclosure: { en: string; de: string };
  lastReviewedAt: string;
}

export interface GearProductMetadata {
  id: string;
  brand: string;
  model: string;
  category: string;
  coreSpecs: Record<string, string>;
  editorialPros: { en: string[]; de: string[] };
  editorialCons: { en: string[]; de: string[] };
  partnerSearchQuery: string;
  affiliatePartnerId: string | null;
  lastReviewedAt: string;
  recommendationBasis: "specification_analysis";
}

export type ImageAssetStatus = "pending" | "approved";

export interface ImageAssetConfig {
  slug: string;
  status: ImageAssetStatus;
  localPath?: string | null;
  sourceUrl?: string | null;
  sourceTitle?: string | null;
  author?: string | null;
  license?: string | null;
  licenseUrl?: string | null;
  attribution?: string | null;
  alt?: { en: string; de: string };
  checkedAt?: string;
  overrideReason?: string;
}

export interface PublicImageAsset {
  slug: string;
  status: ImageAssetStatus;
  localPath: string | null;
  sourceUrl: string | null;
  sourceTitle: string | null;
  author: string | null;
  license: string | null;
  licenseUrl: string | null;
  attribution: string | null;
  alt: { en: string; de: string };
  checkedAt: string;
  overrideReason: string | null;
}

export interface ImageManifest {
  version: 1;
  generatedAt: string;
  policy: { allowedLicenses: string[]; requiredFormat: "webp"; hosting: "self" };
  destinations: PublicImageAsset[];
  sites: PublicImageAsset[];
}

export interface ShortTripFile {
  originSlug: string;
  originName: string;
  countryCode: string;
  maxShortTripKm: number;
  generatedAt: string;
  entries: ShortTripEntry[];
}

export interface ShortTripEntry {
  rank: number;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  distanceKm: number;
  distanceBand: string;
  bestMonths: Array<{ month: MonthNumber; score: number }>;
  monthlyStargazingTripScores: Array<{ month: MonthNumber; score: number; confidenceLevel: ConfidenceLevel }>;
  stargazingTripScore: number;
  distanceUtility: number;
  shortTripScore: number;
  bestSiteId: string;
  stayArea: { id: string; name: string; affiliateQuery: string } | null;
  campingAvailable: boolean | null;
  reasons: string[];
  confidenceLevel: ConfidenceLevel;
}

export interface MonthlySiteClimate {
  siteId: string;
  month: MonthNumber;
  astronomicalHours: number;
  clearHourProbability: number | null;
  goodHourProbability: number | null;
  overcastHourProbability: number | null;
  clearNightProbability: number | null;
  wetNightHourProbability: number | null;
  dewRiskProbability: number | null;
  nightTempMeanC: number | null;
  nightTempP10C: number | null;
  nightTempP90C: number | null;
  nightWindMeanKmh: number | null;
  highWindHourProbability: number | null;
  daylightOppositeNightHoursMean: number | null;
  dataCompleteness: number;
}

export type MonthlyClimate = MonthlySiteClimate;

export interface DarknessMetrics {
  siteId: string;
  blackMarbleYears: number[];
  radiance0to2: number | null;
  radiance2to10: number | null;
  radiance10to30: number | null;
  radiance30to75: number | null;
  alanExposure: number | null;
  darknessScore: number | null;
  coverage: number;
}

export interface MonthlySiteScore {
  siteId: string;
  month: MonthNumber;
  skyQuality: number;
  tripComfort: number;
  stargazingTrip: number;
  clearSkyScore: number;
  darknessScore: number;
  dewScore: number;
  elevationScore: number;
  temperatureComfortScore: number;
  windComfortScore: number;
  rainComfortScore: number;
  accessScore: number | null;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  reasons: string[];
  caveats: string[];
}

export interface SiteScoreSnapshot {
  siteId: string;
  algorithmVersion: "site-score-1.1.0";
  generatedAt: string;
  months: MonthlySiteScore[];
}

export interface DestinationMonthlySummary {
  destinationId: string;
  siteId: string;
  dataStatus: ScoreDataStatus;
  algorithmVersion: string;
  generatedAt: string;
  caveats: string[];
  months: Array<{
    month: MonthNumber;
    score: number;
    confidenceLevel: ConfidenceLevel;
  }>;
}

export interface SiteMonthlySummary {
  siteId: string;
  dataStatus: ScoreDataStatus;
  algorithmVersion: string;
  generatedAt: string;
  scores: MonthlySiteScore[];
}

export interface FinderMonth {
  month: MonthNumber;
  stargazingTrip: number;
  skyQuality: number;
  tripComfort: number;
  clearSkyScore: number;
  darknessScore: number;
  temperatureComfortScore: number;
  nightTempMeanC: number | null;
  dewRiskProbability: number | null;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
}

export interface FinderDestination {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  countryName: string;
  continent: string;
  tags: string[];
  bestSiteId: string;
  bestSiteName: string;
  publicAccess: PublicAccess;
  monthly: FinderMonth[];
}

export interface DestinationMonthScore {
  destinationId: string;
  month: MonthNumber;
  bestSiteId: string | null;
  skyQuality: number;
  tripComfort: number;
  stargazingTrip: number;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  reasons: string[];
  caveats: string[];
}

export interface CalendarNight {
  darknessRank: number;
  dateLocal: string;
  timezone: string;
  astronomicalDusk: string | null;
  astronomicalDawn: string | null;
  moonIlluminationFraction: number | null;
  moonPhaseAngleDeg: number | null;
  moonRiseLocal: string | null;
  moonSetLocal: string | null;
  moonAltitudeMaxDeg: number | null;
  moonAboveHorizonDarkHours: number;
  moonBelowHorizonDarkHours: number;
  moonlessHours: number;
  totalDarknessHours: number;
  calendarDarknessScore: number;
  milkyWayUsefulHours: number;
  milkyWayStrongHours: number;
  galacticCenterAltitudeMaxDeg: number | null;
  milkyWayOpportunityScore: number | null;
}

export interface CalendarFile {
  destinationId: string;
  siteId: string | null;
  bestSiteId: string | null;
  year: number;
  month: MonthNumber;
  algorithmVersion: string;
  astronomyEngineVersion: string;
  generatedAt: string;
  nights: CalendarNight[];
}

export interface MeteorShowerEvent {
  id: string;
  slug: string;
  iauCode: string;
  name: { en: string; de: string };
  year: number;
  peakDate: string;
  peakUtc: string | null;
  activeStart: string;
  activeEnd: string;
  radiantFrame: "J2000";
  radiantRaDeg: number;
  radiantDecDeg: number;
  referenceZhr: number | null;
  source: string;
  sourceUrl: string;
  sourceYear: number;
  verifiedAt: string;
  climateContext: {
    month: MonthNumber;
    metric: "monthly_site_sky_quality";
    source: string;
  };
  moonConditions: {
    bestSiteId: string | null;
    dateLocal: string | null;
    timezone: string | null;
    moonIlluminationFraction: number | null;
    moonlessHours: number | null;
    totalDarknessHours: number | null;
  };
  topDestinations: MeteorShowerViewingRow[];
  topSites: MeteorShowerViewingRow[];
  climateScore: number | null;
  moonScore: number | null;
  radiantScore: number | null;
  viewingScore: number | null;
  confidenceLevel: ConfidenceLevel;
  indexable: boolean;
  caveats: string[];
}

export interface MeteorShowerViewingRow {
  rank: number;
  destinationId: string;
  destinationSlug: string;
  destinationName: string;
  siteId: string;
  siteSlug: string;
  siteName: string;
  climateScore: number | null;
  moonScore: number;
  radiantScore: number;
  viewingScore: number;
  moonConditions: {
    dateLocal: string;
    timezone: string;
    moonIlluminationFraction: number | null;
    moonlessHours: number;
    totalDarknessHours: number;
  };
  radiantConditions: {
    maximumAltitudeDeg: number | null;
    darkRadiantHours: number;
  };
  caveats: string[];
}

export interface RankingEntry {
  rank: number;
  destinationId: string;
  siteId: string | null;
  score: number;
  reason: string;
}

export interface RankingFile {
  slug: string;
  title: string;
  period: string;
  entries: RankingEntry[];
}

export interface ComparisonFile {
  slug: string;
  destinationIds: string[];
  metrics: Array<{
    key: string;
    label: string;
    values: Record<string, number | null>;
  }>;
}

export interface Manifest {
  datasetVersion: string;
  schemaVersion: number;
  algorithmVersion: string;
  generatedAt: string;
  climateNormal: {
    startYear: number;
    endYear: number;
  };
  blackMarble: {
    product: string;
    collection: number;
    years: number[];
  };
  sourceVersions: Record<string, string>;
  counts: Record<string, number>;
  snapshotHashes: Record<string, string>;
  fileChecksums: Record<string, string>;
}
