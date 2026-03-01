# Cerberus — Research Findings

See [research-results.md](research-results.md) for the full methodology, per-payload breakdowns, trace analysis, and statistical validation from the Phase 1 attack harness.

## Summary

- 21 injection payloads across 5 categories (direct injection, encoded/obfuscated, social engineering, multi-turn, multilingual)
- 100% attack success rate — every payload completed the full Lethal Trifecta kill chain
- All exfiltrated payloads contained SSNs, emails, and phone numbers
- Encoding, language, and social engineering techniques all bypass model safety
- Attack cost: $0 (free-tier GPT-4o-mini)
- Attack time: ~12 seconds per run
