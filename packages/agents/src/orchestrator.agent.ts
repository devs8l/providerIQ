// ProviderIQ — Orchestrator Agent
// Powered by Inquantic.Ai

import { BaseAgent } from './base.agent.js';
import type { AgentInput, AgentOutput, ScoringOutput } from '@provideriq/shared';
import { ConnectorOrchestrator } from '@provideriq/connectors';
import { ScoringEngine } from '@provideriq/scoring';
import { prisma } from '@provideriq/database';

export class OrchestratorAgent extends BaseAgent {
  name = 'OrchestratorAgent';
  description = 'Coordinates full multi-agent intelligence gathering and scoring engine runs.';

  private connectors = new ConnectorOrchestrator();
  private scoring = new ScoringEngine();

  async execute(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    console.log(`[Orchestrator] Starting run ${input.runId} for facility ${input.facilityName}`);

    try {
      // 1. Fetch raw web signals via connector orchestrator
      const connectorResults = await this.connectors.runAll(
        input.facilityName,
        input.city,
        input.state
      );

      // 2. Map connector outputs to Prisma Signals format
      const dbSignals: any[] = [];
      for (const res of connectorResults) {
        if (res.status === 'success') {
          for (const sig of res.signals) {
            dbSignals.push({
              facilityId: input.facilityId,
              category: sig.category,
              dimension: sig.dimension,
              source: sig.source,
              sourceUrl: sig.sourceUrl,
              value: sig.value,
              valueText: sig.valueText,
              sentiment: sig.sentiment,
              weight: sig.weight ?? 1.0,
              confidence: sig.confidence ?? 1.0,
              capturedAt: new Date(),
            });
          }
        }
      }

      // 3. Save captured signals to database
      if (dbSignals.length > 0) {
        await prisma.signal.createMany({
          data: dbSignals,
        });
      }

      // 4. Fetch all active signals for the facility to run scoring
      const allSignals = await prisma.signal.findMany({
        where: {
          facilityId: input.facilityId,
          isDecayed: false,
        },
      });

      const mappedSignals = allSignals.map((sig) => ({
        ...sig,
        value: sig.value ?? undefined,
        sourceUrl: sig.sourceUrl ?? undefined,
        valueText: sig.valueText ?? undefined,
        sentiment: sig.sentiment ?? undefined,
        expiresAt: sig.expiresAt ?? undefined,
        rawData: sig.rawData as any,
      }));

      // 5. Run Scoring Engine compute
      const scoringResult = this.scoring.compute({
        facilityId: input.facilityId,
        signals: mappedSignals,
        facility: {
          id: input.facilityId,
          name: input.facilityName,
          city: input.city,
          state: input.state,
          tier: 'TIER_2', // default/simulated
          facilityType: 'HOSPITAL',
          specialties: ['General Medicine'],
        },
      });

      // 6. Update facility record with newly computed PII score details
      await prisma.facility.update({
        where: { id: input.facilityId },
        data: {
          piiScore: scoringResult.piiScore,
          trustScore: scoringResult.dimensions.trust.score,
          operationalScore: scoringResult.dimensions.operational.score,
          billingStabilityScore: scoringResult.dimensions.billingStability.score,
          clinicalQualityScore: scoringResult.dimensions.clinicalQuality.score,
          patientExperienceScore: scoringResult.dimensions.patientExperience.score,
          fraudRiskScore: scoringResult.dimensions.fraudRisk.score,
          scoreUpdatedAt: new Date(),
        },
      });

      // 7. Write run history record
      await prisma.scoreHistory.create({
        data: {
          facilityId: input.facilityId,
          piiScore: scoringResult.piiScore,
          trustScore: scoringResult.dimensions.trust.score,
          operationalScore: scoringResult.dimensions.operational.score,
          billingStabilityScore: scoringResult.dimensions.billingStability.score,
          clinicalQualityScore: scoringResult.dimensions.clinicalQuality.score,
          patientExperienceScore: scoringResult.dimensions.patientExperience.score,
          fraudRiskScore: scoringResult.dimensions.fraudRisk.score,
          snapshotReason: 'triggered_research',
        },
      });

      return this.createOutput(
        input,
        'success',
        [],
        Date.now() - startTime,
        undefined,
        { scoringResult: scoringResult as any }
      );
    } catch (err: unknown) {
      console.error(`[Orchestrator] Run failed: ${String(err)}`);
      return this.createOutput(input, 'failed', [], Date.now() - startTime, String(err));
    }
  }
}
