# Urban Analytics Welcome Modal — "Orbital Cockpit" (Fully Circular) Prompt Pack

Date: 2026-05-21

Target experience: redesign the Urban Analytics welcome modal into a **genuinely circular ("tam yuvarlak") premium portal** — a perfect-disc spatial-intelligence cockpit fronted by the **Synapse IDE logo** as a large, dominant brand.

Primary implementation target in the current codebase:

- `src/features/urbanAnalytics/WelcomeModal.tsx`

Brand asset to reuse:

- `src/components/atoms/Logo.tsx` — the Synapse synapse/neural-network glyph (5 gradient nodes + connecting synapse lines + a wave). Used on the homepage hero at `size={160}`.

All styling stays inside the modal's existing inline `<style>` block, scoped to the welcome modal. Do not change unrelated modal surfaces.

> Decisions baked in as defaults for this pack:
> - **Perfect circle on desktop**, graceful morph to a very-rounded capsule on small screens.
> - **Synapse logo inline-replicated** in the modal palette (no `ThemeContext` coupling).
> - **Light copy/spacing condense** so content reads well inside the narrower circular column.
> - **Disc diameter cap:** `min(92vmin, 940px)`.
> - **Scroll model:** inscribed content column scrolling inside the disc with edge fades.

---

## 1. Design Thesis

The redesigned modal should feel like a luminous **observation disc** — a high-end spatial-intelligence cockpit shaped as a perfect circle. It combines:

- a perfect circular glass shell with a layered gradient rim,
- a slowly rotating conic halo and concentric orbit rings,
- the Synapse IDE logo as a large, dominant brand in the top arc,
- orbital/radial motion (concentric contours, orbiting nodes, radar sweep, particles on circular paths),
- premium cyan signal accents with restrained amber highlights,
- dense but readable typography inside an inscribed, mask-faded scroll column,
- interactive cards with controlled glow and movement,
- a lower-arc command bar with a strong pill CTA.

The mood is:

```text
Luminous observation disc + urban GIS intelligence + AI command surface
```

The result must be visually rich and effect-heavy yet professional. It must not look like a generic SaaS landing page, a neon game menu, or a decorative marketing hero. The circle is the frame; the brand leads; effects stay calm at rest and come alive on interaction.

---

## 2. Non-Negotiable Constraints

Use these constraints in every implementation prompt.

```text
You are working in the Urban Analytics Workbench codebase.

Respect the existing architecture:
- Urban Analytics owns analysis context, cards, evidence artifacts, method validity, and workflow metadata.
- Map Explorer owns map rendering and geometry.
- Synapse IDE owns editor, terminal, and AI chat state.

Do not introduce cross-module coupling.
Do not change domain logic, stores, evidence artifacts, GIS computation, or analytical contracts for a visual modal redesign.
Do not represent demo, synthetic, or placeholder content as real analysis.

Scope:
- Edit only src/features/urbanAnalytics/WelcomeModal.tsx.
- Keep all CSS inside the modal's existing inline <style> block, scoped to the welcome modal.
- Do not add Tailwind. Do not add new dependencies. Do not change global tokens.

Behavior to preserve:
- role="dialog", aria-modal, aria-label.
- Escape-to-close, focus-on-open (first focusable), the isClosing 400ms lifecycle.
- createPortal(modalContent, document.body).
- Backdrop click closes.

Motion expectations:
- Animate transform, opacity, clip-path, and stroke-dashoffset only.
- Avoid layout-shifting hover effects.
- Provide a prefers-reduced-motion fallback for every animated element.
- Keep text readable over animated backgrounds.

UI expectations:
- Premium, dense, restrained, professional.
- Effect-rich, but calm at rest.
- The shell is a PERFECT CIRCLE on desktop (this is the defining requirement).
- Cards ~16px radius; CTA fully rounded (pill).
- No card-inside-card composition. No marketing hero layout. No gradient orb/blob background.
```

---

## 3. Master Prompt

Use this as the main instruction when assigning the redesign to an implementation agent.

```text
Redesign the Urban Analytics welcome modal into a fully circular "Orbital Cockpit" — a perfect-disc premium spatial-intelligence portal.

Primary target:
- src/features/urbanAnalytics/WelcomeModal.tsx

Goal:
Transform the current rectangular modal into a perfect circular disc on desktop. Front it with the Synapse IDE logo as a large, dominant brand in the top arc. Present rich content in an inscribed, mask-faded scroll column. Anchor a strong pill CTA in the lower arc. Convert decoration to radial/orbital motion.

Keep content and product meaning intact:
- Urban Analytics Workbench remains the product.
- The modal still introduces the workbench capabilities.
- Do not alter analytical domain logic, Zustand stores, evidence artifacts, map services, or workflow contracts.

Shell:
- aspect-ratio: 1; border-radius: 50%; overflow: hidden; isolation: isolate.
- Diameter: min(92vmin, 940px).
- Layered gradient rim, rotating conic halo, concentric orbit rings, outer cyan glow.

Brand (dominant):
- Large Synapse logo glyph (~96-120px) with breathing halo + thin rotating accent ring in the top arc.
- Enlarged centered wordmark "Urban Analytics" + secondary "Workbench" + GIS chip.
- "WELCOME TO" mono eyebrow with live status dot. Centered subtitle.

Content:
- Inscribed centered scroll column (max-width ~62% of diameter).
- Top/bottom mask-image fades so content dissolves into the curved edge (no hard clipping).
- Subtle scroll hint that fades after first scroll.

Decoration (radial/orbital, calm at rest):
- Concentric contour rings, orbital flow arcs, radar sweep, orbiting signal nodes.
- Retarget the existing AmbientFlowCanvas particles to parametric circular/elliptical orbits.

Open/close:
- Aperture: clip-path circle iris + scale + fade, synced to the existing isClosing 400ms window.

Accessibility & performance:
- Preserve dialog semantics, focus, Escape, close lifecycle.
- aria-hidden + pointer-events:none on all decorative layers.
- prefers-reduced-motion freezes all motion and uses opacity-only open/close.
- Cap canvas devicePixelRatio at 1.5; rAF only while mounted; cleanup on unmount.
- Verify WCAG AA contrast on visible text over surfaces and effects.

Validation:
- npm run typecheck
- npm run test:analytics
- npm run lint:errors (if feasible)
- npm run dev + visual inspection (if feasible)

Deliver:
- A polished implementation with scoped styling.
- A summary of changes and the checks run.
```

---

## 4. Prompt 01 — Codebase Audit

Purpose: confirm exact structure, style location, and reusable pieces before editing.

```text
Audit the current Urban Analytics welcome modal before editing.

Focus on:
- src/features/urbanAnalytics/WelcomeModal.tsx (render order, inline <style> block, animation names).
- The existing AmbientFlowCanvas helper (rAF lifecycle, DPR handling, cleanup).
- src/components/atoms/Logo.tsx (the Synapse glyph: node positions, synapse paths, wave, gradient).
- How the modal opens, closes, manages focus, scrolls, and renders the footer CTA.

Do not edit files in this step.

Return:
1. Component sections in render order (root, backdrop, panel, atmosphere, hero, content, footer).
2. Major CSS class groups and what they control.
3. Existing animations/keyframes that can be reused or must be retargeted to radial geometry.
4. Accessibility behavior that must be preserved.
5. A precise implementation plan for the circular "Orbital Cockpit".
6. The exact geometry strategy for fitting long content inside a perfect circle.

Constraints:
- Do not change stores or Urban Analytics domain logic.
- Keep the redesign scoped to the welcome modal.
```

Expected audit notes:

```text
Component map:
- Modal root + backdrop (button)
- Panel shell
- Atmosphere (SVG contours/flow, grid, scan, nodes, AmbientFlowCanvas)
- Hero/brand band
- Content scroll container (sections + feature cards)
- Footer + CTA

Risks:
- Perfect circle clips corners; inscribed safe area ~= diameter * 0.707.
- ~10 cards + prose must scroll inside the disc with edge fades.
- Existing horizontal contour/flow/scan must be re-authored as radial.
- Mobile circle is too small to be usable -> needs a capsule fallback.
```

---

## 5. Prompt 02 — Circular Geometry Strategy & Tokens

Purpose: lock the geometry model and the local visual system before building.

```text
Define the circular geometry model and local visual tokens for the Orbital Cockpit.

Geometry model ("Frame + Inscribed Scroll"):
- The disc itself is the frame/decoration band.
- All readable content lives in a centered, inscribed scroll column.
- The brand occupies the top arc; the CTA occupies the bottom arc (narrow zones suit centered short elements).

Add/extend local CSS variables in the modal scope for:
- disc diameter token,
- ring radii (rim, halo, concentric orbits),
- brand sizing tokens (logo size, wordmark size),
- inscribed column max-width,
- edge-fade sizes,
- base/glass/elevated surfaces,
- gradient border,
- cyan signal accent + restrained amber accent + subtle violet depth,
- muted/strong text,
- shadow layers,
- motion timings and easing curves (reuse existing --wm-* where present).

Do not add gradient orbs/blobs or a marketing hero pattern.

Deliver:
- Updated local tokens only. No behavior changes yet.
```

Suggested token direction (adapt to existing `--wm-*` names already in the file):

```css
--wm-disc: min(92vmin, 940px);
--wm-disc-pad: clamp(20px, 4vmin, 48px);
--wm-col-max: calc(var(--wm-disc) * 0.62);
--wm-ring-rim: 50%;
--wm-edge-fade: 14%;
--wm-logo-size: clamp(88px, 12vmin, 120px);
--wm-wordmark: clamp(34px, 4.4vmin, 52px);
--wm-cyan: #3aa8ff;
--wm-cyan-strong: #72ddff;
--wm-amber: #d6a84f;
--wm-text: #eef6ff;
--wm-muted: #9aaabd;
--wm-ease-premium: cubic-bezier(.16, 1, .3, 1);
--wm-duration-aperture: 420ms;
```

---

## 6. Prompt 03 — Circular Shell Construction

Purpose: build the perfect disc with a premium layered rim.

```text
Build the circular shell for the welcome modal panel.

Shell:
- aspect-ratio: 1; width: var(--wm-disc); border-radius: 50%; overflow: hidden; isolation: isolate.
- Center it in the viewport; keep the existing blurred dark backdrop (deepen the vignette so the disc is the focal point).

Rim & depth (layered):
- Layered gradient rim using the existing border-box gradient technique, circular.
- 2-3 pseudo-element rings at slightly different radii for depth (bright outer rim, soft inner rim).
- A slowly rotating conic-gradient halo behind/around the disc (~40-60s), low opacity.
- 2-3 faint concentric orbit rings inside the margin band, subtly breathing.
- Large soft outer drop shadow + cyan rim glow so the disc floats.

Do not:
- reduce readability,
- make it look like a game menu,
- change close/backdrop behavior or aria attributes.

Deliver:
- Circular shell CSS.
- Confirm content scroll and footer still render inside the disc.
```

Acceptance checks:

```text
- Panel is a visually perfect circle at desktop sizes.
- Rim glow is visible but not loud.
- Decorative layers are clipped to the disc.
- Backdrop click still closes; aria unchanged.
```

---

## 7. Prompt 04 — Aperture Open / Close Animation

Purpose: a premium circular reveal that respects the existing lifecycle.

```text
Implement an "aperture" open/close animation for the circular modal.

Open:
- clip-path: circle(0% -> 100%) iris reveal, combined with scale 0.92 -> 1 and fade.
- Conic halo spins up. Duration ~= var(--wm-duration-aperture) with --wm-ease-premium.

Close (isClosing state):
- Reverse iris circle(100% -> ~60%) + slight scale-down + fade.
- Must complete within the existing 400ms setTimeout window already in the component.

Reduced motion:
- Replace iris/scale with a simple opacity fade for both open and close.

Do not change the JS close lifecycle, timers, or focus handling — only the CSS/animation.

Deliver:
- Aperture keyframes + wiring to the existing open / welcome-modal--closing classes.
```

---

## 8. Prompt 05 — Brand Identity Zone (Synapse Logo)

Purpose: make the Synapse IDE logo the large, dominant brand in the top arc.

```text
Build the brand identity zone in the top arc of the disc.

Logo:
- Inline-replicate the Synapse glyph from src/components/atoms/Logo.tsx (5 nodes: 4 corners + larger center; synapse connector paths; the wave path).
- Render at var(--wm-logo-size) (~96-120px), centered.
- Tint with the modal cyan palette (no ThemeContext dependency).
- Wrap with: a breathing radial halo, a thin rotating accent ring echoing the conic halo, and subtle node pulses.

Wordmark & supporting text (all centered, radially symmetric):
- Eyebrow "WELCOME TO" as a mono kicker with a live status dot, above the wordmark.
- "Urban Analytics" at var(--wm-wordmark) (42-52px), heavy weight, tight tracking, retaining a slow shine sweep.
- "Workbench" as a larger secondary word; enlarged "GIS" brand chip aligned beside it.
- Subtitle: "Spatial Intelligence Platform for Urban Scientists & Planners" with comfortable measure.

The brand must be the unmistakable first focal point of the disc.

Accessibility:
- The logo SVG is decorative within the heading context; keep the accessible name on the dialog.
- Do not convey essential meaning through animation. Strong contrast.

Deliver:
- Brand zone markup + scoped CSS.
```

Suggested brand hierarchy:

```text
Eyebrow: WELCOME TO  (mono, status dot)
Logo:    Synapse glyph (large, haloed, rotating ring)
Title:   Urban Analytics · Workbench   [GIS]
Subtitle:Spatial Intelligence Platform for Urban Scientists & Planners
```

---

## 9. Prompt 06 — Metric Chip Rail

Purpose: present the three capability metrics as a centered orbital rail.

```text
Build the metric chip rail directly under the brand.

Chips (centered, following the chord width):
- 150+ Analysis Cards
- GIS + AI Spatial Intelligence
- Python Analysis Engine

Style:
- Rounded pills (~14px), monospace labels, value/label split, soft inner glow.
- Calm at rest; gentle brightness lift on hover; slow, low-opacity periodic glint.

Responsive:
- Wrap to two rows or a column on narrow widths while staying centered.

Deliver:
- Chip rail markup + scoped CSS. No layout shift on hover.
```

---

## 10. Prompt 07 — Inscribed Content Scroll Region

Purpose: present long content cleanly inside a circle.

```text
Build the inscribed, mask-faded content scroll region inside the disc.

Container:
- Centered column, max-width: var(--wm-col-max) (kept inside the inscribed chord with margin for the rings).
- Vertical scroll with a custom thin scrollbar (hide native chrome).

Edge treatment:
- Top & bottom mask-image (linear/radial) fades so content dissolves into the curved frame instead of hard-clipping at the circle edge.
- Use var(--wm-edge-fade) for the fade size.

Scroll affordance:
- A subtle scroll chevron/hint near the lower arc that fades out after the first scroll, so users know more content exists behind the fade.

Content blocks (kept, lightly condensed):
- About Urban Analytics Workbench
- Capability cards grid
- "Built on Synapse IDE Foundation" highlight
- Urban Analysis Workflow steps
- Data Standards & Methodology

Deliver:
- Scroll region markup + scoped CSS (column, masks, scrollbar, scroll hint).
- Confirm no content is hard-clipped by the circle.
```

---

## 11. Prompt 08 — Capability Cards

Purpose: polished, interactive cards that fit the narrower circular column.

```text
Restyle the capability cards for the circular column.

Card style:
- ~16px radius to echo the shell.
- Dark glass surface, thin border, contained icon tile, readable title, compact description.
- Faint curved-line texture behind each card.

Hover/focus (transform-only, no layout shift):
- Lift 2-3px, border becomes more cyan, icon glow intensifies, diagonal light sweep crosses the card.
- Only the hovered/focused card activates (no ambient per-card glow at rest).
- Strong, visible focus ring (2px ring + border).

Do not:
- animate width/height/padding/margins,
- use card-inside-card composition,
- hide text behind glow.

Deliver:
- Card CSS + minimal markup tweaks (sweep/icon layers) only if needed.
```

Acceptance checks:

```text
- Cards readable inside the inscribed column.
- Hover premium but restrained; keyboard focus visible.
- No grid jump on hover.
```

---

## 12. Prompt 09 — Footer Command Bar & CTA (lower arc)

Purpose: anchor a strong primary action in the bottom arc.

```text
Build the lower-arc command bar and primary CTA.

Layout (centered in the bottom arc):
- De-emphasized metadata line: version + date + developer attribution + Synapse IDE link.
- Primary CTA below it.

CTA "Start Workbench":
- Large, fully rounded pill, bright cyan gradient.
- Hover: shine + brightness. Active: slight press. Focus: strong accessible ring.
- The single clear primary action of the disc.

Integration:
- Hero (top arc) and footer (bottom arc) share the same rim-light treatment so the disc reads as one system.

Reduced motion:
- No shine animation.

Deliver:
- Footer/CTA markup + scoped CSS.
- Keep all useful version metadata; do not break close behavior.
```

---

## 13. Prompt 10 — Orbital Decorative System (+ canvas retarget)

Purpose: convert decoration from horizontal to radial/orbital, keeping the effect budget.

```text
Retarget the decorative atmosphere to radial/orbital motion.

Replace/adapt:
- Horizontal contour lines -> concentric contour RINGS (very low opacity, slow breathing).
- Horizontal flow paths -> orbital flow ARCS sweeping around the disc.
- Linear scan -> RADAR SWEEP (rotating conic wedge), periodic and subtle.
- Fixed signal nodes -> nodes ORBITING along a ring.
- Grid drift -> faint, masked to a ring band.

AmbientFlowCanvas:
- Replace the cubic-Bezier routes with parametric circular/elliptical orbit paths.
- Keep <= ~12 particles, low opacity, mix-blend: screen.
- Mask particles away from the brand text region so they never reduce legibility.
- Preserve all four invariants: rAF only while mounted, cleanup on unmount, never start under reduced-motion, devicePixelRatio capped at 1.5.

All decorative layers stay aria-hidden + pointer-events: none.

Effect budget (calm at rest, alive on interaction):
- Concentric rings: always visible, very low opacity.
- Orbital arcs/particles: slow motion.
- Radar sweep: subtle, periodic.
- Orbiting nodes: sparse, slow pulse.

Deliver:
- Updated atmosphere markup + scoped CSS + retargeted canvas math.
```

---

## 14. Prompt 11 — Responsive & Graceful Degradation

Purpose: keep the disc usable across viewports.

```text
Make the circular modal responsive with a graceful mobile fallback.

Sizing:
- Diameter: min(92vmin, 940px); aspect-ratio: 1 keeps it perfectly round on desktop/tablet.

Breakpoints:
- Desktop / large tablet: full perfect circle.
- Below ~560px width: morph the shell to a very-rounded capsule (border-radius ~40px, release aspect-ratio, near full-height sheet) so content stays usable. Keep the brand dominant and the CTA full-width.

Also handle:
- Metric chip wrapping into a rail/column.
- Inscribed column reflow; scroll height.
- Ultra-wide / very short viewports (vmin keeps the disc bounded).
- Browser zoom / OS text scaling (relative units, percentage-based fades).

Rules:
- Do not scale font size directly with viewport width beyond the clamp() tokens.
- No overflow out of buttons/cards. Prefer grid/flex constraints.

Deliver:
- Responsive CSS + a short note of checked breakpoints.
```

---

## 15. Prompt 12 — Motion, Accessibility, and Reduced Motion

Purpose: keep the effect-heavy circular result usable and accessible.

```text
Harden motion and accessibility for the Orbital Cockpit.

Check:
- prefers-reduced-motion support across EVERY new animated element and ::before/::after.
- keyboard focus states; focus-on-open still lands on a sensible control.
- aria-hidden + pointer-events:none on all decorative layers (rings, halo, sweep, nodes, canvas).
- color contrast (WCAG AA) on visible text over surfaces, fades, halo, and particles.
- scrollability is perceivable WITHOUT relying on animation (the scroll hint must be static-visible too).
- CTA focus/activation; Escape and backdrop close still work.

Implement:
- Reduced motion freezes: conic halo, radar sweep, orbital particles, logo node pulses, brand shine, contour-ring breathing.
- Reduced motion uses opacity-only aperture (no iris/scale).
- Decorative SVGs/canvas never receive focus.

Do not:
- remove modal aria attributes,
- change the close lifecycle,
- add a focus trap unless one already exists (keep parity).

Deliver:
- Reduced-motion CSS block + any small markup accessibility fixes.
```

Suggested reduced-motion direction (adapt selectors to the final implementation):

```css
@media (prefers-reduced-motion: reduce) {
  .welcome-modal *,
  .welcome-modal *::before,
  .welcome-modal *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
  .welcome-modal__halo,
  .welcome-modal__radar,
  .welcome-modal__nodes,
  .welcome-modal__flow-canvas {
    display: none;
  }
  .welcome-modal__atmosphere { opacity: 0.45; }
}
```

---

## 16. Prompt 13 — Validation and QA

Purpose: verify with the repo's expected commands.

```text
Validate the circular Orbital Cockpit redesign.

Run:
- npm run typecheck
- npm run test:analytics

Also run if practical:
- npm run lint:errors
- npm run dev, then visually inspect the modal.

Manual QA checklist:
1. Modal renders as a perfect circle on desktop; capsule fallback on mobile.
2. Aperture open/close is smooth; close lifecycle and Escape/backdrop still work.
3. Synapse logo is large and dominant; brand reads first.
4. Metric chips are readable and calm at rest.
5. Content scrolls inside the disc and fades into the edge; nothing hard-clipped.
6. Scroll hint communicates more content exists.
7. Capability cards readable; hover premium; no layout shift; focus visible.
8. CTA prominent and accessible in the lower arc.
9. Decorative layers are aria-hidden + pointer-events:none.
10. Reduced-motion disables continuous animation and uses opacity-only open/close.
11. No TypeScript, analytics test, or lint errors introduced.

Return:
- Commands run, results, files changed, remaining visual risks.
```

---

## 17. One-Shot Implementation Prompt

Use this when you want a single agent to execute the whole circular redesign in one pass.

```text
Implement the fully circular "Orbital Cockpit" redesign for the Urban Analytics welcome modal.

Primary file:
- src/features/urbanAnalytics/WelcomeModal.tsx

Brand asset:
- Reuse the Synapse glyph from src/components/atoms/Logo.tsx (inline-replicated in the modal palette).

Reference design:
- perfect circular glass disc (desktop), capsule fallback (mobile),
- layered gradient rim + rotating conic halo + concentric orbit rings + outer glow,
- large dominant Synapse logo brand in the top arc with halo + rotating ring,
- enlarged centered wordmark + GIS chip + mono eyebrow + subtitle,
- centered metric chip rail,
- inscribed scroll column with top/bottom edge fades + scroll hint,
- interactive capability cards (~16px radius, transform-only hover/focus),
- lower-arc command bar with a fully rounded pill CTA,
- orbital decoration (concentric contour rings, orbital arcs, radar sweep, orbiting nodes, canvas particles on circular orbits),
- aperture open/close (clip-path iris + scale + fade).

Implementation requirements:
1. Preserve modal behavior, content meaning, accessibility semantics, and the isClosing 400ms close lifecycle.
2. Keep edits scoped to the welcome modal; keep CSS in the inline <style> block.
3. The shell must be a PERFECT CIRCLE on desktop (aspect-ratio:1; border-radius:50%).
4. aria-hidden + pointer-events:none on every decorative layer.
5. Animate transform/opacity/clip-path/stroke-dashoffset only.
6. Add prefers-reduced-motion handling for every animated element; opacity-only aperture under reduced motion.
7. Keep text readable; ensure content fades into the curved edge instead of hard-clipping.
8. Retarget AmbientFlowCanvas to circular/elliptical orbits; keep rAF-while-mounted, cleanup-on-unmount, no-start-under-reduced-motion, DPR<=1.5.
9. Do not add Tailwind or unrelated dependencies.
10. Do not touch Urban Analytics stores, evidence artifacts, map rendering, workflow state, GIS calculations, or domain contracts.

Detailed tasks:
- Audit the current component and the Synapse logo glyph.
- Add circular geometry tokens (disc, ring radii, column max-width, edge fades, brand sizes).
- Build the circular shell (rim, halo, orbit rings, glow).
- Wire the aperture open/close animation.
- Build the brand identity zone with the Synapse logo.
- Build the metric chip rail.
- Build the inscribed scroll column with edge fades + scroll hint.
- Restyle capability cards.
- Build the lower-arc command bar + pill CTA.
- Retarget decoration to radial/orbital + canvas orbits.
- Add responsive rules (circle desktop -> capsule mobile).
- Extend prefers-reduced-motion to all new elements.
- Run npm run typecheck and npm run test:analytics.

Definition of done:
- The modal is a perfect circle on desktop, premium and luminous.
- The Synapse logo is large and clearly dominant; brand reads first.
- Long content scrolls inside the disc and fades into the curved edge; nothing hard-clipped.
- Cards feel interactive without layout shift; CTA is prominent in the lower arc.
- Accessibility is preserved; reduced-motion yields a static, readable disc.
- Required checks pass, or failures are reported with exact causes.
```

---

## 18. Visual QA Prompt

Use this after implementation to critique screenshots or browser inspection.

```text
Perform a visual QA review of the redesigned Urban Analytics welcome modal.

Judge it against this target:
"A luminous, perfectly circular spatial-intelligence cockpit with a large dominant Synapse brand, orbital motion, glass surfaces, and controlled effect richness."

Review:
- is the shell a true perfect circle (desktop)? capsule acceptable on mobile?
- brand dominance and first-impression focal point (Synapse logo),
- rim/halo/orbit-ring quality and depth,
- aperture open/close feel,
- metric chip polish,
- inscribed content readability and edge-fade quality (any hard clipping?),
- scroll affordance clarity,
- card readability and hover behavior (layout shift?),
- CTA prominence in the lower arc,
- responsive behavior and the capsule fallback,
- reduced-motion behavior,
- consistency with the Urban Analytics workbench design language.

Call out:
- anything that feels cheap or too noisy,
- any visual hierarchy problem,
- any text contrast or overlap issue,
- any clipped/unreadable content at the circle edge,
- any effect that should be slowed, dimmed, or removed.

Return:
1. Critical fixes.
2. Premium polish improvements.
3. Optional future enhancements.
4. Final accept/reject recommendation.
```

---

## 19. Copy and Label Guidance

Prefer concise labels that make the interface feel like a command surface.

Recommended:

```text
WELCOME TO
Urban Analytics Workbench
Spatial Intelligence Platform for Urban Scientists & Planners
150+ Analysis Cards
GIS + AI Spatial Intelligence
Python Analysis Engine
Start Workbench
```

Avoid:

```text
Get Started With This Amazing Platform
Explore The Future Of Urban Analytics
Revolutionary AI-Powered Solution
Next Generation Experience
```

Reason:
- The product is an analytical workbench, not a marketing landing page.
- Premium here means controlled, precise, and confident.

---

## 20. Effect Budget

Use many effects, but assign them clear hierarchy. The circle is calm at rest; it comes alive on hover/focus.

Primary ambient effects (radial):

```text
Concentric contour rings: always visible, very low opacity.
Orbital flow arcs / canvas particles: always visible, slow motion.
Grid ring band: barely visible, adds technical precision.
Orbiting signal nodes: sparse, slow pulse.
Radar sweep: subtle, periodic.
Conic halo: very slow rotation, low opacity.
```

Interactive effects:

```text
Card hover: lift, border glow, light sweep.
Card focus: clear ring plus border.
CTA hover: shine and brightness.
CTA active: slight press.
Metric chip hover: small brightness increase.
```

Avoid effect stacking where every element glows at full intensity. At rest, the disc should be calm and the brand should dominate.

---

## 21. Implementation Checklist

```text
[ ] Audit WelcomeModal.tsx + Synapse Logo glyph.
[ ] Add circular geometry tokens (disc, ring radii, column max-width, edge fades, brand sizes).
[ ] Build perfect-circle shell (aspect-ratio:1, border-radius:50%, overflow hidden).
[ ] Layered gradient rim + rotating conic halo + concentric orbit rings + outer glow.
[ ] Aperture open/close (clip-path iris + scale + fade) wired to isClosing.
[ ] Brand zone: inline Synapse logo (large, haloed, rotating ring) + node pulses.
[ ] Enlarged centered wordmark + GIS chip + mono eyebrow + subtitle.
[ ] Centered metric chip rail.
[ ] Inscribed scroll column + top/bottom edge fades + custom scrollbar.
[ ] Scroll hint that fades after first scroll.
[ ] Capability cards (~16px radius, transform-only hover/focus, strong focus ring).
[ ] Highlight/workflow/standards sections restyled for the narrow column.
[ ] Lower-arc command bar + fully rounded pill CTA.
[ ] Retarget decoration to radial: concentric contour rings, orbital arcs, radar sweep, orbiting nodes.
[ ] Retarget AmbientFlowCanvas to circular/elliptical orbits (keep all 4 invariants).
[ ] Mask particles away from brand text region.
[ ] Responsive: perfect circle desktop -> rounded capsule below ~560px.
[ ] prefers-reduced-motion: freeze all motion + opacity-only aperture.
[ ] Verify aria-hidden + pointer-events:none on all decorative layers.
[ ] Verify WCAG AA contrast on visible text.
[ ] Run npm run typecheck.
[ ] Run npm run test:analytics.
[ ] Run npm run lint:errors if feasible.
[ ] Inspect visually in browser if feasible.
```

---

## 22. Final Handoff Summary Template

Use this format after the implementation is complete.

```text
Implemented the fully circular "Orbital Cockpit" redesign for the Urban Analytics welcome modal.

Changed:
- src/features/urbanAnalytics/WelcomeModal.tsx

Highlights:
- Reshaped the modal into a perfect circular glass disc (capsule fallback on mobile).
- Added a layered gradient rim, rotating conic halo, concentric orbit rings, and outer glow.
- Made the Synapse IDE logo the large, dominant brand in the top arc.
- Built a centered metric chip rail and an inscribed scroll column with edge fades + scroll hint.
- Restyled capability cards and rebuilt the lower-arc command bar with a pill CTA.
- Converted decoration to radial/orbital motion and retargeted the canvas particles to circular orbits.
- Added an aperture open/close animation, responsive morph, and full reduced-motion handling.

Validation:
- npm run typecheck: PASS/FAIL
- npm run test:analytics: PASS/FAIL
- npm run lint:errors: PASS/FAIL or not run

Notes:
- Any remaining risks or manual QA items (e.g., content density inside the circle, contrast over halo).
```
