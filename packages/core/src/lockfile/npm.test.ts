import { describe, it, expect } from 'vitest';
import { parseNpmLockfile } from './npm.js';

describe('npm lockfile parser', () => {
  it('should parse lockfile v2+ format with packages', () => {
    const lockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 2,
      packages: {
        '': {
          name: 'test-project',
          version: '1.0.0',
        },
        'node_modules/lodash': {
          version: '4.17.21',
          resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
        },
        'node_modules/@types/node': {
          version: '20.11.0',
        },
      },
    });

    const result = parseNpmLockfile(lockfile);

    expect(result.get('lodash')).toBe('4.17.21');
    expect(result.get('@types/node')).toBe('20.11.0');
    expect(result.has('test-project')).toBe(false); // Root package should be skipped
  });

  it('should parse lockfile v1 format with dependencies', () => {
    const lockfile = JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
      lockfileVersion: 1,
      dependencies: {
        lodash: {
          version: '4.17.21',
          resolved: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
        },
        react: {
          version: '18.2.0',
        },
      },
    });

    const result = parseNpmLockfile(lockfile);

    expect(result.get('lodash')).toBe('4.17.21');
    expect(result.get('react')).toBe('18.2.0');
  });

  it('should handle empty lockfile', () => {
    const lockfile = JSON.stringify({
      lockfileVersion: 2,
      packages: {},
    });

    const result = parseNpmLockfile(lockfile);

    expect(result.size).toBe(0);
  });

  it('should handle malformed JSON gracefully', () => {
    const lockfile = '{ invalid json }';

    const result = parseNpmLockfile(lockfile);

    expect(result.size).toBe(0);
  });
});
