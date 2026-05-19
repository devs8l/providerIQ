// ProviderIQ — Facility Types
// Extends Prisma-generated types with domain-specific additions

export type FacilityTier = 'METRO' | 'TIER_2' | 'TIER_3' | 'RURAL';
export type FacilityType = 'HOSPITAL' | 'CLINIC' | 'DIAGNOSTIC_CENTER' | 'NURSING_HOME' | 'SPECIALTY_CENTER';
export type NabhStatus = 'NOT_ACCREDITED' | 'ACCREDITED_ENTRY' | 'ACCREDITED_FULL' | 'ACCREDITED_PROGRESSIVE' | 'EXPIRED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RunStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
export type SignalCategory = 'TRUST' | 'OPERATIONAL' | 'BILLING' | 'CLINICAL' | 'PATIENT' | 'FRAUD';

export interface FacilityIdentity {
  id: string;
  name: string;
  nameAliases: string[];
  abdmFacilityId?: string;
  nabhAccreditationNo?: string;
  cghsEmpanelmentId?: string;
}

export interface FacilityLocation {
  address?: string;
  city: string;
  state: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  tier: FacilityTier;
}

export interface FacilityCharacteristics {
  facilityType: FacilityType;
  bedCount?: number;
  icuBeds?: number;
  nicuBeds?: number;
  operatingTheatres?: number;
  specialties: string[];
}

export interface FacilityAccreditation {
  nabhStatus: NabhStatus;
  nabhGrade?: string;
  nabhExpiryDate?: Date;
  abdmReadiness: boolean;
  cghsEmpanelled: boolean;
  echsEmpanelled: boolean;
}

export interface FacilityScores {
  piiScore?: number;
  trustScore?: number;
  operationalScore?: number;
  billingStabilityScore?: number;
  clinicalQualityScore?: number;
  patientExperienceScore?: number;
  fraudRiskScore?: number;
  fraudRiskLevel?: RiskLevel;
  scoreUpdatedAt?: Date;
}

export interface FacilitySummary extends FacilityIdentity, FacilityLocation, FacilityScores {
  facilityType: FacilityType;
  bedCount?: number;
  nabhStatus: NabhStatus;
}

export interface FacilityProfile extends FacilityIdentity, FacilityLocation, FacilityCharacteristics, FacilityAccreditation, FacilityScores {
  createdAt: Date;
  updatedAt: Date;
}
