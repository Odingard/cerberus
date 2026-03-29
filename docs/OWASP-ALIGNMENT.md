# OWASP Top 10 for Agentic Applications 2026 — Cerberus Coverage Mapping

## Executive Summary

Cerberus provides **PRIMARY** coverage for 5 of the OWASP Top 10 for Agentic Applications 2026 risks, **PARTIAL** coverage for 3, **ROADMAP** coverage for 1, and **ADVISORY** coverage for 1.

| OWASP ID | Risk | Coverage | Primary Cerberus Control |
|----------|------|----------|--------------------------|
| ASI01 | Agent Goal Hijack | **PRIMARY** | Lethal Trifecta + EGI |
| ASI02 | Tool Misuse & Exploitation | **PRIMARY** | EGI + L3 Behavioral Intent Scoring |
| ASI03 | Identity & Privilege Abuse | **PARTIAL** | L1 + EGI |
| ASI04 | Agentic Supply Chain Vulnerabilities | **PARTIAL** | SLSA Level 3 attestation |
| ASI05 | Data & Memory Poisoning | **PRIMARY** | Lethal Trifecta |
| ASI06 | Excessive Agency & Scope Creep | **PRIMARY** | EGI |
| ASI07 | Insecure Agent Communication | **ROADMAP** | Multi-Agent EGI (Sprint 4) |
| ASI08 | Cascading Planning Failures | **PARTIAL** | EGI + Session Risk State |
| ASI09 | Human-Agent Trust Exploitation | **ADVISORY** | Guard Dashboard + Observe Telemetry |
| ASI10 | Rogue Agent Behavior | **PRIMARY** | Lethal Trifecta BLOCK + EGI + Fail-Secure |

---

## ASI01 — Agent Goal Hijack [PRIMARY]

**Description:** An attacker manipulates the agent's goals or objectives through prompt injection, context poisoning, or instruction overrides, causing the agent to pursue attacker-defined objectives instead of its intended task.

**Cerberus Controls:**

- L2 injection detection identifies goal-hijacking payloads (role overrides, authority spoofing, exfiltration commands, instruction injection patterns)
- EGI execution path deviation detects when the agent's tool-call sequence diverges from the declared execution graph
- Lethal Trifecta correlation fires when privileged access + injection + exfiltration co-occur in the same session
- Cross-turn tracking via session risk state persists signals across the full conversation, catching multi-turn hijack sequences

**Acknowledged Gap:** Historical L3 detection rate at 28.5% overall (March 13 `N=525` validation). L3 fires only when the agent executes an unauthorized outbound call — its rate tracks attack success, not miss rate.

**Primary Cerberus Primitive:** Lethal Trifecta correlation + EGI execution path deviation

---

## ASI02 — Tool Misuse & Exploitation [PRIMARY]

**Description:** An agent's tools are used in ways that were not intended by the developer, including calling tools with unexpected arguments, invoking tools in unexpected sequences, or exploiting tool capabilities to access resources outside the agent's intended scope.

**Cerberus Controls:**

- EGI graph defines the authorized tool-call topology — any tool invocation outside the declared graph triggers a deviation signal
- Late-registration hooks detect tools added to the agent's repertoire after initialization
- Schema fingerprinting validates that tool definitions have not been tampered with between registration and invocation
- L3 behavioral intent scoring evaluates whether outbound tool calls are consistent with the agent's declared purpose

**Acknowledged Gap:** Dynamic tool registration in frameworks (e.g., LangChain tool factories, MCP dynamic tool discovery) may add tools that are not in the original EGI graph.

**Primary Cerberus Primitive:** EGI graph + L3 behavioral intent scoring

---

## ASI03 — Identity & Privilege Abuse [PARTIAL]

**Description:** An agent operates with excessive privileges, uses stolen or impersonated credentials, or escalates its permissions beyond what was intended, enabling unauthorized access to data or systems.

**Cerberus Controls:**

- L1 detection identifies when privileged data (PII, secrets, credentials) enters the agent context
- Tool schema flags (`is_network_capable`, `is_data_read`, `is_data_write`) declare per-tool privilege boundaries
- EGI graph constrains which tools can be invoked and in what sequence, limiting privilege escalation paths

**Acknowledged Gap:** Cerberus does not manage IAM policies, rotate credentials, or enforce least-privilege at the infrastructure level. It detects privilege *abuse* at the tool-call level but does not manage privilege *assignment*.

**Primary Cerberus Primitive:** L1 data source classifier + EGI graph

---

## ASI04 — Agentic Supply Chain Vulnerabilities [PARTIAL]

**Description:** Vulnerabilities introduced through the agent's dependencies, including compromised tool packages, poisoned model weights, tampered configuration files, or malicious plugins and extensions.

**Cerberus Controls:**

- SLSA Level 3 attestation on all release artifacts (npm, Docker images via GHCR)
- Runtime integrity check via cosign-signed container images
- Lockfile enforcement ensures deterministic dependency resolution
- EGI schema fingerprinting detects tool definition tampering at runtime

**Acknowledged Gap:** Cerberus does not perform pre-deployment static analysis of tool packages, model weight integrity verification, or dependency vulnerability scanning. These are build-time concerns outside the runtime detection scope.

**Primary Cerberus Primitive:** SLSA Level 3 attestation + EGI schema fingerprinting

---

## ASI05 — Data & Memory Poisoning [PRIMARY]

**Description:** An attacker contaminates the data sources, memory stores, or retrieval-augmented generation (RAG) content that the agent relies on, causing it to operate on false premises or execute injected instructions embedded in its knowledge base.

**Cerberus Controls:**

- L2 token provenance tagging on RAG content identifies external/untrusted tokens before they influence outbound calls
- L1 detection on sensitive data stores flags when privileged data enters context from potentially poisoned sources
- Lethal Trifecta correlation is the canonical detection scenario — poisoned content triggers the full injection-to-exfiltration chain
- L4 memory contamination graph detects injected instructions that persist across conversation turns (cross-session attack)
- Historical `N=525` validation: 100% L1+L2 detection rate across all providers and all 55 payloads

**Acknowledged Gap:** No pre-ingestion scanning of RAG content or memory stores. Cerberus detects poisoned content at runtime when it influences tool calls, not at write time.

**Primary Cerberus Primitive:** Lethal Trifecta (L1+L2+L3+L4) + historical `N=525` empirical validation

---

## ASI06 — Excessive Agency & Scope Creep [PRIMARY]

**Description:** An agent acquires or exercises capabilities beyond its intended scope, either through self-modification, tool discovery, or gradual expansion of its operational boundaries over time.

**Cerberus Controls:**

- EGI scope enforcement constrains the agent to its declared tool set and execution topology
- Scope expansion alerts fire when the agent attempts to invoke tools outside its declared graph
- Late tool registration authorization detects tools added after initialization without explicit approval
- L3 behavioral intent scoring evaluates whether outbound calls are consistent with the agent's declared purpose

**Acknowledged Gap:** Cerberus does not evaluate whether the declared scope itself is minimal — it enforces the scope as declared. If the developer grants overly broad permissions, Cerberus enforces those broad permissions faithfully.

**Primary Cerberus Primitive:** EGI scope enforcement

---

## ASI07 — Insecure Agent Communication [ROADMAP]

**Description:** Agents communicating with other agents or services without proper authentication, encryption, or message integrity verification, enabling man-in-the-middle attacks, message tampering, or unauthorized inter-agent instruction injection.

**Cerberus Controls:**

- Sprint 4 multi-agent EGI extends the execution graph across agent boundaries
- Context contamination propagation tracking across agent handoffs
- Cross-agent Trifecta detection correlates signals when one agent's output becomes another agent's input

**Acknowledged Gap:** Sprint 4 has not yet been delivered. Multi-agent EGI is on the roadmap but not in the current release.

**Primary Cerberus Primitive:** Multi-Agent EGI (Sprint 4)

---

## ASI08 — Cascading Planning Failures [PARTIAL]

**Description:** Errors in an agent's planning or reasoning cascade through its execution, compounding at each step and leading to increasingly harmful actions that deviate from the intended outcome.

**Cerberus Controls:**

- EGI deviation detection identifies when the agent's actual execution path diverges from its planned path
- Session risk state accumulates signals across the full conversation, detecting gradual drift toward harmful actions
- Observe audit trail provides full execution traces for post-incident analysis of cascading failures

**Acknowledged Gap:** Cerberus does not evaluate the operational correctness of the agent's plan — it detects when execution deviates from the declared plan, not whether the plan itself is sound.

**Primary Cerberus Primitive:** EGI deviation detection + session risk state

---

## ASI09 — Human-Agent Trust Exploitation [ADVISORY]

**Description:** An agent exploits the trust relationship with its human operators, either by presenting misleading information, hiding its actions, or manipulating the human's perception of the agent's behavior and intentions.

**Cerberus Controls:**

- Guard dashboard provides real-time visibility into every tool call, signal, and risk assessment
- Observe telemetry (OpenTelemetry spans + metrics) exports full execution traces to external monitoring systems
- EGI deviation detection alerts operators when the agent's behavior diverges from its declared execution path

**Acknowledged Gap:** Human-agent trust exploitation is fundamentally a governance and UX problem, not a runtime detection problem. Cerberus provides observability and alerting, but the trust calibration between human and agent is outside the scope of runtime security.

**Primary Cerberus Primitive:** Guard dashboard + Observe telemetry

---

## ASI10 — Rogue Agent Behavior [PRIMARY]

**Description:** An agent acts in ways that are harmful, unauthorized, or contrary to its operator's interests, whether due to adversarial manipulation, emergent behavior, or failure modes that cause the agent to pursue unintended objectives.

**Cerberus Controls:**

- Lethal Trifecta BLOCK interrupts the attack before any data leaves the system (score >= threshold triggers `interrupt` action)
- EGI graph integrity check validates that the agent's execution path matches the declared topology
- Self-monitoring via session risk state detects behavioral drift across the full conversation
- Session risk persistence ensures that high-risk signals from earlier turns are not forgotten
- Fail-secure timeout ensures that agents that stop responding or hang are terminated rather than left in an indeterminate state

**Acknowledged Gap:** Cross-session persistence — risk state is currently scoped to a single session. An agent that exhibits rogue behavior across multiple independent sessions would require external correlation.

**Primary Cerberus Primitive:** Lethal Trifecta BLOCK + EGI graph integrity + fail-secure

---

## Competitive Context

No major enterprise AI security vendor has published an OWASP Agentic Applications alignment mapping as of March 2026.

| Capability | Cerberus | Palo Alto Prisma AIRS | Cisco AI Defense | Microsoft Agent 365 | HiddenLayer |
|------------|----------|----------------------|------------------|---------------------|-------------|
| Published OWASP Agentic mapping | Yes | No | No | No | No |
| Open source core | Yes (MIT) | No | No | No | No |
| Historical N=525 empirical validation | Yes | No | No | No | No |
| Lethal Trifecta detection | Yes | No | No | No | No |
| EGI (Execution Graph Integrity) | Yes | No | No | No | No |
| Tool-call-level detection | Yes | Partial (API-level) | No (network-level) | No (prompt-level) | No (model-level) |
| L4 Memory Contamination defense | Yes | No | No | No | No |
| Multi-provider validation | 3 providers | Unknown | Unknown | 1 provider | Unknown |
| Self-hosted / data residency | Yes | Cloud-only | Cloud-only | Cloud-only | Cloud-only |

Cerberus is the first agentic AI security platform to publish a systematic alignment against the OWASP Top 10 for Agentic Applications, backed by empirical validation data from controlled experiments across multiple LLM providers.
