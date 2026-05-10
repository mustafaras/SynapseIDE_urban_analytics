# Prompt 28 — Manual QA Checklist

**Purpose:** Human-in-the-loop verification of UI workflows that automated tests cannot cover.  
**When to run:** Before each minor release cut; after any PR that touches command registry, file explorer, AI apply flow, or terminal.

---

## 1. Command Palette

| # | Step | Expected |
|---|------|----------|
| 1.1 | Open command palette (`Alt+Shift+P` or toolbar button) | Overlay appears with search input focused |
| 1.2 | Type partial command name (e.g. `open`) | Matching commands appear in real-time |
| 1.3 | Activate a disabled command (reason tooltip visible) | Command does not fire; tooltip explains why |
| 1.4 | Open a non-spatial file (`.txt`) then open palette | Spatial commands (GeoJSON load, Reproject…) are disabled |
| 1.5 | Open a `.geojson` file then open palette | Spatial commands are enabled |
| 1.6 | Press `Escape` | Palette closes; no state corruption |

---

## 2. File Explorer

| # | Step | Expected |
|---|------|----------|
| 2.1 | Rename a file by double-clicking its label | In-place input appears; confirm renames both `name` and `path` fields |
| 2.2 | Delete a file that is currently selected | File removed from tree; removed from selection set |
| 2.3 | Delete a folder containing selected files | Folder + children removed; selection cleared |
| 2.4 | Click file (single select) → Shift+click another | Range selection highlights both files |
| 2.5 | Ctrl+click to toggle individual files | Files added/removed from selection set independently |
| 2.6 | Use search bar to filter by name | Only matching files shown; search query longer than 200 chars is clamped silently |
| 2.7 | Add a file inside a nested folder | New node appears under correct parent; auto-generated id is unique |

---

## 3. AI Apply Flow

| # | Step | Expected |
|---|------|----------|
| 3.1 | Generate code in AI panel; click **Apply** | Preview pane shows plan with per-file diff before applying |
| 3.2 | Apply to a file that has unsaved edits | `dirty_file` conflict banner appears; apply blocked until user resolves |
| 3.3 | Apply to a path that does not exist in file explorer | `missing_file` conflict banner appears |
| 3.4 | Apply plan with 4+ files at once | Risk level shown as **medium** (no conflicts) or **high** (with conflicts) |
| 3.5 | Confirm apply on clean plan | Files updated; Apply History panel shows new entry |
| 3.6 | Click **Revert** on a history entry | File contents restored to pre-apply snapshot |

---

## 4. Apply History & Artifact Registry

| # | Step | Expected |
|---|------|----------|
| 4.1 | After successful apply, open **Plan History** panel | Entry appears with timestamp, file count, risk level |
| 4.2 | Delete one of the applied files from explorer | `recoverRestoredArtifacts` marks corresponding artifact as `stale` |
| 4.3 | Register an artifact from the AI panel | Artifact appears in the registry panel |
| 4.4 | Reload the page | Artifacts persist (Zustand persist middleware) |

---

## 5. Terminal History

| # | Step | Expected |
|---|------|----------|
| 5.1 | Run more than 200 commands in the embedded terminal | Oldest commands are dropped; only the last 200 remain navigable via `↑` |
| 5.2 | Clear history via the terminal toolbar action | History empties immediately |

---

## 6. Diagnostics Panel

| # | Step | Expected |
|---|------|----------|
| 6.1 | Trigger 501 lint errors (via a deliberately broken file) | Diagnostics panel shows exactly 500 items (cap enforced) |
| 6.2 | Fix the broken file | Diagnostics for that producer clear; others remain |
| 6.3 | A producer enters loading state | Spinner shown in the panel header for that producer |
| 6.4 | A diagnostic message exceeds 1200 chars | Message is truncated with `…` in the panel; full text shown in tooltip |

---

## 7. Cross-Module Bus / Bridge Adapter

| # | Step | Expected |
|---|------|----------|
| 7.1 | Trigger a map selection event from the Map Explorer panel | Analytics panels update without page reload (bus forwarded via bridgeAdapter) |
| 7.2 | Open DevTools console; check for unhandled bus errors | Zero uncaught promise rejections related to bus events |

---

## 8. Keyboard Navigation

| # | Step | Expected |
|---|------|----------|
| 8.1 | `Tab` from shell panel → file explorer → editor → bottom panel → AI panel | Focus ring moves correctly through all panels in order |
| 8.2 | `Shift+Tab` reverses focus order | Focus travels in reverse without jumping to wrong element |
| 8.3 | `Enter` on a file in the explorer | File opens in editor tab |
| 8.4 | `Delete` key with a file focused in explorer | Confirmation prompt appears; file deleted on confirm |

---

## Validation Commands (CI-equivalent)

```sh
# Unit + integration tests
npx vitest run

# Type-check (pre-existing errors in fileExplorerStore.ts and EnhancedIDE.tsx are known)
npx tsc -p tsconfig.app.json --noEmit

# Production build
npm run build
```

### Known pre-existing failures (do NOT investigate as regressions)
- `src/stores/__tests__/editorStore.test.ts` — "marks restored tabs whose file reference no longer resolves" (`isMissingFile` is `undefined` instead of `false`). Pre-dates Prompt 28.
- `src/features/urbanAnalytics/voxcity/__tests__/BuildingViewer.test.tsx` — flaky async timing test. Pre-dates Prompt 28.
- `src/stores/fileExplorerStore.ts` — 2 `exactOptionalPropertyTypes` TS errors. Pre-dates Prompt 28.
- `src/components/ide/EnhancedIDE.tsx` — `openRange`/`openTab` TS errors. Pre-dates Prompt 28.
