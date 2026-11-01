// npm downloads API fetcher with caching and retry

import { MemoryCache } from '../../cache.js';
import { fetchWithRetry } from '../../utils/retry.js';

export interface NpmDownloadsResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface NpmBulkDownloadsResponse {
  [packageName: string]: {
    downloads: number;
    start: string;
    end: string;
    package: string;
  };
}

const downloadsCache = new MemoryCache<number>();

export async function fetchNpmDownloads(packageName: string): Promise<number | null> {
  const cacheKey = `npm-downloads:${packageName}`;
  const cached = downloadsCache.get(cacheKey);
  if (cached !== null) return cached;

  try {
    const result = await fetchWithRetry(async () => {
      const url = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
      const response = await fetch(url);

      if (!response.ok) {
        // npm downloads API returns 404 for packages with no downloads
        if (response.status === 404) {
          return 0;
        }
        throw new Error(
          `npm downloads API returned ${response.status} for ${packageName}`
        );
      }

      const data = (await response.json()) as NpmDownloadsResponse;
      return data.downloads;
    });

    downloadsCache.set(cacheKey, result);
    return result;
  } catch (error) {
    // If we fail to fetch downloads, return null rather than failing the whole scan
    console.warn(`Failed to fetch downloads for ${packageName}:`, error);
    return null;
  }
}

export async function fetchNpmDownloadsBulk(
  packageNames: string[]
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();

  // Separate scoped and unscoped packages
  const unscopedPackages = packageNames.filter((name) => !name.startsWith('@'));
  const scopedPackages = packageNames.filter((name) => name.startsWith('@'));

  // Fetch unscoped packages in bulk (up to 128 at a time per API limit)
  const chunkSize = 128;
  for (let i = 0; i < unscopedPackages.length; i += chunkSize) {
    const chunk = unscopedPackages.slice(i, i + chunkSize);
    const bulkResults = await fetchBulkChunk(chunk);
    for (const [name, downloads] of bulkResults) {
      results.set(name, downloads);
    }
  }

  // Fetch scoped packages individually (bulk API doesn't support them)
  for (const packageName of scopedPackages) {
    const downloads = await fetchNpmDownloads(packageName);
    results.set(packageName, downloads);
  }

  return results;
}

async function fetchBulkChunk(packageNames: string[]): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();

  // Check cache first
  const uncached: string[] = [];
  for (const name of packageNames) {
    const cacheKey = `npm-downloads:${name}`;
    const cached = downloadsCache.get(cacheKey);
    if (cached !== null) {
      results.set(name, cached);
    } else {
      uncached.push(name);
    }
  }

  if (uncached.length === 0) {
    return results;
  }

  try {
    const bulkData = await fetchWithRetry(async () => {
      const packageList = uncached.join(',');
      const url = `https://api.npmjs.org/downloads/point/last-week/${packageList}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`npm downloads API returned ${response.status}`);
      }

      return (await response.json()) as NpmBulkDownloadsResponse;
    });

    // Process bulk response
    for (const name of uncached) {
      const data = bulkData[name];
      const downloads = data?.downloads ?? 0;
      results.set(name, downloads);
      downloadsCache.set(`npm-downloads:${name}`, downloads);
    }
  } catch (error) {
    console.warn('Bulk downloads fetch failed, falling back to individual:', error);
    // Fallback to individual fetches
    for (const name of uncached) {
      const downloads = await fetchNpmDownloads(name);
      results.set(name, downloads);
    }
  }

  return results;
}

export function clearDownloadsCache(): void {
  downloadsCache.clear();
}
