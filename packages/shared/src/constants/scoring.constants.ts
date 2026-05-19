// ProviderIQ — Scoring Constants
// Weights, thresholds, and dimension configuration

import type { DimensionWeightConfig } from '../types/scoring.types.js';

/** PII Dimension Weights — must sum to 1.0 */
export const DIMENSION_WEIGHTS: DimensionWeightConfig = {
  trust: 0.25,
  operational: 0.20,
  billingStability: 0.20,
  clinicalQuality: 0.20,
  patientExperience: 0.10,
  fraudRisk: 0.05,
} as const;

/** Fraud risk level thresholds (score → level) */
export const FRAUD_RISK_THRESHOLDS = {
  LOW: 25,
  MEDIUM: 50,
  HIGH: 75,
  CRITICAL: 90,
} as const;

/** Signal recency decay — days until signal loses ~63% weight */
export const SIGNAL_DECAY_DAYS: Record<string, number> = {
  GOOGLE_REVIEW: 180,
  PRACTO_REVIEW: 180,
  NEWS_ITEM: 90,
  NABH_STATUS: 365,
  ABDM_STATUS: 365,
  CLAIMS_DATA: 90,
  SOCIAL_MENTION: 30,
  TWITTER_MENTION: 30,
  COMPLAINT: 365,
  WEBSITE_SIGNAL: 180,
  JOBS_SIGNAL: 60,
  CGHS_STATUS: 365,
  NMC_VERIFICATION: 365,
} as const;

/** Minimum signal counts per dimension for confident scoring */
export const MIN_SIGNALS_PER_DIMENSION = {
  trust: 1,
  operational: 2,
  billingStability: 5,
  clinicalQuality: 2,
  patientExperience: 3,
  fraudRisk: 2,
} as const;

/** Maximum fraud penalty applied to composite PII */
export const MAX_FRAUD_PENALTY = 15;

/** Score ranges for color coding */
export const SCORE_RANGES = {
  EXCELLENT: { min: 80, max: 100, color: '#1D9E75', label: 'Excellent' },
  GOOD: { min: 65, max: 79, color: '#7F77DD', label: 'Good' },
  FAIR: { min: 50, max: 64, color: '#EF9F27', label: 'Fair' },
  POOR: { min: 25, max: 49, color: '#E24B4A', label: 'Poor' },
  CRITICAL: { min: 0, max: 24, color: '#C41E3A', label: 'Critical' },
} as const;

/** Dimension to SignalCategory mapping */
export const DIMENSION_CATEGORY_MAP = {
  trust: 'TRUST',
  operational: 'OPERATIONAL',
  billingStability: 'BILLING',
  clinicalQuality: 'CLINICAL',
  patientExperience: 'PATIENT',
  fraudRisk: 'FRAUD',
} as const;
