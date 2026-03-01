/**
 * Layer 3 — Outbound Intent Classifier
 *
 * For outbound tool calls (tools that send data externally), checks
 * if the outbound content correlates with privileged data that L1
 * previously observed. This is the core exfiltration detector.
 *
 * L3 reads session state accumulated by L1 (privilegedValues) to detect
 * when PII flows out through an untrusted channel.
 */

import type { ExfiltrationRiskSignal } from '../types/signals.js';
import type { ToolCallContext } from '../types/context.js';
import type { DetectionSession } from '../engine/session.js';

/** Destination field names to look for in tool arguments. */
const DESTINATION_FIELDS = ['recipient', 'to', 'destination', 'url', 'endpoint', 'webhook'];

/**
 * Classify whether this tool call is an exfiltration attempt.
 * Only runs for tools listed in outboundTools. Checks correlation
 * between tool arguments and previously accessed privileged data.
 */
export function classifyOutboundIntent(
  ctx: ToolCallContext,
  session: DetectionSession,
  outboundTools: readonly string[],
): ExfiltrationRiskSignal | null {
  if (!isOutboundTool(ctx.toolName, outboundTools)) {
    return null;
  }

  if (session.privilegedValues.size === 0) {
    return null;
  }

  const outboundText = serializeArguments(ctx.toolArguments);
  const { score, matchedFields } = computeSimilarityScore(outboundText, session.privilegedValues);

  if (matchedFields.length === 0) {
    return null;
  }

  const destination = extractDestination(ctx.toolArguments);

  return {
    layer: 'L3',
    signal: 'EXFILTRATION_RISK',
    turnId: ctx.turnId,
    matchedFields,
    destination,
    similarityScore: score,
    timestamp: ctx.timestamp,
  };
}

/**
 * Determine if a tool is outbound based on explicit configuration.
 */
export function isOutboundTool(toolName: string, outboundTools: readonly string[]): boolean {
  return outboundTools.includes(toolName);
}

/**
 * Compute similarity score between outbound content and privileged values.
 * Uses case-insensitive substring matching.
 * Returns a score between 0 and 1 indicating the fraction of
 * privileged values found in the outbound text.
 */
export function computeSimilarityScore(
  outboundText: string,
  privilegedValues: ReadonlySet<string>,
): { score: number; matchedFields: readonly string[] } {
  if (privilegedValues.size === 0) {
    return { score: 0, matchedFields: [] };
  }

  const lowerText = outboundText.toLowerCase();
  const matched: string[] = [];

  for (const value of privilegedValues) {
    if (lowerText.includes(value.toLowerCase())) {
      matched.push(value);
    }
  }

  return {
    score: matched.length / privilegedValues.size,
    matchedFields: matched,
  };
}

/**
 * Extract destination from tool arguments.
 * Looks for common destination field names.
 */
export function extractDestination(args: Record<string, unknown>): string {
  for (const field of DESTINATION_FIELDS) {
    const value = args[field];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }
  return 'unknown';
}

/**
 * Recursively serialize all string values from tool arguments
 * into a single string for PII scanning.
 */
export function serializeArguments(args: Record<string, unknown>): string {
  const parts: string[] = [];
  collectStrings(args, parts);
  return parts.join(' ');
}

/** Recursively collect string values from a nested structure. */
function collectStrings(value: unknown, parts: string[]): void {
  if (typeof value === 'string') {
    parts.push(value);
    return;
  }

  if (value === null || value === undefined || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, parts);
    }
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const v of Object.values(obj)) {
    collectStrings(v, parts);
  }
}
