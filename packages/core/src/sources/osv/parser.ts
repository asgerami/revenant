// OSV parser - transforms vulnerability data into PackageSignals fields

import type { OSVVulnerability } from './fetcher.js';

export type VulnerabilitySeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

export interface ParsedVulnerability {
  id: string;
  severity: VulnerabilitySeverity;
  hasFix: boolean;
}

export interface OSVSignals {
  vulns: ParsedVulnerability[];
}

function parseSeverity(vuln: OSVVulnerability): VulnerabilitySeverity {
  // Check CVSS severity array first
  if (vuln.severity && vuln.severity.length > 0) {
    const cvss = vuln.severity.find((s) => s.type === 'CVSS_V3');
    if (cvss && cvss.score) {
      // Parse CVSS score (e.g., "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H")
      const scoreMatch = cvss.score.match(/CVSS:\d+\.\d+\/.*?([0-9.]+)/);
      if (scoreMatch && scoreMatch[1]) {
        const score = parseFloat(scoreMatch[1]);
        if (score >= 9.0) return 'CRITICAL';
        if (score >= 7.0) return 'HIGH';
        if (score >= 4.0) return 'MODERATE';
        return 'LOW';
      }
    }
  }

  // Fallback to database_specific severity
  if (vuln.database_specific?.severity) {
    const severity = vuln.database_specific.severity.toUpperCase();
    if (severity === 'CRITICAL') return 'CRITICAL';
    if (severity === 'HIGH') return 'HIGH';
    if (severity === 'MODERATE' || severity === 'MEDIUM') return 'MODERATE';
    if (severity === 'LOW') return 'LOW';
  }

  return 'UNKNOWN';
}

function hasFixedVersion(vuln: OSVVulnerability): boolean {
  if (!vuln.affected || vuln.affected.length === 0) {
    return false;
  }

  // Check if there's a fixed version in any range
  for (const affected of vuln.affected) {
    if (!affected.ranges) continue;

    for (const range of affected.ranges) {
      if (range.type !== 'SEMVER' && range.type !== 'ECOSYSTEM') continue;

      for (const event of range.events) {
        if (event.fixed) {
          return true;
        }
      }
    }
  }

  return false;
}

export function parseOSVVulnerabilities(
  vulns: OSVVulnerability[]
): OSVSignals {
  const parsed: ParsedVulnerability[] = vulns.map((vuln) => ({
    id: vuln.id,
    severity: parseSeverity(vuln),
    hasFix: hasFixedVersion(vuln),
  }));

  return {
    vulns: parsed,
  };
}
