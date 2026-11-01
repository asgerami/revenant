---
inclusion: always
---

# Product: Revenant

Revenant finds the dead packages in your codebase and brings your code back to life.
Full blueprint: type `#blueprint` in chat to load it.

## The problem
- Nearly half of production dependencies are stalled or end-of-life, and most have no CVEs, so vulnerability scanners never flag them.
- Detection tools already exist. None of them do the hard part: migrating the code off the dead package and proving nothing broke.
- Developers hunt for alternatives by hand and often miss the replacement the community already moved to.

## Who it is for
- Primary: JavaScript/TypeScript teams maintaining apps older than two years.
- Secondary: open source maintainers who want a healthy dependency badge.

## Product surfaces
1. **Web (free):** paste a public GitHub repo URL, get a graveyard of its dependencies, a shareable results page, and a README badge.
2. **revenant-mcp:** an MCP server (published to npm) with scan, classify, prescribe, and verify tools.
3. **Revenant Kiro power:** teaches any Kiro agent a safe, test-verified migration procedure ("resurrection").
4. **Revenant Night Patrol (Kiro Crew app):** weekly patrol of watched repos that opens resurrection PRs on its own.

## Lifecycle states (single source of truth)
- **ALIVE:** maintained.
- **DORMANT:** finished and stable. Old but no death signal and no vulnerabilities. Not a problem. We say so honestly.
- **DYING:** stale and carrying a known vulnerability, or a vulnerability with no fixed version.
- **DEAD:** deprecated on npm, archived on GitHub, or its repository is gone.
- **ZOMBIE:** DEAD but still heavily downloaded across the ecosystem (high blast radius).

## Non-goals for the hackathon
- Ecosystems other than npm.
- Private repos in the web app.
- Running user code on our servers. Code changes happen in the user's own Kiro or Kiro Crew.

## Business model
- Free: web scan, public graveyard page, README badge.
- Pro (per org, monthly): Night Patrol, automated resurrection PRs, history. Payments through Polar.

## Tone
Spooky and playful in UI copy, precise and trustworthy in the data. Never let the theme hide a number.
