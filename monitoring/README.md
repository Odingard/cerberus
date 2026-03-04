# Cerberus Monitoring Stack

Pre-built Grafana dashboard for real-time Cerberus threat detection metrics.

## What's Included

| Service | Port | Purpose |
|---------|------|---------|
| OTel Collector | 4317 (gRPC), 4318 (HTTP) | Receives OTLP spans/metrics from your app |
| Prometheus | 9090 | Scrapes metrics from the OTel Collector |
| Grafana | 3000 | Pre-built Cerberus dashboard |

## Quick Start

```bash
# 1. Start the monitoring stack
docker compose -f monitoring/docker-compose.yml up -d

# 2. Open Grafana (no login required)
open http://localhost:3000
```

The Cerberus dashboard opens automatically at `http://localhost:3000`.

## Connecting Your App

Install the OTel SDK packages:

```bash
npm install @opentelemetry/sdk-trace-node @opentelemetry/sdk-metrics \
  @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http \
  @opentelemetry/sdk-trace-base
```

Configure your app before calling `guard()`:

```typescript
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { metrics } from '@opentelemetry/api';
import { guard } from '@cerberus-ai/core';

// Traces
const traceProvider = new NodeTracerProvider({
  spanProcessors: [
    new BatchSpanProcessor(new OTLPTraceExporter({
      url: 'http://localhost:4318/v1/traces',
    })),
  ],
});
traceProvider.register();

// Metrics
const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: 'http://localhost:4318/v1/metrics',
      }),
      exportIntervalMillis: 5000,
    }),
  ],
});
metrics.setGlobalMeterProvider(meterProvider);

// Now enable Cerberus OTel instrumentation
const { executors } = guard(myTools, {
  alertMode: 'interrupt',
  threshold: 3,
  opentelemetry: true,   // ← enables spans + metrics
});
```

## Dashboard Panels

| Panel | What It Shows |
|-------|--------------|
| Total Tool Calls | Cumulative call count over selected time range |
| Blocked Calls | Count of interrupt-action calls |
| Block Rate | % of calls that were blocked |
| Avg Risk Score | Mean risk score (0–4) across all calls |
| High-Risk Calls | Calls with score ≥ 3 (Lethal Trifecta threshold) |
| Tool Call Rate | calls/sec — total vs blocked, over time |
| Current Block Rate | Gauge showing real-time block % |
| Avg Risk Score Over Time | Risk score trend line |
| Risk Score Histogram | Distribution across score buckets |
| Call Rate by Tool | Per-tool throughput |
| Block Rate by Tool | Which tools are getting blocked |
| Per-Tool Summary Table | Total/blocked/block-rate per tool, sorted by risk |
| Calls by Action (stacked) | none/log/alert/interrupt breakdown over time |
| Action Breakdown | Current window bar gauge |

## Metrics Reference

Cerberus emits three OTel metrics when `opentelemetry: true`:

| Metric | Type | Description |
|--------|------|-------------|
| `cerberus.tool_calls.total` | Counter | Every tool call processed |
| `cerberus.tool_calls.blocked` | Counter | Calls with action=interrupt |
| `cerberus.risk_score` | Histogram | Risk score per call (0–4) |

Labels on every metric: `cerberus.tool_name`, `cerberus.action`.

## Stopping

```bash
docker compose -f monitoring/docker-compose.yml down
# Remove volumes too:
docker compose -f monitoring/docker-compose.yml down -v
```
