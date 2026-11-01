---
inclusion: always
---

# Project structure

```
/
├── .kiro/                  # specs, steering, hooks, settings (committed, required for judging)
├── apps/
│   └── web/                # Next.js: landing, scan, graveyard, badge, pricing
├── packages/
│   ├── core/               # sources, classifier, prescriber, scanner (pure TS)
│   └── mcp/                # revenant-mcp server
├── power/                  # Revenant Kiro power (plugin.json, mcp.json, skills/)
├── fixtures/               # recorded API responses for offline tests
├── docs/
│   └── kiro-log.md         # running log of Kiro usage, feeds the submission write-up
└── LICENSE                 # MIT, must show in GitHub's About section
```

The Kiro Crew app lives in its own public repo, `revenant-crew`, because Crew installs apps from separate git repos.

## Conventions
- File names kebab-case; React components export PascalCase.
- Lifecycle types defined once in `packages/core/src/types.ts` and imported everywhere.
- Each data source: `fetcher.ts`, `parser.ts`, `parser.test.ts` using files from `fixtures/`.
- Property-based tests sit next to the code as `*.pbt.test.ts`.
- Small commits after every completed spec task.
