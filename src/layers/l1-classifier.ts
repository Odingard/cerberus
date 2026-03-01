/**
 * Layer 1 — Data Source Classifier
 *
 * Tags every tool call by data trust level at access time.
 * When a tool classified as 'trusted' is invoked, L1 extracts
 * field names and sensitive values from the result and emits
 * a PRIVILEGED_DATA_ACCESSED signal.
 *
 * Generic: not hardcoded to any specific tool. Trust classification
 * comes entirely from CerberusConfig.trustOverrides.
 */

import type { TrustLevel, PrivilegedDataSignal } from '../types/signals.js';
import type { TrustOverride } from '../types/config.js';
import type { ToolCallContext } from '../types/context.js';
import type { DetectionSession } from '../engine/session.js';

/** Regex patterns for extracting sensitive values from text. */
const EMAIL_PATTERN = /[\w.+-]+@[\w.-]+\.\w+/gi;
const SSN_PATTERN = /\d{3}-\d{2}-\d{4}/g;
const PHONE_PATTERN = /\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?(?:\d{3}[-.\s]?)?\d{4}/g;

/**
 * Resolve the trust level for a tool name from config overrides.
 * Returns 'unknown' if the tool has no override.
 */
export function resolveTrustLevel(
  toolName: string,
  trustOverrides: readonly TrustOverride[],
): TrustLevel {
  const override = trustOverrides.find((o) => o.toolName === toolName);
  if (!override) {
    return 'unknown';
  }
  return override.trustLevel;
}

/**
 * Extract field names from a tool result string.
 * Attempts JSON parsing first; falls back to regex-based field detection.
 */
export function extractFieldNames(resultText: string): readonly string[] {
  const fields = new Set<string>();

  try {
    const parsed: unknown = JSON.parse(resultText);
    collectKeysFromValue(parsed, fields);
  } catch {
    // Fallback: regex for common field name patterns in non-JSON text
    const fieldPattern = /\b(email|ssn|phone|name|address|balance|account|id|notes)\b/gi;
    let match: RegExpExecArray | null = fieldPattern.exec(resultText);
    while (match) {
      fields.add(match[1].toLowerCase());
      match = fieldPattern.exec(resultText);
    }
  }

  return [...fields].sort();
}

/** Recursively collect keys from a parsed JSON value. */
function collectKeysFromValue(value: unknown, keys: Set<string>): void {
  if (value === null || value === undefined || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectKeysFromValue(item, keys);
    }
    return;
  }

  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    keys.add(key);
    // Recurse one level for nested objects (not arrays of primitives)
    const child = obj[key];
    if (child !== null && typeof child === 'object') {
      collectKeysFromValue(child, keys);
    }
  }
}

/**
 * Extract PII-like values from a tool result.
 * Looks for patterns matching emails, SSNs, and phone numbers.
 */
export function extractSensitiveValues(resultText: string): readonly string[] {
  const values = new Set<string>();

  const emails = resultText.match(EMAIL_PATTERN);
  if (emails) {
    for (const e of emails) values.add(e.toLowerCase());
  }

  const ssns = resultText.match(SSN_PATTERN);
  if (ssns) {
    for (const s of ssns) values.add(s);
  }

  const phones = resultText.match(PHONE_PATTERN);
  if (phones) {
    for (const p of phones) values.add(p.trim());
  }

  return [...values];
}

/**
 * Classify a tool call's data source trust level.
 * Returns a PrivilegedDataSignal if the tool is classified as trusted.
 * Also updates session state with accessed field names and PII values.
 */
export function classifyDataSource(
  ctx: ToolCallContext,
  trustOverrides: readonly TrustOverride[],
  session: DetectionSession,
): PrivilegedDataSignal | null {
  const trustLevel = resolveTrustLevel(ctx.toolName, trustOverrides);

  if (trustLevel !== 'trusted') {
    return null;
  }

  const fields = extractFieldNames(ctx.toolResult);
  const sensitiveValues = extractSensitiveValues(ctx.toolResult);

  // Update session state
  for (const field of fields) {
    session.accessedFields.add(field);
  }
  for (const value of sensitiveValues) {
    session.privilegedValues.add(value.toLowerCase());
  }
  session.trustedSourcesAccessed.add(ctx.toolName);

  return {
    layer: 'L1',
    signal: 'PRIVILEGED_DATA_ACCESSED',
    turnId: ctx.turnId,
    source: ctx.toolName,
    fields,
    trustLevel: 'trusted',
    timestamp: ctx.timestamp,
  };
}
