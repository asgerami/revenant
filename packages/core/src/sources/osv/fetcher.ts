// OSV API fetcher with batching, caching, and retry

import { MemoryCache } from '../../cache.js';
import { fetchWithRetry } from '../../utils/retry.js';

export interface OSVQuery {
  package: {
    name: string;
    ecosystem: string;
  };
  version: string;
}

export interface OSVVulnerability {
  id: string;
  summary?: string;
  details?: string;
  severity?: Array<{
    type: string;
    score: string;
  }>;
  affected?: Array<{
    package: {
      name: string;
      ecosystem: string;
    };
    ranges?: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
    versions?: string[];
  }>;
  database_specific?: {
    severity?: string;
  };
}

export interface OSVQueryBatchResponse {
  results: Array<{
    vulns: OSVVulnerability[];
  }>;
}

const osvCache = new MemoryCache<OSVVulnerability[]>();

export async function fetchOSVVulnerabilities(
  packageName: string,
  version: string
): Promise<OSVVulnerability[]> {
  const cacheKey = `osv:${packageName}@${version}`;
  const cached = osvCache.get(cacheKey);
  if (cached) return cached;

  try {
    const result = await fetchWithRetry(async () => {
      const response = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          package: {
            name: packageName,
            ecosystem: 'npm',
          },
          version,
        }),
      });

      if (!response.ok) {
        throw new Error(`OSV API returned ${response.status}`);
      }

      const data = (await response.json()) as { vulns?: OSVVulnerability[] };
      return data.vulns || [];
    });

    osvCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn(`Failed to fetch OSV data for ${packageName}@${version}:`, error);
    return [];
  }
}

export async function fetchOSVVulnerabilitiesBatch(
  packages: Array<{ name: string; version: string }>
): Promise<Map<string, OSVVulnerability[]>> {
  const results = new Map<string, OSVVulnerability[]>();

  // Check cache first
  const uncached: Array<{ name: string; version: string }> = [];
  for (const pkg of packages) {
    const cacheKey = `osv:${pkg.name}@${pkg.version}`;
    const cached = osvCache.get(cacheKey);
    if (cached) {
      results.set(`${pkg.name}@${pkg.version}`, cached);
    } else {
      uncached.push(pkg);
    }
  }

  if (uncached.length === 0) {
    return results;
  }

  // OSV querybatch supports up to 1000 queries per request
  const batchSize = 1000;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const batchResults = await fetchBatch(batch);

    for (const [key, vulns] of batchResults) {
      results.set(key, vulns);
    }
  }

  return results;
}

async function fetchBatch(
  packages: Array<{ name: string; version: string }>
): Promise<Map<string, OSVVulnerability[]>> {
  const results = new Map<string, OSVVulnerability[]>();

  const queries: OSVQuery[] = packages.map((pkg) => ({
    package: {
      name: pkg.name,
      ecosystem: 'npm',
    },
    version: pkg.version,
  }));

  try {
    const response = await fetchWithRetry(async () => {
      const res = await fetch('https://api.osv.dev/v1/querybatch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queries }),
      });

      if (!res.ok) {
        throw new Error(`OSV API returned ${res.status}`);
      }

      return (await res.json()) as OSVQueryBatchResponse;
    });

    // Map results back to packages
    packages.forEach((pkg, idx) => {
      const vulns = response.results[idx]?.vulns || [];
      const key = `${pkg.name}@${pkg.version}`;
      results.set(key, vulns);

      const cacheKey = `osv:${pkg.name}@${pkg.version}`;
      osvCache.set(cacheKey, vulns);
    });
  } catch (error) {
    console.warn('OSV batch fetch failed:', error);
    // Return empty arrays for all packages in this batch
    packages.forEach((pkg) => {
      const key = `${pkg.name}@${pkg.version}`;
      results.set(key, []);
    });
  }

  return results;
}

export function clearOSVCache(): void {
  osvCache.clear();
}
