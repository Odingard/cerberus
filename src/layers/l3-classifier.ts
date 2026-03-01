/**
 * Layer 3 — Outbound Intent Classifier
 *
 * Before any network/email/webhook call: checks if output
 * correlates with untrusted-origin content.
 * Emits: EXFILTRATION_RISK signal.
 *
 * Depends on: src/types/signals.ts
 */

export {};
