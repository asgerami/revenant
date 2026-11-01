import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseDownloads } from './parser.js';

function loadFixture(name: string): any {
  const fixturePath = join(process.cwd(), '../../fixtures', `${name}.json`);
  const content = readFileSync(fixturePath, 'utf-8');
  return JSON.parse(content);
}

describe('npm downloads parser', () => {
  describe('parseDownloads', () => {
    it('should parse download count', () => {
      const fixture = loadFixture('lodash@4.17.21');
      const downloads = fixture.downloads.downloads;

      const result = parseDownloads(downloads);

      expect(result.weeklyDownloads).toBe(45000000);
    });

    it('should handle null downloads', () => {
      const result = parseDownloads(null);

      expect(result.weeklyDownloads).toBeNull();
    });

    it('should handle zero downloads', () => {
      const result = parseDownloads(0);

      expect(result.weeklyDownloads).toBe(0);
    });
  });
});
