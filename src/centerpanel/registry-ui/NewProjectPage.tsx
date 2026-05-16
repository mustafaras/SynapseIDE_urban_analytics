/**
 * New Project Page — full form for creating urban analytics study areas.
 */

import styles from './newProject.module.css';
import { useNewProjectDraftStore } from '../../stores/useNewProjectDraftStore';
import { useProjectRegistry } from '../registry/state';
import type { CoordinateReferenceSystem, UrbanScale, UrbanTag } from '@/features/urbanAnalytics/lib/types';

const SCALES: UrbanScale[] = [
  'parcel', 'block', 'neighborhood', 'district',
  'city', 'metropolitan', 'regional', 'national',
];

const CRS_OPTIONS: CoordinateReferenceSystem[] = [
  'EPSG:4326', 'EPSG:3857',
];

const COMMON_TAGS: UrbanTag[] = [
  'mobility', 'transit', 'pedestrian', 'cycling',
  'land_use', 'density', 'green_infra', 'climate',
  'heat_island', 'flood', 'air_quality', 'equity',
  'housing', 'accessibility', 'vulnerability', 'indicators',
];

export default function NewProjectPage() {
  const name = useNewProjectDraftStore((s) => s.name);
  const setName = useNewProjectDraftStore((s) => s.setName);
  const description = useNewProjectDraftStore((s) => s.description);
  const setDescription = useNewProjectDraftStore((s) => s.setDescription);
  const scale = useNewProjectDraftStore((s) => s.scale);
  const setScale = useNewProjectDraftStore((s) => s.setScale);
  const crs = useNewProjectDraftStore((s) => s.crs);
  const setCrs = useNewProjectDraftStore((s) => s.setCrs);
  const bbox = useNewProjectDraftStore((s) => s.bbox);
  const setBbox = useNewProjectDraftStore((s) => s.setBbox);
  const tags = useNewProjectDraftStore((s) => s.tags);
  const addTag = useNewProjectDraftStore((s) => s.addTag);
  const removeTag = useNewProjectDraftStore((s) => s.removeTag);
  const reset = useNewProjectDraftStore((s) => s.reset);
  const toDraft = useNewProjectDraftStore((s) => s.toDraft);

  const { actions } = useProjectRegistry();

  const handleCreate = () => {
    if (!name.trim()) return;
    const draft = toDraft();
    const now = new Date().toISOString();
    actions.addProject({
      id: draft.id ?? `proj_${Date.now()}`,
      name: draft.name ?? name.trim(),
      description: draft.description ?? '',
      scale: draft.scale ?? scale,
      crs: draft.crs ?? crs,
      tags: (draft.tags ?? []) as UrbanTag[],
      priority: 3,
      dataCompleteness: 0,
      sessionsCount: 0,
      indicators: [],
      createdAt: now,
      updatedAt: now,
      ...(draft.bbox ? { bbox: draft.bbox } : {}),
    });
    reset();
  };

  const updateBbox = (idx: number, val: string) => {
    const cur = bbox ?? [0, 0, 0, 0];
    const next = [...cur] as [number, number, number, number];
    next[idx] = parseFloat(val) || 0;
    setBbox(next);
  };

  const toggleTag = (t: UrbanTag) => {
    if (tags.includes(t)) removeTag(t);
    else addTag(t);
  };

  const canCreate = name.trim().length > 0;

  return (
    <form
      className={styles.intakePage}
      onSubmit={(e) => {
        e.preventDefault();
        if (canCreate) handleCreate();
      }}
      aria-label="New project intake"
    >
      {/* Project Identity */}
      <section className={styles.group} aria-labelledby="np-group-identity">
        <header className={styles.groupHeader}>
          <div className={styles.groupTitle} id="np-group-identity">Project Identity</div>
          <div className={styles.groupSub}>Name and describe the study area.</div>
        </header>
        <div className={styles.groupBody}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="np-name">Project Name</label>
            <input
              id="np-name"
              className={styles.fieldInput}
              value={name}
              onChange={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="e.g. Barcelona Superblocks Analysis"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="np-desc">Description</label>
            <textarea
              id="np-desc"
              className={styles.fieldTextarea}
              value={description}
              onChange={(e) => setDescription((e.target as HTMLTextAreaElement).value)}
              placeholder="Describe the research objectives, scope, and expected outcomes…"
            />
          </div>
        </div>
      </section>

      {/* Spatial Configuration */}
      <section className={styles.group} aria-labelledby="np-group-spatial">
        <header className={styles.groupHeader}>
          <div className={styles.groupTitle} id="np-group-spatial">Spatial Configuration</div>
          <div className={styles.groupSub}>Scale, coordinate system, and bounding box.</div>
        </header>
        <div className={styles.groupBody}>
          <div className={styles.rowGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="np-scale">Scale</label>
              <select
                id="np-scale"
                className={styles.fieldSelect}
                value={scale}
                onChange={(e) => setScale((e.target as HTMLSelectElement).value as UrbanScale)}
              >
                {SCALES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="np-crs">CRS</label>
              <select
                id="np-crs"
                className={styles.fieldSelect}
                value={crs}
                onChange={(e) => setCrs((e.target as HTMLSelectElement).value as CoordinateReferenceSystem)}
              >
                {CRS_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.bboxGrid}>
            {(['West', 'South', 'East', 'North'] as const).map((label, i) => (
              <div key={label} className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`np-bbox-${label.toLowerCase()}`}>{label}</label>
                <input
                  id={`np-bbox-${label.toLowerCase()}`}
                  className={styles.fieldInput}
                  type="number"
                  step="any"
                  value={bbox ? bbox[i] : ''}
                  onChange={(e) => updateBbox(i, (e.target as HTMLInputElement).value)}
                  placeholder={label === 'West' ? '-180' : label === 'South' ? '-90' : label === 'East' ? '180' : '90'}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tags */}
      <section className={styles.group} aria-labelledby="np-group-tags">
        <header className={styles.groupHeader}>
          <div className={styles.groupTitle} id="np-group-tags">Thematic Tags</div>
          <div className={styles.groupSub}>Classify the project domain.</div>
        </header>
        <div className={styles.groupBody}>
          <div className={styles.chipRow} role="group" aria-label="Thematic tags">
            {COMMON_TAGS.map((t) => {
              const selected = tags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  className={`${styles.riskChip} ${selected ? styles.riskChipActive : ''}`}
                  aria-pressed={selected}
                  onClick={() => toggleTag(t)}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              );
            })}
          </div>
          {tags.length > 0 && (
            <div className={styles.selectionMeta}>
              Selected: {tags.map((t) => t.replace(/_/g, ' ')).join(', ')}
            </div>
          )}
        </div>
      </section>

      {/* Submit bar */}
      <div className={styles.submitBar}>
        <button type="button" className={styles.btnSecondary} onClick={reset}>Reset</button>
        <button
          type="submit"
          className={styles.btnPrimary}
          disabled={!canCreate}
          aria-disabled={!canCreate}
        >
          Create Project
        </button>
      </div>
    </form>
  );
}
