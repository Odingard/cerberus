/**
 * Detection Session — Per-session state container.
 *
 * Tracks accumulated state across tool calls within a single agent session.
 * L1 writes accessed fields and PII values; L2 writes untrusted sources;
 * L3 reads both to detect exfiltration correlation.
 */

import type { SessionId, DetectionSignal } from '../types/signals.js';

/** Monotonic counter to guarantee unique session IDs even within the same millisecond. */
let sessionSeq = 0;

/** Generate a unique session ID. */
function generateSessionId(): SessionId {
  return `session-${Date.now()}-${String(sessionSeq++)}`;
}

/** Per-session state accumulated by detection layers. */
export interface DetectionSession {
  /** Unique session identifier. Rotated on reset() for L4 cross-session detection. */
  sessionId: SessionId;

  /** Field names accessed from privileged/trusted data sources (set by L1). */
  readonly accessedFields: Set<string>;

  /** Raw PII values seen in tool results, lowercased for matching (set by L1). */
  readonly privilegedValues: Set<string>;

  /** Tool names classified as trusted that have been accessed. */
  readonly trustedSourcesAccessed: Set<string>;

  /** Total untrusted token count accumulated (set by L2). */
  untrustedTokenCount: number;

  /** Sources of untrusted content that entered the context (set by L2). */
  readonly untrustedSources: Set<string>;

  /** All signals emitted during this session, indexed by turnId. */
  readonly signalsByTurn: Map<string, DetectionSignal[]>;

  /** Turn counter for generating sequential turn IDs. */
  turnCounter: number;

  /** Secrets/credentials detected in tool results (set by secrets detector). */
  readonly detectedSecrets: Set<string>;

  /** Injection pattern categories found in untrusted content (set by injection scanner). */
  readonly injectionPatternsFound: Set<string>;

  /** Tool call history for behavioral drift detection. */
  readonly toolCallHistory: Array<{ toolName: string; turnId: string; timestamp: number }>;
}

/** Create a fresh detection session. */
export function createSession(sessionId?: string): DetectionSession {
  return {
    sessionId: sessionId ?? generateSessionId(),
    accessedFields: new Set(),
    privilegedValues: new Set(),
    trustedSourcesAccessed: new Set(),
    untrustedTokenCount: 0,
    untrustedSources: new Set(),
    signalsByTurn: new Map(),
    turnCounter: 0,
    detectedSecrets: new Set(),
    injectionPatternsFound: new Set(),
    toolCallHistory: [],
  };
}

/** Record a signal into the session's per-turn signal store. */
export function recordSignal(session: DetectionSession, signal: DetectionSignal): void {
  const turnSignals = session.signalsByTurn.get(signal.turnId);
  if (turnSignals) {
    turnSignals.push(signal);
  } else {
    session.signalsByTurn.set(signal.turnId, [signal]);
  }
}

/** Reset all session state for reuse between runs. Rotates sessionId for L4 cross-session detection. */
export function resetSession(session: DetectionSession): void {
  session.sessionId = generateSessionId();
  session.accessedFields.clear();
  session.privilegedValues.clear();
  session.trustedSourcesAccessed.clear();
  session.untrustedTokenCount = 0;
  session.untrustedSources.clear();
  session.signalsByTurn.clear();
  session.turnCounter = 0;
  session.detectedSecrets.clear();
  session.injectionPatternsFound.clear();
  session.toolCallHistory.length = 0;
}
