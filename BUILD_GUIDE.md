# Revenant: step-by-step build guide (Kiro IDE)

This guide is for you, not for Kiro. Kiro gets its context from `.kiro/steering/`. Follow the phases in order. Each phase ends with a commit and a line in `docs/kiro-log.md`.

Deadline: Dec 4, 2:00 PM PT = Dec 5, 1:00 AM Addis time. Target submission: Dec 3.

---

## Phase 0: Setup (Oct 31 to Nov 1)

1. Install Kiro IDE, sign in, redeem your 4,000 credits. Send one test chat message to confirm the models work from Ethiopia.
2. Create a public GitHub repo `revenant` with an MIT license (pick it when creating the repo so it shows in About).
3. Clone it, then copy this kit's `.kiro/` folder and this guide into the repo root. Delete `KICKOFF.md` if you still have the old kit.
4. Open the folder in Kiro. Check the Steering panel shows product, tech, structure, design (fileMatch), blueprint (manual), writeup (manual).
5. Check the MCP panel shows context7 and playwright connected.
6. In Kiro settings, make sure property-based testing (Correctness) is available for specs.
7. Create `docs/kiro-log.md` with a heading. Commit: "chore: kiro setup".
8. Create the hooks below in the Agent Hooks panel (describe each in plain English and let Kiro generate it, then check its trigger).

### Hooks to create
| # | Name | Trigger | What it does |
|---|---|---|---|
| 1 | Kiro log | After a spec task completes | Append one line to `docs/kiro-log.md`: date, spec, task, Kiro features used |
| 2 | PBT guard | File save in `packages/core/src/classifier/**` | Run `pnpm --filter core test` and report any property counterexample |
| 3 | Fixture check | File created in `packages/core/src/sources/**` | Make sure a parser test and a fixture in `fixtures/` exist for the new source |
| 4 | Design check | File save in `apps/web/**/*.tsx` | Review the component against design.md: contrast, reduced motion, table fallback, mobile |
| 5 | Type gate | When the agent stops | Run `pnpm -r typecheck` and summarize errors |
| 6 | Shell guard | Before a shell tool runs | Block `git push --force`, `rm -rf /`, and publishing to npm without confirmation |

Manual workflows use manual steering instead of manual hooks: type `#writeup` to draft the write-up.

---

## Phase 1: Monorepo skeleton (Nov 1, vibe mode)

In chat (vibe mode, not a spec):
> #blueprint Set up the pnpm workspaces monorepo described in structure.md: apps/web (Next.js App Router, Tailwind, TypeScript), packages/core and packages/mcp (TypeScript libraries with Vitest and fast-check), root scripts for build, test, typecheck, lint. Add .env.example. Do not implement features yet.

Run `pnpm install && pnpm -r typecheck`. Commit.

---

## How to run every spec (applies to Phases 2 to 8)
1. Kiro pane, Specs, `+`, Feature, Requirements-First.
2. Paste the prompt. Always start it with `#blueprint`.
3. Read requirements.md carefully. Push back in chat if anything is vague. This review is where you win points: log one change you made.
4. Approve, review design.md (check the correctness properties are listed), approve, review tasks.md.
5. Run all tasks. Watch the waves. Fix failures by chatting with Kiro, not by hand where possible.
6. Run the property tests when Kiro offers. Screenshot every counterexample for the write-up.
7. Commit after the spec is green.

---

## Phase 2: Spec `core-sources` (Nov 2 to 3)
> #blueprint Implement packages/core sources for npm registry, npm downloads, GitHub GraphQL, and OSV querybatch, following tech.md rules and blueprint sections 3 and 6. Each source has fetcher, parser, and parser tests using recorded fixtures in fixtures/. Add a script to record fixtures for a given package. Include the lockfile readers for pnpm, npm, and yarn.

## Phase 3: Spec `lifecycle-classifier` (Nov 4)
> #blueprint Implement the pure classifier in packages/core exactly as blueprint section 4 defines it. Requirements must cover every rule and every property P1 to P8 so Kiro can derive property-based tests from them.

This is your PBT showcase. If no counterexample shows up naturally, ask Kiro to try edge cases: null dates, future dates, packages with vulns and no repo.

## Phase 4: Spec `prescriber-and-scanner` (Nov 5 to 6)
> #blueprint Implement the prescriber (blueprint section 5) using the e18e module-replacements package, and the scanner pipeline (section 6) that yields results as an async iterator. Add an end-to-end test that scans a fixture repo and checks the verdicts.

Milestone: `pnpm --filter core scan <owner/repo>` prints a graveyard table in the terminal. Post your Social Blitz now (see Phase 10).

## Phase 5: Spec `graveyard-web` (Nov 8 to 14)
> #blueprint Build apps/web per blueprint section 7 and design.md: landing page, SSE scan endpoint with Postgres caching via Prisma, the streaming graveyard page with SVG graves for each state, side panel with signals and prescriptions, table view, badge endpoint. Use Playwright MCP to screenshot each page at 1440px and 375px and fix layout issues.

Tips:
- Ask Kiro for the grave SVGs as separate components, one per state, then iterate on them visually with Playwright screenshots.
- Deploy to Vercel early (Nov 10) and keep deploying. Test with 3 real repos that contain deprecated packages.

## Phase 6: Spec `revenant-mcp` (Nov 15 to 17)
> #blueprint Build packages/mcp: an stdio MCP server with the tools in blueprint section 8, reusing packages/core. Add integration tests that call each tool. Prepare it for publishing to npm as revenant-mcp with a bin entry.

Then add it to `.kiro/settings/mcp.json` pointing at your local build and ask Kiro: "scan this repo with revenant". Log the moment Revenant scanned itself.
Publish: `npm publish` (you run this, after checking the package contents).

## Phase 7: Spec `revenant-power` (Nov 18 to 21)
> #blueprint Create the Revenant Kiro power in power/ using the Agent Plugins format: plugin.json, mcp.json running npx -y revenant-mcp, and skills scan, resurrect, and badge exactly as blueprint section 9 describes.

Test: Powers panel, Add Custom Power, Import power from a folder. Then create a throwaway repo that uses `request` and `moment`, open it in Kiro, say "resurrect my dead dependencies", and record the whole run. This is the heart of the demo video.

## Phase 8: Spec `night-patrol` in repo `revenant-crew` (Nov 22 to 25)
1. Install Kiro Crew on your Linux machine (`kirocrew setup`, `kirocrew doctor`, `kirocrew gateway`).
2. New public repo `revenant-crew`, MIT, with its own `.kiro/`. Copy product.md and blueprint.md into its steering.
3. Spec prompt:
> #blueprint Build the Kiro Crew app in blueprint section 10. Read https://kiro.dev/docs/crew/apps/ and https://kiro.dev/docs/crew/apps/manifest/ first and follow the app.json schema exactly. Include the gravekeeper agent, patrol and resurrect skills, the revenant MCP server, the weekly night-patrol cron, and a dashboard page.
4. Install it with `kirocrew app dev revenant-crew`. Trigger the patrol manually once for the video.
Crew burns credits fast: keep test runs short.

## Phase 9: Startup layer (Nov 26)
> #blueprint Add the /pricing page with Free and Pro tiers and a Polar checkout link for the founding member plan, plus a founder section on the landing page.
Buy a domain if you can, point it at Vercel. This URL is your "startup website" for the Best Startup prize.

## Nov 27 to 29: Dev3Pack. No Kiroween work.

---

## Phase 10: Ship (Nov 30 to Dec 3)
1. **Video (Nov 30):** follow blueprint section 12. Record screen at 1080p, voice over, under 2:55. Upload to YouTube as public.
2. **Write-up (Dec 1):** type `#writeup` in Kiro, then edit the draft in your own voice.
3. **Blog (Dec 1):** dev.to post "I built Revenant for Kiroween 2026" with the story, the PBT bug, and screenshots. Must say it was written for Kiroween 2026.
4. **Social Blitz (already posted Nov 6):** post must start with `#KiroweenHackathon26`, share your favorite Kiro feature and how it changed your approach. Write it yourself; judges penalize AI-sounding posts.
5. **Submit (Dec 3):** category Resurrection; bonus Best Startup (founder confirmation, LinkedIn, website), Best Kiro Crew App (revenant-crew URL and description), Social Blitz URL, Blog URL. Add test instructions. State that there is no pre-existing code.

## Final checks
- [ ] `/.kiro` is in both repos and not in `.gitignore`
- [ ] MIT license shows in both repos' About section
- [ ] Live site works logged out, on mobile, and with a repo the judges have never seen
- [ ] Video is public and under 3 minutes
- [ ] Everything judges test (web app, badge) runs without needing your Kiro credits
