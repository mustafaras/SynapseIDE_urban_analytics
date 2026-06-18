# MFP-11 — NewProjectModal: keyboard-operable template cards

| Field | Value |
|---|---|
| Trigger | P11, new-project |
| Priority / Phase | P1 / Phase 2 |
| Depends on | MFP-06 |
| Gate | general |
| Severity | medium |
| Proof required | typecheck-clean, manual-keyboard |

## 1. Why this matters
Finding `NewProject`: the project-template chooser renders each option as a clickable `<div onClick>` with no `role`, no `tabIndex`, no key handler, no `aria-checked`, and no programmatic description. Keyboard-only and assistive-technology users cannot reach or operate the cards, so they cannot pick a template (the selection drives `onCreateProject({ template })`). This violates WCAG 2.1 **2.1.1 Keyboard** (functionality must be operable by keyboard) and **4.1.2 Name, Role, Value** (custom controls must expose role/state). Because the modal is built on the base `Modal` (whose trap/restore/inert gaps are fixed by MFP-06), this prompt only needs to fix the grid semantics, not the dialog shell.

## 2. Current state (evidence)
The grid items are non-semantic `<div>`s. `src/components/molecules/NewProjectModal.tsx:22` declares the card as a `styled.div`:
```tsx
const TemplateCard = styled.div<{ $isSelected: boolean }>`
  cursor: pointer;
  ...
```
and `src/components/molecules/NewProjectModal.tsx:159-173` renders the grid with mouse-only `onClick`:
```tsx
<TemplateGrid>
  {PROJECT_TEMPLATES.map(template => (
    <TemplateCard
      key={template.id}
      $isSelected={selectedTemplate === template.id}
      onClick={() => !isCreating && setSelectedTemplate(template.id)}
    >
      <TemplateHeader>
        <TemplateIcon>{template.icon}</TemplateIcon>
        <TemplateTitle>{template.name}</TemplateTitle>
      </TemplateHeader>
      <TemplateDescription>{template.description}</TemplateDescription>
    </TemplateCard>
  ))}
</TemplateGrid>
```
`TemplateGrid` (`:15-20`) has no `role`. Selection state lives in `const [selectedTemplate, setSelectedTemplate] = useState<string>(PROJECT_TEMPLATES[0].id)` (`:78`). `TemplateTitle` is an `<h3>` (`:45`) and `TemplateDescription` a `<p>` (`:52`) inside each card.

## 3. Target state
Before: a `<div>` grid of `<div onClick>` cards, invisible to AT, unreachable by Tab.
After: `TemplateGrid` carries `role="radiogroup"` + `aria-label="Project template"`; each `TemplateCard` becomes a keyboard-operable `role="radio"` with `tabIndex` (0 for the selected card, -1 for others — roving tabindex), `aria-checked`, Enter/Space activation, and `aria-describedby` pointing at its description text. Visual styling (the `$isSelected` border/hover/transform) is unchanged.

## 4. Implementation steps
1. Add `role="radiogroup"` and `aria-label="Project template"` to `TemplateGrid` (keep it a `styled.div`).
2. Give each `TemplateCard` a stable description id, e.g. `const descId = \`np-tpl-desc-${template.id}\``; render it on the `TemplateDescription` (`id={descId}`).
3. On each `TemplateCard` set: `role="radio"`, `aria-checked={selectedTemplate === template.id}`, `aria-describedby={descId}`, `aria-label={template.name}` (or rely on the visible `<h3>` via `aria-labelledby`), and roving `tabIndex={selectedTemplate === template.id ? 0 : -1}`.
4. Add an `onKeyDown` that activates on `Enter`/`' '` (Space — call `e.preventDefault()` to avoid scroll) and, optionally, supports Arrow keys to move selection within the radiogroup.
5. Keep the existing `onClick={() => !isCreating && setSelectedTemplate(template.id)}`; guard the keyboard handler with the same `!isCreating` check.
6. Do not change `TemplateGrid`/`TemplateCard` CSS; the `$isSelected` prop and `&:hover` rules stay as-is.

## 5. Constraints & edge cases
- Built on the base `Modal` — do not re-add a focus trap or Escape handler here (MFP-06 owns that).
- styled-components, not Tailwind (this file lives in `src/components/molecules/`, outside `centerpanel/`).
- `exactOptionalPropertyTypes`: pass `aria-describedby` as a concrete string, never `undefined`.
- Roving tabindex: exactly one radio is tabbable at a time; default selection is `PROJECT_TEMPLATES[0].id`.
- Respect `isCreating` (disabled-while-submitting) in both click and key paths.

## 6. Acceptance criteria
- [ ] Template grid is reachable by Tab and a template can be selected with keyboard alone (Enter/Space, optional arrows).
- [ ] Each card exposes `role="radio"` + `aria-checked` reflecting `selectedTemplate`.
- [ ] `radiogroup` has an accessible name; each radio is described by its description text.
- [ ] axe reports no serious violations for the modal.
- [ ] `npm run typecheck` and `npm run lint:errors` pass.

## 7. Validation
```bash
npm run typecheck
npm run lint:errors
# gate: general
```

## 8. Tests to add
Add `src/components/molecules/__tests__/NewProjectModal.test.tsx`: render with `isOpen`, query `getByRole('radiogroup', { name: /project template/i })`, assert N `role="radio"` options, that the first is `aria-checked`, fire `keyDown {key:'Enter'}` / `{key:' '}` on a non-selected radio and assert `aria-checked` moves, and confirm roving `tabIndex` (one `0`, rest `-1`). Optional: assert `onCreateProject` receives the keyboard-selected template id.

## 9. Proof checklist
- [ ] `proofs/MFP-11/typecheck-clean.txt` — `npm run typecheck` output.
- [ ] `proofs/MFP-11/keyboard.md` — Tab into grid, Enter/Space selects, focus stays in dialog, Escape closes (via base Modal), focus restores to opener.
