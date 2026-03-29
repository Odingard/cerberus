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

Score 3/4 → interrupt. In the guarded demo path, the outbound action never executes.

We have historical controlled validation artifacts across OpenAI, Anthropic, and Google models, and we are refreshing the current-branch benchmark set now. Until that refresh is published, I’m keeping public claims tied to the live demo behavior and the reproducible runtime path shown here.

**The core library is MIT and free**: `npm install @cerberus-ai/core`
**Hosted demo**: https://demo.cerberus.sixsenseenterprise.com
**Live dashboard**: https://grafana.cerberus.sixsenseenterprise.com/d/cerberus-main/cerberus-e28094-ai-security-monitor?orgId=1&refresh=10s
**Fallback proof path**: local demo + recorded fallback in the repo
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
We have controlled validation artifacts across OpenAI, Anthropic, and Google with real API calls.

I’m refreshing the current-branch benchmark set right now, so I’m not quoting stale mixed numbers here.

What I can stand behind today:
• the runtime path is real
• the attack chain is reproducible
• Cerberus can interrupt the guarded outbound action before it executes
```

**Tweet 4:**
```
Cerberus detects it in real-time using 4 layers:

L1 → Data Source (PII accessed)
L2 → Token Provenance (injection in untrusted output)
L3 → Outbound Intent (unauthorized destination)
L4 → Memory Contamination (persisted injections)

+ sub-classifiers for secrets, encodings, MCP poisoning, outbound correlation, and split exfiltration patterns.
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
Hosted demo → https://demo.cerberus.sixsenseenterprise.com
Live dashboard → https://grafana.cerberus.sixsenseenterprise.com/d/cerberus-main/cerberus-e28094-ai-security-monitor?orgId=1&refresh=10s
Fallback proof path → local demo + recorded fallback in the repo

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
> - MIT open-source core · Enterprise self-hosted edition
>
> Hosted demo + live dashboard available now · fallback proof path available in-repo · [Enterprise Licensing](https://cerberus.sixsenseenterprise.com)

---

## Reddit / HN (for when empirical results are final)

**r/netsec, r/MachineLearning, Hacker News:**

**Title:** "We built a runtime guard for the Lethal Trifecta in AI agents — here's the attack path and the 2-line fix"

**Body:**
We've been working on a runtime security layer for AI agents — specifically targeting what we call the "Lethal Trifecta": an AI agent that (1) reads privileged data, (2) ingests external content, and (3) can send data outbound. Any agent with all three is exploitable today via prompt injection.

We have historical controlled validation artifacts across major providers and are refreshing the current benchmark set on the hardened branch now. Rather than quote mixed historical numbers, this post focuses on the runtime path we can reproduce directly.

**With Cerberus detection:**
- guarded outbound actions can be interrupted before execution
- session-aware signals accumulate across tool calls
- the same vulnerable workflow can be shown unprotected vs protected with minimal code changes

The detection library is MIT: `npm install @cerberus-ai/core`

Write-up: [link to framework-attack-surface.md or dev.to article]

---

**When the refreshed benchmark set is published, every number should be tied to one clearly labeled evidence set rather than mixed across paper, historical validation, and current-branch runs.**
