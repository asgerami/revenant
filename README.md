# Revenant

**Revenant finds the dead packages in your codebase and brings your code back to life.** Nearly half of production dependencies are stalled or end-of-life, yet most have no CVEs, so vulnerability scanners never flag them. Revenant detects deprecated, archived, and abandoned packages, classifies them by lifecycle state (ALIVE, DORMANT, DYING, DEAD, ZOMBIE), prescribes modern alternatives, and—through its MCP server and Kiro power—helps you migrate off them with test-verified code changes.

## Project Structure

This is a pnpm workspaces monorepo:

- **`apps/web`**: Next.js web app (scan interface, graveyard pages, badge generation)
- **`packages/core`**: Pure TypeScript engine (sources, classifier, prescriber, scanner)
- **`packages/mcp`**: MCP server (`revenant-mcp`) with scan, classify, prescribe, and verify tools
- **`power/`**: Revenant Kiro power (Agent Plugins format)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build all packages
pnpm build

# Start web dev server
pnpm dev
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL`: PostgreSQL connection string (Neon recommended)
- `GITHUB_TOKEN`: GitHub personal access token for repo metadata
- Other API and feature flags as needed

## License

MIT
