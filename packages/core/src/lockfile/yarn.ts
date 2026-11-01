// yarn.lock parser

export function parseYarnLockfile(content: string): Map<string, string> {
  const versions = new Map<string, string>();

  try {
    const lines = content.split('\n');
    let currentPackage: string | null = null;

    for (const line of lines) {
      // Package entry: "name@range", "@scope/name@range", or "name@npm:version"
      // Handle both quoted and unquoted forms
      if (!line.startsWith('  ') && line.includes('@')) {
        // Try to extract package name - handle scoped and unscoped packages
        const quotedScopedMatch = line.match(/^"(@[^/]+\/[^@"]+)@/);
        const quotedUnscopedMatch = line.match(/^"([^@"]+)@/);
        const unscopedMatch = line.match(/^([^@\s]+)@/);
        
        if (quotedScopedMatch && quotedScopedMatch[1]) {
          currentPackage = quotedScopedMatch[1];
        } else if (quotedUnscopedMatch && quotedUnscopedMatch[1]) {
          currentPackage = quotedUnscopedMatch[1];
        } else if (unscopedMatch && unscopedMatch[1] && !unscopedMatch[1].includes(' ')) {
          currentPackage = unscopedMatch[1];
        }
      }

      // Version line: "  version "1.2.3""
      if (currentPackage && line.trim().startsWith('version ')) {
        const versionMatch = line.match(/version\s+"?([^"\s]+)"?/);
        if (versionMatch && versionMatch[1]) {
          versions.set(currentPackage, versionMatch[1]);
          currentPackage = null;
        }
      }
    }
  } catch (error) {
    console.warn('Failed to parse yarn.lock:', error);
  }

  return versions;
}
