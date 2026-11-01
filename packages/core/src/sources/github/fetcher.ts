// GitHub GraphQL API fetcher with batching, caching, and retry

import { MemoryCache } from '../../cache.js';
import { fetchWithRetry } from '../../utils/retry.js';

export interface GitHubRepoData {
  owner: string;
  name: string;
  isArchived: boolean;
  isDisabled: boolean;
  pushedAt: string | null;
  latestRelease: {
    tagName: string;
    publishedAt: string;
  } | null;
}

export interface GitHubBatchResponse {
  data: {
    [key: string]: {
      isArchived: boolean;
      isDisabled: boolean;
      pushedAt: string | null;
      latestRelease: {
        tagName: string;
        publishedAt: string;
      } | null;
    } | null;
  };
  errors?: Array<{ message: string }>;
}

const repoCache = new MemoryCache<GitHubRepoData>();

export function parseGitHubUrl(url: string): { owner: string; name: string } | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname !== 'github.com') return null;

    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;

    const owner = parts[0];
    const name = parts[1];
    
    if (!owner || !name) return null;

    return { owner, name };
  } catch {
    return null;
  }
}

export async function fetchGitHubRepos(
  repoUrls: string[],
  token: string | undefined
): Promise<Map<string, GitHubRepoData | null>> {
  if (!token) {
    console.warn('GITHUB_TOKEN not set, GitHub data will be unavailable');
    return new Map(repoUrls.map((url) => [url, null]));
  }

  const results = new Map<string, GitHubRepoData | null>();

  // Parse URLs and check cache
  const uncached: Array<{ url: string; owner: string; name: string }> = [];

  for (const url of repoUrls) {
    const parsed = parseGitHubUrl(url);
    if (!parsed) {
      results.set(url, null);
      continue;
    }

    const cacheKey = `github:${parsed.owner}/${parsed.name}`;
    const cached = repoCache.get(cacheKey);
    if (cached) {
      results.set(url, cached);
    } else {
      uncached.push({ url, ...parsed });
    }
  }

  if (uncached.length === 0) {
    return results;
  }

  // Batch fetch in groups of 50
  const batchSize = 50;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const batchResults = await fetchBatch(batch, token);

    for (const item of batch) {
      const data = batchResults.get(`${item.owner}/${item.name}`);
      results.set(item.url, data || null);

      if (data) {
        const cacheKey = `github:${item.owner}/${item.name}`;
        repoCache.set(cacheKey, data);
      }
    }
  }

  return results;
}

async function fetchBatch(
  repos: Array<{ owner: string; name: string }>,
  token: string
): Promise<Map<string, GitHubRepoData | null>> {
  const results = new Map<string, GitHubRepoData | null>();

  // Build GraphQL query with aliases
  const queries = repos
    .map((repo, idx) => {
      const alias = `repo${idx}`;
      return `
        ${alias}: repository(owner: "${repo.owner}", name: "${repo.name}") {
          isArchived
          isDisabled
          pushedAt
          latestRelease {
            tagName
            publishedAt
          }
        }
      `;
    })
    .join('\n');

  const query = `
    query {
      ${queries}
    }
  `;

  try {
    const response = await fetchWithRetry(async () => {
      const res = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`GitHub API returned ${res.status}`);
      }

      return (await res.json()) as GitHubBatchResponse;
    });

    if (response.errors) {
      console.warn('GitHub GraphQL errors:', response.errors);
    }

    // Parse results
    repos.forEach((repo, idx) => {
      const alias = `repo${idx}`;
      const data = response.data[alias];

      if (data) {
        results.set(`${repo.owner}/${repo.name}`, {
          owner: repo.owner,
          name: repo.name,
          isArchived: data.isArchived,
          isDisabled: data.isDisabled,
          pushedAt: data.pushedAt,
          latestRelease: data.latestRelease,
        });
      } else {
        results.set(`${repo.owner}/${repo.name}`, null);
      }
    });
  } catch (error) {
    console.warn('GitHub batch fetch failed:', error);
    // Return null for all repos in this batch
    repos.forEach((repo) => {
      results.set(`${repo.owner}/${repo.name}`, null);
    });
  }

  return results;
}

export function clearGitHubCache(): void {
  repoCache.clear();
}
