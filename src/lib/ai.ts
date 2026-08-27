/**
 * Provider-agnostic AI layer.
 * Calculations stay deterministic. An LLM is never used for volume, risk, or forecasts.
 */
export type AiInsightView = {
  kind: string;
  title: string;
  severity?: string | null;
  patientPublicId?: string | null;
  observation: string;
  dataSummary: string;
  insight: string;
  recommendation: string;
  confidence?: string | null;
  source: string;
  requiresHumanReview: boolean;
};

export interface AiProvider {
  readonly name: string;
  explain?(prompt: string): Promise<string>;
}

export class DeterministicSupportProvider implements AiProvider {
  readonly name = "deterministic-clinical-support";
}

export function getAiProvider(): AiProvider {
  // AI_API_KEY is reserved for a future natural-language provider.
  // Insights in this MVP are computed from SQL and statistical rules.
  void process.env.AI_API_KEY;
  return new DeterministicSupportProvider();
}
