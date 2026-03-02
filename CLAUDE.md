# Cerberus — Claude Code Instructions

## Post-Change Protocol (MANDATORY)

After ANY code change — do NOT wait for the user to ask:

1. **Tests**: `npx vitest run` — all tests must pass
2. **Typecheck**: `npx tsc --noEmit` — must be clean
3. **Lint**: `npx eslint src/ harness/ tests/` — 0 errors
4. **Format**: `npx prettier --check 'src/**/*.ts' 'tests/**/*.ts'` — fix with `--write` if needed

## Documentation Updates (MANDATORY with every code change)

When modifying source code, update ALL relevant docs in the SAME commit:

- **README.md** — architecture diagram, test counts, project structure, new APIs/features
- **CHANGELOG.md** — add entries under the current version section
- **docs/api.md** — new/changed types, config options, signal interfaces, exported functions
- **docs/architecture.md** — module map tables, data flow diagram, design decisions

Never commit code without updating docs. Never leave test counts or coverage numbers stale.

## Commit Standards

- Descriptive commit messages with conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`)
- Include doc updates in the same commit as the code they document
- Run full verification (tests + typecheck + lint + prettier) before committing
- Never use `--no-verify` or skip pre-commit hooks

## Code Conventions

- TypeScript strict mode with `exactOptionalPropertyTypes: true`
- Never assign `undefined` to optional properties — use conditional spread
- Module system: NodeNext with `.js` extensions in all imports
- Zod v4: use `z.strictObject()` not `.strict()` chain
- Use `.safeParse()` not `.parse()` at Zod boundaries
- Global regex patterns: reset `lastIndex = 0` before `.test()`
- ESLint: use alternation (`a|b`) not character class (`[ab]`) for zero-width Unicode chars
- Sub-classifiers are pure functions: `(ctx, session) => Signal | null`
- Sub-classifiers emit signals with existing layer tags (L1/L2/L3) — never add new layers

## Architecture

- Pipeline order: L1 → Secrets → L2 → Injection + Encoding + MCP → L3 → Domain → L4 → Drift → Correlation
- Drift detector runs LAST — reads accumulated session state from all prior classifiers
- Drift detector: history push happens AFTER checks (critical ordering)
- MCP scanner has two modes: standalone `scanToolDescriptions()` + runtime via `config.toolDescriptions`
- Correlation engine is unchanged by sub-classifiers — they use existing layer tags

## Testing

- Vitest with 80% minimum coverage threshold
- Unit tests mirror source structure: `tests/classifiers/`, `tests/layers/`, `tests/engine/`
- Integration tests in `tests/integration/classifier-phases.test.ts` (5-phase severity)
- Test names describe behavior: "should detect X when Y"
