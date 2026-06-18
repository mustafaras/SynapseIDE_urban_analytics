# MFP-22 — Release/publish assets: index.html, favicon, meta, version

| Field | Value |
|---|---|
| Trigger | P22, release, publish-assets |
| Priority / Phase | P2 / Phase 2 |
| Depends on | MFP-21 |
| Gate | release |
| Severity | medium |
| Requires human decision | yes |
| Proof required | typecheck-clean, screenshot, e2e-a11y |

## 1. Why this matters
This is the **public-facing first impression**: the browser tab label, the social-share
preview card (Open Graph / Twitter), the PWA install name, and the address-bar favicon.
Today the static `<title>` in `index.html` still says **"Coder App - Professional Code
Editor"** — a leftover from a scaffold that has nothing to do with this product — and the
favicon is the **default Vite logo**. So before React boots and `document.title` is patched
at runtime (App.tsx:1309), the tab shows the wrong name; any crawler, link unfurler, or
bookmark captures "Coder App"; and the tab icon is a generic framework mark. That is a brand
and SEO bug visible to every first-time visitor.

MFP-22 fixes the publish-time assets so the tab title, share preview, and favicon all show
the confirmed product brand from MFP-21's `src/constants/brand.ts`. Because it also bumps the
release version, it is `requiresHumanDecision: true` — confirm the name and semver with the
owner before editing.

## 2. Current state (evidence)
`index.html:7` — static title (the "Coder App" bug):
```html
    <title>Coder App - Professional Code Editor</title>
```
`index.html:5` — default Vite favicon:
```html
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
```
There is **no** `<meta name="description">`, no `og:*`, no `twitter:*`, and no
`<meta name="theme-color">` anywhere in `<head>` (lines 4-31 contain only charset,
viewport, the wrong title, and font preconnects/styles).

`package.json:2` / `package.json:4`:
```json
  "name": "urban-analytics-workbench",
  "version": "1.0.0",
```
`src/App.tsx:1309` — runtime title that overrides the static one once React mounts:
```tsx
  useEffect(() => { document.title = 'Urban Analytics Workbench'; }, []);
```
So the static title and the runtime title **disagree** with each other *and* with the shell
header `SynapseIDE` — exactly the divergence MFP-21 unifies via `BRAND`.

## 3. Target state
`index.html` and `package.json` both drive off MFP-21's `BRAND` (the canonical, owner-confirmed
name). Note `index.html` is static HTML so it cannot `import` `BRAND` at runtime — the agent
copies the confirmed `BRAND.full` string verbatim into the markup and keeps it in sync.

Before → after for `index.html:7`:
```html
<!-- before -->
<title>Coder App - Professional Code Editor</title>
<!-- after (using owner-confirmed BRAND.full) -->
<title>Synapse IDE — GIS &amp; Urban Analytics Workbench</title>
```
Before → after for `index.html:5`:
```html
<!-- before -->
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
<!-- after -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
```
New `<head>` meta block (values from `BRAND`; image path under `public/`):
```html
<meta name="description" content="Browser-based spatial intelligence platform for urban scientists, planners, and GIS analysts." />
<meta name="theme-color" content="#0e0e0e" />
<meta property="og:type" content="website" />
<meta property="og:title" content="Synapse IDE — GIS & Urban Analytics Workbench" />
<meta property="og:description" content="…" />
<meta property="og:image" content="/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Synapse IDE — GIS & Urban Analytics Workbench" />
```
`package.json` (owner-confirmed semver bump):
```json
  "name": "synapse-ide-urban-analytics-workbench",  // kebab, aligned with BRAND.short+full
  "version": "1.1.0"                                 // confirm with owner
```
Candidate names (owner picks the same one chosen in MFP-21):
1. `Synapse IDE — GIS & Urban Analytics Workbench` (default; GIS-inclusive)
2. `Synapse — Spatial Intelligence Workbench (GIS + Urban Analytics)`
3. `Synapse IDE — Urban Analytics Workbench`

## 4. Implementation steps
1. **AskUserQuestion — confirm name + version (BLOCKING).** Confirm the canonical `BRAND.full`
   (must equal what MFP-21 set), the kebab `package.json` name, and the **semver bump** for
   this release (default proposal `1.0.0 → 1.1.0`; owner may choose `1.0.1` / `2.0.0`). Do not
   bump without sign-off.
2. **Update `index.html:7`** — replace the `Coder App - Professional Code Editor` `<title>`
   with the confirmed `BRAND.full` (HTML-escape `&` → `&amp;`).
3. **Add meta tags** to `<head>`: `description`, `theme-color`, `og:type`, `og:title`,
   `og:description`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`. Use
   `BRAND.full` for titles and the existing product description from `package.json:5` for the
   description copy. Do not invent new marketing copy.
4. **Create `public/favicon.svg`** — a real, optimized, properly-licensed product mark, and
   update `index.html:5` to reference `/favicon.svg`; remove the `/vite.svg` default. If an
   `og:image` PNG is referenced, add `public/og-image.png` (optimized, licensed).
5. **Update `package.json:2` and `package.json:4`** — kebab `name` aligned with `BRAND`, and
   the owner-confirmed `version`. Mirror the new version in `BRAND.version` (`src/constants/brand.ts`).
6. **Confirm App.tsx:1309 matches** — `document.title = BRAND.full` (set by MFP-21) must equal
   the new static `<title>` so the tab label does not flicker between two names on boot.

## 5. Constraints & edge cases
- **Depends on MFP-21** — `BRAND` must already exist and be confirmed; reuse the same name.
- The static `<title>` must **exactly match** the runtime `document.title` (App.tsx:1309 →
  `BRAND.full`); a mismatch causes a visible tab-name flicker on load.
- **Favicon/og asset must be optimized and licensed** — no copied/third-party mark without
  rights. Keep file sizes small (SVG favicon; PNG og-image within reason).
- **No invented taglines/copy** beyond the existing product description; keep the
  minimal-premium tone.
- **Version bump requires owner sign-off** — do not change semver unilaterally.
- HTML-escape special characters in `<title>`/meta (`&` → `&amp;`).

## 6. Acceptance criteria
- [ ] AskUserQuestion answer recorded; name + version confirmed by owner.
- [ ] `index.html` `<title>` shows `BRAND.full`; "Coder App" string is gone.
- [ ] `index.html` references `/favicon.svg` (product mark); `/vite.svg` reference removed.
- [ ] `description`, `theme-color`, `og:*`, and `twitter:*` meta present and brand-consistent.
- [ ] `public/favicon.svg` (and any `og-image.png`) exist, optimized and licensed.
- [ ] `package.json` name kebab-aligned with `BRAND`; `version` bumped per owner; `BRAND.version` matches.
- [ ] Static `<title>` equals runtime `document.title` (App.tsx:1309 → `BRAND.full`).
- [ ] `npm run typecheck` clean; `npm run build` succeeds; `npm run test:e2e:a11y` green.

## 7. Validation
```bash
npm run typecheck
npm run build
npm run test:e2e:a11y
# Gate: release → typecheck + lint:errors + build + test:e2e:a11y must all pass.
# Confirm no stale "Coder App" / "/vite.svg" references remain in index.html.
```

## 8. Tests / manual checks
- Load a production preview (`npm run build` + `vite preview`); confirm the browser **tab
  title** reads `BRAND.full` from first paint (before React boots) and does not flicker.
- Validate the **share preview**: paste the URL into a link-unfurl/OG debugger (or inspect
  `<head>`) and confirm og:title/og:image/twitter:card render the product brand.
- Confirm the **favicon** in the address bar is the product mark, not the Vite logo.
- Run `npm run test:e2e:a11y` to confirm the head/meta changes do not regress the a11y audit.

## 9. Proof checklist
Capture into `proofs/MFP-22/`:
- [ ] `typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `build.txt` — `npm run build` success output.
- [ ] `e2e-a11y.txt` — `npm run test:e2e:a11y` output, green.
- [ ] `screenshot/tab-title.png` — browser tab showing the corrected `BRAND.full` title.
- [ ] `screenshot/share-preview.png` — OG/Twitter card render (or `<head>` inspection).
- [ ] `screenshot/favicon.png` — address-bar favicon = product mark.
- [ ] `decision.md` — the AskUserQuestion prompt and the owner-confirmed name + semver.
