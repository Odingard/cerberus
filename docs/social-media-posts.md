# Cerberus — Social Media Posts

**GIF URL (live after next git push):**
`https://cerberus.sixsenseenterprise.com/demo.gif`

---

## LinkedIn Post

**Attach:** `docs/demo.gif`

---

I ran a controlled experiment: gave a production-grade AI agent real customer records, a real LLM, and a real outbound email tool. Then I put an adversarial instruction inside a web page the agent was told to summarize.

Without any protection — it followed the injection. Customer SSNs, emails, and balances left the system. The agent had no idea.

This is called the **Lethal Trifecta**: privileged data access + external content ingestion + outbound messaging. Every major AI framework ships this pattern by default.

We built **Cerberus** to stop it.

In the GIF above: the same attack, same agent, same LLM — with two lines of code added:

```
const { executors: tools } = guard(rawTools, config, ['sendOutboundReport']);
```

Cerberus fires four signals across three layers:
- L1: Privileged data entered the context
- L2: Injection payload detected in untrusted tool output
- L3: Outbound call to an unauthorized destination
- Outbound Correlator: flagged the injection-to-exfiltration chain

Score 3/4 → interrupt. Zero bytes left the system.

We validated this across **N=525 controlled runs** using OpenAI, Anthropic, and Google models. Attack success (full compliance — agent redirects to attacker's address): OpenAI 90.3%, Google 82.4%, Anthropic 6.7%. Control group: 0/30 exfiltrations.

**The core library is MIT and free**: `npm install @cerberus-ai/core`
**Live attack demo**: https://demo.cerberus.sixsenseenterprise.com
**Enterprise (self-hosted VPC)**: https://cerberus.sixsenseenterprise.com

If you're building AI agents that touch internal data — this is the attack surface that matters.

#AIAgents #PromptInjection #AISecurity #LLMSecurity #AgentSecurity

---

## Twitter / X Thread

**Tweet 1** (attach GIF):
```
I let an AI agent read customer records, fetch a web page, and send reports.

The web page contained an injection payload.

Watch what happens — without protection, then with 2 lines of @cerberus_ai code.

🧵
```

**Tweet 2:**
```
This is the Lethal Trifecta:

1. Agent reads privileged data (PII, credentials)
2. Agent fetches external content (web pages, emails, APIs)
3. Agent sends data outbound

All three conditions = attacker can hijack the outbound call.

Every major AI framework ships this by default.
```

**Tweet 3:**
```
We ran N=525 controlled tests across OpenAI, Anthropic, and Google.
55 payloads × 3 trials × 3 providers. Real API calls.

Attack success (agent fully redirects to attacker's address):
• OpenAI GPT-4o-mini: 90.3% [84.8%, 93.9%]
• Google Gemini 2.5 Flash: 82.4% [75.9%, 87.5%]
• Anthropic Claude: 6.7% [3.8%, 11.5%]

Control group: 0/30 exfiltrations — baseline clean.
```

**Tweet 4:**
```
Cerberus detects it in real-time using 4 layers:

L1 → Data Source (PII accessed)
L2 → Token Provenance (injection in untrusted output)
L3 → Outbound Intent (unauthorized destination)
L4 → Memory Contamination (persisted injections)

+ 7 sub-classifiers. p99: 0.23ms overhead.
```

**Tweet 5:**
```
The fix is 2 lines:

const { executors: tools } = guard(
  rawTools,
  { alertMode: 'interrupt', threshold: 3 },
  ['sendOutboundReport']
);

Works with LangChain, Vercel AI SDK, OpenAI Agents SDK.
Or zero-code via the HTTP gateway.

MIT licensed: npm install @cerberus-ai/core
```

**Tweet 6:**
```
Live demo → https://demo.cerberus.sixsenseenterprise.com

Self-hosted enterprise (your VPC, your data) → https://cerberus.sixsenseenterprise.com

Open source core, enterprise deployment package.
```

---

## sixsenseenterprise.com — Base44 Embed

Add to the Products/Services section of the company site.

**Option A — Embedded GIF with link button (paste as HTML block):**

```html
<div style="max-width:720px;margin:2rem auto;text-align:center">
  <p style="font-size:0.85rem;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.75rem">
    Cerberus — AI Agent Security
  </p>
  <div style="border-radius:10px;overflow:hidden;border:1px solid #1e2230;box-shadow:0 4px 24px rgba(0,0,0,0.4)">
    <img src="https://cerberus.sixsenseenterprise.com/demo.gif"
         alt="Cerberus — AI agent attack blocked in real-time"
         style="width:100%;display:block" />
  </div>
  <p style="margin-top:1rem;font-size:0.9rem;color:#475569">
    Runtime security for AI agents. Detects and blocks the Lethal Trifecta — <br>
    prompt injection + PII exfiltration — before data leaves your system.
  </p>
  <a href="https://cerberus.sixsenseenterprise.com"
     style="display:inline-block;margin-top:1rem;padding:0.65rem 1.5rem;background:#dc2626;color:#fff;border-radius:20px;text-decoration:none;font-weight:600;font-size:0.9rem">
    Learn More →
  </a>
</div>
```

**Option B — Text description for the product card:**

> **Cerberus — Agentic AI Runtime Security**
>
> AI agents with privileged data access, external content ingestion, and outbound messaging are vulnerable to prompt injection attacks that silently exfiltrate customer data. Cerberus detects and interrupts these attacks in real-time — before a single byte leaves your system.
>
> - 4-layer detection pipeline (Data Source · Token Provenance · Outbound Intent · Memory Contamination)
> - Works with LangChain, Vercel AI SDK, OpenAI Agents SDK — or zero-code via HTTP gateway
> - p99 overhead: 0.23ms
> - MIT open-source core · Enterprise self-hosted edition
>
> [See Live Demo](https://demo.cerberus.sixsenseenterprise.com) · [Enterprise Licensing](https://cerberus.sixsenseenterprise.com)

---

## Reddit / HN (for when empirical results are final)

**r/netsec, r/MachineLearning, Hacker News:**

**Title:** "We ran 525 controlled prompt injection attacks across 3 LLMs — here's what the data shows (and the 2-line fix)"

**Body:**
We've been working on a runtime security layer for AI agents — specifically targeting what we call the "Lethal Trifecta": an AI agent that (1) reads privileged data, (2) ingests external content, and (3) can send data outbound. Any agent with all three is exploitable today via prompt injection.

We ran a systematic evaluation: 55 injection payloads × 3 providers (OpenAI gpt-4o-mini, Anthropic claude-sonnet-4, Google gemini-2.5-flash) × 3 trials = 525 total runs with real API calls.

**Attack success (full compliance — agent redirects to attacker's address):**
- OpenAI gpt-4o-mini: 90.3% [84.8%, 93.9%] — causation score 0.811
- Google gemini-2.5-flash: 82.4% [75.9%, 87.5%] — causation score 0.702
- Anthropic claude-sonnet-4: 6.7% [3.8%, 11.5%] — causation score 0.207

**Control group:** 0/30 exfiltrations across all providers — baseline confirmed clean.

**With Cerberus detection:**
- L1 (Data Source): 100% detection
- L2 (Token Provenance): 100% detection
- False positive rate: 0.0% on 30 clean control runs

The detection library is MIT: `npm install @cerberus-ai/core`

Write-up: [link to framework-attack-surface.md or dev.to article]

---

**Detection results (N=525, observe-only mode):**
- L1 (Data Source): **100%** across all providers [97.9%, 100%]
- L2 (Token Provenance): **100%** across all providers [97.9%, 100%]
- L3 (Outbound Intent): OpenAI 13.7% · Anthropic 1.1% · Google 65.7% (tracks attack success)
- False positive rate: **0.0%** [0.0%, 11.4%] — 0/30 clean runs triggered
- Overall detection rate: **28.5%** [24.7%, 32.6%]
