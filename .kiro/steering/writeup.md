---
inclusion: manual
---

# Write-up generator

When this file is included (type `#writeup`), draft the Kiroween "How Kiro was used" section from `docs/kiro-log.md`, the `.kiro/` folder, and git history.

Structure it under these headings, using real counts and file names from the repo, never invented ones:
1. Spec-driven development: list every spec in `.kiro/specs/`, how requirements were reviewed, and one example where the spec caught a design problem early. Compare honestly with vibe coding.
2. Property-based testing: list each property, which requirement it came from, and every counterexample Kiro found, with the shrunk input and the fix.
3. Agent hooks: each hook, its trigger, and what it saved us from.
4. Steering: each steering file and one before/after example of how it changed Kiro's output.
5. MCP: each server, what it enabled, and the moment Revenant's own MCP server was used to scan Revenant.
6. Kiro powers: the Revenant power we built, plus any powers we installed.
7. Kiro IDE vs CLI vs Crew: what each was best at.
8. Custom agents: any we created and where.

Write in first person as the founder, plain English, short paragraphs, no em dashes.
