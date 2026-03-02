/**
 * Core signal and risk vector types for the Cerberus detection platform.
 *
 * Every detection layer emits a typed signal. The correlation engine
 * aggregates these signals into a per-turn risk vector.
 */

/** Trust level assigned to data sources and context tokens. */
export type TrustLevel = 'trusted' | 'untrusted' | 'unknown';

/** Unique identifier for an execution turn within an agent session. */
export type TurnId = string;

/** Unique identifier for a session. */
export type SessionId = string;

/** L1 signal — emitted when a tool accesses a data source. */
export interface PrivilegedDataSignal {
  readonly layer: 'L1';
  readonly signal: 'PRIVILEGED_DATA_ACCESSED';
  readonly turnId: TurnId;
  readonly source: string;
  readonly fields: readonly string[];
  readonly trustLevel: TrustLevel;
  readonly timestamp: number;
}

/** L2 signal — emitted when untrusted tokens enter the LLM context. */
export interface UntrustedTokensSignal {
  readonly layer: 'L2';
  readonly signal: 'UNTRUSTED_TOKENS_IN_CONTEXT';
  readonly turnId: TurnId;
  readonly source: string;
  readonly tokenCount: number;
  readonly trustLevel: TrustLevel;
  readonly timestamp: number;
}

/** L3 signal — emitted when outbound content correlates with untrusted input. */
export interface ExfiltrationRiskSignal {
  readonly layer: 'L3';
  readonly signal: 'EXFILTRATION_RISK';
  readonly turnId: TurnId;
  readonly matchedFields: readonly string[];
  readonly destination: string;
  readonly similarityScore: number;
  readonly timestamp: number;
}

/** L4 signal — emitted when contaminated memory influences an action. */
export interface ContaminatedMemorySignal {
  readonly layer: 'L4';
  readonly signal: 'CONTAMINATED_MEMORY_ACTIVE';
  readonly turnId: TurnId;
  readonly sessionId: SessionId;
  readonly nodeId: string;
  readonly contaminationSource: string;
  readonly timestamp: number;
}

/** Sub-classifier signal — secrets/credentials detected in tool results (enhances L1). */
export interface SecretsDetectedSignal {
  readonly layer: 'L1';
  readonly signal: 'SECRETS_DETECTED';
  readonly turnId: TurnId;
  readonly secretTypes: readonly string[];
  readonly count: number;
  readonly timestamp: number;
}

/** Sub-classifier signal — prompt injection patterns in untrusted content (enhances L2). */
export interface InjectionPatternsSignal {
  readonly layer: 'L2';
  readonly signal: 'INJECTION_PATTERNS_DETECTED';
  readonly turnId: TurnId;
  readonly patternsFound: readonly string[];
  readonly confidence: number;
  readonly timestamp: number;
}

/** Sub-classifier signal — encoded/obfuscated content in untrusted input (enhances L2). */
export interface EncodingDetectedSignal {
  readonly layer: 'L2';
  readonly signal: 'ENCODING_DETECTED';
  readonly turnId: TurnId;
  readonly encodingTypes: readonly string[];
  readonly decodedSnippet?: string;
  readonly timestamp: number;
}

/** Sub-classifier signal — suspicious destination in outbound call (enhances L3). */
export interface SuspiciousDestinationSignal {
  readonly layer: 'L3';
  readonly signal: 'SUSPICIOUS_DESTINATION';
  readonly turnId: TurnId;
  readonly destination: string;
  readonly riskFactors: readonly string[];
  readonly domainRisk: 'low' | 'medium' | 'high';
  readonly timestamp: number;
}

/** Sub-classifier signal — MCP tool description poisoning detected (enhances L2). */
export interface ToolPoisoningSignal {
  readonly layer: 'L2';
  readonly signal: 'TOOL_POISONING_DETECTED';
  readonly turnId: TurnId;
  readonly toolName: string;
  readonly patternsFound: readonly string[];
  readonly severity: 'low' | 'medium' | 'high';
  readonly timestamp: number;
}

/** Sub-classifier signal — behavioral drift after untrusted content (enhances L2/L3). */
export interface BehavioralDriftSignal {
  readonly layer: 'L2' | 'L3';
  readonly signal: 'BEHAVIORAL_DRIFT_DETECTED';
  readonly turnId: TurnId;
  readonly driftType: string;
  readonly evidence: string;
  readonly timestamp: number;
}

/** Tool description for MCP scanner. */
export interface ToolDescription {
  readonly name: string;
  readonly description: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

/** Result from standalone MCP tool description scan. */
export interface ToolPoisoningResult {
  readonly toolName: string;
  readonly poisoned: boolean;
  readonly patternsFound: readonly string[];
  readonly severity: 'low' | 'medium' | 'high';
}

/** Union of all detection layer signals. */
export type DetectionSignal =
  | PrivilegedDataSignal
  | UntrustedTokensSignal
  | ExfiltrationRiskSignal
  | ContaminatedMemorySignal
  | SecretsDetectedSignal
  | InjectionPatternsSignal
  | EncodingDetectedSignal
  | SuspiciousDestinationSignal
  | ToolPoisoningSignal
  | BehavioralDriftSignal;

/** 4-bit risk vector — one boolean per detection layer. */
export interface RiskVector {
  readonly l1: boolean;
  readonly l2: boolean;
  readonly l3: boolean;
  readonly l4: boolean;
}

/** Computed risk score (0-4) with the action to take. */
export type RiskAction = 'none' | 'log' | 'alert' | 'interrupt';

/** Turn-level risk assessment produced by the correlation engine. */
export interface RiskAssessment {
  readonly turnId: TurnId;
  readonly vector: RiskVector;
  readonly score: number;
  readonly action: RiskAction;
  readonly signals: readonly DetectionSignal[];
  readonly timestamp: number;
}
