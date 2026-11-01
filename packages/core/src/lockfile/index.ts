// Lockfile reader - detects and parses lockfiles to resolve versions

import { parsePnpmLockfile } from './pnpm.js';
import { parseNpmLockfile } from './npm.js';
import { parseYarnLockfile } from './yarn.js';

export type LockfileType = 'pnpm' | 'npm' | 'yarn' | 'none';

export function detectLockfileType(
  files: { name: string; content: string }[]
): LockfileType {
  for (const file of files) {
    if (file.name === 'pnpm-lock.yaml') return 'pnpm';
    if (file.name === 'package-lock.json') return 'npm';
    if (file.name === 'yarn.lock') return 'yarn';
  }
  return 'none';
}

export function parseLockfile(content: string, type: LockfileType): Map<string, string> {
  switch (type) {
    case 'pnpm':
      return parsePnpmLockfile(content);
    case 'npm':
      return parseNpmLockfile(content);
    case 'yarn':
      return parseYarnLockfile(content);
    case 'none':
      return new Map();
  }
}

export function resolveVersion(
  packageName: string,
  range: string,
  lockfileVersions: Map<string, string>
): string {
  // Try lockfile first
  const locked = lockfileVersions.get(packageName);
  if (locked) return locked;

  // Fallback: if range is exact version, use it
  if (/^[0-9]/.test(range) && !range.includes('^') && !range.includes('~')) {
    return range;
  }

  // Otherwise return the range itself - caller will need to resolve it
  return range;
}
