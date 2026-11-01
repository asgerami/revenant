import { describe, it, expect } from 'vitest';
import { parseOSVVulnerabilities } from './parser.js';
import type { OSVVulnerability } from './fetcher.js';

describe('OSV parser', () => {
  describe('parseOSVVulnerabilities', () => {
    it('should parse vulnerability with CVSS severity', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-1234-5678-9abc',
          summary: 'Test vulnerability',
          severity: [
            {
              type: 'CVSS_V3',
              score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/8.5',
            },
          ],
          affected: [
            {
              package: {
                name: 'test-pkg',
                ecosystem: 'npm',
              },
              ranges: [
                {
                  type: 'SEMVER',
                  events: [
                    { introduced: '0' },
                    { fixed: '2.0.0' },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns).toHaveLength(1);
      expect(result.vulns[0].id).toBe('GHSA-1234-5678-9abc');
      expect(result.vulns[0].severity).toBe('HIGH');
      expect(result.vulns[0].hasFix).toBe(true);
    });

    it('should classify CRITICAL severity correctly', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-critical',
          severity: [
            {
              type: 'CVSS_V3',
              score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/9.5',
            },
          ],
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].severity).toBe('CRITICAL');
    });

    it('should classify MODERATE severity correctly', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-moderate',
          severity: [
            {
              type: 'CVSS_V3',
              score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L/5.5',
            },
          ],
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].severity).toBe('MODERATE');
    });

    it('should classify LOW severity correctly', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-low',
          severity: [
            {
              type: 'CVSS_V3',
              score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N/3.5',
            },
          ],
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].severity).toBe('LOW');
    });

    it('should handle vulnerability with no fixed version', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-no-fix',
          severity: [
            {
              type: 'CVSS_V3',
              score: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/8.0',
            },
          ],
          affected: [
            {
              package: {
                name: 'test-pkg',
                ecosystem: 'npm',
              },
              ranges: [
                {
                  type: 'SEMVER',
                  events: [{ introduced: '0' }],
                },
              ],
            },
          ],
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].hasFix).toBe(false);
    });

    it('should handle empty vulnerability list', () => {
      const result = parseOSVVulnerabilities([]);

      expect(result.vulns).toHaveLength(0);
    });

    it('should fallback to database_specific severity', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-db-specific',
          database_specific: {
            severity: 'HIGH',
          },
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].severity).toBe('HIGH');
    });

    it('should handle unknown severity', () => {
      const vulns: OSVVulnerability[] = [
        {
          id: 'GHSA-unknown',
        },
      ];

      const result = parseOSVVulnerabilities(vulns);

      expect(result.vulns[0].severity).toBe('UNKNOWN');
    });
  });
});
