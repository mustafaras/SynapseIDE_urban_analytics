import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Geometry } from 'geojson';
import type {
  BoundingBox,
  CoordinateReferenceSystem,
  StudyArea,
  UrbanScale,
  UrbanTag,
} from '@/features/urbanAnalytics/lib/types';

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

type State = {
  name: string;
  description: string;
  scale: UrbanScale;
  bbox: BoundingBox | null;
  crs: CoordinateReferenceSystem;
  tags: UrbanTag[];
  geometry: Geometry | null;
  isDirty: boolean;
};

type Actions = {
  setName: (v: string) => void;
  setDescription: (v: string) => void;
  setScale: (v: UrbanScale) => void;
  setBbox: (v: BoundingBox | null) => void;
  setCrs: (v: CoordinateReferenceSystem) => void;
  addTag: (t: UrbanTag) => void;
  removeTag: (t: UrbanTag) => void;
  setGeometry: (g: Geometry | null) => void;
  reset: () => void;
  toDraft: () => Partial<StudyArea>;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const initial: State = {
  name: '',
  description: '',
  scale: 'city',
  bbox: null,
  crs: 'EPSG:4326',
  tags: [],
  geometry: null,
  isDirty: false,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rid(): string {
  try {
    const b = globalThis.crypto?.getRandomValues?.(new Uint8Array(8));
    if (b) return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch { /* fallback */ }
  return Math.random().toString(36).slice(2, 10);
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useNewProjectDraftStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,

      setName: (v) => set({ name: v, isDirty: true }),
      setDescription: (v) => set({ description: v, isDirty: true }),
      setScale: (v) => set({ scale: v, isDirty: true }),
      setBbox: (v) => set({ bbox: v, isDirty: true }),
      setCrs: (v) => set({ crs: v, isDirty: true }),

      addTag: (t) =>
        set((s) => {
          if (s.tags.includes(t)) return {} as Partial<State> as State;
          return { tags: [...s.tags, t], isDirty: true } as Partial<State> as State;
        }),

      removeTag: (t) =>
        set((s) => ({
          tags: s.tags.filter((x) => x !== t),
          isDirty: true,
        } as Partial<State> as State)),

      setGeometry: (g) => set({ geometry: g, isDirty: true }),

      reset: () => set({ ...initial }),

      toDraft: (): Partial<StudyArea> => {
        const s = get();
        const now = new Date().toISOString();
        return {
          id: `proj_${rid()}`,
          name: s.name.trim(),
          description: s.description.trim(),
          scale: s.scale,
          ...(s.bbox ? { bbox: s.bbox } : {}),
          crs: s.crs,
          tags: [...s.tags],
          ...(s.geometry ? { geometry: s.geometry } : {}),
          datasets: [],
          sessions: [],
          createdAt: now,
          updatedAt: now,
        };
      },
    }),
    {
      name: 'synapse.newproject.draft.v1',
      version: 1,
    },
  ),
);
