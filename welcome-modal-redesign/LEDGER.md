# Urban Analytics Premium Modal Redesign Ledger

Date: May 21, 2026
Maintained by: Plan revision pass (v3 "Orbital Cockpit")

This ledger is the current-state source of truth for [`PROMPTS.md`](PROMPTS.md)
(in this same `welcome-modal-redesign/` working folder).

## Direction Change (read first)

The prompt pack has been **fully rewritten**. The previous plan ("Curved
Intelligence Layer" — a premium rectangular glass cockpit) is complete in the
working copy. The user then requested a **genuinely circular ("tam yuvarlak")**
modal with a **large, dominant Synapse IDE brand**. The prompts file now
describes the new target:

```text
v3 — "Orbital Cockpit": a perfect-disc spatial-intelligence portal,
fronted by the Synapse IDE logo, with orbital decoration and an
inscribed mask-faded scroll column.
```

Two design generations are tracked here:

- **v2 (Curved Intelligence Layer)** — superseded by v3 in the working copy.
- **v3 (Orbital Cockpit, fully circular)** — **implemented** in the working copy (uncommitted).

## Current Position

```text
v3: implemented in working copy (uncommitted) via the one-shot pass on May 21, 2026.
    typecheck / test:analytics / lint:errors all pass. Browser visual QA pending.
v2: superseded; the prior rectangular shell/header/horizontal decoration was
    replaced by the circular implementation in the same file.
```

Next action:

```text
Browser visual QA of the circular disc (Section 18 of PROMPTS.md), then commit.
Tune circular geometry (brand/footer chord fit, content density) if QA flags it.
```

## v3 "Orbital Cockpit" — Baked-in Decisions

| Decision | Choice |
|---|---|
| Shell shape | Perfect circle on desktop; rounded-capsule fallback below ~560px |
| Brand logo | Synapse glyph from `src/components/atoms/Logo.tsx`, inline-replicated in modal palette |
| Content fit | Inscribed centered scroll column with top/bottom edge fades; light copy condense |
| Disc diameter | `min(96vmin, 1180px)` (enlarged from 940px after QA) |
| Scroll model | Scroll inside the disc with mask fades + scroll hint |

## Status Vocabulary

- `implemented`: visible in the current working copy.
- `planned`: specified in the new prompt pack, not yet built.
- `superseded`: belonged to the prior plan; replaced by the v3 direction.
- `deferred`: intentionally not started unless a later review requires it.

## v2 (Curved Intelligence Layer) — Implemented Baseline

| Area | Status | Current truth | Evidence |
|---|---|---|---|
| Visual tokens (`--wm-*`) | implemented | Deep bg, glass surfaces, cyan/amber accents, shadows, timings, easing in modal scope. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Atmosphere layer | implemented | aria-hidden SVG contours, data-flow paths, grid, scan, signal nodes. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Glass shell | implemented | Dark glass panel, gradient border, inner edge light, clipped overflow, backdrop depth. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Header command layer | implemented | WELCOME TO, wordmark, GIS badge, metric chips, icon glow, header channel. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Capability cards | implemented | Glass cards, contained icon tiles, transform-only hover/focus lift, glow, sweep. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Footer + CTA | implemented | Command-bar footer; CTA `Start Workbench`. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Responsive | implemented | 960px / 768px / 520px breakpoints. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Motion / a11y / reduced-motion | implemented | Decorative layers aria-hidden + pointer-events:none; focus-visible; reduced-motion block. | `src/features/urbanAnalytics/WelcomeModal.tsx` |
| Canvas ambient layer (opt.) | implemented | `AmbientFlowCanvas` added: ~12 particles on cubic-Bezier routes, low opacity, mix-blend screen, masked from text. rAF only while mounted, cleanup on unmount, never starts under reduced-motion, DPR capped at 1.5. aria-hidden + pointer-events:none + reduced-motion hidden. | `src/features/urbanAnalytics/WelcomeModal.tsx` (this session) |

## v3 (Orbital Cockpit, fully circular) — Implemented

All built in `src/features/urbanAnalytics/WelcomeModal.tsx` in the one-shot pass.

| Prompt | Title | Status | Current truth |
|---|---|---|---|
| 01 | Codebase Audit | implemented | Audited before rewrite; structure/logo/lifecycle confirmed. |
| 02 | Circular Geometry Strategy & Tokens | implemented | "Frame + Inscribed Scroll" model; tokens `--wm-disc`, `--wm-col-max`, `--wm-edge-fade`, `--wm-logo-size`, `--wm-wordmark`. |
| 03 | Circular Shell Construction | implemented | `aspect-ratio:1; border-radius:50%` panel; gradient rim, conic halo, concentric orbit rings, outer glow. |
| 04 | Aperture Open / Close | implemented | `wmApertureIn/Out` clip-path circle iris + scale + fade, synced to the 400ms close lifecycle. |
| 05 | Brand Identity Zone | implemented | `BrandLogo` (inline Synapse glyph, cyan-tinted) with breathing halo + rotating ring + node pulses; enlarged centered wordmark + GIS chip + mono eyebrow + subtitle. |
| 06 | Metric Chip Rail | implemented | Three centered rounded metric pills under the brand; calm at rest, hover brightness. |
| 07 | Inscribed Content Scroll Region | implemented | Centered column `min(--wm-col-max, 100%-24px)`, top/bottom mask fades, hidden scrollbar, scroll hint that fades after first scroll. |
| 08 | Capability Cards | implemented | ~16px radius, transform-only hover/focus lift + sweep, strong focus ring. |
| 09 | Footer Command Bar & CTA | implemented | Lower-arc centered command bar; fully rounded pill CTA `Start Workbench`. |
| 10 | Orbital Decorative System | implemented | Concentric SVG rings, conic radar sweep, orbiting nodes; `AmbientFlowCanvas` retargeted to elliptical orbits (4 orbits × 3 particles, outer band). |
| 11 | Responsive & Graceful Degradation | implemented | Circle at ≥560px; morph to rounded capsule below 560px (`wmCapsuleIn/Out`, clip-path disabled, rings/radar hidden). |
| 12 | Motion, Accessibility, Reduced Motion | implemented | Dialog semantics/focus/Escape preserved; decorative layers aria-hidden + pointer-events:none; reduced-motion freezes all + hides halo/radar/nodes/canvas/ring/hint + opacity-only aperture. |
| 13 | Validation & QA | implemented | typecheck/test/lint pass; browser visual QA captured at desktop + mobile (see screenshots). |

Canvas invariants preserved through the orbital retarget: rAF only while
mounted, cleanup on unmount, never starts under reduced-motion, DPR capped at 1.5.

### Browser visual QA (May 21, 2026)

Captured via a temporary Playwright spec (since removed) against the dev server:

- `welcome-modal-redesign/qa/welcome-desktop.png` — confirms a true circular
  disc, dominant Synapse brand, metric chips, scrolling content, and the
  "Start Workbench" pill in the lower arc.
- `welcome-modal-redesign/qa/welcome-mobile.png` — confirms the rounded-capsule
  fallback below 560px with a full-width CTA.

Fixes / refinements applied from QA:
- The mobile capsule was floating the "Scroll" hint over body text → hidden in capsule mode.
- The brand logo read small for the disc → enlarged `--wm-logo-size` to
  `clamp(94px, 13.5vmin, 134px)`, bumped `--wm-wordmark`, and strengthened the
  logo halo so the Synapse mark is the unmistakable focal point.
- Disc enlarged: `--wm-disc` `min(92vmin, 940px)` → `min(96vmin, 1180px)`.
- Content enrichment + round design carried into the text (user request):
  content sections are now rounded glass panels with mono "eyebrow" labels
  (Overview / Foundation / Workflow / Standards); every capability card carries
  3 rounded tech tag pills (factual, drawn from each description); the About
  paragraph gained a sentence on explicit method assumptions + reproducible
  evidence. Re-captured `welcome-modal-redesign/qa/welcome-desktop.png` and
  `welcome-modal-redesign/qa/welcome-rich.png`.
- Round design pushed into the cards (user request): circular icon badges
  (cards, sections, step numbers now `border-radius: 50%`), card radius 16→24px,
  and a faint concentric-arc accent per card echoing the disc's orbit rings
  (clipped to a soft arc, shifts on hover). CSS-only. See
  `welcome-modal-redesign/qa/welcome-cards.png`.
- Visibility verification (user request "everything visible"): checked default
  unscrolled at 1920×1080, 1440×900, 1366×768 — brand, metric chips, and the
  footer CTA are always visible (fixed flex zones); content scrolls between them
  with edge fades; `vmin` sizing keeps the whole disc on-screen so the footer
  never drops off. Added a `@media (max-height: 860px)` density rule that trims
  brand spacing + panel padding so short laptops show more content at once. See
  `welcome-modal-redesign/qa/v-1920x1080.png`, `v-1440x900.png`, `v-short.png`.
- Reduced-motion + a11y hardening verified in a real browser (Playwright with
  `emulateMedia({ reducedMotion: 'reduce' })`), asserting: halo / radar /
  orbit-nodes / flow-canvas are hidden; `.welcome-modal__atmosphere` is
  `aria-hidden`; focus lands on the "Start Workbench" CTA on open; Escape closes.
  Static disc stays fully readable. See `welcome-modal-redesign/qa/v-reduced-motion.png`.
- Audit fix (full-pack re-check): the reduced-motion block was `display:none`-ing
  the scroll hint, which violated Prompt 12 ("scroll hint must be static-visible"
  so reduced-motion users still perceive more content). Removed the hint from the
  hidden list — it now stays visible (static) with its bob frozen. Verified the
  hint is visible under reduced motion while halo/radar stay hidden.

### Related fix outside the modal file

The e2e helper and a lazy-loading spec referenced a stale CTA label
(`"Got it, Let's Start"`) that the v2 redesign had already renamed to
`"Start Workbench"`, so those selectors could never match. Updated both to
`/Start Workbench/i`:

- `e2e/helpers/urbanAnalytics.ts`
- `e2e/lazy-loading.spec.ts`

## Validation Snapshot (May 21, 2026 — v3 one-shot)

| Gate | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run test:analytics` | Pass; 62 files, 1111 tests |
| `npm run lint:errors` | Pass (clean) |
| Browser visual inspection | Pass — circular desktop + capsule mobile captured |

Fresh circular-design QA screenshots:

- `welcome-modal-redesign/qa/welcome-desktop.png`
- `welcome-modal-redesign/qa/welcome-mobile.png`

Prior v2 `test-results/urban-welcome-qa/*` artifacts are stale (rectangular design).

## Open Risks

- v3 (plus the e2e selector fixes) is present only in the working copy; not committed.
- The pack folder (`welcome-modal-redesign/`) and this ledger are untracked in git.
- Visual QA covered desktop (1440×1040) and mobile (390×820). Other aspect
  ratios (ultrawide, very short landscape) verified only by reasoning — the
  `min(92vmin, 940px)` sizing should keep the disc bounded, but a wider sweep
  could be worth a future pass.
- Mobile (<560px) intentionally morphs from circle to rounded capsule.

## Maintenance Rule

Any future pass that changes the modal implementation, the prompt pack, or a
verification claim must update this ledger and record:

1. Prompt/area status changes.
2. Commands run and results.
3. Files changed.
4. Remaining visual, accessibility, or validation risks.
