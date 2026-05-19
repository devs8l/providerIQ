// ProviderIQ — Agent Types
// Input/output contracts for all AI agents

import type { SignalCategory } from './facility.types.js';

export interface AgentInput {
  facilityId: string;
  facilityName: string;
  city: string;
  state: string;
  abdmFacilityId?: string;
  nabhAccreditationNo?: string;
  runId: string;
}

export interface AgentOutput {
  agentName: string;
  facilityId: string;
  runId: string;
  status: 'success' | 'partial' | 'failed';
  signals: SignalInput[];
  rawData?: Record<string, unknown>;
  error?: string;
  executionMs: number;
}

export interface SignalInput {
  category: SignalCategory;
  dimension: string;
  source: string;
  sourceUrl?: string;
  value?: number;
  valueText?: string;
  sentiment?: number;
  weight?: number;
  confidence?: number;
  capturedAt?: Date;
  rawData?: Record<string, unknown>;
}

export interface AgentProgress {
  runId: string;
  agentName: string;
  stage: 'queued' | 'running' | 'complete' | 'failed';
  message: string;
  percentage: number;
  elapsedMs: number;
  timestamp: Date;
}

export interface ConnectorOptions {
  timeout?: number;
  retries?: number;
  useProxy?: boolean;
  maxResults?: number;
}

export interface ConnectorResult {
  connectorName: string;
  status: 'success' | 'partial' | 'failed';
  signals: SignalInput[];
  rawData?: Record<string, unknown>;
  error?: string;
  executionMs: number;
}
