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
import type { MemoryToolConfig } from '../layers/l4-memory.js';
import type { ContaminationGraph } from '../graph/contamination.js';
import { createContaminationGraph } from '../graph/contamination.js';
import type { ProvenanceLedger } from '../graph/ledger.js';
import { createLedger } from '../graph/ledger.js';

/** Options for L4 memory contamination tracking. */
export interface MemoryGuardOptions {
  /** Memory tool configurations (which tools are memory reads/writes). */
  readonly memoryTools?: readonly MemoryToolConfig[];
  /** Path for the SQLite provenance ledger. Default: ':memory:'. */
  readonly dbPath?: string;
}

/** The result of calling guard(): wrapped executors + session handle. */
export interface GuardResult {
  /** Wrapped tool executors with detection middleware. */
  readonly executors: Record<string, ToolExecutorFn>;
  /** Session handle for inspection (reading signals, assessments). */
  readonly session: DetectionSession;
  /** All risk assessments produced during the session. */
  readonly assessments: readonly RiskAssessment[];
  /** Reset the session state and assessments for reuse between runs. Graph/ledger persist. */
  readonly reset: () => void;
  /** Contamination graph (present when memoryTracking is enabled). */
  readonly graph?: ContaminationGraph;
  /** Provenance ledger (present when memoryTracking is enabled). */
  readonly ledger?: ProvenanceLedger;
  /** Tear down all resources (close DB, clear graph). Call when done. */
  readonly destroy: () => void;
}

/**
 * Wrap tool executors with Cerberus detection middleware.
 *
 * @param executors - Map of tool name to executor function
 * @param config - Cerberus configuration (alertMode, threshold, trustOverrides, etc.)
 * @param outboundTools - Names of tools that send data externally (for L3 detection)
 * @param memoryOptions - Optional L4 memory contamination tracking configuration
 * @returns GuardResult with wrapped executors and session handle
 *
 * @example
 * ```typescript
 * const guarded = guard(myToolExecutors, {
 *   alertMode: 'interrupt',
 *   memoryTracking: true,
 *   trustOverrides: [
 *     { toolName: 'readDatabase', trustLevel: 'trusted' },
 *     { toolName: 'fetchUrl', trustLevel: 'untrusted' },
 *   ],
 *   threshold: 3,
 * }, ['sendEmail', 'postWebhook'], {
 *   memoryTools: [
 *     { toolName: 'writeMemory', operation: 'write' },
 *     { toolName: 'readMemory', operation: 'read' },
 *   ],
 * });
 * ```
 */
export function guard(
  executors: Record<string, ToolExecutorFn>,
  config: CerberusConfig,
  outboundTools: readonly string[],
  memoryOptions?: MemoryGuardOptions,
): GuardResult {
  const session = createSession();
  const assessments: RiskAssessment[] = [];

  // Initialize L4 resources when memory tracking is enabled
  const memoryTools = memoryOptions?.memoryTools ?? [];
  const useMemory = config.memoryTracking === true && memoryTools.length > 0;

  const graph = useMemory ? createContaminationGraph() : undefined;
  const ledger = useMemory
    ? createLedger({
        ...(memoryOptions?.dbPath ? { dbPath: memoryOptions.dbPath } : {}),
      })
    : undefined;

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
      useMemory ? memoryTools : undefined,
      graph,
      ledger,
    );
  }

  // Reset clears session + assessments but preserves graph/ledger (cross-session persistence)
  const reset = (): void => {
    resetSession(session);
    assessments.length = 0;
  };

  // Destroy tears down everything including DB connection
  const destroy = (): void => {
    ledger?.close();
    graph?.clear();
  };

  return {
    executors: wrappedExecutors,
    session,
    assessments,
    reset,
    ...(graph ? { graph } : {}),
    ...(ledger ? { ledger } : {}),
    destroy,
  };
}
