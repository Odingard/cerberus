/**
 * Detection Session — Per-session state container.
 *
 * Tracks accumulated state across tool calls within a single agent session.
 * L1 writes accessed fields and PII values; L2 writes untrusted sources;
 * L3 reads both to detect exfiltration correlation.
 */

import type { SessionId, DetectionSignal } from '../types/signals.js';

/** Per-session state accumulated by detection layers. */
export interface DetectionSession {
  readonly sessionId: SessionId;

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
}

/** Create a fresh detection session. */
export function createSession(sessionId?: string): DetectionSession {
  return {
    sessionId: sessionId ?? `session-${Date.now()}`,
    accessedFields: new Set(),
    privilegedValues: new Set(),
    trustedSourcesAccessed: new Set(),
    untrustedTokenCount: 0,
    untrustedSources: new Set(),
    signalsByTurn: new Map(),
    turnCounter: 0,
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

/** Reset all session state for reuse between runs. */
export function resetSession(session: DetectionSession): void {
  session.accessedFields.clear();
  session.privilegedValues.clear();
  session.trustedSourcesAccessed.clear();
  session.untrustedTokenCount = 0;
  session.untrustedSources.clear();
  session.signalsByTurn.clear();
  session.turnCounter = 0;
}
