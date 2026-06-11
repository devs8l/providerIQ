import type { RawEvidence } from './raw-evidence.types.js';

export interface IdentityCandidate {
  id?: string;
  canonicalName?: string;
  matchedName?: string;
  source?: string;
  sourceId?: string;
  sourceUrl?: string;
  address?: string;
  website?: string;
  confidence?: number;
  matchReasons?: string[];
}

export interface ConnectorInput {
  runId: string;
  seed: {
    id: string;
    name: string;
    city?: string;
    state?: string;
    website?: string;
    address?: string;
  };
  identityCandidates?: IdentityCandidate[];
  options?: Record<string, unknown>;
}

export interface RawEvidenceBatch {
  source: string;
  sourceType: string;
  records: RawEvidence[];
  identityCandidates?: IdentityCandidate[];
  warnings: string[];
  partial: boolean;
}
