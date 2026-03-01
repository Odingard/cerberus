/**
 * Interceptor — Tool call wrapper with detection pipeline.
 *
 * Wraps a single tool executor. Runs L1, L2, L3 after tool execution,
 * feeds signals to the Correlation Engine, and can block the result
 * if the action is 'interrupt'.
 */

import type { CerberusConfig } from '../types/config.js';
import type { DetectionSignal, RiskAssessment } from '../types/signals.js';
import type { ToolCallContext } from '../types/context.js';
import type { DetectionSession } from './session.js';
import { recordSignal } from './session.js';
import { classifyDataSource, resolveTrustLevel } from '../layers/l1-classifier.js';
import { tagTokenProvenance } from '../layers/l2-tagger.js';
import { classifyOutboundIntent } from '../layers/l3-classifier.js';
import { checkMemoryContamination } from '../layers/l4-memory.js';
import type { MemoryToolConfig } from '../layers/l4-memory.js';
import type { ContaminationGraph } from '../graph/contamination.js';
import type { ProvenanceLedger } from '../graph/ledger.js';
import { assessRisk } from './correlation.js';

/** Generic tool executor function signature. */
export type ToolExecutorFn = (args: Record<string, unknown>) => Promise<string>;

/** Callback invoked with the full risk assessment after each tool call. */
export type OnFullAssessmentCallback = (assessment: RiskAssessment) => void;

/**
 * Create an intercepted version of a tool executor.
 *
 * The returned function has the same signature as the original executor
 * but runs the detection pipeline around it:
 * 1. Execute the tool
 * 2. Run L1 (data source classification)
 * 3. Run L2 (token provenance tagging)
 * 4. Run L3 (outbound intent classification)
 * 5. Correlate signals into a risk assessment
 * 6. If action='interrupt', return a blocked message instead of the real result
 */
export function interceptToolCall(
  toolName: string,
  executor: ToolExecutorFn,
  session: DetectionSession,
  config: CerberusConfig,
  outboundTools: readonly string[],
  onFullAssessment?: OnFullAssessmentCallback,
  memoryTools?: readonly MemoryToolConfig[],
  graph?: ContaminationGraph,
  ledger?: ProvenanceLedger,
): ToolExecutorFn {
  const trustOverrides = config.trustOverrides ?? [];

  return async (args: Record<string, unknown>): Promise<string> => {
    // Generate turn ID
    const turnIndex = session.turnCounter;
    session.turnCounter += 1;
    const turnId = `turn-${String(turnIndex).padStart(3, '0')}`;

    // Execute the tool
    const result = await executor(args);

    // Build context for detection layers
    const ctx: ToolCallContext = {
      turnId,
      sessionId: session.sessionId,
      toolName,
      toolArguments: args,
      toolResult: result,
      timestamp: Date.now(),
    };

    // Run detection layers and collect signals
    const signals: DetectionSignal[] = [];

    const l1Signal = classifyDataSource(ctx, trustOverrides, session);
    if (l1Signal) {
      signals.push(l1Signal);
      recordSignal(session, l1Signal);
    }

    const l2Signal = tagTokenProvenance(ctx, trustOverrides, session);
    if (l2Signal) {
      signals.push(l2Signal);
      recordSignal(session, l2Signal);
    }

    const l3Signal = classifyOutboundIntent(ctx, session, outboundTools);
    if (l3Signal) {
      signals.push(l3Signal);
      recordSignal(session, l3Signal);
    }

    // L4: Memory contamination detection (optional — skip if not configured)
    if (graph && ledger && memoryTools && memoryTools.length > 0) {
      const trustLevel = resolveTrustLevel(toolName, trustOverrides);
      const l4Signal = checkMemoryContamination(ctx, memoryTools, graph, ledger, trustLevel);
      if (l4Signal) {
        signals.push(l4Signal);
        recordSignal(session, l4Signal);
      }
    }

    // Correlate signals into a risk assessment
    const assessment = assessRisk(turnId, signals, config);

    // Invoke callbacks
    onFullAssessment?.(assessment);
    config.onAssessment?.({
      turnId: assessment.turnId,
      score: assessment.score,
      action: assessment.action,
    });

    // If action is interrupt, return blocked message
    if (assessment.action === 'interrupt') {
      return `[Cerberus] Tool call blocked — risk score ${String(assessment.score)}/4`;
    }

    return result;
  };
}
