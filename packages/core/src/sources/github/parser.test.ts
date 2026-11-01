import { describe, it, expect } from 'vitest';
import { parseGitHubRepo } from './parser.js';
import type { GitHubRepoData } from './fetcher.js';

describe('GitHub parser', () => {
  describe('parseGitHubRepo', () => {
    it('should parse active repository', () => {
      const data: GitHubRepoData = {
        owner: 'lodash',
        name: 'lodash',
        isArchived: false,
        isDisabled: false,
        pushedAt: '2023-10-15T12:00:00Z',
        latestRelease: {
          tagName: 'v4.17.21',
          publishedAt: '2021-02-20T00:00:00Z',
        },
      };

      const result = parseGitHubRepo(data);

      expect(result.repoStatus).toBe('ok');
      expect(result.lastCommitAt).toEqual(new Date('2023-10-15T12:00:00Z'));
    });

    it('should detect archived repository', () => {
      const data: GitHubRepoData = {
        owner: 'user',
        name: 'archived-repo',
        isArchived: true,
        isDisabled: false,
        pushedAt: '2020-01-01T00:00:00Z',
        latestRelease: null,
      };

      const result = parseGitHubRepo(data);

      expect(result.repoStatus).toBe('archived');
      expect(result.lastCommitAt).toEqual(new Date('2020-01-01T00:00:00Z'));
    });

    it('should detect disabled repository', () => {
      const data: GitHubRepoData = {
        owner: 'user',
        name: 'disabled-repo',
        isArchived: false,
        isDisabled: true,
        pushedAt: null,
        latestRelease: null,
      };

      const result = parseGitHubRepo(data);

      expect(result.repoStatus).toBe('disabled');
      expect(result.lastCommitAt).toBeNull();
    });

    it('should handle missing repository data', () => {
      const result = parseGitHubRepo(null);

      expect(result.repoStatus).toBe('missing');
      expect(result.lastCommitAt).toBeNull();
    });

    it('should handle repository with no commits', () => {
      const data: GitHubRepoData = {
        owner: 'user',
        name: 'new-repo',
        isArchived: false,
        isDisabled: false,
        pushedAt: null,
        latestRelease: null,
      };

      const result = parseGitHubRepo(data);

      expect(result.repoStatus).toBe('ok');
      expect(result.lastCommitAt).toBeNull();
    });
  });
});
