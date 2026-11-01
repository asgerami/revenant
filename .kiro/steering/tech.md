---
inclusion: always
---

# Tech stack and rules

## Stack
- TypeScript everywhere, strict mode.
- pnpm workspaces monorepo.
- `apps/web`: Next.js (App Router), React, Tailwind CSS. Deployed on Vercel.
- `packages/core`: pure TypeScript engine (sources, classifier, prescriber). No framework imports.
- `packages/mcp`: MCP server using the official TypeScript MCP SDK, stdio transport, published to npm as `revenant-mcp`.
- `power/`: Revenant Kiro power in the Agent Plugins format (plugin.json, mcp.json, skills/).
- PostgreSQL with Prisma (Neon) for cached package signals and scan results.
- Tests: Vitest for unit tests, fast-check for property-based tests.

## Data sources
- npm registry `https://registry.npmjs.org/<name>` (abbreviated metadata with header `Accept: application/vnd.npm.install-v1+json` for versions, `deprecated`, and `modified`; `/<name>/latest` for the repository URL).
- npm downloads `https://api.npmjs.org/downloads/point/last-week/<name>` (bulk comma-separated for unscoped names).
- GitHub GraphQL API, batched up to 50 repos per query: `isArchived`, `pushedAt`, `isDisabled`, latest release. Server-side token only.
- OSV `POST https://api.osv.dev/v1/querybatch` with package name, ecosystem `npm`, and resolved version.
- e18e `module-replacements` npm package (MIT): `preferred`, `native`, and `micro-utilities` manifests.

## Rules
- Every external call goes through `packages/core/src/sources/<source>/` with a timeout, retry with backoff, and a cache (memory first, then Postgres, 24h TTL).
- The classifier is a pure, deterministic function `(PackageSignals, now: Date) => LifecycleVerdict`. Never call `Date.now()` inside it.
- Stream scan results to the page as each package resolves. Never block on the slowest package.
- Respect rate limits; batch GitHub and OSV calls.
- No secrets in the repo. Every variable lives in `.env.example`.
- Keep `/.kiro` committed. Never add it to `.gitignore`.
- Before adding or changing any dependency, check the real current version with `npm view <package> version` and use that. Never guess version numbers.
