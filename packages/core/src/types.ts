// Lifecycle types - single source of truth

export type LifecycleState = 'ALIVE' | 'DORMANT' | 'DYING' | 'DEAD' | 'ZOMBIE';

export interface LifecycleVerdict {
  state: LifecycleState;
  score: number;
  reasons: string[];
  epitaph: string;
}

export interface PackageSignals {
  name: string;
  resolvedVersion: string;
  deprecatedMessage: string | null;
  lastPublishAt: Date | null;
  repoUrl: string | null;
  repoStatus: 'ok' | 'archived' | 'disabled' | 'missing' | 'unknown';
  lastCommitAt: Date | null;
  weeklyDownloads: number | null;
  vulns: {
    id: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';
    hasFix: boolean;
  }[];
  e18e: { kind: 'preferred' | 'native' | 'micro'; replacements: string[] } | null;
  fetchedAt: Date;
}

export interface Dependency {
  name: string;
  range: string;
  resolvedVersion: string;
  kind: 'prod' | 'dev';
}
