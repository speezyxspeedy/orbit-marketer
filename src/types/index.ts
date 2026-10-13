export type ChannelType = "hook" | "reel_script" | "ad_copy" | "email" | "landing_page";

export type AngleType = "authority" | "urgency" | "curiosity" | "proof" | "fear-to-relief";
export type PsychologicalAngle = AngleType;

export type CampaignStatus = "draft" | "generated" | "active";
export type ExperimentStatus = "COLLECTING_DATA" | "OPTIMIZED";
export type RiskType = "guaranteed_results" | "medical_claim" | "prohibited_phrase" | string;

// 1. Brand Document and Semantic Chunks
export interface BrandChunk {
  id: string;
  text: string;
  embedding: number[];
}

export interface BrandDoc {
  id: string;
  fileName: string;
  uploadedAt: string | number | Date;
  chunks: BrandChunk[];
}

// 2. Campaign & Brief Schemas
export interface Campaign {
  id: string;
  brief: string;
  status: CampaignStatus;
  createdAt: string | number | Date;
}

export interface CampaignBrief {
  id: string;
  campaignName?: string;
  briefText: string;
  targetChannels?: ChannelType[];
  targetAngles?: AngleType[];
  brandDocId?: string;
  status: CampaignStatus;
  createdAt: string | number | Date;
}

// 3. Campaign Assets
export interface CampaignAsset {
  id: string;
  campaignId: string;
  channel: ChannelType;
  angle: AngleType;
  content: string;
  brand_rule_cited: string;
  chunk_id: string;
  embedding: number[];
  isDuplicate: boolean;
  similarityScore?: number;
}

export type Asset = CampaignAsset;

// 4. Compliance & Policy Flags
export interface ComplianceFlag {
  id?: string;
  assetId: string;
  riskType: RiskType;
  originalLine: string;
  fixApplied: string;
  rationale?: string;
  timestamp: string | number | Date;
}

export type PolicyFlag = ComplianceFlag;

export interface ComplianceAuditItem {
  risk_detected: boolean;
  risk_type: RiskType;
  original_line: string;
  rewritten_line: string;
  rationale: string;
}

// 5. Experiment & Bandit Schemas
export interface VariantMetric {
  id: string;
  assetId?: string;
  impressions: number;
  conversions: number;
  cvr?: number;
}

export type ExperimentVariant = VariantMetric;

export interface VariantWeight {
  variantId: string;
  weight: number;
  weightPercentage?: number;
}

export interface Experiment {
  id: string;
  campaignId: string;
  variants: VariantMetric[];
  weights: VariantWeight[];
  status: ExperimentStatus;
}

export interface BanditResult {
  status: ExperimentStatus;
  budgetSplit: VariantWeight[];
  winnerVariantId: string | null;
  totalImpressions: number;
  conversionRates: Record<string, number>;
  rationale: string;
}

// 6. Deduplication Schemas
export interface DedupeSimilarityItem {
  assetAId: string;
  assetBId: string;
  channel: ChannelType;
  similarity: number;
  isDuplicate: boolean;
}

export interface DedupeResult {
  kept: CampaignAsset[];
  removed: CampaignAsset[];
  uniqueAssets: CampaignAsset[];
  duplicateAssets: Array<{
    asset: CampaignAsset;
    matchedAssetId: string;
    similarity: number;
  }>;
  matrix: Array<{
    assetAId: string;
    assetBId: string;
    similarity: number;
    isDuplicate: boolean;
  }>;
}

export interface DedupeAssetsResponse {
  campaignId: string;
  similarityThreshold: number;
  duplicateCount: number;
  matrix: DedupeSimilarityItem[];
  filteredAssetIds: string[];
}

// 7. API Payloads
export interface GenerateCampaignRequest {
  brief: string;
  brandDocId?: string;
  campaignName?: string;
  targetAngles?: AngleType[];
}

export interface GenerateCampaignResponse {
  campaign_name: string;
  brand_voice_summary: string;
  assets: Array<{
    id: string;
    channel: ChannelType;
    angle: AngleType;
    content: string;
    brand_rule_cited: string;
    chunk_id: string;
    isDuplicate?: boolean;
  }>;
  compliance_audit: ComplianceAuditItem[];
}
