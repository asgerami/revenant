// Aggregated source fetching and parsing

import type { PackageSignals } from '../types.js';
import { fetchNpmMetadata, fetchNpmLatest } from './npm/fetcher.js';
import { combineNpmSignals } from './npm/parser.js';
import { fetchNpmDownloadsBulk } from './npm-downloads/fetcher.js';
import { parseDownloads } from './npm-downloads/parser.js';
import { fetchGitHubRepos } from './github/fetcher.js';
import { parseGitHubRepo } from './github/parser.js';
import { fetchOSVVulnerabilitiesBatch } from './osv/fetcher.js';
import { parseOSVVulnerabilities } from './osv/parser.js';

export interface FetchOptions {
  githubToken?: string;
  parallelLimit?: number;
}

/**
 * Fetch all signals for a single package
 */
export async function fetchPackageSignals(
  packageName: string,
  resolvedVersion: string,
  options: FetchOptions = {}
): Promise<PackageSignals> {
  const fetchedAt = new Date();

  // Fetch npm data
  const [npmMetadata, npmLatest] = await Promise.all([
    fetchNpmMetadata(packageName),
    fetchNpmLatest(packageName),
  ]);

  const npmSignals = combineNpmSignals(npmMetadata, npmLatest, resolvedVersion);

  // Fetch downloads
  const downloadsMap = await fetchNpmDownloadsBulk([packageName]);
  const downloads = downloadsMap.get(packageName) ?? null;
  const downloadsSignals = parseDownloads(downloads);

  // Fetch GitHub data if repo URL is available
  let githubSignals: {
    repoStatus: 'ok' | 'archived' | 'disabled' | 'missing' | 'unknown';
    lastCommitAt: Date | null;
  } = {
    repoStatus: 'unknown',
    lastCommitAt: null,
  };

  if (npmSignals.repoUrl) {
    const githubMap = await fetchGitHubRepos([npmSignals.repoUrl], options.githubToken);
    const githubData = githubMap.get(npmSignals.repoUrl);
    githubSignals = parseGitHubRepo(githubData || null);
  }

  // Fetch OSV vulnerabilities
  const osvMap = await fetchOSVVulnerabilitiesBatch([
    { name: packageName, version: resolvedVersion },
  ]);
  const osvVulns = osvMap.get(`${packageName}@${resolvedVersion}`) || [];
  const osvSignals = parseOSVVulnerabilities(osvVulns);

  // Combine all signals
  return {
    name: packageName,
    resolvedVersion,
    deprecatedMessage: npmSignals.deprecatedMessage,
    lastPublishAt: npmSignals.lastPublishAt,
    repoUrl: npmSignals.repoUrl,
    repoStatus: githubSignals.repoStatus,
    lastCommitAt: githubSignals.lastCommitAt,
    weeklyDownloads: downloadsSignals.weeklyDownloads,
    vulns: osvSignals.vulns,
    e18e: null, // Will be populated by e18e integration
    fetchedAt,
  };
}

/**
 * Fetch signals for multiple packages in parallel with batching
 */
export async function fetchPackageSignalsBatch(
  packages: Array<{ name: string; version: string }>,
  options: FetchOptions = {}
): Promise<Map<string, PackageSignals>> {
  const results = new Map<string, PackageSignals>();
  const { parallelLimit = 8 } = options;

  // Process in chunks to respect rate limits
  for (let i = 0; i < packages.length; i += parallelLimit) {
    const chunk = packages.slice(i, i + parallelLimit);

    const chunkResults = await Promise.all(
      chunk.map(async (pkg) => {
        try {
          const signals = await fetchPackageSignals(pkg.name, pkg.version, options);
          return { key: `${pkg.name}@${pkg.version}`, signals };
        } catch (error) {
          console.error(`Failed to fetch signals for ${pkg.name}@${pkg.version}:`, error);
          return null;
        }
      })
    );

    for (const result of chunkResults) {
      if (result) {
        results.set(result.key, result.signals);
      }
    }
  }

  return results;
}

// Re-export cache clearing functions
export { clearNpmCache } from './npm/fetcher.js';
export { clearDownloadsCache } from './npm-downloads/fetcher.js';
export { clearGitHubCache } from './github/fetcher.js';
export { clearOSVCache } from './osv/fetcher.js';

export function clearAllCaches(): void {
  const { clearNpmCache } = require('./npm/fetcher.js');
  const { clearDownloadsCache } = require('./npm-downloads/fetcher.js');
  const { clearGitHubCache } = require('./github/fetcher.js');
  const { clearOSVCache } = require('./osv/fetcher.js');

  clearNpmCache();
  clearDownloadsCache();
  clearGitHubCache();
  clearOSVCache();
}
