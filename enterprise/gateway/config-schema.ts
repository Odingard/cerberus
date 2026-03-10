/**
 * Zod schema for enterprise cerberus.config.yml validation.
 *
 * Customers fill out cerberus.config.yml to define their tools, detection
 * settings, gateway options, and alert routing. This schema validates the
 * parsed YAML on gateway startup and fails fast with a clear error message
 * if the config is invalid.
 */

import { z } from 'zod';

const ToolConfigSchema = z.object({
  /** HTTP upstream URL — gateway forwards POST { args } to this endpoint. */
  target: z.string().url().optional(),
  /** Trust level: 'trusted' = internal data (L1), 'untrusted' = scan for injection (L2). */
  trustLevel: z.enum(['trusted', 'untrusted']).optional(),
  /** Mark this tool as outbound — enables L3 exfiltration detection. */
  outbound: z.boolean().optional(),
});

const CerberusDetectionSchema = z.object({
  /** log | alert | interrupt. Default: interrupt. */
  alertMode: z.enum(['log', 'alert', 'interrupt']).optional(),
  /** Block threshold 1–4. Default: 3 (full Lethal Trifecta). */
  threshold: z.number().int().min(1).max(4).optional(),
  /** Enable L4 cross-session memory contamination detection. Default: false. */
  memoryTracking: z.boolean().optional(),
  /** Domains L3 will NOT flag as exfiltration — expected outbound destinations. */
  authorizedDestinations: z.array(z.string()).optional(),
});

const GatewaySchema = z
  .object({
    /** Gateway listen port. Default: 4000. */
    port: z.number().int().min(1).max(65535).optional(),
    /** Session TTL in minutes. Default: 30. */
    sessionTtlMinutes: z.number().int().min(1).optional(),
    /**
     * If set, every tool request must include this value in the
     * X-Cerberus-Api-Key header. Health checks are exempt.
     * Can reference env var: apiKey: ${CERBERUS_API_KEY}
     */
    apiKey: z.string().optional(),
  })
  .optional();

const AlertsSchema = z
  .object({
    slack: z.object({ webhook: z.string().url() }).optional(),
    pagerduty: z.object({ integrationKey: z.string().min(1) }).optional(),
    email: z
      .object({
        smtp: z.string().min(1),
        from: z.string().min(1),
        to: z.string().min(1),
      })
      .optional(),
  })
  .optional();

export const EnterpriseConfigSchema = z.object({
  /** Detection settings. */
  cerberus: CerberusDetectionSchema,
  /**
   * Tool definitions. Each key becomes a route at POST /tool/<toolName>.
   * At least one tool must specify target or be reachable via handler.
   */
  tools: z.record(z.string(), ToolConfigSchema),
  /** Gateway server settings. */
  gateway: GatewaySchema,
  /** Alert routing configuration. */
  alerts: AlertsSchema,
});

export type EnterpriseConfig = z.infer<typeof EnterpriseConfigSchema>;
export type ToolConfig = z.infer<typeof ToolConfigSchema>;
