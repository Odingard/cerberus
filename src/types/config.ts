/**
 * Configuration types for the Cerberus platform.
 *
 * These types define the developer-facing configuration surface
 * for the cerberus.guard() API.
 */

import type { RiskAction } from './signals.js';

/** Alert mode determines the maximum action Cerberus will take. */
export type AlertMode = 'log' | 'alert' | 'interrupt';

/** Where Cerberus sends detection output. */
export type LogDestination = 'console' | 'file' | 'webhook';

/** Configuration for file-based logging. */
export interface FileLogConfig {
  readonly destination: 'file';
  readonly path: string;
}

/** Configuration for webhook-based logging. */
export interface WebhookLogConfig {
  readonly destination: 'webhook';
  readonly url: string;
  readonly headers?: Readonly<Record<string, string>>;
}

/** Configuration for console logging. */
export interface ConsoleLogConfig {
  readonly destination: 'console';
}

/** Union of all log destination configs. */
export type LogConfig = ConsoleLogConfig | FileLogConfig | WebhookLogConfig;

/** Per-tool trust override. */
export interface TrustOverride {
  readonly toolName: string;
  readonly trustLevel: 'trusted' | 'untrusted';
}

/** Main configuration for cerberus.guard(). */
export interface CerberusConfig {
  /** Maximum action Cerberus will take. Default: 'alert'. */
  readonly alertMode?: AlertMode;

  /** Enable Layer 4 memory contamination tracking. Default: false. */
  readonly memoryTracking?: boolean;

  /** Log destination configuration. Default: 'console'. */
  readonly logDestination?: LogDestination | LogConfig;

  /** Custom trust overrides for specific tools. */
  readonly trustOverrides?: readonly TrustOverride[];

  /** Minimum risk score (0-4) to trigger the configured alert mode. Default: 3. */
  readonly threshold?: number;

  /** Callback invoked on every risk assessment. */
  readonly onAssessment?: (assessment: {
    readonly turnId: string;
    readonly score: number;
    readonly action: RiskAction;
  }) => void;
}
