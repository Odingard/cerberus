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

/** Union of all detection layer signals. */
export type DetectionSignal =
  | PrivilegedDataSignal
  | UntrustedTokensSignal
  | ExfiltrationRiskSignal
  | ContaminatedMemorySignal;

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
