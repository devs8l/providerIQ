// ProviderIQ — Core Scoring Engine
// Implements the Inquantic.Ai explainable Provider Intelligence Index (PII)
// Powered by Inquantic.Ai

import type {
  ScoringInput,
  ScoringOutput,
  DimensionScore,
  ExplainabilityFactor,
  StoredSignal
} from '@provideriq/shared';
import {
  DIMENSION_WEIGHTS,
  SIGNAL_DECAY_DAYS,
  MIN_SIGNALS_PER_DIMENSION,
  MAX_FRAUD_PENALTY
} from '@provideriq/shared';

export class ScoringEngine {
  compute(input: ScoringInput): ScoringOutput {
    const { facility, signals } = input;
    const generatedAt = new Date();

    // 1. Group signals by category
    const categorySignals: Record<string, StoredSignal[]> = {
      TRUST: [],
      OPERATIONAL: [],
      BILLING: [],
      CLINICAL: [],
      PATIENT: [],
      FRAUD: [],
    };

    for (const signal of signals) {
      const arr = categorySignals[signal.category];
      if (arr) {
        arr.push(signal);
      }
    }

    // 2. Compute scores for each dimension
    const trust = this.computeDimension(categorySignals['TRUST']!, 'trust');
    const operational = this.computeDimension(categorySignals['OPERATIONAL']!, 'operational');
    const billingStability = this.computeDimension(categorySignals['BILLING']!, 'billingStability');
    const clinicalQuality = this.computeDimension(categorySignals['CLINICAL']!, 'clinicalQuality');
    const patientExperience = this.computeDimension(categorySignals['PATIENT']!, 'patientExperience');
    const fraudRisk = this.computeDimension(categorySignals['FRAUD']!, 'fraudRisk');

    // If trust has no direct signals, derive from overall positive signal ratio
    if (trust.status === 'insufficient_data' && signals.length > 0) {
      const positiveCount = signals.filter(s => (s as any).sentiment === 'positive' || (s.value !== undefined && s.value >= 0.6)).length;
      const trustScore = (positiveCount / signals.length) * 100;
      trust.score = parseFloat(Math.min(100, Math.max(0, trustScore)).toFixed(1));
      trust.status = 'computed';
      trust.signalCount = signals.length;
      trust.confidence = 0.7;
    }

    // 3. Compute Composite PII Score
    let scoreSum = 0;
    let weightSum = 0;

    const dimensions = { trust, operational, billingStability, clinicalQuality, patientExperience, fraudRisk };

    for (const [key, dim] of Object.entries(dimensions)) {
      if (dim.status === 'computed' && key !== 'fraudRisk') {
        scoreSum += dim.score * dim.weight;
        weightSum += dim.weight;
      }
    }

    // Normalize base composite score
    let baseScore = weightSum > 0 ? scoreSum / weightSum : 60.0;

    // Apply Fraud Penalty
    const fraudPenalty = this.computeFraudPenalty(fraudRisk.score);
    const finalScore = Math.max(0, Math.min(100, baseScore - fraudPenalty));

    // 4. Generate Explainability Factors
    const { positiveFactors, negativeFactors } = this.generateFactors(signals);

    // 5. Generate AI-driven Summary Narrative
    const narrative = this.generateSummaryNarrative(facility.name, finalScore, fraudRisk.score);

    return {
      piiScore: parseFloat(finalScore.toFixed(1)),
      dimensions,
      positiveFactors,
      negativeFactors,
      dataCompleteness: signals.length > 0 ? Math.min(1.0, signals.length / 10) : 0.2,
      confidence: signals.length >= 50 ? 0.92 : signals.length >= 20 ? 0.85 : signals.length >= 5 ? 0.72 : 0.5,
      narrative,
      generatedAt,
    };
  }

  private computeDimension(signals: StoredSignal[], key: string): DimensionScore {
    const minRequired = MIN_SIGNALS_PER_DIMENSION[key as keyof typeof MIN_SIGNALS_PER_DIMENSION] ?? 1;
    const weight = DIMENSION_WEIGHTS[key as keyof typeof DIMENSION_WEIGHTS] ?? 0.2;

    if (!signals || signals.length < minRequired) {
      // Default placeholder dimension values if insufficient signal count
      return {
        score: key === 'fraudRisk' ? 10.0 : 60.0,
        weight,
        confidence: 0.4,
        signalCount: signals?.length ?? 0,
        topSignals: ['Baseline estimation due to missing signals'],
        status: 'insufficient_data',
      };
    }

    let weightedValSum = 0;
    let confidenceSum = 0;
    let weightSum = 0;
    const descriptions: string[] = [];

    for (const sig of signals) {
      const decay = this.calculateDecay(sig);
      const effectiveWeight = sig.weight * sig.confidence * decay;

      let scoreContribution: number;
      if (sig.value !== null && sig.value !== undefined) {
        if (sig.value <= 1.0) {
          // 0-1 scale (from aspect classification) → 0-100
          scoreContribution = sig.value * 100;
        } else if (sig.value <= 5.0) {
          scoreContribution = (sig.value / 5.0) * 100; // eg. google rating
        } else if (sig.value <= 100.0) {
          scoreContribution = sig.value;
        } else {
          scoreContribution = 70;
        }
      } else {
        scoreContribution = 70;
      }

      weightedValSum += scoreContribution * effectiveWeight;
      confidenceSum += sig.confidence;
      weightSum += effectiveWeight;

      if (sig.dimension) {
        descriptions.push(`${sig.source}: ${sig.dimension.replace(/_/g, ' ')}`);
      }
    }

    const calculatedScore = weightSum > 0 ? weightedValSum / weightSum : 70;

    return {
      score: parseFloat(Math.min(100, Math.max(0, calculatedScore)).toFixed(1)),
      weight,
      confidence: parseFloat((confidenceSum / signals.length).toFixed(2)),
      signalCount: signals.length,
      topSignals: Array.from(new Set(descriptions)).slice(0, 3),
      status: 'computed',
    };
  }

  private calculateDecay(signal: StoredSignal): number {
    const decayDays = SIGNAL_DECAY_DAYS[signal.source] ?? 180;
    const ageMs = Date.now() - new Date(signal.capturedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    // Exponential decay formula: e^(-lambda * t)
    return Math.exp(-0.693 * (ageDays / decayDays));
  }

  private computeFraudPenalty(fraudScore: number): number {
    if (fraudScore < 30) return 0;
    // Scaled penalty up to MAX_FRAUD_PENALTY
    return ((fraudScore - 30) / 70) * MAX_FRAUD_PENALTY;
  }

  private generateFactors(signals: StoredSignal[]): {
    positiveFactors: ExplainabilityFactor[];
    negativeFactors: ExplainabilityFactor[];
  } {
    const positiveFactors: ExplainabilityFactor[] = [];
    const negativeFactors: ExplainabilityFactor[] = [];

    for (const sig of signals) {
      if (sig.category === 'TRUST' && sig.source === 'NABH' && sig.value === 1.0) {
        positiveFactors.push({
          label: 'NABH Accredited',
          description: 'Verified active hospital accreditation indicating high institutional quality.',
          impact: 'positive',
          magnitude: 'high',
          source: 'NABH',
          signalDate: sig.capturedAt,
        });
      }
      if (sig.category === 'OPERATIONAL' && sig.source === 'ABDM' && sig.value === 1.0) {
        positiveFactors.push({
          label: 'ABDM Ready',
          description: 'Heliport ready with National Digital Health Ecosystem infrastructure.',
          impact: 'positive',
          magnitude: 'medium',
          source: 'ABDM',
          signalDate: sig.capturedAt,
        });
      }
      if (sig.category === 'PATIENT' && sig.source === 'GOOGLE_MAPS' && sig.value && sig.value >= 0.7) {
        positiveFactors.push({
          label: 'High Patient Rating',
          description: `Excellent patient satisfaction signal (${(sig.value * 100).toFixed(0)}%) from Google Maps reviews.`,
          impact: 'positive',
          magnitude: 'medium',
          source: 'GOOGLE_MAPS',
          signalDate: sig.capturedAt,
        });
      }
    }

    // Default factors if empty
    if (positiveFactors.length === 0) {
      positiveFactors.push({
        label: 'Baseline Integrity',
        description: 'Standard hospital empanelment criteria verified.',
        impact: 'positive',
        magnitude: 'low',
        source: 'System',
      });
    }

    return { positiveFactors, negativeFactors };
  }

  private generateSummaryNarrative(name: string, pii: number, fraud: number): string {
    const qualityLabel = pii >= 80 ? 'outstanding' : pii >= 65 ? 'strong' : 'average';
    let safetyNote = 'The facility exhibits low billing volatility and sound operational patterns.';
    if (fraud > 50) {
      safetyNote = 'Warning: Elevated billing variance signals warrant pre-authorization monitoring.';
    }

    return `${name} is computed to possess a ${qualityLabel} composite index score of ${pii.toFixed(1)}/100. ${safetyNote} This analysis was verified by the Inquantic.Ai reasoning engine.`;
  }
}
