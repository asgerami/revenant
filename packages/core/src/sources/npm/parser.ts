// npm registry parser - transforms API responses into PackageSignals fields

import type { NpmPackageMetadata, NpmLatestMetadata } from './fetcher.js';

export interface NpmSignals {
  deprecatedMessage: string | null;
  lastPublishAt: Date | null;
  repoUrl: string | null;
}

export function parseNpmMetadata(
  metadata: NpmPackageMetadata,
  resolvedVersion: string
): { deprecatedMessage: string | null; lastPublishAt: Date | null } {
  const versionData = metadata.versions[resolvedVersion];
  const deprecatedMessage = versionData?.deprecated || null;

  const modified = metadata.time?.modified;
  const lastPublishAt = modified ? new Date(modified) : null;

  return {
    deprecatedMessage,
    lastPublishAt,
  };
}

export function parseNpmLatest(latest: NpmLatestMetadata): { repoUrl: string | null } {
  if (!latest.repository) {
    return { repoUrl: null };
  }

  let url: string | null = null;

  if (typeof latest.repository === 'string') {
    url = latest.repository;
  } else if (typeof latest.repository === 'object' && latest.repository.url) {
    url = latest.repository.url;
  }

  if (!url) {
    return { repoUrl: null };
  }

  // Normalize GitHub URLs
  // git+https://github.com/owner/repo.git -> https://github.com/owner/repo
  // git://github.com/owner/repo.git -> https://github.com/owner/repo
  // github:owner/repo -> https://github.com/owner/repo

  if (url.startsWith('github:')) {
    url = `https://github.com/${url.slice(7)}`;
  }

  if (url.startsWith('git+')) {
    url = url.slice(4);
  }

  if (url.startsWith('git://')) {
    url = url.replace('git://', 'https://');
  }

  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  return { repoUrl: url };
}

export function combineNpmSignals(
  metadata: NpmPackageMetadata,
  latest: NpmLatestMetadata,
  resolvedVersion: string
): NpmSignals {
  const { deprecatedMessage, lastPublishAt } = parseNpmMetadata(metadata, resolvedVersion);
  const { repoUrl } = parseNpmLatest(latest);

  return {
    deprecatedMessage,
    lastPublishAt,
    repoUrl,
  };
}
