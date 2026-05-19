// ProviderIQ — API Types
// Request/response shapes for the tRPC API layer

import type { FacilityTier, RiskLevel, FacilitySummary, FacilityProfile } from './facility.types.js';
import type { ScoringOutput, NarrativeReport, ExplainabilityFactor } from './scoring.types.js';
import type { StoredSignal } from './scoring.types.js';

// --- Facility Endpoints ---

export interface FacilitySearchInput {
  query?: string;
  state?: string;
  tier?: FacilityTier;
  minScore?: number;
  maxScore?: number;
  riskLevel?: RiskLevel;
  sortBy?: 'piiScore' | 'name' | 'updatedAt' | 'bedCount' | 'fraudRiskScore';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface FacilitySearchResult {
  facilities: FacilitySummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FacilityCompareInput {
  facilityIds: string[];
}

export interface FacilityCompareResult {
  facilities: (FacilityProfile & {
    scoring?: ScoringOutput;
    peerPercentile?: number;
  })[];
}

export interface FacilityHeatmapInput {
  state?: string;
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  dimension?: string;
}

export interface HeatmapPoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  score: number;
  tier: FacilityTier;
  bedCount?: number;
}

// --- Research Endpoints ---

export interface ResearchTriggerInput {
  facilityId: string;
}

export interface ResearchTriggerResult {
  runId: string;
  status: string;
  estimatedDurationMs: number;
}

export interface ResearchStatusResult {
  runId: string;
  facilityId: string;
  status: string;
  progress?: number;
  currentAgent?: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

// --- Signal Endpoints ---

export interface SignalQueryInput {
  facilityId: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface ExplainabilityResult {
  facilityId: string;
  narrative: NarrativeReport;
  positiveFactors: ExplainabilityFactor[];
  negativeFactors: ExplainabilityFactor[];
  signals: StoredSignal[];
}

// --- Analytics Endpoints ---

export interface NetworkOverview {
  totalFacilities: number;
  avgPiiScore: number;
  scoreDistribution: { range: string; count: number }[];
  activeAlerts: number;
  facilitiesByTier: Record<string, number>;
  facilitiesByState: Record<string, number>;
  topPerformers: FacilitySummary[];
  bottomPerformers: FacilitySummary[];
}

export interface StateStats {
  state: string;
  facilityCount: number;
  avgPiiScore: number;
  avgTrustScore: number;
  avgFraudRiskScore: number;
  topPerformers: FacilitySummary[];
  bottomPerformers: FacilitySummary[];
}

export interface FraudAlert {
  facilityId: string;
  facilityName: string;
  city: string;
  state: string;
  fraudRiskScore: number;
  fraudRiskLevel: RiskLevel;
  corroboratingSources: {
    category: string;
    source: string;
    detail: string;
  }[];
  supervisorVerdict: string;
  flaggedAt: Date;
  acknowledged: boolean;
}

// --- API Key ---

export interface ApiKeyInfo {
  id: string;
  name: string;
  scopes: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  isActive: boolean;
}
