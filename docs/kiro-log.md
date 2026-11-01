# Kiro Development Log

This file tracks how Kiro was used to build Revenant, for the hackathon submission write-up.

## Session 1: Initial Setup

- Created pnpm workspaces monorepo structure
- Set up packages/core with TypeScript, Vitest, ESLint
- Set up packages/mcp with MCP SDK and stdio transport
- Set up apps/web with Next.js 14 App Router, Tailwind CSS
- Added root-level scripts for build, test, typecheck, lint
- Created .env.example with database and API configuration
- Added README with project overview
- 2026-11-01 | setup | Kiro (Haiku) invented a non-existent version, module-replacements@^1.1.0, which broke pnpm install. Fixed versions and added a steering rule in tech.md to always check real versions with npm view.
