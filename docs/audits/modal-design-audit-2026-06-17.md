# Modal & Dialog System — Design, Accessibility & Maintainability Audit

**Date:** 2026-06-17
**Scope:** Every modal/dialog component in `SynapseIDE_urban_analytics`
**Method:** Full source inspection of each modal, the shared `Modal` primitive, and
the `useFocusTrap` hook, evaluated against the
[WAI-ARIA Authoring Practices — Dialog (Modal) Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
and WCAG 2.2 (2.1.2 No Keyboard Trap / focus order, 2.4.3 Focus Order, 2.4.7 Focus
Visible, 4.1.2 Name·Role·Value, 1.4.10 Reflow, 2.3.3 Animation from Interactions).

> **Accuracy note.** This audit supersedes an earlier draft that asserted the Map
> Explorer modal was *missing* ARIA roles and *eagerly loaded 3D models*, and that
> several files were larger than they are. Direct inspection shows the Map Explorer
> modal in fact has the **strongest** accessibility implementation in the codebase,
> deck.gl/three are **not** eagerly imported, and the line counts differ from the
> draft. The findings below are grounded in verified `file:line` evidence.

---

## 1. Modal inventory

| Modal | File | Lines | Render strategy | Focus trap | Focus restore | Escape | ARIA name |
|---|---|---:|---|:--:|:--:|:--:|---|
| Base `Modal` primitive | `src/components/molecules/Modal.tsx` | 235 | portal + styled | ❌ | ❌ | ✅ | `aria-labelledby` (hardcoded id) |
| `useFocusTrap` (shared hook) | `src/centerpanel/components/map/useFocusTrap.ts` | 123 | — | ✅ | ✅ | — | — |
| Command Palette | `src/components/ide/CommandPalette.tsx` | 744 | base `Modal` | ❌ (inherits) | ✅ (own) | ✅ | `title` prop |
| Global Search | `src/components/ide/GlobalSearch.tsx` | — | inline panel | ❌ | partial | ✅ | `aria-label` |
| Unsaved Changes | `src/components/ide/UnsavedChangesDialog.tsx` | 255 | raw + portal | ✅ (own) | ✅ | ✅ | `aria-labelledby`+`describedby` |
| New File | `src/components/file-explorer/NewFileModal.tsx` | 940 | raw + portal | ❌ | ❌ | ✅ | `aria-label` (on overlay) |
| New Project | `src/components/molecules/NewProjectModal.tsx` | 193 | base `Modal` | ❌ (inherits) | ❌ | ✅ | `aria-labelledby` |
| Keys | `src/components/ai/panel/KeysModal.tsx` | 218 | raw + portal | ✅ (own) | ✅ | ✅ | `aria-labelledby` |
| AI Settings | `src/components/ai/settings/AiSettingsModal.tsx` | 275 | raw div (no portal) | ❌ | ❌ | ❌ | role only, **unnamed** |
| Settings | `src/components/settings/SettingsModal.tsx` | 1352 | base `Modal` | ❌ (inherits) | ❌ | ✅ | `aria-labelledby` |
| Welcome | `src/features/urbanAnalytics/WelcomeModal.tsx` | 2807 | raw + portal | ✅ (own) | ✅ | ✅ | `aria-label` (title id unused) |
| Urban Analytics | `src/features/urbanAnalytics/UrbanAnalyticsModal.tsx` | 1706 | raw + portal | ✅ (own) | ✅ | ✅ | `aria-labelledby`+`describedby` |
| Map Explorer (shell) | `…/map/controllers/MapExplorerModalRuntimeCore.tsx` | 6791 | portal → `MapWorkspaceShell` | ✅ (shared hook) | ✅ | ✅ | `aria-labelledby` + bg `aria-hidden` |
| Map Dialog Shell (nested) | `…/map/MapDialogShell.tsx` | — | floating dialog | ✅ (own, 2nd impl) | ✅ | ✅ | — |

Plus a family of Map data dialogs (`MapServiceDialog`, `MapCsvImportDialog`,
`MapColumnarImportDialog`, `MapDataImportHubDialog`, `MapExportDialog`,
`MapDataExportDialog`, `MapImportPreviewDialog`, `MapStartDialog`,
`MapFlowDispatchDialog`) that render inside the Map Explorer shell.

**The single most important structural fact:** the codebase contains **at least six
independent focus-trap implementations** — the shared `useFocusTrap` hook, plus
hand-rolled copies in `KeysModal`, `UnsavedChangesDialog`, `WelcomeModal`,
`UrbanAnalyticsModal`, and `MapDialogShell` — while the *base* `Modal` primitive that
most dialogs are built on **has none**. Accessibility quality is therefore a lottery
determined by which pattern a given modal happened to copy.

---

## 2. Shared infrastructure

### 2.1 Base `Modal` primitive — `src/components/molecules/Modal.tsx`

This is the component most dialogs compose (Command Palette, New Project, Settings).
Its gaps propagate to every consumer.

| # | Issue | Evidence | Why it matters |
|---|---|---|---|
| M1 | **No focus trap.** Only the first focusable element is focused on open; Tab/Shift+Tab can leave the dialog into background content. | `Modal.tsx:189-199` (initial focus only; no `keydown`/Tab handler) | Violates WAI-ARIA dialog pattern & WCAG 2.4.3. `aria-modal` promises containment the DOM does not deliver. |
| M2 | **No focus restoration on close.** The opener element is never captured or refocused. | No `previouslyFocused` ref anywhere in the file | Keyboard/SR users are dropped at `<body>` start after closing. |
| M3 | **Hardcoded `id="modal-title"`.** Every instance emits the same DOM id. | `Modal.tsx:214,217` | Two base `Modal`s open at once produce duplicate ids → `aria-labelledby` resolves ambiguously. |
| M4 | **Global key/click listeners, not dialog-scoped.** `useKeyPress('Escape')` and `useOnClickOutside` attach to `window`/`document`. | `Modal.tsx:162-168`; `useCommon.ts:363-420` | With stacked or portaled dialogs, an Escape/outside-click can close the wrong (or every) modal. `useKeyPress` returns boolean state shared process-wide. |
| M5 | **Direct `document.body.style.overflow` mutation** for scroll lock. | `Modal.tsx:178-186` | Two modals fight over the same style; the first to close restores scroll while another is still open. No ref-counting. |
| M6 | **No background `inert`/`aria-hidden`.** The app root stays in the AT tree. | (absent) | SR virtual-cursor users can still read/operate the page behind the modal. |
| M7 | **No live-region announcement** of open/close. | (absent) | Modal appearance is silent to screen readers beyond the focus move. |

`aria-modal` is written as a bare attribute (`Modal.tsx:213`), which React serialises to
`aria-modal="true"` — so the *attribute* is correct; the *behaviour* it implies (M1, M6)
is what is missing.

### 2.2 `useFocusTrap` — `src/centerpanel/components/map/useFocusTrap.ts`

A **well-built, reusable** hook: it re-queries focusables on each Tab (handles dynamic
content), filters hidden/`aria-hidden`/`tabindex=-1` nodes (`:18-45`), captures and
**restores** the previously focused element with a `document.contains` guard
(`:59-75`), and wraps Tab/Shift+Tab at the boundaries (`:78-107`).

**The problem is location, not quality.** It lives under `centerpanel/components/map/`,
so non-map modals do not discover it and instead reimplement the same logic. It should
be promoted to a shared location (e.g. `src/hooks/useFocusTrap.ts`) and consumed by the
base `Modal`.

---

## 3. Per-modal findings

### 3.1 IDE modals

#### Command Palette — `CommandPalette.tsx`
- ✅ Strong **combobox/listbox** semantics: `role="listbox"`, `role="option"`,
  `aria-activedescendant`, `aria-selected`, `role="tablist"`/`tab` for modes
  (`:558-702`), live region for result count (`:600`).
- ✅ Captures and **restores** opener focus itself (`:431,437`); Escape handled (`:446`).
- ⚠️ Built on base `Modal` (`:556`) so it inherits **M1** (no Tab trap) and **M5/M6**.
  Its rich keyboard model partly compensates, but Tab still escapes.

#### Global Search — `GlobalSearch.tsx`
- ✅ `role="listbox"`/`tab` scope tabs, arrow-key navigation, Escape to close (`:373-428`).
- ⚠️ Rendered as an inline panel, **no `role="dialog"`/`aria-modal`**, no focus trap, and
  focus management is ad-hoc (`resultRefs…focus()`). If presented modally it needs the
  dialog contract; if it is a non-modal panel that should be explicit.

#### Unsaved Changes — `UnsavedChangesDialog.tsx`
- ✅ **Reference-quality small dialog**: `role="dialog"`, `aria-labelledby`,
  `aria-describedby` (`:137-140`), 3-button focus trap (`:119-132`), focus restore
  (`:112-116`), Escape (`:120`), primary action (Save) focused on mount.
- ⚠️ Injects a global `<style>` once via a module-level `_styleInjected` flag
  (`:88-96`) and hardcodes colors/sizes inline (`width:380`, hex values) rather than
  using theme tokens. Trap logic is a private copy (consolidation candidate).

#### New File — `NewFileModal.tsx` (940 lines)
| # | Issue | Evidence | Severity |
|---|---|---|---|
| NF1 | **`role="dialog"`/`aria-modal` placed on the full-screen overlay** (which also has `onClick={onClose}`), not on the panel. | `:783-788` vs panel `:790` | High — SR dialog boundary is wrong |
| NF2 | **Selection flow is mouse-only.** Category/language/template cards are clickable `<div>`s with no `role`, `tabIndex`, or `onKeyDown`. | `:829-833, 849-853, 864-868` | High — keyboard users cannot pick a template (WCAG 2.1.1) |
| NF3 | **No focus trap; no focus restore.** Focus enters only on the *filename* step. | `:457-466`; no Tab handler | High |
| NF4 | **~470 lines of static data inlined** in the component file (`getTemplateContentByLanguage` `:17-88`, `LANGUAGE_CATEGORIES` `:91-281`, `TEMPLATE_TYPES` `:284-388`). | as cited | Medium — maintainability |
| NF5 | **Dead pseudo-selectors in inline `style`** objects (`&:hover`, `&:focus` never apply to React inline styles). | e.g. `:585, 632, 720` | Low — silent dead code |
| NF6 | Fixed JS-driven width `Math.min(sidebarWidth*1.8, 600)` (px, not clamped to viewport). | `:534` | Low — narrow-screen overflow |

#### New Project — `NewProjectModal.tsx`
- ✅ Clean, uses base `Modal`, autofocuses the name input.
- ⚠️ **Template cards are clickable `<div>`s** (`:161-172`) with no `role="radio"`/
  `aria-checked`/`tabIndex`/keyboard handler and no description for AT — same class of
  defect as NF2. Inherits base-Modal **M1/M2**.

### 3.2 AI / Settings modals

#### Keys — `KeysModal.tsx`
- ✅ Good a11y baseline: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
  (`:168-170`), proper `tablist`/`tab`/`tabpanel` wiring (`:175-208`), focus trap
  (`:120-136`), focus restore (`:99-118`), Escape (`:92-96`), masked key display, toggle
  with `aria-pressed`/`aria-label`.
- 🐞 **Bug: `GOLD` is referenced but never defined or imported.** `color:GOLD` on the
  title is an undefined identifier (only `GOLDEN_RATIO`/`GOLDEN_PAIRS` exist in the
  repo). This is a `ReferenceError`/`Cannot find name 'GOLD'` waiting to fire on render.
  | `KeysModal.tsx:174` | **High — runtime/type error**
- ⚠️ No background inert; trap logic duplicated (should use shared hook).

#### AI Settings — `AiSettingsModal.tsx` (worst-accessibility modal)
| # | Issue | Evidence | Severity |
|---|---|---|---|
| AS1 | **No focus trap and no focus restore.** | whole file; no Tab/`previouslyFocused` logic | High |
| AS2 | **No Escape-to-close handler.** | no `keydown` effect | High |
| AS3 | **Dialog has no accessible name** — `role='dialog' aria-modal='true'` with no `aria-labelledby`/`aria-label`; the "AI Settings" text is a plain `<strong>`. | `:159-166` | High (WCAG 4.1.2) |
| AS4 | **Not portaled** — rendered in-tree, so z-index/stacking and background interaction are unmanaged. | `:158-163` | Medium |
| AS5 | **Close button is `×` with only a `title`**, no `aria-label`. | `:167` | Medium |
| AS6 | Pervasive `any` (`keys: Record<string, any>`, `keyPayload: any`, etc.) undermines `strict`/`exactOptionalPropertyTypes`. | `:10, 82-85, 126-128` | Medium |

#### Settings — `SettingsModal.tsx` (1352 lines)
- ✅ Excellent **internal** ARIA: vertical `tablist`/`tab`/`tabpanel`, roving tabindex,
  `radiogroup`/`radio`, `listbox`/`option`, arrow-key roving (`:730-973, 665-678`); ids
  namespaced with `useId()` (no duplicate-id risk).
- ⚠️ Inherits base-Modal **M1/M2** (no Tab trap, no focus restore).
- ⚠️ **Responsiveness floor:** `<Wrap>` is locked to `height:560px` and `180px` nav
  (`:17-21`); base `Modal` `palette` size sets `min-width:640px` (`Modal.tsx:101`), so
  the dialog cannot reflow below 640px — overflows small viewports (WCAG 1.4.10).
- ⚠️ Monolith signals: ~19 `useState`; inline `<style>` block re-injected on render
  (`:690-728`); **hand-rolled list virtualization** reading `scrollTop` during render
  (`:829-894`); **network key-verification** (`testOpenAI/Anthropic/Gemini`) embedded in
  the component (`:613-631`); brittle global flag `globalThis.__KEY_ROUTER_SUSPENDED__`
  (`:188-201, 563-564`).

### 3.3 Urban Analytics modals

#### Welcome — `WelcomeModal.tsx` (2807 lines)
- ✅ Hand-rolled focus trap (`:519-562`), focus restore via `previousFocusRef`
  (`:566-585`), Escape (`:522`), reduced-motion-aware ambient canvas that never starts
  its rAF loop under `prefers-reduced-motion` (`:94-97`), correct `aria-hidden` on
  decorative SVG/canvas, content is data-driven (`WELCOME_SECTIONS` etc.).
- ⚠️ Uses `aria-label` while a visible `<h1 id="welcome-modal-title">` exists but is
  **never referenced** by `aria-labelledby` (`:596-598` vs `:708`) — name drift risk.
- ⚠️ **No background inert/`aria-hidden`.**
- ⚠️ **Duplicates the shared hook** (`FOCUSABLE_MODAL_SELECTOR`/`getFocusableModalElements`
  `:60-82` ≈ `useFocusTrap`).
- ⚠️ Fixed `setTimeout(…,400)` close delay ignores reduced-motion (`:466-470`)
  — keyboard users wait 400 ms for unmount even when motion is disabled.
- ⚠️ ~1860-line inline CSS-in-`<style>` block; densest section shows 9 cards at once.

#### Urban Analytics — `UrbanAnalyticsModal.tsx` (1706 lines)
- ✅ Best-named dialog: `role="dialog"`, `aria-labelledby` + `aria-describedby` wired to
  real SR-only nodes (`:866-914`), polite live regions for status (`:915,932`), focus
  trap (`:782-807`), focus restore (`:648-652`), Escape (`:770`), `RightPanelBoundary`
  **lazy-loaded** with retry + suspense (`:65-67, 979-990`).
| # | Issue | Evidence | Severity |
|---|---|---|---|
| UA1 | **Focus-trap listener bound to the modal element, not `document`** — cannot recapture focus that has already escaped to the background. | `:805` | Medium |
| UA2 | **No background inert/`aria-hidden`.** | (absent) | Medium |
| UA3 | **`jsx-a11y/no-noninteractive-element-interactions` disabled file-wide** (dialog root carries `onMouseDown`/`onKeyDown`). | `:1` | Medium |
| UA4 | **Untyped `window.dispatchEvent(new CustomEvent('synapse:…'))`** instead of the mandated typed `synapseBus`. | `:687-756` | Medium (convention) |
| UA5 | `aria-hidden={false}` left on `.midCol` — no-op leftover. | `:966` | Low |
| UA6 | **High cognitive load:** 101-card library rail + ~9 context pills + ~18 status-bar actions visible simultaneously; narrow-screen breakpoints **hide** the rail/center entirely (`:1674-1678`). | `:413-459, 955, 1093-1173` | Medium (UX) |
| UA7 | Module-load side effects (`buildFullLibrary()`, `__setUrbanLibrary`, dev store subscription) run on import. | `:53-77` | Low |

### 3.4 Map Explorer modal — `MapExplorerModalRuntimeCore.tsx` (6791 lines)

**Accessibility is the codebase's best** — and should be the template the others copy:
- `role="dialog"` / `aria-modal` / `aria-labelledby` on `MapWorkspaceShell`
  (`MapWorkspaceShell.tsx:626-628`), background siblings set `aria-hidden` while modal
  (`:600-617`), focus trap + restore + Escape via `useMapExplorerLifecycle` →
  `useFocusTrap` (`useMapExplorerLifecycle.ts:18-42`; `Core:703-707`), a skip link
  (`Core:6154`), and a screen-reader announcer.

The problems here are **architecture, not a11y**:
| # | Issue | Evidence | Severity |
|---|---|---|---|
| MX1 | **6791-line god-component**, ~66 `useState`, ~28 `useRef`, ~173 `useCallback`, ~59 `useMemo`, ~27 `useEffect` (~325 hook calls) coordinating every panel. | file-wide | High — maintainability/bug risk |
| MX2 | **~170-field props interface** on `MapExplorerModalRuntimeView` spread in one JSX element; every new overlay touches two files. | `View.tsx:37-208`; `Core:6609` | High |
| MX3 | **Three pure passthrough files** (`MapExplorerModal.tsx`, `…Root.tsx`, `…Runtime.tsx`) add indirection with no behavior. | those files | Low |
| MX4 | **Two parallel focus-trap/Escape implementations** (`useFocusTrap` for the shell vs hand-rolled in `MapDialogShell.tsx:139-265`). | as cited | Medium |
| MX5 | **51 direct `toastError/Info/Success` calls; 0 `reportError`** — violates the project rule that error conditions go through `src/lib/error-bus.ts`. No top-level error boundary in Core (only per-panel `MapPanelErrorBoundary` in the View). | `Core:137`; `View.tsx:534,554,574,596` | Medium (convention + UX consistency) |
| MX6 | **Eager service/data imports** (workflow/QA/NL/cartography services, `SAMPLE_BUILDINGS`, `SpatialDB`) load with the module. deck.gl/three are *not* eager — they sit behind `MapCanvas`/Scene3D (good). Only the report drawer and inspector host are code-split (`Core:140-148`). | `Core:21,46-48,112` | Medium (boot cost) |
| MX7 | A few **fixed rem layout magic numbers** assume the activity rail is always present (`--map-canvas-control-dock-width:'58rem'`, `width: calc(100% - ${MAP_ACTIVITY_RAIL_WIDTH})`). Panel widths are otherwise state-driven (no literal 384px). | `Core:6419-6425` | Low |

---

## 4. Cross-cutting themes

1. **Fragmented focus management.** Six trap implementations + a base primitive with
   none. The good hook exists but is mislocated. *(M1, NF3, AS1, plus every "own"/"inherits" row.)*
2. **No background inertness anywhere except the Map Explorer.** Most modals rely on
   `aria-modal` alone. *(M6, AS-, UA2, Welcome.)*
3. **Inconsistent accessible naming.** Best: Urban/Map (`aria-labelledby`+`describedby`).
   Worst: AI Settings (unnamed). Welcome wires a title id it never uses. *(AS3, Welcome, M3.)*
4. **Keyboard-inaccessible "cards."** Clickable `<div>`s as selectors in New File and New
   Project. *(NF2, NewProject.)*
5. **Monoliths mixing data, network, and UI.** New File (templates), Settings (network
   key tests + virtualization), Welcome (1860-line CSS), Map Explorer Core (6791 lines).
6. **Convention drift from `CLAUDE.md`:** direct toasts instead of `reportError` (Map
   Explorer), untyped `CustomEvent` instead of `synapseBus` (Urban), pervasive `any`
   (AI Settings), an a11y-lint suppression (Urban).
7. **Responsiveness via hide-not-reflow.** Settings has a 640px min-width floor; Urban &
   Map hide whole columns at breakpoints rather than reflowing. *(Settings, UA6.)*
8. **One concrete runtime bug:** undefined `GOLD` in Keys. *(KeysModal.)*

---

## 5. Recommendations

### 5.1 Accessibility & focus (do first)
- **Promote `useFocusTrap` to `src/hooks/useFocusTrap.ts`** unchanged (it is already
  correct) and re-export the map copy from it to avoid churn.
- **Adopt it inside the base `Modal`** (fixes M1/M2 for Command Palette, New Project,
  Settings in one change) and add: focus restore, a ref-counted body-scroll lock, and a
  background-inert toggle (`inert` attr on the app root with `aria-hidden` fallback).
- **Replace the hardcoded `id="modal-title"`** with a `useId()`-derived id (fixes M3).
- **Migrate the five hand-rolled traps** (Keys, UnsavedChanges, Welcome, Urban,
  MapDialogShell) onto the shared hook; delete the duplicates.
- **AI Settings:** add `aria-labelledby`, portal it, add Escape + focus trap/restore, and
  give the close button an `aria-label` (AS1-AS5).
- **Standardise naming:** every dialog uses `aria-labelledby` pointing at its real
  heading (`aria-describedby` where a subtitle exists). Wire Welcome's existing
  `welcome-modal-title`.
- **Keyboard-enable selector cards** in New File and New Project: `role="radio"` within a
  `radiogroup` (or real `<button>`s), `tabIndex`, Enter/Space, `aria-checked`, and an
  accessible label/description (NF2, NewProject).
- Add a polite **live-region announcement** on open/close in the base `Modal`.

### 5.2 Bug fix
- **Define/import `GOLD`** (or replace with the intended token) in `KeysModal.tsx:174`.

### 5.3 Maintainability & performance
- **Extract New File data** (`getTemplateContentByLanguage`, `LANGUAGE_CATEGORIES`,
  `TEMPLATE_TYPES`) into `src/components/file-explorer/newFileTemplates.ts`; lazy-load it.
  Remove dead inline pseudo-selectors (NF4-NF5).
- **Decompose `MapExplorerModalRuntimeCore`**: lift panel state into the existing
  controller hooks (continue the pattern already started), collapse the three passthrough
  files, and replace the ~170-prop View interface with grouped context objects or
  per-panel context providers (MX1-MX3).
- **Settings:** extract network key-verification into a service, replace hand-rolled
  virtualization with a library, and lift the `560px`/`640px` floor for reflow
  (MX-style) (Settings responsiveness + monolith).
- **Map Explorer:** route errors through `reportError`, add a top-level shell error
  boundary, and lazy-load the eager analysis-service web (MX5-MX6).
- **Reduced motion:** gate the `setTimeout` close delays on `prefers-reduced-motion`
  (Welcome `:466`, Urban `:521`).
- **Convention:** replace Urban's untyped `CustomEvent`s with `synapseBus`; remove the
  file-wide a11y-lint suppression once the dialog root is corrected (UA3-UA4).

---

## 6. Prioritized improvement plan

| Priority | Task | Files | Effort | Benefit |
|---|---|---|---|---|
| **P0** | Fix undefined `GOLD` runtime/type error | `KeysModal.tsx:174` | XS | Removes a crash/`tsc` error |
| **P0** | Promote `useFocusTrap` to `src/hooks/`; bake trap + focus-restore + ref-counted scroll-lock + inert + `useId` title into base `Modal` | `Modal.tsx`, new `hooks/useFocusTrap.ts` | M | Fixes M1-M7 for all base-Modal consumers at once |
| **P0** | AI Settings: name the dialog, portal it, add Escape + trap/restore + close `aria-label` | `AiSettingsModal.tsx` | S | Closes the worst single-modal a11y gap |
| **P1** | Keyboard-enable selector cards (radio semantics + key handlers) | `NewFileModal.tsx`, `NewProjectModal.tsx` | S | WCAG 2.1.1; restores keyboard-only flows |
| **P1** | Move New File dialog role to the panel; add focus enter/restore | `NewFileModal.tsx` | S | Correct SR dialog boundary (NF1/NF3) |
| **P1** | Standardise `aria-labelledby`/`describedby`; wire Welcome title id | Welcome, Settings, all | S | Consistent accessible names (4.1.2) |
| **P1** | Migrate the 5 hand-rolled traps onto the shared hook; delete duplicates | Keys, Unsaved, Welcome, Urban, MapDialogShell | M | One audited code path; less drift |
| **P2** | Map Explorer: `reportError` + top-level error boundary; lazy-load eager service web | `…RuntimeCore.tsx`, `View.tsx` | M | Convention compliance; faster modal open |
| **P2** | Extract New File template/catalog data to a lazy module; drop dead inline styles | `NewFileModal.tsx` | S | Smaller file, smaller initial chunk |
| **P2** | Settings: lift 560/640px floor for reflow; extract key-verification service; replace manual virtualization | `SettingsModal.tsx` | M | WCAG 1.4.10; maintainability |
| **P2** | Reduced-motion gating on close `setTimeout`s; replace Urban `CustomEvent`s with `synapseBus`; remove a11y-lint suppression | Welcome, Urban | S | WCAG 2.3.3; typed event contract |
| **P3** | Decompose `MapExplorerModalRuntimeCore` (collapse passthroughs, group the ~170 props, push state into controllers) | Map controllers | L | Long-term maintainability; lower bug rate |

**Sequencing rationale:** P0 items are tiny and either remove a crash or fix the largest
number of modals through a single shared change. P1 closes the remaining WCAG blockers
(keyboard operability, accessible names) and consolidates the duplicated traps. P2/P3 are
maintainability and performance work that is valuable but lower risk; the Map Explorer
decomposition (P3) is the largest effort and should be staged behind the quick wins.

---

## 7. Conclusion

The modal layer is **uneven rather than broadly broken**. The building blocks for a
production-grade system already exist in-repo — a correct `useFocusTrap`, the fully
accessible Map Explorer shell, and the reference-quality `UnsavedChangesDialog` — but they
are not unified. The highest-leverage move is to **lift the existing good patterns into the
base `Modal` primitive and a shared hook**, then migrate the bespoke dialogs onto them.
That single consolidation, plus the `GOLD` fix and the AI Settings naming/trap work,
resolves every P0/P1 accessibility blocker; the monolith decomposition and convention
clean-ups can then proceed incrementally without further regressing accessibility.
