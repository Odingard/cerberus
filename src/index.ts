/**
 * @cerberus/core — Agentic AI Runtime Security Platform
 *
 * Detects, correlates, and interrupts the Lethal Trifecta attack pattern
 * across all agentic AI systems.
 *
 * Usage:
 *   import { guard } from '@cerberus/core';
 *   const guarded = guard(myToolExecutors, config, outboundTools);
 */

export type {
  TrustLevel,
  TurnId,
  SessionId,
  PrivilegedDataSignal,
  UntrustedTokensSignal,
  ExfiltrationRiskSignal,
  ContaminatedMemorySignal,
  DetectionSignal,
  RiskVector,
  RiskAction,
  RiskAssessment,
  AlertMode,
  LogDestination,
  CerberusConfig,
  ToolCallContext,
} from './types/index.js';

export { guard } from './middleware/wrap.js';
export type { GuardResult } from './middleware/wrap.js';
export type { ToolExecutorFn } from './engine/interceptor.js';
