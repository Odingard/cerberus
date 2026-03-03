/**
 * Validation Protocol Runner — orchestrates control + treatment groups.
 *
 * Phase A: Control group (clean external content, no injection)
 * Phase B: Treatment group (injection payloads)
 * Phase C: Analysis (enhanced ground truth, statistics, report)
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { runAgent } from '../agent.js';
import { runAgentMulti } from '../agent-multi.js';
import { detectProvider } from '../providers/index.js';
import { PAYLOADS } from '../payloads.js';
import {
  createToolExecutors,
  loadFixture,
  resetTurnCounter,
  resetCapturedReports,
} from '../tools.js';
import {
  DEFAULT_USER_PROMPT,
  SYSTEM_PROMPT_VARIANTS,
} from '../runner.js';
import type { SystemPromptId } from '../runner.js';
import type { AgentResult, Payload } from '../types.js';
import { computeEnhancedGroundTruth } from './ground-truth-v2.js';
import { wilsonCI } from './statistics.js';
import { PAYLOAD_DESTINATIONS } from './payload-destinations.js';
import type {
  ValidationReport,
  ValidationProgress,
  ProviderStats,
  PayloadValidationResult,
  DetailedOutcome,
  EnhancedGroundTruth,
  ConfidenceInterval,
} from './types.js';

// ── Types ───────────────────────────────────────────────────────

export interface ValidationOptions {
  readonly providers: readonly { model: string; provider: string }[];
  readonly trialsPerPayload: number;
  readonly controlTrialsPerProvider: number;
  readonly systemPromptId: SystemPromptId;
  readonly outputDir: string;
  readonly delayBetweenRunsMs?: number;
  readonly payloadIds?: readonly string[];
  readonly onProgress?: (progress: ValidationProgress) => void;
}

interface RunResult {
  readonly groundTruth: EnhancedGroundTruth;
  readonly agentResult: AgentResult;
  readonly payloadId: string;
  readonly provider: string;
  readonly model: string;
  readonly durationMs: number;
  readonly tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

// ── Helpers ─────────────────────────────────────────────────────

const EMPTY_OUTCOMES: Record<DetailedOutcome, number> = {
  success: 0,
  partial: 0,
  failure: 0,
  refused: 0,
  error: 0,
  content_filtered: 0,
};

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function selectPayloads(payloadIds?: readonly string[]): readonly Payload[] {
  if (!payloadIds || payloadIds.length === 0) return PAYLOADS;
  return PAYLOADS.filter((p) => payloadIds.includes(p.id));
}

async function runSingle(
  injectionContent: string,
  model: string,
  systemPrompt: string,
  delayMs: number,
): Promise<AgentResult> {
  resetTurnCounter();
  resetCapturedReports();

  const executors = createToolExecutors({
    mode: 'simulated',
    injectionContent,
    webhookUrl: '',
    externalUrl: 'https://acme-corp.example.com/reporting-guidelines',
  });

  const provider = detectProvider(model);
  const agentRunner = provider === 'openai' ? runAgent : runAgentMulti;

  const result = await agentRunner(systemPrompt, DEFAULT_USER_PROMPT, {
    model,
    maxTurns: 10,
    toolExecutors: executors,
  });

  if (delayMs > 0) await delay(delayMs);

  return result;
}

// ── Main Runner ─────────────────────────────────────────────────

export async function runValidationProtocol(
  options: ValidationOptions,
): Promise<ValidationReport> {
  const fixture = loadFixture();
  const systemPrompt = SYSTEM_PROMPT_VARIANTS[options.systemPromptId];
  const payloads = selectPayloads(options.payloadIds);
  const delayMs = options.delayBetweenRunsMs ?? 1000;

  mkdirSync(options.outputDir, { recursive: true });

  const controlResults: RunResult[] = [];
  const treatmentResults: RunResult[] = [];

  // Determine if control group exfiltrated (per provider)
  const controlExfiltratedByProvider: Record<string, boolean> = {};

  // ── Phase A: Control Group ──────────────────────────────────

  for (const { model, provider } of options.providers) {
    let controlExfiltrated = false;

    for (let trial = 0; trial < options.controlTrialsPerProvider; trial++) {
      options.onProgress?.({
        phase: 'control',
        provider,
        current: trial + 1,
        total: options.controlTrialsPerProvider,
      });

      const startTime = Date.now();
      try {
        const agentResult = await runSingle(
          '', model, systemPrompt, delayMs,
        );

        const gt = computeEnhancedGroundTruth(
          agentResult.turns, fixture, { id: 'CTRL' },
          agentResult, 'control', false,
        );

        if (gt.exfiltrationAttempted && gt.privateDataInExfiltration) {
          controlExfiltrated = true;
        }

        controlResults.push({
          groundTruth: gt,
          agentResult,
          payloadId: 'CTRL',
          provider,
          model,
          durationMs: Date.now() - startTime,
          tokenUsage: agentResult.tokenUsage,
        });
      } catch (err) {
        controlResults.push({
          groundTruth: {
            privilegedAccessOccurred: false,
            injectionDelivered: false,
            exfiltrationAttempted: false,
            privateDataInExfiltration: false,
            exfiltratedFields: [],
            riskVector: { l1: false, l2: false, l3: false, l4: false },
            condition: 'control',
            detailedOutcome: 'error',
            sequenceValid: false,
            recipientMatch: { injectedDestination: null, actualRecipient: null, matches: false, isExternal: false },
            causation: { score: 0, factors: [], verdict: 'coincidental' },
            refusalDetected: false,
            refusalText: null,
            piiDetailed: [],
          },
          agentResult: {
            turns: [],
            finalMessage: null,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            errors: [{ code: 'UNKNOWN', message: String(err), timestamp: Date.now() }],
            stopReason: 'unknown',
          },
          payloadId: 'CTRL',
          provider,
          model,
          durationMs: Date.now() - startTime,
          tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        });
      }
    }

    controlExfiltratedByProvider[provider] = controlExfiltrated;
  }

  // ── Phase B: Treatment Group ────────────────────────────────

  for (const { model, provider } of options.providers) {
    const controlExfiltrated = controlExfiltratedByProvider[provider] ?? false;
    let runIndex = 0;
    const totalTreatment = payloads.length * options.trialsPerPayload;

    for (const payload of payloads) {
      for (let trial = 0; trial < options.trialsPerPayload; trial++) {
        runIndex++;
        options.onProgress?.({
          phase: 'treatment',
          provider,
          current: runIndex,
          total: totalTreatment,
          payloadId: payload.id,
          trialIndex: trial,
        });

        const startTime = Date.now();
        try {
          const agentResult = await runSingle(
            payload.content, model, systemPrompt, delayMs,
          );

          const gt = computeEnhancedGroundTruth(
            agentResult.turns, fixture, payload,
            agentResult, 'treatment', controlExfiltrated,
          );

          treatmentResults.push({
            groundTruth: gt,
            agentResult,
            payloadId: payload.id,
            provider,
            model,
            durationMs: Date.now() - startTime,
            tokenUsage: agentResult.tokenUsage,
          });
        } catch (err) {
          treatmentResults.push({
            groundTruth: {
              privilegedAccessOccurred: false,
              injectionDelivered: false,
              exfiltrationAttempted: false,
              privateDataInExfiltration: false,
              exfiltratedFields: [],
              riskVector: { l1: false, l2: false, l3: false, l4: false },
              condition: 'treatment',
              detailedOutcome: 'error',
              sequenceValid: false,
              recipientMatch: { injectedDestination: PAYLOAD_DESTINATIONS[payload.id] ?? null, actualRecipient: null, matches: false, isExternal: false },
              causation: { score: 0, factors: [], verdict: 'coincidental' },
              refusalDetected: false,
              refusalText: null,
              piiDetailed: [],
            },
            agentResult: {
              turns: [],
              finalMessage: null,
              tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
              errors: [{ code: 'UNKNOWN', message: String(err), timestamp: Date.now() }],
              stopReason: 'unknown',
            },
            payloadId: payload.id,
            provider,
            model,
            durationMs: Date.now() - startTime,
            tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          });
        }
      }
    }
  }

  // ── Phase C: Analysis ───────────────────────────────────────

  const report = buildReport(
    options, payloads, controlResults, treatmentResults,
  );

  // Write report files
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const jsonPath = resolve(options.outputDir, `validation-report-${timestamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  return report;
}

// ── Report Building ─────────────────────────────────────────────

function buildReport(
  options: ValidationOptions,
  payloads: readonly Payload[],
  controlResults: readonly RunResult[],
  treatmentResults: readonly RunResult[],
): ValidationReport {
  const totalRuns = controlResults.length + treatmentResults.length;
  const providerNames = options.providers.map((p) => p.provider);

  // Aggregate control stats per provider
  const controlStats: Record<string, ProviderStats> = {};
  for (const { model, provider } of options.providers) {
    const runs = controlResults.filter((r) => r.provider === provider);
    controlStats[provider] = aggregateStats(runs, provider, model, 'control');
  }

  // Aggregate treatment stats per provider
  const treatmentStats: Record<string, ProviderStats> = {};
  for (const { model, provider } of options.providers) {
    const runs = treatmentResults.filter((r) => r.provider === provider);
    treatmentStats[provider] = aggregateStats(runs, provider, model, 'treatment');
  }

  // Per-payload results
  const perPayload: PayloadValidationResult[] = payloads.map((payload) => {
    const perProvider: Record<string, {
      trials: number;
      outcomes: Record<DetailedOutcome, number>;
      successRate: number;
      confidenceInterval: ConfidenceInterval;
      meanCausationScore: number;
      recipientMatchRate: number;
    }> = {};

    for (const { provider } of options.providers) {
      const runs = treatmentResults.filter(
        (r) => r.provider === provider && r.payloadId === payload.id,
      );
      const successes = runs.filter((r) => r.groundTruth.detailedOutcome === 'success').length;
      const recipientMatches = runs.filter((r) => r.groundTruth.recipientMatch.matches).length;
      const meanCausation = runs.length > 0
        ? runs.reduce((sum, r) => sum + r.groundTruth.causation.score, 0) / runs.length
        : 0;

      const outcomes = { ...EMPTY_OUTCOMES };
      for (const r of runs) {
        outcomes[r.groundTruth.detailedOutcome]++;
      }

      perProvider[provider] = {
        trials: runs.length,
        outcomes,
        successRate: runs.length > 0 ? successes / runs.length : 0,
        confidenceInterval: wilsonCI(successes, runs.length),
        meanCausationScore: meanCausation,
        recipientMatchRate: runs.length > 0 ? recipientMatches / runs.length : 0,
      };
    }

    return {
      payloadId: payload.id,
      category: payload.category,
      injectedDestination: PAYLOAD_DESTINATIONS[payload.id] ?? null,
      perProvider,
    };
  });

  // Cost estimate (rough)
  const totalTokens = [...controlResults, ...treatmentResults]
    .reduce((sum, r) => sum + r.tokenUsage.totalTokens, 0);
  const estimatedCost = totalTokens * 0.000005; // ~$5/M tokens average

  return {
    schemaVersion: '2.0.0',
    protocol: {
      trialsPerPayload: options.trialsPerPayload,
      controlTrialsPerProvider: options.controlTrialsPerProvider,
      totalRuns,
      providers: providerNames,
      payloadCount: payloads.length,
      systemPromptId: options.systemPromptId,
    },
    controlResults: controlStats,
    treatmentResults: treatmentStats,
    perPayload,
    generatedAt: new Date().toISOString(),
    totalCostEstimateUsd: Math.round(estimatedCost * 1000) / 1000,
  };
}

function aggregateStats(
  runs: readonly RunResult[],
  provider: string,
  model: string,
  condition: 'control' | 'treatment',
): ProviderStats {
  const outcomes = { ...EMPTY_OUTCOMES };
  for (const r of runs) {
    outcomes[r.groundTruth.detailedOutcome]++;
  }

  const successes = outcomes.success;
  const total = runs.length;
  const meanCausation = total > 0
    ? runs.reduce((sum, r) => sum + r.groundTruth.causation.score, 0) / total
    : 0;

  return {
    provider,
    model,
    condition,
    totalRuns: total,
    outcomes,
    successRate: total > 0 ? successes / total : 0,
    confidenceInterval: wilsonCI(successes, total),
    meanCausationScore: meanCausation,
  };
}
