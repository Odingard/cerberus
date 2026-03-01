/**
 * Developer-facing API — cerberus.guard() entry point.
 *
 * Wraps tool executors with the Cerberus detection pipeline.
 * Each tool call passes through L1, L2, L3, and the Correlation Engine.
 * The guard function manages session state and assessment collection.
 */

import type { CerberusConfig } from '../types/config.js';
import type { RiskAssessment } from '../types/signals.js';
import type { DetectionSession } from '../engine/session.js';
import { createSession, resetSession } from '../engine/session.js';
import { interceptToolCall } from '../engine/interceptor.js';
import type { ToolExecutorFn } from '../engine/interceptor.js';

/** The result of calling guard(): wrapped executors + session handle. */
export interface GuardResult {
  /** Wrapped tool executors with detection middleware. */
  readonly executors: Record<string, ToolExecutorFn>;
  /** Session handle for inspection (reading signals, assessments). */
  readonly session: DetectionSession;
  /** All risk assessments produced during the session. */
  readonly assessments: readonly RiskAssessment[];
  /** Reset the session state and assessments for reuse between runs. */
  readonly reset: () => void;
}

/**
 * Wrap tool executors with Cerberus detection middleware.
 *
 * @param executors - Map of tool name to executor function
 * @param config - Cerberus configuration (alertMode, threshold, trustOverrides, etc.)
 * @param outboundTools - Names of tools that send data externally (for L3 detection)
 * @returns GuardResult with wrapped executors and session handle
 *
 * @example
 * ```typescript
 * const guarded = guard(myToolExecutors, {
 *   alertMode: 'interrupt',
 *   trustOverrides: [
 *     { toolName: 'readDatabase', trustLevel: 'trusted' },
 *     { toolName: 'fetchUrl', trustLevel: 'untrusted' },
 *   ],
 *   threshold: 3,
 * }, ['sendEmail', 'postWebhook']);
 * ```
 */
export function guard(
  executors: Record<string, ToolExecutorFn>,
  config: CerberusConfig,
  outboundTools: readonly string[],
): GuardResult {
  const session = createSession();
  const assessments: RiskAssessment[] = [];

  const wrappedExecutors: Record<string, ToolExecutorFn> = {};

  for (const [toolName, executor] of Object.entries(executors)) {
    wrappedExecutors[toolName] = interceptToolCall(
      toolName,
      executor,
      session,
      config,
      outboundTools,
      (assessment) => {
        assessments.push(assessment);
      },
    );
  }

  const reset = (): void => {
    resetSession(session);
    assessments.length = 0;
  };

  return {
    executors: wrappedExecutors,
    session,
    assessments,
    reset,
  };
}
