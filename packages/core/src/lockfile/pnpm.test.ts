import { describe, it, expect } from 'vitest';
import { parsePnpmLockfile } from './pnpm.js';

describe('pnpm lockfile parser', () => {
  it('should parse v6+ format with dependencies', () => {
    const lockfile = `
lockfileVersion: '6.0'

dependencies:
  lodash:
    specifier: ^4.17.21
    version: 4.17.21
  react:
    specifier: ^18.2.0
    version: 18.2.0

devDependencies:
  typescript:
    specifier: ^5.0.0
    version: 5.3.3
`;

    const result = parsePnpmLockfile(lockfile);

    expect(result.get('lodash')).toBe('4.17.21');
    expect(result.get('react')).toBe('18.2.0');
    expect(result.get('typescript')).toBe('5.3.3');
  });

  it('should parse older format with packages', () => {
    const lockfile = `
lockfileVersion: 5.4

packages:
  /lodash@4.17.21:
    version: 4.17.21
    resolution: {integrity: sha512-...}
  /@types/node@20.11.0:
    version: 20.11.0
    resolution: {integrity: sha512-...}
`;

    const result = parsePnpmLockfile(lockfile);

    expect(result.get('lodash')).toBe('4.17.21');
    expect(result.get('@types/node')).toBe('20.11.0');
  });

  it('should handle peer dependency versions with parentheses', () => {
    const lockfile = `
lockfileVersion: '6.0'

dependencies:
  react-dom:
    specifier: ^18.2.0
    version: 18.2.0(react@18.2.0)
`;

    const result = parsePnpmLockfile(lockfile);

    expect(result.get('react-dom')).toBe('18.2.0');
  });

  it('should ignore link: and file: versions', () => {
    const lockfile = `
lockfileVersion: '6.0'

dependencies:
  local-pkg:
    specifier: workspace:*
    version: link:packages/core
  file-pkg:
    specifier: file:./local
    version: file:local
`;

    const result = parsePnpmLockfile(lockfile);

    expect(result.has('local-pkg')).toBe(false);
    expect(result.has('file-pkg')).toBe(false);
  });

  it('should handle empty lockfile', () => {
    const lockfile = `
lockfileVersion: '6.0'
`;

    const result = parsePnpmLockfile(lockfile);

    expect(result.size).toBe(0);
  });

  it('should handle malformed YAML gracefully', () => {
    const lockfile = 'invalid: yaml: content: [[[';

    const result = parsePnpmLockfile(lockfile);

    expect(result.size).toBe(0);
  });
});
