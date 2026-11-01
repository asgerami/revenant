# @revenant/core

Pure TypeScript engine for detecting and classifying package lifecycle states. No framework dependencies.

## Features

- **Multiple data sources**: npm registry, npm downloads, GitHub GraphQL, OSV
- **Caching**: In-memory cache with 24h TTL (Postgres caching ready for integration)
- **Retry with backoff**: Automatic retry for transient failures
- **Batching**: Efficient batch fetching for GitHub and OSV APIs
- **Lockfile support**: Parse pnpm, npm, and yarn lockfiles to resolve versions
- **Type-safe**: Strict TypeScript with comprehensive type definitions

## Data Sources

### npm Registry
- Abbreviated metadata with `Accept: application/vnd.npm.install-v1+json`
- Fetches: versions, deprecated status, last publish date
- Latest endpoint for repository URL

### npm Downloads API
- Weekly download counts
- Bulk fetching for unscoped packages (up to 128 at a time)
- Individual fetching for scoped packages

### GitHub GraphQL API
- Batched queries (up to 50 repos per request)
- Fetches: archived status, disabled status, last commit date, latest release
- Requires `GITHUB_TOKEN` environment variable

### OSV (Open Source Vulnerabilities)
- Querybatch endpoint (up to 1000 queries per request)
- Fetches: vulnerability ID, severity, fix availability
- Supports npm ecosystem

## Usage

```typescript
import { fetchPackageSignals, fetchPackageSignalsBatch } from '@revenant/core';

// Fetch signals for a single package
const signals = await fetchPackageSignals('lodash', '4.17.21', {
  githubToken: process.env.GITHUB_TOKEN,
});

console.log(signals);
// {
//   name: 'lodash',
//   resolvedVersion: '4.17.21',
//   deprecatedMessage: null,
//   lastPublishAt: Date,
//   repoUrl: 'https://github.com/lodash/lodash',
//   repoStatus: 'ok',
//   lastCommitAt: Date,
//   weeklyDownloads: 45000000,
//   vulns: [],
//   e18e: null,
//   fetchedAt: Date
// }

// Fetch signals for multiple packages (batched)
const packagesSignals = await fetchPackageSignalsBatch([
  { name: 'lodash', version: '4.17.21' },
  { name: 'express', version: '4.18.2' },
], {
  githubToken: process.env.GITHUB_TOKEN,
  parallelLimit: 8,
});

for (const [key, signals] of packagesSignals) {
  console.log(`${key}:`, signals.repoStatus);
}
```

## Lockfile Parsing

```typescript
import { parseLockfile, detectLockfileType, resolveVersion } from '@revenant/core';

// Parse a lockfile
const lockfileContent = await readFile('pnpm-lock.yaml', 'utf-8');
const type = detectLockfileType([{ name: 'pnpm-lock.yaml', content: lockfileContent }]);
const versions = parseLockfile(lockfileContent, type);

// Resolve a version
const resolved = resolveVersion('lodash', '^4.17.0', versions);
console.log(resolved); // '4.17.21'
```

## Cache Management

```typescript
import { clearAllCaches, clearNpmCache, clearDownloadsCache } from '@revenant/core';

// Clear all caches
clearAllCaches();

// Clear specific cache
clearNpmCache();
```

## Recording Fixtures

Record API responses for testing:

```bash
pnpm record-fixture lodash 4.17.21
```

This creates a fixture file in `fixtures/` with responses from all data sources.

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Type check
pnpm typecheck

# Build
pnpm build
```

## Architecture

- `src/types.ts`: Core type definitions (PackageSignals, LifecycleVerdict, etc.)
- `src/cache.ts`: In-memory cache with TTL
- `src/utils/retry.ts`: Retry utility with exponential backoff
- `src/sources/`: Data source implementations
  - `npm/`: npm registry fetcher and parser
  - `npm-downloads/`: npm downloads API
  - `github/`: GitHub GraphQL API
  - `osv/`: OSV vulnerability database
  - `index.ts`: Aggregated fetching functions
- `src/lockfile/`: Lockfile parsers
  - `pnpm.ts`: pnpm-lock.yaml parser
  - `npm.ts`: package-lock.json parser
  - `yarn.ts`: yarn.lock parser
  - `index.ts`: Lockfile detection and resolution

## Environment Variables

```bash
# Required for GitHub data
GITHUB_TOKEN=ghp_...

# Optional configuration
API_TIMEOUT_MS=10000
CACHE_TTL_HOURS=24
```

## Rate Limits

- npm registry: No documented limit, be respectful
- npm downloads: Bulk endpoint supports comma-separated packages
- GitHub GraphQL: 5000 points per hour (batching uses 1 point per 50 repos)
- OSV: No documented limit, batching recommended

## License

MIT
