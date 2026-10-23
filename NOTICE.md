# Notice — third-party code

Dynamic Home Card is licensed under the **GNU General Public License v3.0 or later** (see [LICENSE](LICENSE)).

It contains code derived from **Aurora Glass v3**:

- © 2026 DomotikPro.it (Luca Pinelli) — https://github.com/lucalux00/aurora-glass-v3
- License: GPL-3.0
- Base version: commit `a2cdf25` (2026-10-21)

## What comes from Aurora Glass v3

| File | Origin | Changes |
|---|---|---|
| `src/engine/aurora-engine.js` | Drawing engine, the 10 worlds and the 11 canvas effects (`disegno.js`, `mondi-base.js`, `mondi-a.js`, `mondi-b.js`, `effetti.js`) | Wrapped in a private namespace instead of `window` globals; `AMB.BASECSS` exported. Otherwise unchanged. |
| `src/styles.js` | CSS of the Aurora "hero" banner | Adapted to a standalone Lovelace card: container queries, background scoped to the card, theme and font options. |

Everything else (`src/card.js`, `src/logic.js`, `src/i18n.js`, tests, build) was written for this project.

As required by the Aurora Glass license, the name "Aurora Glass" and the DomotikPro.it brand are **not** used by this project. Dynamic Home Card is not affiliated with or endorsed by DomotikPro.it.
