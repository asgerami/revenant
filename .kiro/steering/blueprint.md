---
inclusion: manual
---

# Revenant blueprint

The complete product and technical design. Specs should implement exactly this unless a spec review changes it.

## 1. Pitch
"Dependabot updates packages that are alive. Revenant handles the ones that died."
Nearly half of production dependencies are stalled or end-of-life and most have no CVEs, so security tools stay silent. Revenant finds them, prescribes the replacement the community already moved to, and has an agent migrate your code with tests proving nothing broke.

## 2. Differentiation
| | npm audit / Snyk | Lifecycle detectors | Renovate / Dependabot | Revenant |
|---|---|---|---|---|
| Finds CVEs | yes | partly | no | yes (OSV) |
| Finds dead packages without CVEs | no | yes | no | yes |
| Separates "finished and stable" from "dead" | no | some | no | yes (DORMANT) |
| Suggests the replacement | no | rarely | no | yes (e18e dataset + deprecation notices) |
| Migrates the code | no | no | only version bumps | yes (agent, test-verified PR) |
| Patrols on a schedule | no | CI only | yes | yes (Kiro Crew) |

## 3. Core data model (`packages/core/src/types.ts`)

```ts
type LifecycleState = "ALIVE" | "DORMANT" | "DYING" | "DEAD" | "ZOMBIE";

interface Dependency {
  name: string;
  range: string;              // from package.json
  resolvedVersion: string;    // from lockfile, else minimum satisfying version
  kind: "prod" | "dev";
}

interface PackageSignals {
  name: string;
  resolvedVersion: string;
  deprecatedMessage: string | null;     // npm deprecation on the latest version
  lastPublishAt: Date | null;           // npm `modified`
  repoUrl: string | null;
  repoStatus: "ok" | "archived" | "disabled" | "missing" | "unknown";
  lastCommitAt: Date | null;            // GitHub pushedAt
  weeklyDownloads: number | null;
  vulns: { id: string; severity: "LOW" | "MODERATE" | "HIGH" | "CRITICAL" | "UNKNOWN"; hasFix: boolean }[];
  e18e: { kind: "preferred" | "native" | "micro"; replacements: string[] } | null;
  fetchedAt: Date;
}

interface LifecycleVerdict {
  state: LifecycleState;
  score: number;              // 0 (worst) to 100 (best), integer
  reasons: string[];          // human readable, each tied to one signal
  epitaph: string;            // short line shown on the grave
}
```

## 4. Classification rules (pure function, evaluated top to bottom)
Constants: `STALE_DAYS = 730` (2 years), `ZOMBIE_DOWNLOADS = 100_000` weekly.

1. **DEAD** if `deprecatedMessage` is set, OR `repoStatus` is `archived` or `disabled`, OR (`repoStatus` is `missing` AND last publish older than STALE_DAYS).
2. **ZOMBIE** if the package is DEAD by rule 1 AND `weeklyDownloads >= ZOMBIE_DOWNLOADS`.
3. **DYING** if any vuln has `hasFix === false`, OR (any vuln exists AND last commit older than STALE_DAYS).
4. **DORMANT** if last publish AND last commit are both older than STALE_DAYS, there are no vulns, and rules 1 to 3 did not match.
5. **ALIVE** otherwise.

Score: start at 100 and subtract. Deprecated -60, archived -50, missing repo -40, each unfixed vuln -25 (CRITICAL -35), each fixed-but-unpatched vuln -10, staleness up to -30 (linear from 1 to 5 years since last commit). Clamp to 0..100. Round down.

Properties that must hold (property-based tests):
- P1 Determinism: same `(signals, now)` always gives the same verdict.
- P2 A deprecated or archived package is never ALIVE or DORMANT.
- P3 Monotonic staleness: moving `lastCommitAt` earlier never increases the score.
- P4 Monotonic risk: adding a vuln never increases the score.
- P5 ZOMBIE implies the DEAD conditions hold and downloads are at least ZOMBIE_DOWNLOADS.
- P6 DORMANT implies zero vulns.
- P7 Score is always an integer within 0..100.
- P8 Every verdict has at least one reason.

## 5. Prescriptions (`packages/core/src/prescriber/`)
For DEAD, ZOMBIE, and DYING packages:
1. e18e `preferred` mapping: list its replacements.
2. e18e `native` mapping: suggest the native API with its MDN link.
3. e18e `micro-utilities`: show the snippet that replaces it.
4. Parse `deprecatedMessage` for patterns like "use X", "moved to X", "renamed to X", "replaced by X"; validate X exists on npm.
5. For each npm replacement candidate, fetch its signals and classify it; never suggest a candidate that is itself DEAD. Rank by score.
6. If nothing is found, say "No known replacement yet" and offer the "fork and patch" path.
DYING packages whose vulns have a fixed version: prescribe "upgrade to X.Y.Z" first.

## 6. Scan pipeline (`packages/core/src/scanner/`)
1. Input: `owner/repo` (web) or a local path (MCP).
2. Read `package.json`; read `pnpm-lock.yaml`, `package-lock.json`, or `yarn.lock` if present to resolve versions.
3. Collect direct `dependencies` and `devDependencies`.
4. Fetch signals in batches: npm (parallel, max 8 at a time), downloads (bulk), GitHub (GraphQL, 50 per query), OSV (querybatch).
5. Classify each, prescribe for the bad ones.
6. Emit results as an async iterator so the web page can stream them.
7. Monorepos: if `pnpm-workspace.yaml` or `workspaces` exist, scan each workspace package.json too (stretch goal).

## 7. Web app (`apps/web`)
Routes:
- `/` landing page (startup site): hero with a live scan box, the problem in numbers, how it works in 3 steps, the Kiro power and Crew app, pricing teaser, founder note.
- `/r/[owner]/[repo]` graveyard page, shareable. Streams graves in via a route handler using Server-Sent Events.
- `/r/[owner]/[repo]?view=table` table view.
- `/api/scan/[owner]/[repo]` SSE stream of `{ dependency, signals, verdict, prescriptions }` events.
- `/badge/[owner]/[repo]` SVG badge: "graveyard: 0 dead" (green) or "graveyard: 3 dead" (red). Cached 6h.
- `/pricing` Free vs Pro, Polar checkout for Pro (founding member).
- `/power` how to install the Revenant power in Kiro, with copyable prompt.
Caching: store package signals in Postgres keyed by `name@version`, 24h TTL. Store scan summaries for the badge.
Example repos for the "try it" buttons: pick 3 public repos that really contain deprecated packages (verify before the demo).

## 8. revenant-mcp tools
| Tool | Input | Output |
|---|---|---|
| `scan_repo` | `{ path }` local path or `{ repo }` owner/name | list of `{ dependency, verdict, prescriptions }` |
| `classify_package` | `{ name, version }` | `{ signals, verdict }` |
| `get_replacements` | `{ name }` | ranked prescriptions with reasons |
| `find_usages` | `{ path, name }` | files and lines that import or require the package |
| `verify_migration` | `{ path, command? }` | runs tests (default `npm test`), returns pass/fail, counts, duration, last 50 lines of output |

`verify_migration` runs only inside the given path, with a 10 minute timeout, and never runs install scripts from unknown packages without the user approving.

## 9. Revenant power (`power/`)
- `plugin.json` keywords: "dead dependencies", "deprecated package", "abandoned package", "unmaintained", "revenant", "resurrect", "dependency graveyard".
- `mcp.json` runs `npx -y revenant-mcp`.
- Skill `scan`: run scan_repo on the workspace and present the graveyard as a table sorted worst first.
- Skill `resurrect`, the safe migration procedure:
  1. Run `verify_migration` first to record the baseline. If tests already fail, stop and tell the user.
  2. Pick one target package. Create branch `revenant/<pkg>-to-<replacement>`.
  3. `get_replacements`, choose the top candidate, explain the choice in one line.
  4. `find_usages`, migrate every call site. Use an existing codemod if one exists for this replacement.
  5. Swap the dependency in package.json and the lockfile.
  6. `verify_migration` again. If it fails, fix up to 3 times, else revert and report.
  7. Write `RESURRECTION.md` (what died, why, what replaced it, files touched, tests before and after).
  8. Commit and offer to open a PR.
- Skill `badge`: add the Revenant badge to the README.

## 10. Night Patrol (separate repo `revenant-crew`, Kiro Crew app)
- `app.json` with: an agent `gravekeeper`, skills `patrol` and `resurrect`, `mcpServers.revenant` running `npx -y revenant-mcp`, a cron `night-patrol` with `cron_expr: "0 2 * * 1"` (Mondays 02:00), and a dashboard page "Graveyard" listing watched repos, last patrol, new deaths, and open resurrection PRs.
- Patrol: for each watched repo, scan; compare with the last patrol stored in app storage; for each newly DEAD or DYING package, spawn a subagent that runs the resurrect procedure in a separate worktree and opens a PR; post a summary notification.
- Platform: macOS and Linux.

## 11. Business model
- Free: unlimited public scans, badge, power.
- Pro, $19 per org per month: Night Patrol hosting, history, Slack alerts, priority prescriptions. Founding member preorder via Polar.
- Growth loop: badge in READMEs links back to the public graveyard page.

## 12. Demo script (video, under 3 minutes)
1. 0:00 Hook: "Your dependencies are dying and nobody tells you." Show a real popular repo's graveyard rising out of the fog.
2. 0:20 The problem in two numbers.
3. 0:35 Click a ZOMBIE grave: signals, sources, prescription.
4. 0:55 In Kiro: "resurrect my dead dependencies". Power activates, baseline tests, migration, tests pass, RESURRECTION.md, PR.
5. 1:50 Kiro Crew Night Patrol dashboard: scheduled patrol found a newly deprecated package and opened a PR by itself.
6. 2:15 How Kiro built it: specs, PBT counterexample, hooks, steering, MCP, power, Crew.
7. 2:40 Badge, pricing, "Revenant: we bring your code back from the dead."
