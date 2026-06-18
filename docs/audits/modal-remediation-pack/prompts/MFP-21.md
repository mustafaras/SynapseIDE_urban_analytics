# MFP-21 — Branding & product-name consistency across modals and shell

| Field | Value |
|---|---|
| Trigger | P21, branding, naming |
| Priority / Phase | P2 / Phase 2 |
| Depends on | none |
| Gate | general |
| Severity | medium |
| Requires human decision | yes |
| Proof required | typecheck-clean, screenshot |

## 1. Why this matters
The product currently presents **three different names** in the running shell, and a
fourth in the public tab title (handled by MFP-22). Every welcome surface, modal title,
"about" line, and empty-state header is a branding moment — and right now they disagree.
A user who opens the app sees `SynapseIDE` in the header, `Synapse IDE` in the status bar,
and `Urban Analytics Workbench` in the browser tab. This erodes brand trust, makes the
product look unfinished, and makes downstream release assets (MFP-22) ambiguous because
there is no canonical string to point at.

This is the **last wave before publish**, so we fix the divergence at the root: a single
`src/constants/brand.ts` source of truth that every shell/modal string imports. The
platform is **tri-modal** (Synapse IDE + Map Explorer + Urban Analytics); Map Explorer
**is** the GIS surface (deck.gl / maplibre, CRS-aware spatial ops), so the proposed
canonical name is GIS-inclusive. Because the name is a product decision, this prompt is
`requiresHumanDecision: true` — the agent must **confirm with the owner before editing**.

## 2. Current state (evidence)
The same product is named four ways across `src/App.tsx` and `WelcomeModal.tsx`:

`src/App.tsx:215` — shell header `<h1>`:
```tsx
                SynapseIDE
```
`src/App.tsx:392` — splash/hero `<h1>`:
```tsx
            SynapseIDE
```
`src/App.tsx:570` — welcome `<h2>`:
```tsx
                    Welcome to SynapseIDE
```
`src/App.tsx:903` — sidebar `<h4>`:
```tsx
                SynapseIDE
```
`src/App.tsx:1249` — status bar content prop (note the **space**: `Synapse IDE`):
```tsx
            content="// Welcome to Synapse IDE"
```
`src/App.tsx:1309` — runtime document title:
```tsx
  useEffect(() => { document.title = 'Urban Analytics Workbench'; }, []);
```
`src/App.tsx:1484-1487` — Urban Analytics modal fallback copy:
```tsx
                  title="Urban Analytics Workbench unavailable"
                  message="The Urban Analytics Workbench did not load. Retry after the dev server reconnects, or reload the app if it persists."
                >
                  <Suspense fallback={<ModalLoadingFallback label="Loading Urban Analytics Workbench..." testId="urban-analytics-modal-loading" />}>
```
`src/features/urbanAnalytics/WelcomeModal.tsx:708` — visible welcome title:
```tsx
            <h1 id="welcome-modal-title" className="brand-title">
              <span className="brand-title__primary">
                <span className="brand-shine">Urban Analytics</span>
              </span>
              <span className="brand-title__sep" aria-hidden="true">·</span>
              <span className="brand-title__secondary">Workbench</span>
```
Supporting metadata — `package.json:2`/`package.json:4`:
```json
  "name": "urban-analytics-workbench",
  "version": "1.0.0",
```
There is **no** `src/constants/brand.ts` today; every string above is a hardcoded literal.

## 3. Target state
A single source of truth `src/constants/brand.ts` exporting a frozen `BRAND` object; every
divergent literal above imports from it. **Proposed default** (owner picks the final value):

- `full`: `"Synapse IDE — GIS & Urban Analytics Workbench"`
- `short`: `"Synapse IDE"`
- `modules`: `"Synapse IDE" | "Map Explorer (GIS)" | "Urban Analytics"`

Candidate names from `canonicalProductName.candidates` (owner chooses one or supplies another):
1. `Synapse IDE — GIS & Urban Analytics Workbench` (default; GIS-inclusive)
2. `Synapse — Spatial Intelligence Workbench (GIS + Urban Analytics)`
3. `Synapse IDE — Urban Analytics Workbench`

Before → after (illustrative, exact name pending owner confirmation):

| Location | Before | After |
|---|---|---|
| App.tsx:215 header | `SynapseIDE` | `{BRAND.short}` |
| App.tsx:392 hero | `SynapseIDE` | `{BRAND.short}` |
| App.tsx:570 welcome | `Welcome to SynapseIDE` | `{`Welcome to ${BRAND.short}`}` |
| App.tsx:903 sidebar | `SynapseIDE` | `{BRAND.short}` |
| App.tsx:1249 status | `// Welcome to Synapse IDE` | `{`// Welcome to ${BRAND.short}`}` |
| App.tsx:1309 title | `'Urban Analytics Workbench'` | `BRAND.full` |
| WelcomeModal:708 | hand-split spans | spans driven by `BRAND` parts |

## 4. Implementation steps
1. **AskUserQuestion — confirm canonical name (BLOCKING).** Present the three candidates
   plus a free-text "other" option, and confirm `short` (`Synapse IDE`) and whether to
   carry a tagline. Do **not** invent a tagline. Capture the answer before any edit.
2. **Create `src/constants/brand.ts`** exporting a frozen const:
   ```ts
   export const BRAND = {
     full: '…confirmed full name…',
     short: 'Synapse IDE',
     tagline: '' /* only if owner approves */,
     version: '1.0.0' /* keep in sync; MFP-22 bumps it */,
     modules: ['Synapse IDE', 'Map Explorer (GIS)', 'Urban Analytics'] as const,
   } as const;
   ```
   Use `as const`; respect `exactOptionalPropertyTypes` (omit `tagline` rather than set
   `undefined` if unused).
3. **Replace the App.tsx literals** at 215, 392, 570, 903, 1249 with `BRAND.short` (or the
   templated string shown above), preserving each element's existing styling/className.
4. **Set `document.title`** at App.tsx:1309 to `BRAND.full`.
5. **Update App.tsx:1484-1487** fallback copy to use `BRAND.short`/`BRAND.full` instead of
   the hardcoded `Urban Analytics Workbench`, keeping the message meaning.
6. **WelcomeModal.tsx:708** — drive the title spans from `BRAND` (keep the `brand-shine` /
   `brand-title__*` classes and `id="welcome-modal-title"` intact for MFP-14).
7. **UrbanAnalyticsModal.tsx** — replace any hardcoded product-name title/copy with `BRAND`.
8. Leave `package.json` name/version to MFP-22 (release assets), but ensure `BRAND.version`
   matches the current `1.0.0` so MFP-22 has one place to bump.

## 5. Constraints & edge cases
- **No invented taglines or names** — every user-visible name comes from the owner-confirmed
  `BRAND`. If the owner declines a tagline, omit the field (do not ship a placeholder).
- Keep the **minimal-premium** design language: dense typography, thin separators, restrained
  amber accent. No marketing hero layouts, no cards-in-cards.
- `document.title` (runtime, App.tsx:1309) **must match** the static `<title>` MFP-22 sets in
  `index.html`, or the tab label will flicker between two names. Both must equal `BRAND.full`.
- No behavioural change beyond copy — do not alter component structure, ARIA ids, or layout.
- `exactOptionalPropertyTypes`: do not set optional `BRAND` fields to `undefined`.

## 6. Acceptance criteria
- [ ] AskUserQuestion answer recorded; canonical name confirmed by owner.
- [ ] `src/constants/brand.ts` exists and is the only place the name strings are defined.
- [ ] No divergent name literal remains in App.tsx (215, 392, 570, 903, 1249, 1484-1487).
- [ ] `document.title` (App.tsx:1309) uses `BRAND.full`.
- [ ] WelcomeModal:708 title derives from `BRAND`; `id="welcome-modal-title"` preserved.
- [ ] UrbanAnalyticsModal title/copy uses `BRAND`.
- [ ] `npm run typecheck` and `npm run lint:errors` clean.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
# Confirm no stray hardcoded brand literals remain in shell/modals:
# (manual grep) "SynapseIDE", "Welcome to SynapseIDE", "Urban Analytics Workbench"
# Gate: general → typecheck + lint:errors must both pass.
```

## 8. Tests / manual checks
- Run the app; confirm header, hero, welcome, sidebar, and status bar all show the confirmed
  `BRAND.short`, and the browser tab shows `BRAND.full` (matches MFP-22's static title).
- Open WelcomeModal and the Urban Analytics modal; confirm titles read from `BRAND`.
- `npm run typecheck` to confirm `brand.ts` typing (`as const`) is consumed correctly.

## 9. Proof checklist
Capture into `proofs/MFP-21/`:
- [ ] `typecheck-clean.txt` — `npm run typecheck` output, no errors.
- [ ] `lint-clean.txt` — `npm run lint:errors` output (advisory; gate is general).
- [ ] `screenshot/` — before/after PNGs of the shell header, welcome modal title, and the
      browser tab showing the unified name.
- [ ] `decision.md` — the AskUserQuestion prompt and the owner's confirmed name/tagline.
