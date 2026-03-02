# Cerberus — API Reference

## `guard()`

The main entry point. Wraps tool executors with the Cerberus detection pipeline.

```typescript
import { guard } from '@cerberus-ai/core';

function guard(
  executors: Record<string, ToolExecutorFn>,
  config: CerberusConfig,
  outboundTools: readonly string[],
  memoryOptions?: MemoryGuardOptions,
): GuardResult;
```

### Parameters

| Parameter       | Type                             | Description                                            |
| --------------- | -------------------------------- | ------------------------------------------------------ |
| `executors`     | `Record<string, ToolExecutorFn>` | Map of tool name to executor function                  |
| `config`        | `CerberusConfig`                 | Detection configuration                                |
| `outboundTools` | `readonly string[]`              | Tool names that send data externally (monitored by L3) |
| `memoryOptions` | `MemoryGuardOptions`             | Optional L4 memory contamination tracking config       |

### Returns: `GuardResult`

```typescript
interface GuardResult {
  readonly executors: Record<string, ToolExecutorFn>; // Wrapped executors
  readonly session: DetectionSession; // Session state handle
  readonly assessments: readonly RiskAssessment[]; // All assessments this session
  readonly reset: () => void; // Clear session state (graph/ledger persist)
  readonly graph?: ContaminationGraph; // Present when memoryTracking enabled
  readonly ledger?: ProvenanceLedger; // Present when memoryTracking enabled
  readonly destroy: () => void; // Close DB, clear graph — call when done
}
```

- `reset()` clears session state and assessments but preserves the contamination graph and ledger (cross-session persistence is the point of L4).
- `destroy()` tears down everything including the SQLite connection. Call when you're done with the guard instance.

### Example

```typescript
import { guard } from '@cerberus-ai/core';
import type { CerberusConfig } from '@cerberus-ai/core';

const executors = {
  readDatabase: async (args) => db.query(args.sql),
  fetchUrl: async (args) => fetch(args.url).then((r) => r.text()),
  sendEmail: async (args) => mailer.send(args),
};

const config: CerberusConfig = {
  alertMode: 'interrupt',
  threshold: 3,
  trustOverrides: [
    { toolName: 'readDatabase', trustLevel: 'trusted' },
    { toolName: 'fetchUrl', trustLevel: 'untrusted' },
  ],
  onAssessment: ({ turnId, score, action }) => {
    if (score > 0) console.log(`[${turnId}] score=${score} action=${action}`);
  },
};

const { executors: secured, assessments, destroy } = guard(executors, config, ['sendEmail']);

// Use secured tools — they have the same interface as the originals
const data = await secured.readDatabase({ sql: 'SELECT * FROM customers' });
const page = await secured.fetchUrl({ url: 'https://example.com' });
const result = await secured.sendEmail({ to: 'user@example.com', body: data });
// ^ If this leaks PII from readDatabase, Cerberus blocks it

// Clean up when done
destroy();
```

---

## `ToolExecutorFn`

```typescript
type ToolExecutorFn = (args: Record<string, unknown>) => Promise<string>;
```

Every tool executor must accept a string-keyed argument map and return a string result. This is the universal interface that Cerberus wraps.

---

## `CerberusConfig`

```typescript
interface CerberusConfig {
  readonly alertMode?: AlertMode; // Default: 'alert'
  readonly memoryTracking?: boolean; // Default: false
  readonly logDestination?: LogDestination | LogConfig; // Default: 'console'
  readonly trustOverrides?: readonly TrustOverride[];
  readonly threshold?: number; // Default: 3 (range 0-4)
  readonly toolDescriptions?: readonly ToolDescription[]; // Enable runtime MCP poisoning detection
  readonly onAssessment?: (assessment: {
    readonly turnId: string;
    readonly score: number;
    readonly action: RiskAction;
  }) => void;
}
```

### `alertMode`

| Value         | Behavior                                                                           |
| ------------- | ---------------------------------------------------------------------------------- |
| `'log'`       | Record signals but never block tool calls                                          |
| `'alert'`     | Record signals and fire `onAssessment` callback (default)                          |
| `'interrupt'` | Block tool calls when score meets threshold, return `[Cerberus] Tool call blocked` |

### `threshold`

Risk score (0-4) needed to trigger the configured `alertMode`. Default is `3` (the Lethal Trifecta). Set to `4` to only trigger on full-spectrum attacks including L4 memory contamination.

### `trustOverrides`

```typescript
interface TrustOverride {
  readonly toolName: string;
  readonly trustLevel: 'trusted' | 'untrusted';
}
```

Maps tool names to trust levels. Tools marked `'trusted'` trigger L1 (data source classification). Tools marked `'untrusted'` trigger L2 (token provenance tagging). Tools not listed are classified as `'unknown'` and do not trigger L1 or L2.

---

## `MemoryGuardOptions`

```typescript
interface MemoryGuardOptions {
  readonly memoryTools?: readonly MemoryToolConfig[];
  readonly dbPath?: string; // Default: ':memory:'
}
```

### `MemoryToolConfig`

```typescript
interface MemoryToolConfig {
  readonly toolName: string;
  readonly operation: 'read' | 'write';
  readonly extractNodeId?: (args: Record<string, unknown>) => string | undefined;
  readonly extractContent?: (args: Record<string, unknown>, result: string) => string;
}
```

Tells Cerberus which tools are memory operations. Write operations are recorded in the contamination graph. Read operations are checked for cross-session taint.

**Default node ID extraction**: looks for `key`, `id`, `nodeId`, or `memoryKey` in tool arguments.

**Default content extraction**: looks for `value`, `content`, or `data` in tool arguments (writes), falls back to tool result (reads).

### Example with L4

```typescript
const { executors: secured, destroy } = guard(
  executors,
  { ...config, memoryTracking: true },
  ['sendEmail'],
  {
    memoryTools: [
      { toolName: 'writeMemory', operation: 'write' },
      { toolName: 'readMemory', operation: 'read' },
    ],
  },
);
```

---

## `RiskAssessment`

```typescript
interface RiskAssessment {
  readonly turnId: TurnId;
  readonly vector: RiskVector;
  readonly score: number; // 0-4
  readonly action: RiskAction; // 'none' | 'log' | 'alert' | 'interrupt'
  readonly signals: readonly DetectionSignal[];
  readonly timestamp: number;
}
```

### `RiskVector`

```typescript
interface RiskVector {
  readonly l1: boolean; // Privileged data accessed
  readonly l2: boolean; // Untrusted tokens in context
  readonly l3: boolean; // Exfiltration risk detected
  readonly l4: boolean; // Contaminated memory activated
}
```

The vector is computed from **cumulative session signals**, not just the current turn. This means L1 firing on turn 0 and L3 firing on turn 2 produces a vector with both `l1: true` and `l3: true` on the turn-2 assessment.

### Score-to-Action Mapping

| Score          | Condition                  | Action                 |
| -------------- | -------------------------- | ---------------------- |
| `< threshold`  | Below configured threshold | `'none'`               |
| `>= threshold` | Meets or exceeds threshold | Configured `alertMode` |

Default threshold is 3 (the Lethal Trifecta: L1+L2+L3).

---

### `toolDescriptions`

```typescript
interface ToolDescription {
  readonly name: string;
  readonly description: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}
```

When provided, the MCP Tool Poisoning Scanner runs per-tool-call, checking the called tool's description for hidden instructions, cross-tool manipulation, and obfuscation. See also `scanToolDescriptions()` for standalone registration-time scanning.

---

## `scanToolDescriptions()`

Standalone MCP tool description scanner — call at tool registration time before wiring tools into your agent.

```typescript
import { scanToolDescriptions } from '@cerberus-ai/core';

function scanToolDescriptions(tools: readonly ToolDescription[]): readonly ToolPoisoningResult[];
```

Returns one `ToolPoisoningResult` per tool:

```typescript
interface ToolPoisoningResult {
  readonly toolName: string;
  readonly poisoned: boolean;
  readonly patternsFound: readonly string[]; // e.g. ['hidden_instruction', 'sensitive_file_ref']
  readonly severity: 'low' | 'medium' | 'high';
}
```

**Pattern categories**: `hidden_instruction`, `sensitive_file_ref`, `cross_tool_manipulation`, `instruction_injection`, `data_routing`, `obfuscation`.

---

## Detection Signals

### L1: `PrivilegedDataSignal`

Emitted when a tool classified as `'trusted'` returns data containing PII patterns (emails, SSNs, phone numbers).

```typescript
interface PrivilegedDataSignal {
  readonly layer: 'L1';
  readonly signal: 'PRIVILEGED_DATA_ACCESSED';
  readonly turnId: TurnId;
  readonly source: string; // Tool name
  readonly fields: readonly string[]; // Extracted field names
  readonly trustLevel: TrustLevel;
  readonly timestamp: number;
}
```

### L2: `UntrustedTokensSignal`

Emitted when a tool classified as `'untrusted'` returns content (potential injection vector).

```typescript
interface UntrustedTokensSignal {
  readonly layer: 'L2';
  readonly signal: 'UNTRUSTED_TOKENS_IN_CONTEXT';
  readonly turnId: TurnId;
  readonly source: string;
  readonly tokenCount: number; // Estimated tokens (~4 chars/token)
  readonly trustLevel: TrustLevel;
  readonly timestamp: number;
}
```

### L3: `ExfiltrationRiskSignal`

Emitted when an outbound tool call contains content matching previously observed PII from trusted sources.

```typescript
interface ExfiltrationRiskSignal {
  readonly layer: 'L3';
  readonly signal: 'EXFILTRATION_RISK';
  readonly turnId: TurnId;
  readonly matchedFields: readonly string[]; // PII values found in outbound content
  readonly destination: string; // Extracted destination (recipient, URL, etc.)
  readonly similarityScore: number; // 0-1 fraction of PII matched
  readonly timestamp: number;
}
```

### L4: `ContaminatedMemorySignal`

Emitted when a memory read retrieves data that was written by an untrusted source in a different session.

```typescript
interface ContaminatedMemorySignal {
  readonly layer: 'L4';
  readonly signal: 'CONTAMINATED_MEMORY_ACTIVE';
  readonly turnId: TurnId;
  readonly sessionId: SessionId;
  readonly nodeId: string; // Memory key that was contaminated
  readonly contaminationSource: string; // Tool that wrote the tainted data
  readonly timestamp: number;
}
```

### Sub-Classifier Signals

These signals are emitted by the advanced sub-classifiers and use existing layer tags (L1/L2/L3) so they contribute to the same risk vector.

#### `SecretsDetectedSignal` (L1)

```typescript
interface SecretsDetectedSignal {
  readonly layer: 'L1';
  readonly signal: 'SECRETS_DETECTED';
  readonly turnId: TurnId;
  readonly secretTypes: readonly string[]; // e.g. ['aws_key', 'jwt', 'private_key']
  readonly count: number;
  readonly timestamp: number;
}
```

#### `InjectionPatternsSignal` (L2)

```typescript
interface InjectionPatternsSignal {
  readonly layer: 'L2';
  readonly signal: 'INJECTION_PATTERNS_DETECTED';
  readonly turnId: TurnId;
  readonly patternsFound: readonly string[]; // e.g. ['role_override', 'authority_spoofing']
  readonly confidence: number; // 0-1 weighted score
  readonly timestamp: number;
}
```

#### `EncodingDetectedSignal` (L2)

```typescript
interface EncodingDetectedSignal {
  readonly layer: 'L2';
  readonly signal: 'ENCODING_DETECTED';
  readonly turnId: TurnId;
  readonly encodingTypes: readonly string[]; // e.g. ['base64', 'hex_escape']
  readonly decodedSnippet?: string; // First 100 chars of decoded content
  readonly timestamp: number;
}
```

#### `ToolPoisoningSignal` (L2)

```typescript
interface ToolPoisoningSignal {
  readonly layer: 'L2';
  readonly signal: 'TOOL_POISONING_DETECTED';
  readonly turnId: TurnId;
  readonly toolName: string;
  readonly patternsFound: readonly string[];
  readonly severity: 'low' | 'medium' | 'high';
  readonly timestamp: number;
}
```

#### `SuspiciousDestinationSignal` (L3)

```typescript
interface SuspiciousDestinationSignal {
  readonly layer: 'L3';
  readonly signal: 'SUSPICIOUS_DESTINATION';
  readonly turnId: TurnId;
  readonly destination: string;
  readonly riskFactors: readonly string[]; // e.g. ['webhook_service', 'ip_address']
  readonly domainRisk: 'low' | 'medium' | 'high';
  readonly timestamp: number;
}
```

#### `BehavioralDriftSignal` (L2/L3)

```typescript
interface BehavioralDriftSignal {
  readonly layer: 'L2' | 'L3';
  readonly signal: 'BEHAVIORAL_DRIFT_DETECTED';
  readonly turnId: TurnId;
  readonly driftType: string; // 'post_injection_outbound' | 'repeated_exfiltration' | 'privilege_escalation'
  readonly evidence: string;
  readonly timestamp: number;
}
```

---

## Notes

- **`better-sqlite3` dependency**: The L4 provenance ledger uses `better-sqlite3`, which is a native C++ addon. Consumers need either a C++ compiler or pre-built binaries available for their platform. This dependency is only exercised when `memoryTracking: true`.
- **Thread safety**: Cerberus is designed for single-threaded Node.js use. The SQLite ledger uses WAL mode for read performance but assumes single-writer access.
- **Session lifecycle**: Call `destroy()` when you're done with a guard instance to close the SQLite connection and free memory.
