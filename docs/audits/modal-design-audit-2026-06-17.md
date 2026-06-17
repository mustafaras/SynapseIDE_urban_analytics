# Modal & Dialog System — Comprehensive Design, Accessibility & Maintainability Audit

| | |
|---|---|
| **Date** | 2026-06-17 |
| **Scope** | Every modal/dialog component in `SynapseIDE_urban_analytics` (≈25 files) + the shared primitives, hooks, theme tokens, orchestration, and tests that support them |
| **Standards** | [WAI-ARIA APG — Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), WCAG 2.2 AA |
| **Companion** | Remediation plan: [`modal-remediation-plan-2026-06-17.md`](./modal-remediation-plan-2026-06-17.md) |
| **Method** | Full source inspection of each file; behaviour cross-checked against the ARIA dialog pattern and WCAG SCs; every finding carries `file:line` evidence |

> **Accuracy note (supersedes the first draft).** Direct inspection corrected several
> claims from an earlier high-level draft: the **Map Explorer modal has the *strongest*
> accessibility** in the codebase (not "missing ARIA roles"); **deck.gl/three are not
> eagerly imported** by the map modal; there is **no literal `384px` panel** (widths are
> state-driven); and the line counts differ (`NewFileModal` is 940 lines, not ~1,300).
> All findings below are grounded in verified evidence.

---

## 1. Executive summary

The modal layer is **uneven, not uniformly broken**. Production-grade building blocks
already exist in-repo — a correct `useFocusTrap` hook, the fully accessible Map Explorer
shell, and a reference-quality `UnsavedChangesDialog` — but they were never unified.
Whether a given dialog is accessible is effectively a **lottery determined by which
pattern its author copied**.

**The five systemic problems:**

1. **No shared modal foundation.** The base `Modal` primitive (`molecules/Modal.tsx`)
   that Command Palette, Global Search, New Project, and Settings build on has **no focus
   trap, no focus restoration, and no background inerting**. Meanwhile the *good*
   `useFocusTrap` hook is buried under `centerpanel/components/map/` where non-map code
   never finds it — so **at least six independent focus-trap implementations** exist.
2. **Two accessibility blockers ship today.** `AiSettingsModal` is an unnamed dialog with
   no Escape and no focus trap; `MapServiceDialog` is `aria-modal="true"` yet has no Tab
   containment, no Escape, and no focus restore.
3. **Keyboard-inaccessible selectors.** `NewFileModal` and `NewProjectModal` implement
   their primary choices as clickable `<div>`s with no role/tabindex/key handling.
4. **No layering discipline.** A documented z-index scale exists but is unenforced: five
   different strategies coexist, and `AiSettingsModal` (`z-index:1000`) sits *below* the
   backdrop and status bar tiers.
5. **A real runtime bug.** `KeysModal` references an undefined `GOLD` identifier.

**The fix is leverage, not volume:** lifting the existing good patterns into the base
`Modal` + a shared hook resolves the majority of accessibility defects in a single change.

---

## 2. Methodology & evaluation criteria

Each dialog was scored against the WAI-ARIA dialog pattern and the WCAG 2.2 SCs most
relevant to modals:

| Criterion | ARIA APG / WCAG | What "pass" looks like |
|---|---|---|
| Role & modality | `role="dialog"` + `aria-modal="true"` | Present on the **panel**, not the backdrop |
| Accessible name | WCAG 4.1.2 | `aria-labelledby` → visible heading (preferred) or `aria-label` |
| Description | APG | `aria-describedby` for any subtitle/instructions |
| Initial focus | APG | Focus moves into the dialog (first control or primary action) on open |
| Focus containment | WCAG 2.1.2, 2.4.3 | Tab/Shift+Tab cycle within the dialog |
| Focus restoration | APG | Focus returns to the trigger on close |
| Dismissal | APG | Escape closes; backdrop click optional |
| Background inert | APG | Rest of app `inert`/`aria-hidden` while open |
| Reflow | WCAG 1.4.10 | Usable at 320px without horizontal scroll |
| Motion | WCAG 2.3.3 | Animations gated on `prefers-reduced-motion` |
| Name/role of controls | WCAG 4.1.2, 2.1.1 | All actions are real buttons or correctly-roled, keyboard-operable |

---

## 3. Modal inventory

| # | Modal | File | Lines | Render | Name | Init focus | Trap | Restore | Esc | Inert |
|---|---|---|---:|---|---|:--:|:--:|:--:|:--:|:--:|
| 1 | Base `Modal` primitive | `components/molecules/Modal.tsx` | 235 | portal + styled | labelledby (hardcoded id) | first only | ❌ | ❌ | ✅ | ❌ |
| 2 | `useFocusTrap` (hook) | `centerpanel/components/map/useFocusTrap.ts` | 123 | — | — | ✅ | ✅ | ✅ | — | — |
| 3 | Command Palette | `components/ide/CommandPalette.tsx` | 744 | base `Modal` | title prop | ✅ | ❌* | ✅(own) | ✅ | ❌ |
| 4 | Global Search | `components/ide/GlobalSearch.tsx` | 545 | base `Modal` | aria-label | first | ❌ | ❌ | ✅ | ❌ |
| 5 | Unsaved Changes | `components/ide/UnsavedChangesDialog.tsx` | 255 | raw + portal | labelledby+describedby | ✅ | ✅ | ✅ | ✅ | ❌ |
| 6 | New File | `components/file-explorer/NewFileModal.tsx` | 940 | raw + portal | aria-label (on overlay) | partial | ❌ | ❌ | ✅ | ❌ |
| 7 | New Project | `components/molecules/NewProjectModal.tsx` | 193 | base `Modal` | labelledby | ✅ | ❌ | ❌ | ✅ | ❌ |
| 8 | Keys | `components/ai/panel/KeysModal.tsx` | 218 | raw + portal | labelledby | ✅ | ✅ | ✅ | ✅ | ❌ |
| 9 | AI Settings | `components/ai/settings/AiSettingsModal.tsx` | 275 | raw div (**no portal**) | **none** | ❌ | ❌ | ❌ | ❌ | ❌ |
| 10 | Settings | `components/settings/SettingsModal.tsx` | 1352 | base `Modal` | labelledby | ✅ | ❌ | ❌ | ✅ | ❌ |
| 11 | Welcome | `features/urbanAnalytics/WelcomeModal.tsx` | 2807 | raw + portal | aria-label (title id unused) | ✅ | ✅ | ✅ | ✅ | ❌ |
| 12 | Urban Analytics | `features/urbanAnalytics/UrbanAnalyticsModal.tsx` | 1706 | raw + portal | labelledby+describedby | ✅ | ✅* | ✅ | ✅ | ❌ |
| 13 | Map Explorer shell | `…/controllers/MapExplorerModalRuntimeCore.tsx` | 6791 | portal → `MapWorkspaceShell` | labelledby | ✅ | ✅(hook) | ✅ | ✅ | ✅ |
| 14 | Map Dialog Shell | `…/map/MapDialogShell.tsx` | 378 | raw overlay | aria-label | ✅ | ✅(own #2) | ✅ | ✅ | n/a |
| 15 | Map Workspace Shell | `…/map/MapWorkspaceShell.tsx` | 810 | raw overlay | labelledby | ❌ | ❌(delegated) | ❌ | ❌ | ✅ |
| 16 | Map Start Dialog | `…/map/MapStartDialog.tsx` | 510 | raw panel | labelledby+describedby | ✅ | ❌(delegated) | ❌ | ❌ | n/a |
| 17 | Map Import Preview | `…/map/MapImportPreviewDialog.tsx` | 483 | `MapDialogShell` | via shell | ✅ | ✅(shell) | ✅ | ✅ | n/a |
| 18 | Map Service | `components/MapServiceDialog.tsx` | 821 | raw overlay | aria-label | ❌ | ❌ | ❌ | ❌ | ❌ |
| 19 | Map CSV Import | `components/MapCsvImportDialog.tsx` | 392 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |
| 20 | Map Columnar Import | `components/MapColumnarImportDialog.tsx` | 487 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |
| 21 | Map Data Import Hub | `components/MapDataImportHubDialog.tsx` | 253 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |
| 22 | Map Export | `components/MapExportDialog.tsx` | 265 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |
| 23 | Map Data Export | `components/MapDataExportDialog.tsx` | 204 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |
| 24 | Map Flow Dispatch | `…/controllers/MapFlowDispatchDialog.tsx` | 139 | `MapDialogShell` | via shell | ✅ | ✅ | ✅ | ✅ | n/a |

\* Command Palette adds its own focus restore but inherits the base Modal's lack of a Tab
trap. Urban Analytics' trap listener is bound to the modal element, not `document`
(weakness — see §6.3).

**Verdict by family:**
- **Map `MapDialogShell`-based dialogs (17, 19–24): healthy.** All inherit one robust trap.
- **Map bespoke dialogs (15, 16, 18): risky.** Service has no trap/Escape; Start &
  Workspace delegate trapping to a parent and are not self-contained.
- **Generic/base-Modal dialogs (3, 4, 7, 10): inherit the foundation's gaps.**
- **Bespoke app modals (5, 6, 8, 9, 11, 12): each reimplements the wheel** — quality
  ranges from excellent (5) to failing (9).

---

## 4. Architecture & orchestration

### 4.1 No central modal manager — open-state is scattered boolean `useState`

There is **no modal registry, stack, provider, or `useModal` hook**. Each modal's
visibility is an ad-hoc local boolean owned by whichever component happens to render it:

| Modal | Owner | Evidence |
|---|---|---|
| New Project | `App.tsx` | `useState(false)` `App.tsx:123`; rendered `:963` |
| Welcome | `App.tsx` | `showWelcome` `App.tsx:1305`; `:1476` |
| Urban Analytics | `App.tsx` | `showUrbanModal` `App.tsx:1306`; lazy `:35`, `:1488` |
| New File | `EnhancedIDE.tsx` | `showNewFileModal` `:1049`; `:2248` |
| Command Palette | `EnhancedIDE.tsx` | `isCmdOpen` `:1063`; `:2123` |
| Global Search | `EnhancedIDE.tsx` | `isSearchOpen` `:1064`; `:2129` |
| Unsaved Changes | `EnhancedIDE.tsx` | `pendingCloseTabId` `:1112`; `:2296` |
| Settings | `ai/panel/Header.tsx` | `settingsOpen` `Header.tsx:103` |
| Keys | `ai/panel/*` | local boolean |
| Map Explorer | `useMapExplorerStore` (the one store-backed modal) | — |

**Consequences:**
- **Stacking is uncoordinated.** Two base-`Modal`s can be open simultaneously, which
  triggers the duplicate `id="modal-title"` bug (§5.1, M3) and the body-scroll-lock race
  (M5). Nothing prevents or sequences overlapping modals.
- **No global Escape stack.** The base `Modal` and most bespoke modals attach
  document/window Escape listeners with no `stopPropagation` discipline, so Escape can
  close more than intended. (Contrast: Map Explorer e2e explicitly tests *scoped* Escape
  that returns focus to the trigger — `e2e/accessibility-audit.spec.ts`.)
- **Inconsistent lifecycle.** Only Urban Analytics is lazy-loaded (`App.tsx:35`); the
  others are eagerly imported.

### 4.2 Three render strategies coexist

1. **Base `Modal` primitive** (portal + styled-components) — Command Palette, Global
   Search, New Project, Settings.
2. **`MapDialogShell`** (raw overlay, own trap) — the seven map content dialogs.
3. **Fully bespoke `createPortal`/raw `<div>`** — Unsaved, New File, Keys, AI Settings
   (not even portaled), Welcome, Urban, Map Service, Map Start, Map Workspace.

There is no single dialog contract; each strategy re-solves naming, focus, dismissal, and
layering differently.

### 4.3 Z-index: a scale exists but is unenforced

A canonical scale is defined in `constants/design.ts:323-336`
(`backdrop:1040, statusBar:9999, modal:10050, popover:10060, tooltip:10070, toast:10080`),
but **only `--z-modal` (10050) is published as a CSS variable** (`styles/theme.ts:304`).
Every bespoke modal therefore hard-codes a raw number:

| Surface | z-index | Source | Problem |
|---|---:|---|---|
| Base `Modal` (Global Search, Settings) | `var(--z-modal)` = 10050 | `Modal.tsx:49` | ✅ correct |
| Urban Analytics dialog | 10049 | `UrbanAnalyticsModal.tsx:881` | deliberately 1 below modal tier |
| Keys overlay | 2200 | `KeysModal.tsx:21` | **below** statusBar(9999) & modal tier — occludable |
| AI Settings overlay | 1000 | `AiSettingsModal.module.css:11` | **below backdrop(1040) and statusBar** — can be hidden |
| Unsaved Changes backdrop | 9999 | `UnsavedChangesDialog.tsx:144` | ties statusBar tier, **below** modal tier |
| Urban/Welcome gold bar | 2147483648 | `UrbanAnalyticsModal.tsx:1291`, `WelcomeModal.tsx:945` | max-int, exceeds entire scale |
| Global gold bar | 999999 | `EnhancedIDE.tsx:1696` | arbitrary |

Five strategies (token, deliberate-offset, max-int, two arbitrary lows) with concrete
occlusion bugs (AI Settings, Keys, Unsaved). `popover`/`tooltip`/`toast` tiers are defined
but never wired to CSS vars.

---

## 5. Shared infrastructure deep-dive

### 5.1 Base `Modal` — `components/molecules/Modal.tsx`

The most-composed primitive; its gaps propagate to every consumer.

| # | Issue | Evidence | WCAG | Severity |
|---|---|---|---|---|
| M1 | **No focus trap** — only first element focused on open; Tab leaves the dialog. | `:189-199` (no Tab handler) | 2.1.2, 2.4.3 | **High** |
| M2 | **No focus restoration** — opener never captured/refocused. | none in file | APG | **High** |
| M3 | **Hardcoded `id="modal-title"`** — every instance emits the same id. | `:214,217` | 4.1.1 | Medium |
| M4 | **Global, unscoped key/click listeners** — `useKeyPress('Escape')` + `useOnClickOutside` on `window`/`document`; `useKeyPress` returns process-wide boolean state. | `:162-168`; `useCommon.ts:363-420` | — | Medium |
| M5 | **Direct `document.body.style.overflow` mutation** — no ref-counting; stacked modals fight. | `:178-186` | — | Medium |
| M6 | **No background inert/`aria-hidden`.** | absent | APG | Medium |
| M7 | **No open/close live announcement.** | absent | 4.1.3 | Low |
| M8 | **Palette variant hardcodes `#121212`/`#?`** bypassing `SYNAPSE_OVERLAY.surface` token. | `:65` | — | Low |
| M9 | **`min-width:640px` on palette size** — hard reflow floor (see Global Search/Settings). | `:101` | 1.4.10 | Medium |

`aria-modal` is written bare (`:213`) → React serialises to `"true"`, so the *attribute*
is fine; the *behaviour* it advertises (M1, M6) is what is missing.

### 5.2 `useFocusTrap` — `centerpanel/components/map/useFocusTrap.ts`

**Already correct and reusable.** Re-queries focusables each Tab (handles dynamic content),
filters hidden/`aria-hidden`/negative-tabindex nodes (`:18-45`), captures and **restores**
the opener with a `document.contains` guard (`:59-75`), wraps both directions (`:78-107`),
and offers a `data-map-skip-link`-aware `activate()` (`:110-119`). **The only problem is
location** — under `map/`, so non-map modals reimplement it instead. Promoting it to
`src/hooks/useFocusTrap.ts` is the single highest-leverage move in this audit.

### 5.3 `MapDialogShell` — `…/map/MapDialogShell.tsx`

A solid local modal base for the map content dialogs: `role="dialog"`,
`aria-modal={!nonBlocking}` (`:313-315`), own focus trap + restore + Escape (`:220-265`),
fully fluid sizing via `clamp()`/`min()`/`calc(100% - 2rem)` (`:52,60-63,158`). **But** it
uses `aria-label` only — its visible `<h2>` title (`:338`) is never wired via
`aria-labelledby`, so all seven shell-based dialogs lack a programmatic title association,
and it **duplicates** `useFocusTrap` rather than consuming it (trap implementation #2).

### 5.4 `MapWorkspaceShell` — `…/map/MapWorkspaceShell.tsx`

Hosts the Map Explorer modal chrome. Correctly sets `role`/`aria-modal`/`aria-labelledby`
(`:626-628`) and **manages background `aria-hidden`** on body siblings (`:574-618`) — the
only modal that inerts the background. But it has **no focus trap/Escape of its own**
(`:620-621` delegates to the parent), so it is not self-contained.

### 5.5 `SYNAPSE_OVERLAY` tokens — `ui/theme/synapseTheme.ts:294-303`

Provides `backdrop`, `blur`, `surface`, `surfaceBorder`, `surfaceGlow`, `focusRing` — but
**no z-index token**, which is why layering is left to each modal (§4.3). Only the base
`Modal` consumes these; bespoke modals hardcode colours.

---

## 6. Per-modal detailed findings

### 6.1 IDE modals

#### Command Palette — `CommandPalette.tsx` (744)
- ✅ Strong combobox/listbox: `role="listbox"`/`option`, `aria-activedescendant`,
  `aria-selected`, mode `tablist`/`tab` (`:558-702`), live result count (`:600`), captures
  & restores opener focus (`:431,437`), Escape (`:446`).
- ⚠️ Built on base `Modal` (`:556`) ⇒ inherits **M1** (no Tab trap), **M9** (640px floor).

#### Global Search — `GlobalSearch.tsx` (545)
| # | Issue | Evidence | Severity |
|---|---|---|---|
| GS1 | Built on base `Modal` ⇒ **no focus trap, no focus restore**. | `:398`; Modal M1/M2 | High |
| GS2 | **`role="listbox"` with `<button>` children** — should be `role="option"`; `aria-selected` on a button is invalid. | `:428,450` | Medium |
| GS3 | **Incomplete tab pattern** — `role="tab"` without `tabpanel`/`aria-controls`/roving tabindex; tabs are really filter toggles. | `:413-424` | Medium |
| GS4 | **Arrow nav dead-ends** — once a row is focused, arrows no longer move (handler only on the input); no Home/End/wrap. | `:374-390` | Medium |
| GS5 | **Not responsive** — inherits palette `min-width:640px`; overflows <688px. | Modal `:99-102` | Medium |
| — | **Zero tests.** | — | — |

#### New File — `NewFileModal.tsx` (940)
| # | Issue | Evidence | Severity |
|---|---|---|---|
| NF1 | **`role="dialog"`/`aria-modal` on the click-to-close overlay**, not the panel. | `:783-788` vs `:790` | High |
| NF2 | **Selection flow is mouse-only** — category/language/template are clickable `<div>`s, no role/tabindex/keydown. | `:829-833,849-853,864-868` | High (2.1.1) |
| NF3 | **No focus trap; no focus restore;** focus enters only on the filename step. | `:457-466` | High |
| NF4 | **~470 lines of static data inlined** (`getTemplateContentByLanguage` `:17-88`, `LANGUAGE_CATEGORIES` `:91-281`, `TEMPLATE_TYPES` `:284-388`). | as cited | Medium |
| NF5 | **Dead inline pseudo-selectors** (`&:hover`/`&:focus` never apply in React inline style). | `:585,632,720` | Low |
| NF6 | Fixed JS px width `Math.min(sidebarWidth*1.8,600)`. | `:534` | Low |

#### Unsaved Changes — `UnsavedChangesDialog.tsx` (255)
- ✅ **Reference-quality**: `role="dialog"`, `aria-labelledby`+`aria-describedby`
  (`:137-140`), 3-button trap (`:119-132`), focus restore (`:112-116`), Escape (`:120`),
  primary focused on mount.
- ⚠️ Injects a global `<style>` via module flag (`:88-96`); hardcodes colours/`width:380`
  rather than tokens; **z-index 9999 ties the statusBar tier**, below the modal tier (§4.3).

### 6.2 AI / Settings modals

#### Keys — `KeysModal.tsx` (218)
- ✅ Good baseline: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (`:168-170`),
  proper `tablist`/`tab`/`tabpanel` (`:175-208`), trap (`:120-136`), restore (`:99-118`),
  Escape (`:92-96`), masked keys, `aria-pressed` toggle.
- 🐞 **Bug: `GOLD` is undefined** — `color:GOLD` references an identifier never declared or
  imported anywhere in `src/` (only `GOLDEN_RATIO`/`GOLDEN_PAIRS` exist). Runtime
  `ReferenceError`/`tsc` "Cannot find name". | `KeysModal.tsx:174` | **High**
- ⚠️ No background inert; z-index 2200 (occludable); trap duplicated.

#### AI Settings — `AiSettingsModal.tsx` (275) — *worst-accessibility modal*
| # | Issue | Evidence | Severity |
|---|---|---|---|
| AS1 | **No focus trap, no focus restore.** | whole file | High |
| AS2 | **No Escape handler.** | no keydown effect | High |
| AS3 | **Dialog has no accessible name** — `role/aria-modal` with no labelledby/label; title is a plain `<strong>`. | `:159-166` | High (4.1.2) |
| AS4 | **Not portaled** — renders in-tree; stacking/background interaction unmanaged. | `:158-163` | Medium |
| AS5 | **Close button `×` has only `title`, no `aria-label`.** | `:167` | Medium |
| AS6 | **`z-index:1000` — below backdrop(1040) & statusBar(9999)**; can be occluded. | `module.css:11` | Medium |
| AS7 | Pervasive `any` undermines `strict`/`exactOptionalPropertyTypes`. | `:10,82-85,126-128` | Medium |

#### Settings — `SettingsModal.tsx` (1352)
- ✅ Excellent internal ARIA: vertical `tablist`/`tab`/`tabpanel`, roving tabindex,
  `radiogroup`/`radio`, `listbox`/`option`, arrow roving (`:730-973,665-678`); ids
  namespaced with `useId()`; a correctly-roled `<span role="button" tabIndex={0}>` star
  with key handler (`:876-884`).
- ⚠️ Inherits base-Modal **M1/M2**.
- ⚠️ **Reflow floor** — `<Wrap>` locked to `height:560px`, `180px` nav (`:17-21`); base
  palette `min-width:640px` (`Modal.tsx:101`) ⇒ no reflow below 640px (1.4.10).
- ⚠️ Monolith: ~19 `useState`; render-injected inline `<style>` (`:690-728`); **hand-rolled
  virtualization reading `scrollTop` during render** (`:829-894`); **network key
  verification embedded** (`:613-631`); brittle `globalThis.__KEY_ROUTER_SUSPENDED__`
  (`:188-201,563-564`); ref-in-deps anti-patterns (`:448,573`).

### 6.3 Urban Analytics modals

#### Welcome — `WelcomeModal.tsx` (2807)
- ✅ Hand-rolled trap (`:519-562`), restore (`:566-585`), Escape (`:522`), reduced-motion
  ambient canvas that never starts its rAF loop (`:94-97`), correct decorative
  `aria-hidden`, data-driven content.
- ⚠️ **Uses `aria-label` while a visible `<h1 id="welcome-modal-title">` exists but is
  never referenced** (`:596-598` vs `:708`) — name drift.
- ⚠️ **No background inert**; **duplicates `useFocusTrap`** (`:60-82`); fixed
  `setTimeout(…,400)` close ignores reduced-motion (`:466-470`); ~1860-line inline CSS;
  densest section shows 9 cards.

#### Urban Analytics — `UrbanAnalyticsModal.tsx` (1706)
- ✅ Best naming: `aria-labelledby`+`aria-describedby` to real SR-only nodes (`:866-914`),
  polite live regions (`:915,932`), trap (`:782-807`), restore (`:648-652`), Escape
  (`:770`), `RightPanelBoundary` lazy-loaded with retry/suspense (`:65-67,979-990`).
| # | Issue | Evidence | Severity |
|---|---|---|---|
| UA1 | **Trap listener bound to modal element, not `document`** — can't recapture escaped focus. | `:805` | Medium |
| UA2 | **No background inert/`aria-hidden`.** | absent | Medium |
| UA3 | **`jsx-a11y/no-noninteractive-element-interactions` disabled file-wide.** | `:1` | Medium |
| UA4 | **Untyped `window.dispatchEvent(new CustomEvent('synapse:…'))`** instead of typed `synapseBus`. | `:687-756` | Medium |
| UA5 | `aria-hidden={false}` leftover on `.midCol`. | `:966` | Low |
| UA6 | **High cognitive load** — 101-card rail + ~9 context pills + ~18 status actions at once; narrow breakpoints **hide** the rail/center entirely. | `:955,413-459,1093-1173,1674-1678` | Medium (UX) |
| UA7 | Module-load side effects (`buildFullLibrary()`, `__setUrbanLibrary`, dev subscription). | `:53-77` | Low |

### 6.4 Map Explorer shell & dialog family

**The Map Explorer modal is the codebase's accessibility template** — `role="dialog"` /
`aria-modal` / `aria-labelledby` (`MapWorkspaceShell.tsx:626-628`), background
`aria-hidden` (`:574-618`), trap+restore+Escape via `useMapExplorerLifecycle` →
`useFocusTrap` (`useMapExplorerLifecycle.ts:18-42`), skip link (`Core:6154`), announcer.
The issues are **architectural**:

| # | Issue | Evidence | Severity |
|---|---|---|---|
| MX1 | **6,791-line god-component** (~66 useState, ~28 useRef, ~173 useCallback, ~59 useMemo, ~27 useEffect ≈ 325 hooks). | file-wide | High |
| MX2 | **~170-field props interface** on the View, spread in one JSX element; every overlay touches two files. | `View.tsx:37-208`; `Core:6609` | High |
| MX3 | **Three pure passthrough files** add indirection with no behaviour. | `MapExplorerModal.tsx`,`…Root.tsx`,`…Runtime.tsx` | Low |
| MX4 | **Two parallel focus-trap implementations** (`useFocusTrap` vs `MapDialogShell` hand-roll). | `MapDialogShell.tsx:139-265` | Medium |
| MX5 | **51 direct `toast*` calls, 0 `reportError`** — violates the project error-bus rule; no top-level shell error boundary (only per-panel `MapPanelErrorBoundary`). | `Core:137`; `View.tsx:534,554,574,596` | Medium |
| MX6 | **Eager analysis-service web + `SAMPLE_BUILDINGS` + `SpatialDB`** load with the module (deck.gl/three correctly behind `MapCanvas`). | `Core:21,46-48,112` | Medium |
| MX7 | Activity-rail-dependent layout magic (`--map-canvas-control-dock-width:'58rem'`). | `Core:6419-6425` | Low |

**Map dialog family detail:**
- **`MapServiceDialog` (821) — second accessibility blocker.** `aria-modal="true"`
  (`:789`) but **no trap, no Escape, no initial focus, no restore**; `role="listbox"` with
  `<button>` children (`:599-619`) is a role mismatch; `boundsLabel` is both a prop and a
  module function (`:254,290`) — fragile shadowing; **12 useState + embedded
  WMS/WFS/OSM/CityJSON network + projection logic** (`:299-583`) — prime extraction target.
- **`MapStartDialog` (510).** Best ARIA wiring (labelledby+describedby `:351-354`) but
  delegates trap/Escape to parent (`:190-191`); unused `dialogRef` (`:176`); declared-but-
  unused `onAddDemoPack` prop (`:42`) and dead `demoBadge` branch (`:404`); risk of double
  `aria-modal` when wrapped.
- **Shell-based content dialogs (Import Preview/CSV/Columnar/Hub/Export/DataExport/Flow)
  are healthy** (0 useState, presentation-only, inherit the shell trap). Two have
  **non-responsive fixed two-column grids**: `MapExportDialog` `minmax(360px,…)
  minmax(320px,…)` = 680px min (`:31`) and `MapColumnarImportDialog` `1.15fr/0.85fr`
  (`:54`). `MapCsvImportDialog` calls `profileCsvImportSession` **unmemoized every render**
  (`:131-134`).

---

## 7. Cross-cutting themes

1. **Fragmented focus management** — 6 trap implementations + a base primitive with none.
   The good hook exists but is mislocated. *(M1, GS1, NF3, AS1, MX4, Welcome, Urban, Keys, MapDialogShell.)*
2. **Background inerting missing everywhere except Map Explorer.** *(M6, AS-, UA2, Welcome.)*
3. **Inconsistent accessible naming** — best: Urban/Map/Unsaved (labelledby+describedby);
   worst: AI Settings (unnamed); Welcome wires a title id it never uses; shell-based map
   dialogs use label-only. *(AS3, Welcome, M3, MapDialogShell.)*
4. **No layering discipline** — five z-index strategies; concrete occlusion bugs. *(§4.3.)*
5. **Keyboard-inaccessible "cards"** — clickable `<div>`s in New File & New Project. *(NF2.)*
6. **Monoliths mixing data/network/UI** — New File (templates), Settings (network+virtual),
   Welcome (1860-line CSS), Map Service (network/geometry), Map Core (6,791 lines).
7. **Convention drift from `CLAUDE.md`** — direct toasts vs `reportError` (Map), untyped
   `CustomEvent` vs `synapseBus` (Urban), pervasive `any` (AI Settings), a11y-lint
   suppression (Urban). *(MX5, UA3, UA4, AS7.)*
8. **Responsiveness via hide-not-reflow** — Settings 640px floor; Urban/Map hide columns;
   two map dialogs don't stack. *(M9, UA6, MapExport, MapColumnar.)*
9. **Reduced-motion mismatches** — close `setTimeout`s ignore the preference. *(Welcome, Urban.)*
10. **One runtime bug** — undefined `GOLD` in Keys.

---

## 8. Test coverage gaps

Real modal-a11y test depth exists **only for Map Explorer surfaces**:
- `src/centerpanel/components/map/__tests__/map-accessibility.test.ts` asserts
  `useFocusTrap` exports, focusable filtering, focus restore, Tab wrap, scoped Escape,
  roving rails, command-palette focus.
- E2E: `e2e/accessibility-audit.spec.ts` (axe on `[role="dialog"][aria-labelledby="map-explorer-title"]`,
  scoped Escape returning focus, forced-colors), `e2e/map-modal-layout.spec.ts`, plus
  several map/UA-workflow specs.

**Modals with NO focus/Escape/axe tests:** the base `Modal` molecule, `GlobalSearch`,
`KeysModal`, `SettingsModal`, `AiSettingsModal`, `WelcomeModal`, `UrbanAnalyticsModal`,
`UnsavedChangesDialog`, and all bespoke map dialogs (`MapServiceDialog`, `MapStartDialog`).
The generic primitive that most dialogs depend on is the least tested.

---

## 9. Severity rollup

| Severity | Findings |
|---|---|
| **High / blocker** | M1, M2 (base Modal trap/restore) · AS1–AS3 (AI Settings unnamed/no-trap/no-Esc) · MapService no-trap/no-Esc · NF1–NF3 (New File overlay role, mouse-only, no trap) · KeysModal `GOLD` bug · MX1–MX2 (Map Core monolith / 170-prop View) |
| **Medium** | M3–M6, M9 · GS1–GS5 · AS4–AS7 · NF4 · Settings reflow/monolith · Welcome inert/dup/label · UA1–UA4, UA6 · MX4–MX6 · z-index occlusion (Keys, Unsaved) · MapExport/MapColumnar reflow · NewProject cards |
| **Low** | M7–M8 · NF5–NF6 · UA5, UA7 · MX3, MX7 · MapStart dead code · MapCsv unmemoized profiling · reduced-motion close delays |

See the companion [remediation plan](./modal-remediation-plan-2026-06-17.md) for the
phased, prioritized fix sequence with code sketches, acceptance criteria, and tests.
