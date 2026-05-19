// ProviderIQ — Base Agent Implementation
// Powered by Inquantic.Ai

import type { AgentInput, AgentOutput, SignalInput } from '@provideriq/shared';

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;

  abstract execute(input: AgentInput): Promise<AgentOutput>;

  protected createOutput(
    input: AgentInput,
    status: 'success' | 'partial' | 'failed',
    signals: SignalInput[],
    executionMs: number,
    error?: string,
    rawData?: Record<string, unknown>
  ): AgentOutput {
    return {
      agentName: this.name,
      facilityId: input.facilityId,
      runId: input.runId,
      status,
      signals,
      rawData,
      error,
      executionMs,
    };
  }
}
