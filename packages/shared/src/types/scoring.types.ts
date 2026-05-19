// ProviderIQ — Scoring Types
// Provider Intelligence Index computation types

import type { SignalCategory, FacilityTier } from './facility.types.js';

export interface ScoringInput {
  facilityId: string;
  signals: StoredSignal[];
  facility: {
    id: string;
    name: string;
    city: string;
    state: string;
    tier: FacilityTier;
    facilityType: string;
    bedCount?: number;
    specialties: string[];
  };
  peerGroup?: PeerFacility[];
}

export interface StoredSignal {
  id: string;
  facilityId: string;
  category: SignalCategory;
  dimension: string;
  source: string;
  sourceUrl?: string;
  value?: number;
  valueText?: string;
  sentiment?: number;
  weight: number;
  confidence: number;
  capturedAt: Date;
  expiresAt?: Date;
  isDecayed: boolean;
}

export interface PeerFacility {
  id: string;
  name: string;
  city: string;
  state: string;
  tier: FacilityTier;
  piiScore?: number;
  specialties: string[];
}

export interface ScoringOutput {
  piiScore: number;
  dimensions: {
    trust: DimensionScore;
    operational: DimensionScore;
    billingStability: DimensionScore;
    clinicalQuality: DimensionScore;
    patientExperience: DimensionScore;
    fraudRisk: DimensionScore;
  };
  positiveFactors: ExplainabilityFactor[];
  negativeFactors: ExplainabilityFactor[];
  dataCompleteness: number;
  confidence: number;
  narrative: string;
  generatedAt: Date;
}

export interface DimensionScore {
  score: number;
  weight: number;
  confidence: number;
  signalCount: number;
  topSignals: string[];
  status: 'computed' | 'insufficient_data';
}

export interface ExplainabilityFactor {
  label: string;
  description: string;
  impact: 'positive' | 'negative';
  magnitude: 'low' | 'medium' | 'high';
  source: string;
  sourceUrl?: string;
  signalDate?: Date;
}

export interface NarrativeReport {
  executiveSummary: string;
  positiveFactors: ExplainabilityFactor[];
  negativeFactors: ExplainabilityFactor[];
  peerContext: string;
  trendDirection: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  trendReason: string;
  dataGaps: string[];
  actionableInsight: string;
  oneLineVerdict: string;
  confidenceNote: string;
}

export type DimensionKey = 'trust' | 'operational' | 'billingStability' | 'clinicalQuality' | 'patientExperience' | 'fraudRisk';

export type DimensionWeightConfig = Record<DimensionKey, number>;
