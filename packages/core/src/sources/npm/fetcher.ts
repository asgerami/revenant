// npm registry fetcher with caching and retry

import { MemoryCache } from '../../cache.js';
import { fetchWithRetry } from '../../utils/retry.js';

export interface NpmPackageMetadata {
  name: string;
  'dist-tags': {
    latest: string;
  };
  versions: {
    [version: string]: {
      deprecated?: string;
    };
  };
  time: {
    modified: string;
    [version: string]: string;
  };
}

export interface NpmLatestMetadata {
  name: string;
  version: string;
  repository?:
    | string
    | {
        type?: string;
        url?: string;
      };
}

const metadataCache = new MemoryCache<NpmPackageMetadata>();
const latestCache = new MemoryCache<NpmLatestMetadata>();

export async function fetchNpmMetadata(
  packageName: string
): Promise<NpmPackageMetadata> {
  const cacheKey = `npm:metadata:${packageName}`;
  const cached = metadataCache.get(cacheKey);
  if (cached) return cached;

  const result = await fetchWithRetry(async () => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.npm.install-v1+json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `npm registry returned ${response.status} for ${packageName}`
      );
    }

    return (await response.json()) as NpmPackageMetadata;
  });

  metadataCache.set(cacheKey, result);
  return result;
}

export async function fetchNpmLatest(
  packageName: string
): Promise<NpmLatestMetadata> {
  const cacheKey = `npm:latest:${packageName}`;
  const cached = latestCache.get(cacheKey);
  if (cached) return cached;

  const result = await fetchWithRetry(async () => {
    const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `npm registry returned ${response.status} for ${packageName}/latest`
      );
    }

    return (await response.json()) as NpmLatestMetadata;
  });

  latestCache.set(cacheKey, result);
  return result;
}

export function clearNpmCache(): void {
  metadataCache.clear();
  latestCache.clear();
}
