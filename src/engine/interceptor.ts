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
import { detectSecretsInResult } from '../classifiers/secrets-detector.js';
import { scanInjectionInResult } from '../classifiers/injection-scanner.js';
import { detectEncodingInResult } from '../classifiers/encoding-detector.js';
import { classifyOutboundDomain } from '../classifiers/domain-classifier.js';
import { checkToolCallPoisoning } from '../classifiers/mcp-scanner.js';
import { detectBehavioralDrift } from '../classifiers/drift-detector.js';
import { detectInjectionCorrelatedOutbound } from '../classifiers/outbound-correlator.js';
import { recordToolCall } from '../telemetry/otel.js';

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
 * 2. Run L1 (data source classification) → Secrets Detector
 * 3. Run L2 (token provenance tagging) → Injection Scanner + Encoding Detector + MCP Scanner
 * 4. Run L3 (outbound intent classification) → Domain Classifier → Outbound Correlator
 * 5. Run L4 (memory contamination — optional)
 * 6. Run Behavioral Drift Detector
 * 7. Correlate signals into a risk assessment
 * 8. If action='interrupt', return a blocked message instead of the real result
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

    // Record wall time including tool execution (used for OTel span)
    const startMs = Date.now();

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
    const trustLevel = resolveTrustLevel(toolName, trustOverrides);
    const isTrusted = trustLevel === 'trusted';
    const isUntrusted = trustLevel === 'untrusted';

    // L1: Data source classification
    const l1Signal = classifyDataSource(ctx, trustOverrides, session);
    if (l1Signal) {
      signals.push(l1Signal);
      recordSignal(session, l1Signal);
    }

    // L1 sub-classifier: Secrets detector (runs when L1 fires)
    const secretsSignal = detectSecretsInResult(ctx, session, isTrusted);
    if (secretsSignal) {
      signals.push(secretsSignal);
      recordSignal(session, secretsSignal);
    }

    // L2: Token provenance tagging
    const l2Signal = tagTokenProvenance(ctx, trustOverrides, session);
    if (l2Signal) {
      signals.push(l2Signal);
      recordSignal(session, l2Signal);
    }

    // L2 sub-classifiers: Injection scanner + Encoding detector (run when untrusted)
    const injectionSignal = scanInjectionInResult(ctx, session, isUntrusted);
    if (injectionSignal) {
      signals.push(injectionSignal);
      recordSignal(session, injectionSignal);
    }

    const encodingSignal = detectEncodingInResult(ctx, session, isUntrusted);
    if (encodingSignal) {
      signals.push(encodingSignal);
      recordSignal(session, encodingSignal);
    }

    // L2 sub-classifier: MCP tool poisoning (runs when toolDescriptions configured)
    if (config.toolDescriptions && config.toolDescriptions.length > 0) {
      const poisoningSignal = checkToolCallPoisoning(ctx, config.toolDescriptions, session);
      if (poisoningSignal) {
        signals.push(poisoningSignal);
        recordSignal(session, poisoningSignal);
      }
    }

    // L3: Outbound intent classification
    const l3Signal = classifyOutboundIntent(
      ctx,
      session,
      outboundTools,
      config.authorizedDestinations,
    );
    if (l3Signal) {
      signals.push(l3Signal);
      recordSignal(session, l3Signal);
    }

    // L3 sub-classifier: Suspicious domain classifier (runs for outbound tools)
    const domainSignal = classifyOutboundDomain(ctx, session, outboundTools);
    if (domainSignal) {
      signals.push(domainSignal);
      recordSignal(session, domainSignal);
    }

    // L3 sub-classifier: Injection-correlated outbound detector — catches summarized/transformed
    // exfiltration where PII is not verbatim in args but context has injection + privileged data
    const correlatedOutboundSignal = detectInjectionCorrelatedOutbound(
      ctx,
      session,
      outboundTools,
      config.authorizedDestinations,
    );
    if (correlatedOutboundSignal) {
      signals.push(correlatedOutboundSignal);
      recordSignal(session, correlatedOutboundSignal);
    }

    // L4: Memory contamination detection (optional — skip if not configured)
    if (graph && ledger && memoryTools && memoryTools.length > 0) {
      const l4Signal = checkMemoryContamination(ctx, memoryTools, graph, ledger, trustLevel);
      if (l4Signal) {
        signals.push(l4Signal);
        recordSignal(session, l4Signal);
      }
    }

    // Behavioral drift detector (runs last — reads accumulated session state)
    const driftSignal = detectBehavioralDrift(
      ctx,
      session,
      outboundTools,
      isTrusted,
      config.authorizedDestinations,
    );
    if (driftSignal) {
      signals.push(driftSignal);
      recordSignal(session, driftSignal);
    }

    // Collect all session signals (including current turn) for cumulative scoring
    const allSessionSignals: DetectionSignal[] = [];
    for (const turnSignals of session.signalsByTurn.values()) {
      allSessionSignals.push(...turnSignals);
    }

    // Correlate: vector/score from cumulative session signals, turn signals for inspection
    const assessment = assessRisk(turnId, signals, config, allSessionSignals);

    // Invoke callbacks
    onFullAssessment?.(assessment);
    config.onAssessment?.({
      turnId: assessment.turnId,
      score: assessment.score,
      action: assessment.action,
    });

    // OpenTelemetry instrumentation
    if (config.opentelemetry === true) {
      recordToolCall({
        toolName,
        sessionId: session.sessionId,
        turnId,
        score: assessment.score,
        action: assessment.action,
        blocked: assessment.action === 'interrupt',
        signals: signals.map((s) => s.signal),
        durationMs: Date.now() - startMs,
      });
    }

    // If action is interrupt, return blocked message
    if (assessment.action === 'interrupt') {
      return `[Cerberus] Tool call blocked — risk score ${String(assessment.score)}/4`;
    }

    return result;
  };
}
