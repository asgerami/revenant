// GitHub parser - transforms GraphQL responses into PackageSignals fields

import type { GitHubRepoData } from './fetcher.js';

export type RepoStatus = 'ok' | 'archived' | 'disabled' | 'missing' | 'unknown';

export interface GitHubSignals {
  repoStatus: RepoStatus;
  lastCommitAt: Date | null;
}

export function parseGitHubRepo(data: GitHubRepoData | null): GitHubSignals {
  if (!data) {
    return {
      repoStatus: 'missing',
      lastCommitAt: null,
    };
  }

  let repoStatus: RepoStatus;
  if (data.isArchived) {
    repoStatus = 'archived';
  } else if (data.isDisabled) {
    repoStatus = 'disabled';
  } else {
    repoStatus = 'ok';
  }

  const lastCommitAt = data.pushedAt ? new Date(data.pushedAt) : null;

  return {
    repoStatus,
    lastCommitAt,
  };
}
