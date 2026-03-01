/**
 * Correlation Engine — Turn-level risk aggregation.
 *
 * Aggregates all detection layer signals for a given turn into a
 * RiskAssessment. Computes the 4-bit risk vector, scores it (0-4),
 * and maps the score to an action based on CerberusConfig.
 */

import type {
  TurnId,
  DetectionSignal,
  RiskVector,
  RiskAction,
  RiskAssessment,
} from '../types/signals.js';
import type { CerberusConfig } from '../types/config.js';

/** Default risk score threshold to trigger the configured alert mode. */
const DEFAULT_THRESHOLD = 3;

/**
 * Build the 4-bit risk vector from a set of signals.
 * Each bit is true if at least one signal from that layer is present.
 */
export function buildRiskVector(signals: readonly DetectionSignal[]): RiskVector {
  let l1 = false;
  let l2 = false;
  let l3 = false;
  let l4 = false;

  for (const signal of signals) {
    switch (signal.layer) {
      case 'L1':
        l1 = true;
        break;
      case 'L2':
        l2 = true;
        break;
      case 'L3':
        l3 = true;
        break;
      case 'L4':
        l4 = true;
        break;
    }
  }

  return { l1, l2, l3, l4 };
}

/**
 * Count the number of true bits in a risk vector (0-4).
 */
export function computeScore(vector: RiskVector): number {
  return [vector.l1, vector.l2, vector.l3, vector.l4].filter(Boolean).length;
}

/**
 * Map a risk score to an action based on config.
 *
 * If score is below the threshold, the action is 'none'.
 * If score meets or exceeds the threshold, the action is
 * the configured alertMode (default: 'alert').
 */
export function resolveAction(score: number, config: CerberusConfig): RiskAction {
  const threshold = config.threshold ?? DEFAULT_THRESHOLD;
  const alertMode = config.alertMode ?? 'alert';

  if (score < threshold) {
    return 'none';
  }

  return alertMode;
}

/**
 * Compute a risk assessment from a set of signals for a single turn.
 */
export function assessRisk(
  turnId: TurnId,
  signals: readonly DetectionSignal[],
  config: CerberusConfig,
): RiskAssessment {
  const vector = buildRiskVector(signals);
  const score = computeScore(vector);
  const action = resolveAction(score, config);

  return {
    turnId,
    vector,
    score,
    action,
    signals,
    timestamp: Date.now(),
  };
}
