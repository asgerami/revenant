// pnpm-lock.yaml parser

import * as yaml from 'yaml';

interface PnpmLockfile {
  lockfileVersion: string | number;
  packages?: {
    [key: string]: {
      version?: string;
    };
  };
  dependencies?: {
    [name: string]: {
      version: string;
      specifier?: string;
    };
  };
  devDependencies?: {
    [name: string]: {
      version: string;
      specifier?: string;
    };
  };
}

export function parsePnpmLockfile(content: string): Map<string, string> {
  const versions = new Map<string, string>();

  try {
    const lockfile = yaml.parse(content) as PnpmLockfile;

    // Try new format first (v6+)
    if (lockfile.dependencies) {
      for (const [name, data] of Object.entries(lockfile.dependencies)) {
        const version = cleanVersion(data.version);
        if (version) {
          versions.set(name, version);
        }
      }
    }

    if (lockfile.devDependencies) {
      for (const [name, data] of Object.entries(lockfile.devDependencies)) {
        const version = cleanVersion(data.version);
        if (version) {
          versions.set(name, version);
        }
      }
    }

    // Fallback to packages (older format)
    if (lockfile.packages && versions.size === 0) {
      for (const [key, data] of Object.entries(lockfile.packages)) {
        // Match patterns like:
        // /lodash@4.17.21
        // /@types/node@20.11.0
        const unscopedMatch = key.match(/\/([^@/][^/]*)@(.+)$/);
        const scopedMatch = key.match(/\/((@[^/]+\/[^/]+))@(.+)$/);
        
        const match = scopedMatch || unscopedMatch;
        if (match && match[1] && data.version) {
          const name = match[1];
          const version = cleanVersion(data.version);
          if (version) {
            versions.set(name, version);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse pnpm-lock.yaml:', error);
  }

  return versions;
}

function cleanVersion(version: string): string {
  // Remove pnpm-specific prefixes like "link:" or "file:"
  if (version.startsWith('link:') || version.startsWith('file:')) {
    return '';
  }

  // Extract version from formats like "1.2.3(react@18.0.0)"
  const match = version.match(/^([0-9][^(]+)/);
  return match && match[1] ? match[1] : version;
}
