/**
 * @cerberus/core — Agentic AI Runtime Security Platform
 *
 * Detects, correlates, and interrupts the Lethal Trifecta attack pattern
 * across all agentic AI systems.
 *
 * Usage:
 *   import { cerberus } from '@cerberus/core';
 *   const securedAgent = cerberus.guard(myAgent, { alertMode: 'interrupt' });
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
} from './types/index.js';
