import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseNpmMetadata,
  parseNpmLatest,
  combineNpmSignals,
} from './parser.js';
import type { NpmPackageMetadata, NpmLatestMetadata } from './fetcher.js';

function loadFixture(name: string): any {
  const fixturePath = join(process.cwd(), '../../fixtures', `${name}.json`);
  const content = readFileSync(fixturePath, 'utf-8');
  return JSON.parse(content);
}

describe('npm parser', () => {
  describe('parseNpmMetadata', () => {
    it('should parse non-deprecated package metadata', () => {
      const fixture = loadFixture('lodash@4.17.21');
      const metadata = fixture.npm.metadata as NpmPackageMetadata;

      const result = parseNpmMetadata(metadata, '4.17.21');

      expect(result.deprecatedMessage).toBeNull();
      expect(result.lastPublishAt).toEqual(new Date('2021-02-20T19:00:00.000Z'));
    });

    it('should parse deprecated package metadata', () => {
      const fixture = loadFixture('deprecated-pkg@1.0.0');
      const metadata = fixture.npm.metadata as NpmPackageMetadata;

      const result = parseNpmMetadata(metadata, '1.0.0');

      expect(result.deprecatedMessage).toBe(
        'This package is deprecated. Use new-pkg instead.'
      );
      expect(result.lastPublishAt).toEqual(new Date('2020-01-01T00:00:00.000Z'));
    });
  });

  describe('parseNpmLatest', () => {
    it('should parse GitHub repository URL from object format', () => {
      const fixture = loadFixture('lodash@4.17.21');
      const latest = fixture.npm.latest as NpmLatestMetadata;

      const result = parseNpmLatest(latest);

      expect(result.repoUrl).toBe('https://github.com/lodash/lodash');
    });

    it('should normalize git+https URLs', () => {
      const latest: NpmLatestMetadata = {
        name: 'test',
        version: '1.0.0',
        repository: {
          type: 'git',
          url: 'git+https://github.com/user/repo.git',
        },
      };

      const result = parseNpmLatest(latest);

      expect(result.repoUrl).toBe('https://github.com/user/repo');
    });

    it('should normalize git:// URLs', () => {
      const latest: NpmLatestMetadata = {
        name: 'test',
        version: '1.0.0',
        repository: {
          url: 'git://github.com/user/repo.git',
        },
      };

      const result = parseNpmLatest(latest);

      expect(result.repoUrl).toBe('https://github.com/user/repo');
    });

    it('should normalize github: shorthand', () => {
      const latest: NpmLatestMetadata = {
        name: 'test',
        version: '1.0.0',
        repository: 'github:user/repo',
      };

      const result = parseNpmLatest(latest);

      expect(result.repoUrl).toBe('https://github.com/user/repo');
    });

    it('should handle missing repository', () => {
      const latest: NpmLatestMetadata = {
        name: 'test',
        version: '1.0.0',
      };

      const result = parseNpmLatest(latest);

      expect(result.repoUrl).toBeNull();
    });
  });

  describe('combineNpmSignals', () => {
    it('should combine all npm signals', () => {
      const fixture = loadFixture('lodash@4.17.21');
      const metadata = fixture.npm.metadata as NpmPackageMetadata;
      const latest = fixture.npm.latest as NpmLatestMetadata;

      const result = combineNpmSignals(metadata, latest, '4.17.21');

      expect(result.deprecatedMessage).toBeNull();
      expect(result.lastPublishAt).toEqual(new Date('2021-02-20T19:00:00.000Z'));
      expect(result.repoUrl).toBe('https://github.com/lodash/lodash');
    });
  });
});
