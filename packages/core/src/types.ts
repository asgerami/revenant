// Lifecycle types - single source of truth

export type LifecycleState = 'ALIVE' | 'DORMANT' | 'DYING' | 'DEAD' | 'ZOMBIE';

export interface LifecycleVerdict {
  state: LifecycleState;
  reason: string;
  signals: string[];
}

export interface PackageSignals {
  name: string;
  version: string;
  // Add more signal fields as sources are implemented
}
