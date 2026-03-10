/**
 * OpenTelemetry SDK setup for the Cerberus Playground.
 *
 * Import this module at the very top of server.ts before any guard() calls.
 * It registers a TracerProvider and MeterProvider so that guard()'s built-in
 * OTel instrumentation (src/telemetry/otel.ts) emits real spans and metrics
 * to the OTel Collector → Prometheus → Grafana pipeline.
 *
 * OTEL_ENDPOINT env var:
 *   - Local dev:  http://localhost:4318  (OTel Collector HTTP endpoint)
 *   - Docker:     http://otel-collector:4318  (set in docker-compose.yml)
 */

import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { metrics } from '@opentelemetry/api';

const OTEL_ENDPOINT = process.env['OTEL_ENDPOINT'] ?? 'http://localhost:4318';

const traceProvider = new NodeTracerProvider({
  spanProcessors: [
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: `${OTEL_ENDPOINT}/v1/traces`,
      }),
    ),
  ],
});
traceProvider.register();

const meterProvider = new MeterProvider({
  readers: [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: `${OTEL_ENDPOINT}/v1/metrics`,
      }),
      exportIntervalMillis: 3000,
    }),
  ],
});
metrics.setGlobalMeterProvider(meterProvider);

// eslint-disable-next-line no-console
console.log(`[otel] Exporting to ${OTEL_ENDPOINT}`);
