---
inclusion: fileMatch
fileMatchPattern: ["apps/web/**/*.tsx", "apps/web/**/*.css"]
---

# Design rules

Design is 20% of the judging score. The UI must feel like a finished product, not a demo.

## Concept
A moonlit cemetery at night. Each direct dependency is a plot of land. How the plot looks tells you the package's state at a glance.

| State | Visual | Epitaph example |
|---|---|---|
| ALIVE | glowing lantern on a small sapling | "Last release 12 days ago" |
| DORMANT | peaceful grave with flowers, no cracks | "Resting. Stable since 2021" |
| DYING | cracked tombstone, flickering candle | "1 unpatched vulnerability" |
| DEAD | full tombstone, dim | "Deprecated: use undici instead" |
| ZOMBIE | disturbed grave, hand breaking through soil | "Dead, still 40M downloads/week" |

## Layout
- Header: repo name, a single "Graveyard health" score (0 to 100), counts per state.
- Main: the cemetery. Graves sorted worst first, left to right. Click a grave to open a side panel with every signal, its source, and the suggested replacements.
- Every dead or dying grave has a "Resurrect" button that shows the exact Kiro prompt and the install link for the Revenant power.
- Toggle to a plain sortable table view at any time.

## Rules
- Dark theme, WCAG AA contrast. Spooky never means unreadable.
- Every visual maps to a real number; the side panel shows the raw signals and links to the npm, GitHub, and OSV source.
- Motion is subtle: fog drift, candle flicker, graves rising in as results stream. Respect `prefers-reduced-motion`.
- Works at 375px wide (graves stack into a list).
- One accent color (spectral green) reserved for "Resurrect" and primary actions.
- Graves are SVG components, not images, so they scale and theme cleanly.
