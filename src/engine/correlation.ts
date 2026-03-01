/**
 * Correlation Engine — Turn-level risk aggregation.
 *
 * Aggregates all 4 layer signals per execution turn into a risk score.
 * Score >= 3: ALERT. Score = 4: INTERRUPT outbound call.
 *
 * Depends on: src/types/signals.ts
 */

export {};
