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

  return (
    <div className={styles.intakePage}>
      {/* Project Identity */}
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div className={styles.cardTitle}>Project Identity</div>
          <div className={styles.cardSub}>Define the study area name and description.</div>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.rowGrid}>
            <div className={styles.fieldGroup} style={{ gridColumn: 'span 2' }}>
              <label className={styles.fieldLabel} htmlFor="np-name">Project Name</label>
              <input
                id="np-name"
                className={styles.fieldInput}
                value={name}
                onChange={(e) => setName((e.target as HTMLInputElement).value)}
                placeholder="e.g. Barcelona Superblocks Analysis"
              />
            </div>
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
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div className={styles.cardTitle}>Spatial Configuration</div>
          <div className={styles.cardSub}>Set the analysis scale, coordinate system, and bounding box.</div>
        </header>
        <div className={styles.cardBody}>
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

          {/* Bounding Box */}
          <div className={styles.rowGrid}>
            {(['West', 'South', 'East', 'North'] as const).map((label, i) => (
              <div key={label} className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>{label}</label>
                <input
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
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <div className={styles.cardTitle}>Thematic Tags</div>
          <div className={styles.cardSub}>Select tags to classify the project domain.</div>
        </header>
        <div className={styles.cardBody}>
          <div className={styles.chipRow}>
            {COMMON_TAGS.map((t) => (
              <button
                key={t}
                className={`${styles.riskChip} ${tags.includes(t) ? styles.riskChipActive : ''}`}
                onClick={() => toggleTag(t)}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
          {tags.length > 0 && (
            <div style={{ fontSize: 11, opacity: 0.6 }}>
              Selected: {tags.map((t) => t.replace(/_/g, ' ')).join(', ')}
            </div>
          )}
        </div>
      </section>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className={styles.btnSecondary} onClick={reset}>Reset</button>
        <button className={styles.btnPrimary} onClick={handleCreate} disabled={!name.trim()}>
          Create Project
        </button>
      </div>
    </div>
  );
}
