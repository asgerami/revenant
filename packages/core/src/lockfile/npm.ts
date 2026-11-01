// package-lock.json parser

interface NpmLockfile {
  lockfileVersion: number;
  dependencies?: {
    [name: string]: {
      version: string;
    };
  };
  packages?: {
    [key: string]: {
      version?: string;
    };
  };
}

export function parseNpmLockfile(content: string): Map<string, string> {
  const versions = new Map<string, string>();

  try {
    const lockfile = JSON.parse(content) as NpmLockfile;

    // v2+ format uses packages
    if (lockfile.packages) {
      for (const [key, data] of Object.entries(lockfile.packages)) {
        if (!data.version) continue;

        // Extract package name from key
        // "" = root package, skip
        // "node_modules/foo" = foo
        // "node_modules/@scope/pkg" = @scope/pkg
        if (key === '') continue;

        const name = key.replace(/^node_modules\//, '');
        versions.set(name, data.version);
      }
    }

    // v1 format uses dependencies
    if (lockfile.dependencies) {
      for (const [name, data] of Object.entries(lockfile.dependencies)) {
        if (data.version) {
          versions.set(name, data.version);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse package-lock.json:', error);
  }

  return versions;
}
