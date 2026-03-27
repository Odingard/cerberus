/**
 * Cerberus Playground Server
 *
 * HTTP server on port 4040 that:
 *   - Serves the single-page playground UI (GET /)
 *   - Streams attack scenario execution via SSE (POST /api/run)
 *   - Exposes scenario metadata (GET /api/scenarios)
 *   - Health check (GET /health)
 *
 * Each run executes real Cerberus guard() with opentelemetry: true so metrics
 * flow to the OTel Collector → Prometheus → Grafana pipeline.
 */

import './otel.js'; // Must be first — registers OTel providers before guard() is called

import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { guard } from '../../src/middleware/wrap.js';
import type { MemoryGuardOptions } from '../../src/middleware/wrap.js';
import { SCENARIOS, getScenario } from './scenarios.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const INDEX_HTML = path.join(PUBLIC_DIR, 'index.html');
const PORT = parseInt(process.env['PORT'] ?? '4040', 10);
const GRAFANA_URL = process.env['GRAFANA_URL'] ?? 'http://localhost:3030';
const CORE_PROOF_PATH = {
  controlScenarioId: 'clean-run',
  attackScenarioId: 'lethal-trifecta',
} as const;

// ── SSE helpers ─────────────────────────────────────────────────────────────

function sendEvent(res: http.ServerResponse, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── Body reader ─────────────────────────────────────────────────────────────

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

// ── Sleep helper ─────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Request handler ──────────────────────────────────────────────────────────

const server = http.createServer((req, res) => {
  void handleRequest(req, res);
});

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = req.url ?? '/';
  const method = req.method ?? 'GET';

  // CORS — allow iframe from same host
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204).end();
    return;
  }

  // ── GET / → serve index.html ────────────────────────────────────────────
  if (method === 'GET' && (url === '/' || url === '/index.html')) {
    try {
      const raw = fs.readFileSync(INDEX_HTML, 'utf8');
      const html = raw.replace(
        '</head>',
        `<script>window.__GRAFANA_URL__=${JSON.stringify(GRAFANA_URL)};</script></head>`,
      );
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.writeHead(200).end(html);
    } catch {
      res.writeHead(500).end('Failed to load playground UI');
    }
    return;
  }

  // ── GET /health ──────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/health') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200).end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // ── GET /api/scenarios ───────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/scenarios') {
    const metadata = SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      expectedLayers: s.expectedLayers,
      stepCount: s.steps.length,
      featured: s.id === CORE_PROOF_PATH.controlScenarioId || s.id === CORE_PROOF_PATH.attackScenarioId,
    }));
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200).end(
      JSON.stringify({
        scenarios: metadata,
        featured: CORE_PROOF_PATH,
      }),
    );
    return;
  }

  // ── POST /api/run → SSE stream ───────────────────────────────────────────
  if (method === 'POST' && url === '/api/run') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.writeHead(200);

    let scenarioId: string;
    try {
      const body = await readBody(req);
      const parsed = JSON.parse(body) as { scenarioId?: unknown };
      if (typeof parsed.scenarioId !== 'string') throw new Error('scenarioId must be a string');
      scenarioId = parsed.scenarioId;
    } catch (err) {
      sendEvent(res, 'error', { message: String(err) });
      res.end();
      return;
    }

    const scenario = getScenario(scenarioId);
    if (!scenario) {
      sendEvent(res, 'error', { message: `Unknown scenario: ${scenarioId}` });
      res.end();
      return;
    }

    // Wrap executors with guard() — pass memoryOptions if scenario has L4 memory tools
    const memoryOptions: MemoryGuardOptions | undefined = scenario.memoryTools
      ? { memoryTools: [...scenario.memoryTools] }
      : undefined;

    const guarded = guard(
      scenario.executors as Record<string, (args: Record<string, unknown>) => Promise<string>>,
      scenario.cerberusConfig,
      scenario.outboundTools as string[],
      memoryOptions,
    );

    // Pre-contamination: simulate a prior session writing to the memory graph so L4 can fire
    if (scenario.preContaminationSteps && scenario.preContaminationSteps.length > 0) {
      for (const step of scenario.preContaminationSteps) {
        const exec = guarded.executors[step.toolName];
        if (exec) await exec(step.args);
      }
      // Reset to a new session ID — graph/ledger persist, enabling cross-session taint detection
      guarded.reset();
    }

    sendEvent(res, 'start', { scenarioId, totalSteps: scenario.steps.length });

    let finalScore = 0;
    let finalAction = 'log';
    let totalBlocked = 0;

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      if (!step) continue;

      const executor = guarded.executors[step.toolName];
      if (!executor) {
        sendEvent(res, 'error', { message: `Executor not found for tool: ${step.toolName}` });
        break;
      }

      // guard() returns a "[Cerberus]" prefixed string on interrupt — never throws
      const rawResult = await executor(step.args);
      const blocked = rawResult.startsWith('[Cerberus]');

      // Get the latest assessment (the one for this step)
      const allAssessments = guarded.assessments;
      const assessment = allAssessments[allAssessments.length - 1];

      if (assessment) {
        if (assessment.score > finalScore) finalScore = assessment.score;
        if (assessment.action === 'interrupt') {
          finalAction = 'interrupt';
        } else if (assessment.action === 'alert' && finalAction !== 'interrupt') {
          finalAction = 'alert';
        }
      }

      if (blocked) totalBlocked++;

      sendEvent(res, 'step', {
        index: i,
        toolName: step.toolName,
        description: step.description,
        args: step.args,
        result: rawResult,
        assessment: assessment
          ? {
              turnId: assessment.turnId,
              score: assessment.score,
              action: assessment.action,
              vector: assessment.vector,
              signals: assessment.signals.map((s) => s.signal),
            }
          : null,
        blocked,
        layer: step.layer,
      });

      // Stop execution if blocked
      if (blocked) break;

      // Pause between steps — long enough for non-technical audiences to read
      if (i < scenario.steps.length - 1) {
        // Extra pause when risk is building, so the audience feels the tension
        const pauseMs = assessment && assessment.score >= 2 ? 2500 : 1500;
        await sleep(pauseMs);
      }
    }

    sendEvent(res, 'done', {
      finalScore,
      action: finalAction,
      totalBlocked,
    });

    guarded.destroy();
    res.end();
    return;
  }

  // ── 404 ──────────────────────────────────────────────────────────────────
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(404).end(JSON.stringify({ error: 'Not found' }));
}

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[playground] Cerberus Playground running at http://localhost:${PORT}`);
  // eslint-disable-next-line no-console
  console.log(`[playground] ${SCENARIOS.length} attack scenarios loaded`);
});
