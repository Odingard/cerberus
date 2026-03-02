/**
 * @cerberus-ai/core — Agentic AI Runtime Security Platform
 *
 * Detects, correlates, and interrupts the Lethal Trifecta attack pattern
 * across all agentic AI systems.
 *
 * Usage:
 *   import { guard } from '@cerberus-ai/core';
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
export type { GuardResult, MemoryGuardOptions } from './middleware/wrap.js';
export type { ToolExecutorFn } from './engine/interceptor.js';

// L4 Memory Contamination Graph exports
export type { MemoryToolConfig } from './layers/l4-memory.js';
export type { ContaminationGraph, GraphNode, GraphEdge } from './graph/contamination.js';
export type { ProvenanceLedger, ProvenanceRecord } from './graph/ledger.js';

// Framework adapters
export { guardLangChain } from './adapters/langchain.js';
export type {
  LangChainTool,
  LangChainGuardConfig,
  LangChainGuardResult,
} from './adapters/langchain.js';
export { guardVercelAI } from './adapters/vercel-ai.js';
export type {
  VercelAITool,
  VercelAIToolMap,
  VercelAIGuardConfig,
  VercelAIGuardResult,
} from './adapters/vercel-ai.js';
export { createCerberusGuardrail } from './adapters/openai-agents.js';
export type {
  GuardrailFunctionOutput,
  OpenAIAgentsGuardConfig,
  OpenAIAgentsGuardrailResult,
} from './adapters/openai-agents.js';
