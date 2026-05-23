import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFlowStore } from '@/stores/useFlowStore';
import { useMapExplorerStore } from '@/stores/useMapExplorerStore';
import { useUrbanContextStore } from './useUrbanContextStore';

export interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

/* ──────────────────────────────────────────────────────────────
   Ambient orbital canvas — sparse signal particles drifting along
   concentric elliptical orbits in the disc's outer band. Decorative
   only: aria-hidden, no pointer interaction, very low opacity, and
   disabled under reduced-motion. Mounts only while the modal is open
   (parent unmounts it on close), so the rAF loop is scoped to the
   modal. devicePixelRatio is capped to keep GPU cost modest.
   ────────────────────────────────────────────────────────────── */

type Orbit = {
  readonly cx: number; // normalized center x [0..1]
  readonly cy: number; // normalized center y [0..1]
  readonly rx: number; // normalized radius x
  readonly ry: number; // normalized radius y
  readonly speed: number; // radians per second
  readonly dir: 1 | -1;
};

// Orbits live in the outer band so particles never cross the central
// brand/content column (kept at radius >= ~0.33 of the disc).
const WM_ORBITS: readonly Orbit[] = [
  { cx: 0.5, cy: 0.5, rx: 0.47, ry: 0.47, speed: 0.10, dir: 1 },
  { cx: 0.5, cy: 0.5, rx: 0.41, ry: 0.43, speed: 0.085, dir: -1 },
  { cx: 0.5, cy: 0.5, rx: 0.36, ry: 0.33, speed: 0.12, dir: 1 },
  { cx: 0.5, cy: 0.5, rx: 0.33, ry: 0.40, speed: 0.095, dir: -1 },
];

const PARTICLES_PER_ORBIT = 3;

type OrbitParticle = {
  orbit: Orbit;
  theta: number;
};

const WELCOME_SECTIONS = [
  { id: 'brief', label: 'Brief' },
  { id: 'workbench', label: 'Workbench' },
  { id: 'methods', label: 'Methods' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'launch', label: 'Launch' },
] as const;

type WelcomeSectionId = typeof WELCOME_SECTIONS[number]['id'];

const isWelcomeSectionId = (value: string | undefined): value is WelcomeSectionId => (
  typeof value === 'string' && WELCOME_SECTIONS.some(section => section.id === value)
);

const FOCUSABLE_MODAL_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableModalElements = (container: HTMLElement): HTMLElement[] => (
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_MODAL_SELECTOR))
    .filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0
        && rect.height > 0
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && !element.matches(':disabled')
        && element.getAttribute('aria-hidden') !== 'true';
    })
);

const AmbientFlowCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    // Respect reduced-motion: never start the animation loop.
    const mq = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
    if (mq?.matches) return undefined;

    // Modest devicePixelRatio handling to avoid GPU overuse.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(canvas);
    else window.addEventListener('resize', resize);

    const particles: OrbitParticle[] = [];
    WM_ORBITS.forEach((orbit, oi) => {
      for (let pi = 0; pi < PARTICLES_PER_ORBIT; pi += 1) {
        particles.push({
          orbit,
          theta: (pi / PARTICLES_PER_ORBIT) * Math.PI * 2 + oi * 0.7,
        });
      }
    });

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, width, height);

      // Very faint orbit rings beneath the particles.
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(114, 221, 255, 0.045)';
      for (const orbit of WM_ORBITS) {
        ctx.beginPath();
        ctx.ellipse(
          orbit.cx * width, orbit.cy * height,
          orbit.rx * width, orbit.ry * height,
          0, 0, Math.PI * 2,
        );
        ctx.stroke();
      }

      // Glowing signal particles orbiting in the outer band.
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(58, 168, 255, 0.7)';
      ctx.fillStyle = 'rgba(170, 232, 255, 0.5)';
      for (const p of particles) {
        p.theta += p.orbit.speed * p.orbit.dir * dt;
        const x = (p.orbit.cx + p.orbit.rx * Math.cos(p.theta)) * width;
        const y = (p.orbit.cy + p.orbit.ry * Math.sin(p.theta)) * height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="welcome-modal__flow-canvas" aria-hidden="true" />;
};

// Synapse IDE brand glyph (replicated from src/components/atoms/Logo.tsx),
// tinted to the modal cyan palette so the modal stays self-contained.
const BrandLogo: React.FC = () => (
  <svg className="brand-logo__svg" viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="wmLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--wm-cyan-strong)" />
        <stop offset="100%" stopColor="var(--wm-cyan)" />
      </linearGradient>
    </defs>
    <circle className="brand-logo__node" cx="20" cy="25" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__node" cx="60" cy="25" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__core" cx="40" cy="40" r="6" fill="url(#wmLogoGrad)" />
    <circle className="brand-logo__node" cx="20" cy="55" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <circle className="brand-logo__node" cx="60" cy="55" r="5" fill="url(#wmLogoGrad)" opacity="0.9" />
    <path
      d="M25 25 L34 40 M46 40 L55 25 M25 55 L34 40 M46 40 L55 55"
      stroke="url(#wmLogoGrad)"
      strokeWidth="2.5"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M10 40 Q20 35 30 40 Q40 45 50 40 Q60 35 70 40"
      stroke="url(#wmLogoGrad)"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
  </svg>
);

/* ──────────────────────────────────────────────────────────────
   v5 mission-briefing content model. Kept local to the modal (no
   store coupling) so onboarding copy lives in one place and the card
   markup is rendered from data instead of being hand-duplicated. All
   copy is static and product-truth-safe: no counts, sources, or QA
   state are claimed.
   ────────────────────────────────────────────────────────────── */

// data-feature-kind values map to the accent palette in the modal CSS.
type FeatureKind = 'workflow' | 'gis' | 'ai' | 'engine' | 'evidence' | 'python' | 'stream';

interface FeatureSurface {
  readonly kind: FeatureKind;
  readonly title: string;
  readonly desc: string;
  readonly tags: readonly string[];
  readonly icon: React.ReactNode;
}

// The three bounded workbench modules (rendered as full feature cards).
const WORKBENCH_SURFACES: readonly FeatureSurface[] = [
  {
    kind: 'workflow',
    title: 'Urban Analytics',
    desc: 'Method catalog, workflow runs, data fitness, method validity, and evidence QA.',
    tags: ['Methods', 'Fitness', 'Evidence QA'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="2"/>
        <path d="M14 8v6l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    kind: 'gis',
    title: 'Map Explorer',
    desc: 'Layer inspection, viewport state, geometry, feature selection, and published map outputs.',
    tags: ['Layers', 'Geometry', 'Publishing'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="8" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M8 4v4M20 4v4M4 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    kind: 'ai',
    title: 'Synapse IDE',
    desc: 'Scripts, reports, file buffers, AI assistance, and reproducible analysis notes.',
    tags: ['Code', 'Reports', 'AI Assist'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M4 14h7l3 6 6-12 3 6h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// Application-native capability groups (rendered as compact feature cards).
const CAPABILITY_GROUPS: readonly FeatureSurface[] = [
  {
    kind: 'gis',
    title: 'Spatial Data and Layers',
    desc: 'Load, inspect, and publish spatial layers without mixing map rendering ownership into analytical interpretation.',
    tags: ['Map Explorer', 'Deck.gl', 'GeoJSON'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M18 11l-6 6-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    kind: 'workflow',
    title: 'Method Library',
    desc: 'Select validity-aware workflows and indicators with explicit scale, data, CRS, assumptions, and limitations.',
    tags: ['Validity', 'Indicators', 'Workflows'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4v20M4 14h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="14" cy="14" r="3" fill="currentColor"/>
        <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="20" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    kind: 'engine',
    title: 'Workflow Runs',
    desc: 'Carry runtime mode, data fitness, method validity, and output links into reviewable run manifests.',
    tags: ['Manifests', 'Run QA', 'Outputs'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4L18 8M14 4L10 8M14 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="16" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M9 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    kind: 'evidence',
    title: 'Evidence Registry',
    desc: 'Keep workflow outputs reviewable through provenance, QA state, linked files, map layers, and reproducibility notes.',
    tags: ['Provenance', 'QA State', 'Artifacts'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="6" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
        <circle cx="10" cy="12" r="2" fill="currentColor"/>
        <circle cx="18" cy="12" r="2" fill="currentColor"/>
        <circle cx="10" cy="18" r="2" fill="currentColor"/>
        <circle cx="18" cy="18" r="2" fill="currentColor"/>
      </svg>
    ),
  },
  {
    kind: 'python',
    title: 'Spatial SQL Runtime',
    desc: 'Use in-browser spatial database surfaces and worker-backed checks for reproducible query and transformation steps where supported.',
    tags: ['Spatial DB', 'DuckDB-WASM', 'Workers'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <circle cx="8" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
        <circle cx="20" cy="14" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    kind: 'stream',
    title: 'Publishing to Map and Reports',
    desc: 'Publish eligible outputs back to Map Explorer and carry reproducible context into code, notes, and reports.',
    tags: ['Map Output', 'Code Links', 'Reports'],
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 14l3 3 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="4" width="20" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    ),
  },
];

interface MethodGuardrail {
  readonly code: string;
  readonly title: string;
  readonly text: string;
}

const METHOD_GUARDRAILS: readonly MethodGuardrail[] = [
  {
    code: 'CRS',
    title: 'CRS before measurement',
    text: 'Area and distance workflows must declare a projected CRS before calculation.',
  },
  {
    code: 'FIT',
    title: 'Fitness is explicit',
    text: 'Unknown metadata stays unknown. No source, date, CRS, or schema should be treated as ready by default.',
  },
  {
    code: 'VAL',
    title: 'Validity envelopes',
    text: 'Methods declare scale, required data types, CRS requirements, assumptions, and limitations.',
  },
  {
    code: 'LAB',
    title: 'Demo stays labeled',
    text: 'Synthetic or demo-mode output must stay visibly labeled and separate from real analytical evidence.',
  },
];

interface StartPath {
  readonly title: string;
  readonly desc: string;
}

const START_PATHS: readonly StartPath[] = [
  {
    title: 'Inspect a map layer',
    desc: 'Load or review spatial layers in Map Explorer before choosing a method.',
  },
  {
    title: 'Choose a method',
    desc: 'Start from a validity-aware workflow such as accessibility, suitability, or exposure screening.',
  },
  {
    title: 'Generate evidence',
    desc: 'Publish eligible outputs back to Map Explorer and carry reproducible notes into Synapse IDE.',
  },
];

// Compact operating-model row shown under the mission brief.
const MISSION_FLOW = ['Choose Method', 'Inspect Data', 'Run Workflow', 'Publish Evidence'] as const;

// Evidence artifact properties (static, generic — not live counts).
const EVIDENCE_FACTS = ['Provenance', 'QA State', 'Linked Outputs', 'Reproducibility'] as const;

interface CommandChip {
  readonly value: string;
  readonly label: string;
}

type StateChipTone = 'active' | 'neutral' | 'count';

interface StateBackedChip {
  readonly label: string;
  readonly value: string;
  readonly tone: StateChipTone;
}

// Truth-safe static command chips. Values stay generic per the product-truth
// rules; labels describe the principle, not a measured state.
const COMMAND_CHIPS: readonly CommandChip[] = [
  { value: 'Method-aware', label: 'Validity Envelopes' },
  { value: 'Evidence-tracked', label: 'Provenance QA' },
  { value: 'CRS-safe', label: 'Projected Measures' },
];

const FeatureCard: React.FC<{ surface: FeatureSurface; compact?: boolean }> = ({ surface, compact }) => (
  <div className={`feature-card${compact ? ' feature-card--compact' : ''}`} data-feature-kind={surface.kind}>
    <div className="feature-icon">{surface.icon}</div>
    <h3 className="feature-title">{surface.title}</h3>
    <p className="feature-desc">{surface.desc}</p>
    <div className="feature-tags">
      {surface.tags.map(tag => (
        <span key={tag} className="feature-tag">{tag}</span>
      ))}
    </div>
  </div>
);

const WelcomeModal: React.FC<WelcomeModalProps> = ({ open, onClose }) => {
  const ref = useRef<HTMLDivElement|null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<WelcomeSectionId>('brief');
  const [ctaArmed, setCtaArmed] = useState(false);
  const hasUrbanContext = useUrbanContextStore((s) => s.context !== null);
  const evidenceArtifactCount = useUrbanContextStore((s) => s.evidenceArtifacts.length);
  const mapLayerCount = useMapExplorerStore((s) => s.overlayLayers.length);
  const completedRunCount = useFlowStore((s) => s.completedRuns.length);

  const stateBackedChips: readonly StateBackedChip[] = [
    {
      label: 'Context',
      value: hasUrbanContext ? 'Active' : 'No context',
      tone: hasUrbanContext ? 'active' : 'neutral',
    },
    { label: 'Layers', value: String(mapLayerCount), tone: 'count' },
    { label: 'Evidence', value: String(evidenceArtifactCount), tone: 'count' },
    { label: 'Runs', value: String(completedRunCount), tone: 'count' },
  ];

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 400);
  }, [onClose]);

  const updateScrollState = useCallback((scrollEl: HTMLDivElement) => {
    const maxScroll = Math.max(1, scrollEl.scrollHeight - scrollEl.clientHeight);
    const nextProgress = Math.min(1, Math.max(0, scrollEl.scrollTop / maxScroll));
    setScrollProgress(prev => (Math.abs(prev - nextProgress) > 0.004 ? nextProgress : prev));
    setScrolled(prev => prev || scrollEl.scrollTop > 6);

    const containerTop = scrollEl.getBoundingClientRect().top;
    const activationLine = containerTop + scrollEl.clientHeight * 0.34;
    const sections = Array.from(scrollEl.querySelectorAll<HTMLElement>('[data-welcome-section]'));
    let nextActive: WelcomeSectionId = 'brief';

    for (const section of sections) {
      const sectionId = section.dataset.welcomeSection;
      if (!isWelcomeSectionId(sectionId)) continue;
      if (section.getBoundingClientRect().top <= activationLine) {
        nextActive = sectionId;
      }
    }

    setActiveSection(prev => (prev === nextActive ? prev : nextActive));
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    updateScrollState(e.currentTarget);
  }, [updateScrollState]);

  const handleSectionJump = useCallback((sectionId: WelcomeSectionId) => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;
    const target = scrollEl.querySelector<HTMLElement>(`[data-welcome-section="${sectionId}"]`);
    if (!target) return;

    const targetTop = target.getBoundingClientRect().top
      - scrollEl.getBoundingClientRect().top
      + scrollEl.scrollTop
      - 10;
    const reducedMotion = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    scrollEl.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
    setActiveSection(sectionId);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const panel = ref.current;
      if (!panel) return;

      const focusable = getFocusableModalElements(panel);
      if (focusable.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!(active instanceof HTMLElement) || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }

      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
        return;
      }

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleClose, open]);

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      setScrolled(false);
      setScrollProgress(0);
      setActiveSection('brief');
      setCtaArmed(false);
      const el = ref.current?.querySelector('.btn-start') as HTMLElement | null;
      el?.focus();
      const frame = requestAnimationFrame(() => {
        const scrollEl = scrollRef.current;
        if (scrollEl) updateScrollState(scrollEl);
      });
      return () => cancelAnimationFrame(frame);
    }
    const previousFocus = previousFocusRef.current;
    previousFocusRef.current = null;
    if (previousFocus && document.contains(previousFocus)) {
      window.setTimeout(() => previousFocus.focus(), 0);
    }
    return undefined;
  }, [open, updateScrollState]);

  if (!open && !isClosing) return null;

  const progressAngle = `${Math.round(scrollProgress * 3600) / 10}deg`;

  const modalContent = (
    <div
      className={`welcome-modal ${isClosing ? 'welcome-modal--closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Urban Analytics Workbench"
      style={{ zIndex: 2147483648 }}
    >
      <button
        type="button"
        className="welcome-modal__backdrop"
        onClick={handleClose}
        aria-label="Close welcome modal"
        tabIndex={-1}
      />

      <div className="welcome-modal__disc-wrap">
        <div className="welcome-modal__halo" aria-hidden="true" />

        <div className={`welcome-modal__panel ${ctaArmed ? 'is-cta-armed' : ''}`} ref={ref} tabIndex={-1}>
          <div className="welcome-modal__atmosphere" aria-hidden="true">
            <svg
              className="welcome-modal__urban-texture"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              focusable="false"
            >
              <path d="M8 21C22 18 28 28 41 25C54 22 59 11 76 14C84 15 90 19 96 23" />
              <path d="M4 55C14 48 24 49 35 53C47 58 55 57 66 49C75 42 84 39 96 42" />
              <path d="M15 82C28 75 36 79 47 84C61 90 72 82 86 72" />
              <path d="M18 9L24 31L17 49L24 69L19 94" />
              <path d="M44 4L47 22L42 41L50 62L46 96" />
              <path d="M73 8L68 28L76 48L70 68L82 92" />
              <path className="texture-parcel" d="M24 31L42 41L35 53L24 49Z" />
              <path className="texture-parcel" d="M50 62L70 68L66 49L47 57Z" />
              <path className="texture-parcel" d="M68 28L76 48L86 42L76 14Z" />
              <circle className="texture-node" cx="24" cy="31" r="0.8" />
              <circle className="texture-node" cx="66" cy="49" r="0.8" />
              <circle className="texture-node" cx="47" cy="84" r="0.8" />
            </svg>
            <svg
              className="welcome-modal__polar-grid"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              focusable="false"
            >
              {Array.from({ length: 36 }, (_, index) => (
                <line
                  key={`polar-tick-${index}`}
                  className={index % 9 === 0 ? 'polar-tick polar-tick--major' : 'polar-tick'}
                  x1="50"
                  y1={index % 9 === 0 ? '2.2' : '3.1'}
                  x2="50"
                  y2={index % 9 === 0 ? '7.6' : '5.9'}
                  transform={`rotate(${index * 10} 50 50)`}
                />
              ))}
              <text className="polar-label polar-label--n" x="50" y="9">N</text>
              <text className="polar-label polar-label--e" x="91" y="52">E</text>
              <text className="polar-label polar-label--s" x="50" y="94">S</text>
              <text className="polar-label polar-label--w" x="9" y="52">W</text>
            </svg>
            <svg
              className="welcome-modal__rings"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid meet"
              focusable="false"
            >
              <circle className="ring ring--1" cx="50" cy="50" r="48" />
              <circle className="ring ring--2" cx="50" cy="50" r="40" />
              <circle className="ring ring--3" cx="50" cy="50" r="31" />
              <circle className="ring ring--4" cx="50" cy="50" r="22" />
            </svg>
            <div className="welcome-modal__radar" />
            <AmbientFlowCanvas />
            <div className="welcome-modal__orbit-nodes">
              <span className="orbit-node orbit-node--a" />
              <span className="orbit-node orbit-node--b" />
              <span className="orbit-node orbit-node--c" />
              <span className="orbit-node orbit-node--d" />
              <span className="orbit-node orbit-node--e" />
            </div>
          </div>

          <div
            className="welcome-modal__progress"
            aria-hidden="true"
            style={{ '--wm-scroll-angle': progressAngle } as React.CSSProperties}
          >
            <span className="progress-ring progress-ring--track" />
            <span className="progress-ring progress-ring--value" />
            <span
              className="progress-ring progress-ring--accent"
              style={{ opacity: scrollProgress > 0.015 ? 1 : 0 }}
            />
          </div>

          <div className="welcome-disc__brand">
            <span className="brand-eyebrow">
              <span className="brand-eyebrow__dot" aria-hidden="true" />
              WELCOME TO
            </span>

            <div className="brand-logo">
              <span className="brand-logo__halo" aria-hidden="true" />
              <span className="brand-logo__medallion" aria-hidden="true" />
              <span className="brand-logo__inner-ring" aria-hidden="true" />
              <span className="brand-logo__ring" aria-hidden="true" />
              <span className="brand-logo__ticks" aria-hidden="true" />
              <span className="brand-logo__reticle" aria-hidden="true" />
              <span className="brand-logo__glint" aria-hidden="true" />
              <BrandLogo />
              <span className="brand-logo__micro" aria-hidden="true">Synapse Core</span>
            </div>

            <h1 id="welcome-modal-title" className="brand-title">
              <span className="brand-title__primary">
                <span className="brand-shine">Urban Analytics</span>
              </span>
              <span className="brand-title__sep" aria-hidden="true">·</span>
              <span className="brand-title__secondary">Workbench</span>
              <span className="brand-chip">GIS</span>
            </h1>

            <p className="brand-subtitle">
              Method-aware spatial analysis across maps, code, workflows, and evidence.
            </p>

            <div className="brand-metrics" aria-label="Urban Analytics command principles">
              {COMMAND_CHIPS.map(chip => (
                <span key={chip.value} className="metric-chip">
                  <span className="metric-chip__value">{chip.value}</span>
                  <span className="metric-chip__label">{chip.label}</span>
                </span>
              ))}
            </div>
          </div>

          <div
            className="welcome-disc__scroll"
            ref={scrollRef}
            onScroll={handleScroll}
            tabIndex={0}
            role="region"
            aria-label="Welcome briefing sections"
          >
            <div className="welcome-disc__col">
              <section id="welcome-section-brief" className="welcome-section welcome-section--highlight" data-welcome-section="brief">
                <span className="section-eyebrow">Brief</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    <circle cx="16" cy="16" r="3" fill="currentColor"/>
                  </svg>
                </div>
                <h2 className="section-title">Mission Brief</h2>
                <p className="section-text">
                  <strong>Urban Analytics Workbench</strong> coordinates analytical methods, spatial
                  layers, workflow runs, and reproducible code in one browser-based cockpit. The goal
                  is not just to visualize cities, but to keep every analytical assumption,
                  limitation, and evidence artifact reviewable.
                </p>
                <div className="mission-flow" aria-label="Urban Analytics operating model">
                  {MISSION_FLOW.map(step => (
                    <span key={step} className="mission-step">{step}</span>
                  ))}
                </div>
              </section>

              <section id="welcome-section-workbench" className="welcome-section" data-welcome-section="workbench">
                <span className="section-eyebrow">Workbench</span>
                <h2 className="section-title">Three Surfaces, One Analytical Chain</h2>
                <p className="section-text">
                  Urban Analytics interprets methods, Map Explorer owns spatial layers and geometry,
                  and Synapse IDE carries files, scripts, reports, terminal work, and AI-assisted
                  reproducibility. The modal briefs the operating model before the workbench opens.
                </p>
                <div className="workbench-triad" aria-label="Tri-modal workbench surfaces">
                  {WORKBENCH_SURFACES.map((surface, index) => (
                    <React.Fragment key={surface.title}>
                      {index > 0 ? <span className="triad-link" aria-hidden="true" /> : null}
                      <FeatureCard surface={surface} />
                    </React.Fragment>
                  ))}
                </div>
                <div className="features-grid features-grid--mission">
                  {CAPABILITY_GROUPS.map(surface => (
                    <FeatureCard key={surface.title} surface={surface} compact />
                  ))}
                </div>
              </section>

              <section id="welcome-section-methods" className="welcome-section" data-welcome-section="methods">
                <span className="section-eyebrow">Methods</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
                    <path d="M16 4v24M4 16h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                    <circle cx="16" cy="16" r="4" fill="currentColor"/>
                  </svg>
                </div>
                <h2 className="section-title">Scientific Guardrails Stay Visible</h2>
                <p className="section-text">
                  Analytical confidence comes from explicit constraints, not optimistic defaults.
                  The workbench keeps CRS requirements, fitness gaps, method limits, and demo modes
                  visible before outputs become evidence.
                </p>
                <div className="guardrail-grid" aria-label="Method guardrails">
                  {METHOD_GUARDRAILS.map(guardrail => (
                    <div className="guardrail-card" key={guardrail.code}>
                      <span className="guardrail-card__code">{guardrail.code}</span>
                      <h3 className="guardrail-card__title">{guardrail.title}</h3>
                      <p className="guardrail-card__text">{guardrail.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section id="welcome-section-evidence" className="welcome-section welcome-section--highlight" data-welcome-section="evidence">
                <span className="section-eyebrow">Evidence</span>
                <h2 className="section-title">Evidence Contract</h2>
                <p className="section-text">
                  Workflow results become evidence artifacts with provenance, QA state, linked map
                  layers, and reproducibility references. Artifacts are not silently rewritten; they
                  are marked stale or invalid when context changes.
                </p>
                <div className="evidence-facts" aria-label="Evidence artifact properties">
                  {EVIDENCE_FACTS.map(fact => (
                    <span key={fact} className="evidence-fact">{fact}</span>
                  ))}
                </div>
              </section>

              <section id="welcome-section-launch" className="welcome-section" data-welcome-section="launch">
                <span className="section-eyebrow">Launch</span>
                <div className="section-icon" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <rect x="4" y="4" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2"/>
                    <path d="M9 16l4 4 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="section-title">Start With the Right Analytical Move</h2>
                <p className="section-text">
                  Open the workbench by inspecting available spatial context, selecting a method
                  whose validity envelope fits the question, and publishing eligible outputs only
                  when provenance and review state are clear.
                </p>
                <div className="launch-grid" aria-label="Recommended launch paths">
                  {START_PATHS.map((path, index) => (
                    <div className="launch-card" key={path.title}>
                      <div className="step-number">{index + 1}</div>
                      <div className="step-content">
                        <h3 className="step-title">{path.title}</h3>
                        <p className="step-desc">{path.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <div className={`welcome-disc__hint ${scrolled ? 'is-hidden' : ''}`} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Scroll</span>
          </div>

          <div className="welcome-disc__footer">
            <span className="footer-dock__rail footer-dock__rail--left" aria-hidden="true" />
            <span className="footer-dock__rail footer-dock__rail--right" aria-hidden="true" />
            <div className="footer-meta">
              <div className="footer-status-row">
                <span className="footer-status">
                  <span className="footer-status__dot" aria-hidden="true" />
                  Mission Briefing
                </span>
                <span className="footer-mode">v5</span>
              </div>
              <div className="footer-state-row" aria-label="Current workbench state">
                {stateBackedChips.map(chip => (
                  <span key={chip.label} className={`footer-state-chip footer-state-chip--${chip.tone}`}>
                    <span className="footer-state-chip__label">{chip.label}</span>
                    <span className="footer-state-chip__value">{chip.value}</span>
                  </span>
                ))}
              </div>
              <p className="footer-text">
                <svg aria-hidden="true" focusable="false" width="14" height="14" viewBox="0 0 16 16" fill="none" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '6px'}}>
                  <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 4v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Urban Analytics Workbench • Mission briefing
              </p>
              <p className="footer-text footer-text--credit">
                Developed by <strong>Mustafa Raşit Şahin, PhD</strong> • Built on{' '}
                <a
                  href="https://github.com/mustafaras/Synapse_IDE"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{color: 'var(--syn-text-link)', textDecoration: 'none', borderBottom: '1px solid color-mix(in srgb, var(--syn-text-link) 30%, transparent)'}}
                >
                  Synapse IDE
                </a>
              </p>
            </div>
            <button
              type="button"
              className="btn-start"
              onClick={handleClose}
              onMouseEnter={() => setCtaArmed(true)}
              onMouseLeave={() => setCtaArmed(false)}
              onFocus={() => setCtaArmed(true)}
              onBlur={() => setCtaArmed(false)}
            >
              <span className="btn-start__icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9l3 3 9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className="btn-start__label">Start Workbench</span>
            </button>
          </div>

          <nav className="welcome-modal__section-orbit" aria-label="Welcome modal sections">
            {WELCOME_SECTIONS.map(section => (
              <button
                key={section.id}
                type="button"
                className={`section-dot ${activeSection === section.id ? 'is-active' : ''}`}
                aria-label={`Jump to ${section.label}`}
                aria-current={activeSection === section.id ? 'true' : undefined}
                aria-controls={`welcome-section-${section.id}`}
                onClick={() => handleSectionJump(section.id)}
              >
                <span className="section-dot__marker" aria-hidden="true" />
                <span className="section-dot__label">{section.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      <style>{`
        /* ────────────────────────────────────────────────────────────
           Welcome modal — Urban Analytics "Orbital Cockpit" (circular)
           ────────────────────────────────────────────────────────── */

        .welcome-modal {
          position: fixed !important;
          inset: 0 !important;
          z-index: 2147483648 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 16px;
          overflow: hidden !important;
          animation: wmFadeIn var(--wm-duration-enter) var(--wm-ease);
          --wm-disc: min(96vmin, 1180px);
          --wm-col-max: calc(var(--wm-disc) * 0.62);
          --wm-edge-fade: 9%;
          --wm-logo-size: clamp(84px, 11.7vmin, 122px);
          --wm-wordmark: clamp(30px, 4.25vmin, 46px);
          --wm-cyan: #3aa8ff;
          --wm-cyan-strong: #72ddff;
          --wm-cyan-soft: rgba(58, 168, 255, 0.18);
          --wm-amber: #d6a84f;
          --wm-text: #eef6ff;
          --wm-muted: #9aaabd;
          --wm-subtle: #6f8197;
          --wm-surface: rgba(18, 28, 42, 0.68);
          --wm-surface-strong: rgba(25, 38, 56, 0.82);
          --wm-border-gradient: linear-gradient(132deg,
            rgba(114, 221, 255, 0.5),
            rgba(136, 176, 218, 0.12) 30%,
            rgba(214, 168, 79, 0.22) 56%,
            rgba(58, 168, 255, 0.28) 80%,
            rgba(255, 255, 255, 0.1));
          --wm-duration-fast: 160ms;
          --wm-duration-hover: 220ms;
          --wm-duration-enter: 320ms;
          --wm-duration-exit: 360ms;
          --wm-duration-panel: 480ms;
          --wm-duration-sweep: 620ms;
          --wm-duration-reveal: 560ms;
          --wm-ease: cubic-bezier(.16, 1, .3, 1);
          --wm-ease-firm: cubic-bezier(.2, .8, .2, 1);
          --wm-orbit-nav-width: 108px;
        }
        @keyframes wmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wmFadeOut { from { opacity: 1; } to { opacity: 0; } }
        .welcome-modal--closing { animation: wmFadeOut var(--wm-duration-exit) ease-in forwards; }
        .welcome-modal--closing .welcome-modal__panel { animation: wmApertureOut var(--wm-duration-exit) var(--wm-ease-firm) forwards; }
        .welcome-modal--closing .welcome-modal__backdrop { animation: wmBackdropFadeOut var(--wm-duration-exit) ease-in forwards; }
        .welcome-modal--closing .welcome-modal__halo { opacity: 0; transition: opacity var(--wm-duration-exit) ease-in; }

        .welcome-modal__backdrop {
          position: fixed !important;
          inset: 0 !important;
          z-index: -1 !important;
          background:
            radial-gradient(ellipse 120% 120% at 50% 42%, rgba(7, 13, 22, 0.55), rgba(2, 5, 10, 0.94) 78%),
            linear-gradient(180deg, rgba(2, 6, 12, 0.9), rgba(3, 7, 13, 0.96)),
            repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.014) 0 1px, transparent 1px 78px) !important;
          backdrop-filter: blur(20px) saturate(116%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(116%) !important;
          animation: wmBackdropFadeIn var(--wm-duration-enter) ease-out;
        }
        @keyframes wmBackdropFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes wmBackdropFadeOut { from { opacity: 1; } to { opacity: 0; } }

        /* ───────── Disc wrapper + halo ───────── */

        .welcome-modal__disc-wrap {
          position: relative;
          width: var(--wm-disc);
          height: var(--wm-disc);
          aspect-ratio: 1 / 1;
          flex: 0 0 auto;
        }
        .welcome-modal__halo {
          position: absolute;
          inset: -6%;
          z-index: 0;
          border-radius: 50%;
          pointer-events: none;
          background: conic-gradient(from 0deg,
            rgba(58, 168, 255, 0) 0deg,
            rgba(114, 221, 255, 0.24) 58deg,
            rgba(58, 168, 255, 0) 128deg,
            rgba(214, 168, 79, 0.14) 208deg,
            rgba(58, 168, 255, 0) 296deg,
            rgba(114, 221, 255, 0.2) 360deg);
          filter: blur(28px);
          opacity: 0.55;
          animation: wmHaloSpin 64s linear infinite;
        }
        .welcome-modal__halo::after {
          content: "";
          position: absolute;
          inset: 7%;
          border-radius: 50%;
          box-shadow: 0 0 90px 8px rgba(58, 168, 255, 0.2);
        }
        @keyframes wmHaloSpin { to { transform: rotate(360deg); } }

        /* ───────── Circular panel shell ───────── */

        .welcome-modal__panel {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          isolation: isolate;
          overflow: hidden;
          padding: clamp(26px, 6%, 60px) 0 clamp(22px, 5%, 50px);
          clip-path: circle(75% at 50% 50%);
          background:
            radial-gradient(circle at 50% 30%, rgba(18, 30, 48, 0.92), rgba(7, 12, 20, 0.96) 72%) padding-box,
            var(--wm-border-gradient) border-box;
          border: 1px solid transparent;
          backdrop-filter: blur(22px) saturate(122%);
          -webkit-backdrop-filter: blur(22px) saturate(122%);
          box-shadow:
            0 42px 110px -24px rgba(0, 0, 0, 0.74),
            0 0 0 1px rgba(58, 168, 255, 0.1),
            0 0 64px rgba(58, 168, 255, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.06);
          animation: wmApertureIn var(--wm-duration-panel) var(--wm-ease);
        }
        .welcome-modal__panel::before {
          content: "";
          position: absolute;
          inset: 3px;
          z-index: 6;
          border-radius: 50%;
          pointer-events: none;
          border: 1px solid rgba(114, 221, 255, 0.14);
          box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.045),
            inset 0 34px 64px -46px rgba(255, 255, 255, 0.34),
            inset 0 -70px 130px -50px rgba(0, 0, 0, 0.55);
        }
        .welcome-modal__panel::after {
          content: "";
          position: absolute;
          inset: 2px;
          z-index: 7;
          border-radius: 50%;
          pointer-events: none;
          opacity: 0;
          transform: rotate(-40deg);
          background: conic-gradient(from 0deg,
            transparent 0deg,
            rgba(114, 221, 255, 0.74) 18deg,
            rgba(214, 168, 79, 0.36) 28deg,
            transparent 56deg,
            transparent 360deg);
          -webkit-mask: radial-gradient(circle, transparent 69%, #000 70%, #000 73%, transparent 74%);
          mask: radial-gradient(circle, transparent 69%, #000 70%, #000 73%, transparent 74%);
        }
        .welcome-modal__panel.is-cta-armed::after {
          animation: wmCtaRimSweep 920ms var(--wm-ease) both;
        }
        @keyframes wmApertureIn {
          from { opacity: 0; transform: scale(.92); clip-path: circle(0% at 50% 50%); }
          to   { opacity: 1; transform: scale(1);   clip-path: circle(75% at 50% 50%); }
        }
        @keyframes wmApertureOut {
          from { opacity: 1; transform: scale(1);  clip-path: circle(75% at 50% 50%); }
          to   { opacity: 0; transform: scale(.9); clip-path: circle(0% at 50% 50%); }
        }
        @keyframes wmCtaRimSweep {
          0%   { opacity: 0; transform: rotate(-40deg); }
          18%  { opacity: 0.78; }
          100% { opacity: 0; transform: rotate(92deg); }
        }

        /* ───────── Instrumented rim progress ───────── */

        .welcome-modal__progress {
          position: absolute;
          inset: 1.35%;
          z-index: 5;
          width: 97.3%;
          height: 97.3%;
          border-radius: 50%;
          pointer-events: none;
          overflow: hidden;
          animation: wmRevealSoft var(--wm-duration-reveal) var(--wm-ease) 90ms both;
          --wm-scroll-angle: 0deg;
        }
        .progress-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          pointer-events: none;
          -webkit-mask-image: radial-gradient(circle,
            transparent 0,
            transparent 69.35%,
            #000 69.65%,
            #000 70.35%,
            transparent 70.7%);
          mask-image: radial-gradient(circle,
            transparent 0,
            transparent 69.35%,
            #000 69.65%,
            #000 70.35%,
            transparent 70.7%);
        }
        .progress-ring--track {
          background: rgba(114, 221, 255, 0.075);
        }
        .progress-ring--value {
          background: conic-gradient(from -90deg,
            rgba(114, 221, 255, 0.76) 0deg,
            rgba(114, 221, 255, 0.76) var(--wm-scroll-angle),
            transparent var(--wm-scroll-angle),
            transparent 360deg);
        }
        .progress-ring--accent {
          background: conic-gradient(from calc(-90deg + var(--wm-scroll-angle) - 8deg),
            transparent 0deg,
            rgba(214, 168, 79, 0.82) 0.6deg,
            rgba(214, 168, 79, 0.82) 8deg,
            transparent 8.7deg,
            transparent 360deg);
          transition: opacity 140ms linear;
        }

        /* ───────── Orbital atmosphere ───────── */

        .welcome-modal__atmosphere {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          border-radius: 50%;
          overflow: hidden;
        }
        .welcome-modal__urban-texture {
          position: absolute;
          inset: 12%;
          width: 76%;
          height: 76%;
          opacity: 0.28;
          mix-blend-mode: screen;
          -webkit-mask-image: radial-gradient(circle, transparent 0 20%, #000 28%, #000 76%, transparent 90%);
          mask-image: radial-gradient(circle, transparent 0 20%, #000 28%, #000 76%, transparent 90%);
        }
        .welcome-modal__urban-texture path {
          fill: none;
          stroke: rgba(114, 221, 255, 0.18);
          stroke-width: 0.34;
          stroke-linecap: round;
          stroke-linejoin: round;
          vector-effect: non-scaling-stroke;
        }
        .welcome-modal__urban-texture path:nth-child(3n) { stroke: rgba(214, 168, 79, 0.12); }
        .welcome-modal__urban-texture .texture-parcel {
          fill: rgba(114, 221, 255, 0.025);
          stroke: rgba(114, 221, 255, 0.12);
          stroke-width: 0.26;
        }
        .welcome-modal__urban-texture .texture-node {
          fill: rgba(114, 221, 255, 0.32);
          stroke: rgba(5, 12, 22, 0.5);
          stroke-width: 0.18;
        }
        .welcome-modal__polar-grid {
          position: absolute;
          inset: 1.2%;
          width: 97.6%;
          height: 97.6%;
          opacity: 0.62;
        }
        .polar-tick {
          stroke: rgba(114, 221, 255, 0.22);
          stroke-width: 0.22;
          stroke-linecap: round;
        }
        .polar-tick--major {
          stroke: rgba(214, 168, 79, 0.34);
          stroke-width: 0.34;
        }
        .polar-label {
          fill: rgba(114, 221, 255, 0.26);
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 2.6px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-anchor: middle;
          dominant-baseline: middle;
        }
        .polar-label--n,
        .polar-label--s {
          fill: rgba(214, 168, 79, 0.32);
        }
        .welcome-modal__rings {
          position: absolute;
          inset: 3%;
          width: 94%;
          height: 94%;
          opacity: 0.6;
        }
        .welcome-modal__rings .ring {
          fill: none;
          stroke: rgba(114, 221, 255, 0.1);
          stroke-width: 0.22;
          transform-origin: 50% 50%;
        }
        .welcome-modal__rings .ring--2 {
          stroke: rgba(114, 221, 255, 0.09);
          stroke-dasharray: 1.5 3;
          animation: wmRingSpin 84s linear infinite;
        }
        .welcome-modal__rings .ring--3 { stroke: rgba(214, 168, 79, 0.08); }
        .welcome-modal__rings .ring--4 {
          stroke: rgba(114, 221, 255, 0.08);
          stroke-dasharray: 0.8 4;
          animation: wmRingSpin 62s linear infinite reverse;
        }
        @keyframes wmRingSpin { to { transform: rotate(360deg); } }

        .welcome-modal__radar {
          position: absolute;
          inset: 3%;
          border-radius: 50%;
          background: conic-gradient(from 0deg,
            rgba(114, 221, 255, 0.14),
            rgba(114, 221, 255, 0) 40deg);
          opacity: 0.5;
          mix-blend-mode: screen;
          -webkit-mask-image: radial-gradient(circle, #000 60%, transparent 63%);
          mask-image: radial-gradient(circle, #000 60%, transparent 63%);
          animation: wmRadarSweep 16s linear infinite;
        }
        @keyframes wmRadarSweep { to { transform: rotate(360deg); } }

        .welcome-modal__flow-canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.5;
          mix-blend-mode: screen;
        }

        .welcome-modal__orbit-nodes {
          position: absolute;
          inset: 10%;
          border-radius: 50%;
          animation: wmRingSpin 96s linear infinite;
        }
        .orbit-node {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 0 1px rgba(114, 221, 255, 0.22), 0 0 14px rgba(58, 168, 255, 0.6);
          opacity: 0.5;
          animation: wmSignalPulse 6.5s ease-in-out infinite;
        }
        .orbit-node--a { top: -2px; left: 50%; }
        .orbit-node--b { top: 50%; right: -2px; animation-delay: -2s; }
        .orbit-node--c { bottom: -2px; left: 42%; animation-delay: -3.6s; background: var(--wm-amber); }
        .orbit-node--d { top: 16%; left: 8%; animation-delay: -1.2s; }
        .orbit-node--e { bottom: 13%; right: 11%; animation-delay: -4.7s; }
        @keyframes wmSignalPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.85); }
          48%      { opacity: 0.66; transform: scale(1.22); }
          74%      { opacity: 0.42; transform: scale(1); }
        }

        /* ───────── Brand identity zone (top arc) ───────── */

        .welcome-disc__brand {
          position: relative;
          z-index: 3;
          flex: 0 0 auto;
          width: min(72%, 620px);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 7px;
          padding-top: clamp(2px, 1.5vmin, 14px);
        }
        .welcome-disc__brand > * {
          animation: wmRevealUp var(--wm-duration-reveal) var(--wm-ease) both;
        }
        .welcome-disc__brand > .brand-eyebrow { animation-delay: 125ms; }
        .welcome-disc__brand > .brand-logo { animation-delay: 190ms; }
        .welcome-disc__brand > .brand-title { animation-delay: 280ms; }
        .welcome-disc__brand > .brand-subtitle { animation-delay: 345ms; }
        .welcome-disc__brand > .brand-metrics { animation-delay: 420ms; }
        @keyframes wmRevealUp {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmRevealDock {
          from { opacity: 0; transform: translateY(14px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmRevealSoft {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .brand-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 12px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          color: color-mix(in srgb, var(--wm-cyan-strong) 82%, var(--wm-text));
          background: linear-gradient(180deg, rgba(58, 168, 255, 0.16), rgba(58, 168, 255, 0.07));
          border: 1px solid rgba(114, 221, 255, 0.3);
          border-radius: 999px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 18px rgba(58, 168, 255, 0.1);
        }
        .brand-eyebrow__dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 10px rgba(114, 221, 255, 0.85);
          animation: wmDotBlink 2s ease-in-out infinite;
        }
        @keyframes wmDotBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: .45; transform: scale(.82); }
        }

        .brand-logo {
          position: relative;
          width: var(--wm-logo-size);
          height: var(--wm-logo-size);
          display: grid;
          place-items: center;
          margin: 2px 0 1px;
        }
        .brand-logo__svg { width: 100%; height: 100%; position: relative; z-index: 2; }
        .brand-logo__halo {
          position: absolute;
          inset: -24%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(58, 168, 255, 0.42), rgba(58, 168, 255, 0.12) 48%, transparent 70%);
          filter: blur(11px);
          z-index: 0;
          animation: wmHaloBreathe 4.6s ease-in-out infinite;
        }
        .brand-logo__medallion {
          position: absolute;
          inset: -5%;
          z-index: 1;
          border-radius: 50%;
          background:
            radial-gradient(circle at 50% 42%, rgba(18, 32, 50, 0.42), rgba(5, 10, 18, 0.1) 58%, transparent 70%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(114, 221, 255, 0.02));
          border: 1px solid rgba(114, 221, 255, 0.22);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            inset 0 -18px 36px -30px rgba(0, 0, 0, 0.82),
            0 0 0 6px rgba(58, 168, 255, 0.035),
            0 0 28px rgba(58, 168, 255, 0.12);
        }
        .brand-logo__inner-ring {
          position: absolute;
          inset: 17%;
          z-index: 1;
          border-radius: 50%;
          border: 1px solid rgba(114, 221, 255, 0.3);
          background:
            radial-gradient(circle, transparent 0 54%, rgba(114, 221, 255, 0.08) 55%, transparent 58%),
            conic-gradient(from 45deg,
              transparent 0deg,
              rgba(114, 221, 255, 0.22) 48deg,
              transparent 92deg,
              transparent 185deg,
              rgba(214, 168, 79, 0.16) 242deg,
              transparent 300deg);
          box-shadow:
            inset 0 0 18px rgba(58, 168, 255, 0.1),
            0 0 16px rgba(58, 168, 255, 0.1);
        }
        @keyframes wmHaloBreathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%      { opacity: 0.92; transform: scale(1.08); }
        }
        .brand-logo__ring {
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          z-index: 1;
          background: conic-gradient(from 0deg,
            transparent 0deg,
            rgba(114, 221, 255, 0.5) 40deg,
            transparent 120deg,
            transparent 240deg,
            rgba(214, 168, 79, 0.34) 300deg,
            transparent 360deg);
          -webkit-mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
          mask: radial-gradient(circle, transparent 60%, #000 61%, #000 70%, transparent 71%);
          animation: wmRingSpin 18s linear infinite;
        }
        .brand-logo__ticks {
          position: absolute;
          inset: -17%;
          z-index: 1;
          border-radius: 50%;
          background: repeating-conic-gradient(
            from 0deg,
            rgba(114, 221, 255, 0.32) 0deg 1.6deg,
            transparent 1.6deg 15deg
          );
          -webkit-mask: radial-gradient(circle, transparent 63%, #000 64%, #000 68%, transparent 69%);
          mask: radial-gradient(circle, transparent 63%, #000 64%, #000 68%, transparent 69%);
          opacity: 0.5;
          animation: wmRingSpin 38s linear infinite reverse;
        }
        .brand-logo__reticle {
          position: absolute;
          inset: 2%;
          z-index: 1;
          border-radius: 50%;
          opacity: 0.35;
          background:
            linear-gradient(90deg, transparent 0 47%, rgba(114, 221, 255, 0.32) 49%, rgba(114, 221, 255, 0.32) 51%, transparent 53%),
            linear-gradient(0deg, transparent 0 47%, rgba(114, 221, 255, 0.22) 49%, rgba(114, 221, 255, 0.22) 51%, transparent 53%);
          -webkit-mask: radial-gradient(circle, transparent 0 32%, #000 33%, #000 58%, transparent 60%);
          mask: radial-gradient(circle, transparent 0 32%, #000 33%, #000 58%, transparent 60%);
        }
        .brand-logo__glint {
          position: absolute;
          inset: -8%;
          z-index: 3;
          border-radius: 50%;
          pointer-events: none;
          background: conic-gradient(from -24deg,
            transparent 0deg,
            rgba(255, 255, 255, 0.44) 10deg,
            rgba(114, 221, 255, 0.16) 24deg,
            transparent 42deg,
            transparent 360deg);
          -webkit-mask: radial-gradient(circle, transparent 56%, #000 57%, #000 62%, transparent 64%);
          mask: radial-gradient(circle, transparent 56%, #000 57%, #000 62%, transparent 64%);
          opacity: 0.56;
          animation: wmMedallionGlint 9s var(--wm-ease) infinite;
        }
        @keyframes wmMedallionGlint {
          0%, 62% { opacity: 0; transform: rotate(-34deg); }
          72%     { opacity: 0.56; }
          100%    { opacity: 0; transform: rotate(56deg); }
        }
        .brand-logo__micro {
          position: absolute;
          z-index: 3;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          padding: 2px 7px;
          border-radius: 999px;
          border: 1px solid rgba(114, 221, 255, 0.22);
          background: rgba(5, 12, 22, 0.64);
          color: color-mix(in srgb, var(--wm-cyan-strong) 72%, var(--wm-text));
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          white-space: nowrap;
          box-shadow: 0 6px 14px -10px rgba(0, 0, 0, 0.8);
        }
        .brand-logo__core { transform-origin: center; transform-box: fill-box; animation: wmCorePulse 2.6s ease-in-out infinite; }
        .brand-logo__node { transform-origin: center; transform-box: fill-box; animation: wmNodePulse 3s ease-in-out infinite; }
        .brand-logo__node:nth-of-type(2) { animation-delay: .5s; }
        .brand-logo__node:nth-of-type(4) { animation-delay: 1s; }
        .brand-logo__node:nth-of-type(5) { animation-delay: 1.5s; }
        @keyframes wmCorePulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.16); opacity: 0.9; }
        }
        @keyframes wmNodePulse {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%      { opacity: 1; transform: scale(1.18); }
        }

        .brand-title {
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: center;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          gap: 4px 10px;
          font-size: var(--wm-wordmark);
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.08;
        }
        .brand-title__primary,
        .brand-title__secondary {
          min-width: 0;
          overflow-wrap: break-word;
        }
        .brand-title__primary { color: var(--syn-text-default, var(--wm-text)); }
        .brand-shine {
          overflow-wrap: inherit;
          background: linear-gradient(100deg,
            var(--wm-text) 0%,
            var(--wm-text) 36%,
            color-mix(in srgb, var(--wm-cyan-strong) 92%, #ffffff) 50%,
            var(--wm-text) 64%,
            var(--wm-text) 100%);
          background-size: 300% 100%;
          background-position: 100% 50%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: wmBrandShine 4.8s cubic-bezier(.4, 0, .2, 1) infinite;
        }
        @keyframes wmBrandShine {
          0%, 18%   { background-position: 100% 50%; }
          72%, 100% { background-position: 0% 50%; }
        }
        .brand-title__sep { color: var(--wm-subtle); font-weight: 300; opacity: 0.5; }
        .brand-title__secondary { color: color-mix(in srgb, var(--wm-muted) 60%, var(--wm-text)); font-weight: 600; }
        .brand-chip {
          align-self: center;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          border-radius: 7px;
          background: linear-gradient(180deg, rgba(214, 168, 79, 0.18), rgba(214, 168, 79, 0.1));
          border: 1px solid rgba(214, 168, 79, 0.4);
          color: color-mix(in srgb, var(--wm-amber) 88%, #ffffff);
          letter-spacing: 0.14em;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 14px rgba(214, 168, 79, 0.2);
        }

        .brand-subtitle {
          margin: 1px 0 0;
          font-size: 13px;
          line-height: 1.42;
          color: color-mix(in srgb, var(--wm-muted) 88%, var(--wm-text));
          max-width: 460px;
        }

        .brand-metrics {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .metric-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          padding: 7px 14px;
          border-radius: 14px;
          border: 1px solid rgba(136, 176, 218, 0.24);
          background:
            linear-gradient(180deg, rgba(24, 42, 62, 0.84), rgba(8, 14, 23, 0.6)),
            linear-gradient(100deg, rgba(58, 168, 255, 0.08), transparent 60%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 10px 22px -18px rgba(58, 168, 255, 0.8);
          transition: background-color var(--wm-duration-hover) var(--wm-ease), box-shadow var(--wm-duration-hover) var(--wm-ease);
        }
        .metric-chip:hover {
          background:
            linear-gradient(180deg, rgba(31, 52, 76, 0.9), rgba(10, 18, 29, 0.66)),
            linear-gradient(100deg, rgba(58, 168, 255, 0.12), transparent 60%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.09), 0 0 16px rgba(58, 168, 255, 0.2);
        }
        .metric-chip__value {
          font-size: 13px;
          font-weight: 700;
          color: var(--wm-cyan-strong);
          letter-spacing: 0;
          text-shadow: 0 0 14px rgba(58, 168, 255, 0.36);
        }
        .metric-chip__label {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          color: var(--wm-subtle);
          text-transform: uppercase;
          letter-spacing: 0.13em;
          opacity: 0.72;
        }

        /* ───────── Inscribed scroll column ───────── */

        .welcome-disc__scroll {
          position: relative;
          z-index: 2;
          flex: 1 1 auto;
          width: 100%;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          margin: 10px 0 4px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          -webkit-mask-image: linear-gradient(180deg,
            transparent 0,
            #000 var(--wm-edge-fade),
            #000 calc(100% - var(--wm-edge-fade)),
            transparent 100%);
          mask-image: linear-gradient(180deg,
            transparent 0,
            #000 var(--wm-edge-fade),
            #000 calc(100% - var(--wm-edge-fade)),
            transparent 100%);
        }
        .welcome-disc__scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .welcome-disc__scroll:focus-visible {
          outline: 1px solid rgba(114, 221, 255, 0.74);
          outline-offset: -4px;
          box-shadow: inset 0 0 0 1px rgba(214, 168, 79, 0.16);
        }
        .welcome-disc__col {
          width: min(var(--wm-col-max), calc(100% - 24px));
          margin: 0 auto;
          padding: 12px 0 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .welcome-disc__col > * {
          animation: wmSectionIn var(--wm-duration-reveal) var(--wm-ease) both;
        }
        .welcome-disc__col > *:nth-child(1) { animation-delay: 500ms; }
        .welcome-disc__col > *:nth-child(2) { animation-delay: 565ms; }
        .welcome-disc__col > *:nth-child(3) { animation-delay: 630ms; }
        .welcome-disc__col > *:nth-child(4) { animation-delay: 695ms; }
        .welcome-disc__col > *:nth-child(5) { animation-delay: 760ms; }
        @keyframes wmSectionIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .welcome-section {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 7px;
          padding: 15px 17px;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(19, 30, 47, 0.56), rgba(10, 17, 28, 0.5)),
            radial-gradient(150% 130% at 100% 0%, rgba(58, 168, 255, 0.05), transparent 58%);
          border: 1px solid rgba(136, 176, 218, 0.14);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
        }
        .welcome-section--highlight {
          background:
            linear-gradient(180deg, rgba(23, 35, 52, 0.72), rgba(12, 20, 32, 0.66)),
            radial-gradient(150% 130% at 100% 0%, rgba(214, 168, 79, 0.06), transparent 58%);
          border: 1px solid rgba(136, 176, 218, 0.17);
          border-left: 2px solid rgba(214, 168, 79, 0.72);
          border-radius: 18px;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 12px 28px -24px rgba(58, 168, 255, 0.5);
        }
        .section-eyebrow {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 1px;
          padding: 3px 10px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-cyan-strong) 76%, var(--wm-text));
          background: rgba(58, 168, 255, 0.1);
          border: 1px solid rgba(114, 221, 255, 0.22);
        }
        .welcome-section--highlight .section-eyebrow {
          color: color-mix(in srgb, var(--wm-amber) 80%, var(--wm-text));
          background: rgba(214, 168, 79, 0.1);
          border-color: rgba(214, 168, 79, 0.3);
        }
        .section-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(58, 168, 255, 0.12);
          border: 1px solid rgba(114, 221, 255, 0.22);
          color: var(--wm-cyan-strong);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 14px rgba(58, 168, 255, 0.08);
        }
        .section-icon svg { width: 18px; height: 18px; }
        .section-title {
          position: relative;
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0;
          color: var(--wm-text);
          padding-bottom: 4px;
        }
        .section-title::after {
          content: "";
          display: block;
          margin-top: 6px;
          width: 24px;
          height: 1px;
          background: linear-gradient(90deg, var(--wm-cyan-strong), rgba(214, 168, 79, 0.45), transparent);
          opacity: 0.7;
        }
        .section-text {
          margin: 0;
          font-size: 12.25px;
          line-height: 1.58;
          color: color-mix(in srgb, var(--wm-muted) 92%, var(--wm-text));
        }
        .section-text strong { color: color-mix(in srgb, var(--wm-text) 86%, var(--wm-cyan-strong)); font-weight: 600; }

        .guardrail-grid,
        .launch-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
          margin-top: 4px;
        }
        .mission-flow {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-top: 4px;
        }
        .mission-step,
        .guardrail-card,
        .evidence-fact,
        .launch-card {
          min-width: 0;
          border: 1px solid rgba(136, 176, 218, 0.16);
          background:
            linear-gradient(180deg, rgba(18, 31, 48, 0.66), rgba(8, 15, 25, 0.54)),
            radial-gradient(110% 120% at 100% 0%, rgba(58, 168, 255, 0.06), transparent 54%);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
        }
        .mission-step {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 30px;
          padding: 6px 7px;
          border-radius: 11px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0;
          line-height: 1.35;
          text-align: center;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-cyan-strong) 76%, var(--wm-text));
        }
        /* Directional connector that turns the four steps into a readable
           Choose -> Inspect -> Run -> Publish pipeline. Sits in the 8px grid
           gap; hidden on the mobile 2-column layout (see max-width:560). */
        .mission-step:not(:last-child)::after {
          content: "";
          position: absolute;
          right: 5px;
          top: 50%;
          width: 5px;
          height: 5px;
          border-top: 1.5px solid rgba(114, 221, 255, 0.5);
          border-right: 1.5px solid rgba(114, 221, 255, 0.5);
          transform: translateY(-50%) rotate(45deg);
          pointer-events: none;
        }
        .guardrail-card {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 4px 9px;
          align-items: start;
          padding: 10px;
          border-radius: 12px;
        }
        .guardrail-card__code {
          grid-row: span 2;
          width: 34px;
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(214, 168, 79, 0.34);
          background: rgba(214, 168, 79, 0.1);
          color: color-mix(in srgb, var(--wm-amber) 84%, var(--wm-text));
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.05em;
        }
        .guardrail-card__title,
        .step-title {
          overflow-wrap: anywhere;
        }
        .guardrail-card__title {
          margin: 0;
          font-size: 12px;
          font-weight: 650;
          line-height: 1.28;
          color: var(--wm-text);
        }
        .guardrail-card__text {
          margin: 0;
          font-size: 10.75px;
          line-height: 1.45;
          color: color-mix(in srgb, var(--wm-muted) 90%, var(--wm-text));
        }
        .evidence-facts {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 5px;
        }
        .evidence-fact {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          padding: 5px 10px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-amber) 82%, var(--wm-text));
          background:
            linear-gradient(180deg, rgba(42, 32, 18, 0.56), rgba(13, 18, 25, 0.5)),
            radial-gradient(100% 140% at 100% 0%, rgba(214, 168, 79, 0.12), transparent 58%);
          border-color: rgba(214, 168, 79, 0.24);
        }
        .launch-grid {
          grid-template-columns: 1fr;
          gap: 9px;
        }
        .launch-card {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px;
          border-radius: 12px;
          transition: border-color 160ms ease, background-color 160ms ease;
        }
        .launch-card:hover {
          border-color: rgba(114, 221, 255, 0.26);
          background: rgba(20, 32, 49, 0.66);
        }

        /* ───────── Feature cards ───────── */

        /* Tri-modal triad: its own no-wrap row so the three bounded modules
           read as one connected system, separate from the capability grid.
           Cards shrink (min-width:0) rather than wrap, keeping the link
           glyphs between them valid at every desktop/short width. */
        .workbench-triad {
          display: flex;
          align-items: stretch;
          gap: 9px;
          margin-top: 2px;
        }
        .workbench-triad .feature-card {
          flex: 1 1 0;
          min-width: 0;
        }
        /* Subtle connector between adjacent surfaces: a hairline rail with a
           central node sitting in the gap. Decorative, static, aria-hidden. */
        .triad-link {
          flex: 0 0 14px;
          align-self: center;
          position: relative;
          height: 2px;
          border-radius: 2px;
          background: linear-gradient(90deg,
            rgba(114, 221, 255, 0.15),
            rgba(114, 221, 255, 0.55),
            rgba(214, 168, 79, 0.4));
        }
        .triad-link::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5px;
          height: 5px;
          transform: translate(-50%, -50%) rotate(45deg);
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 8px rgba(58, 168, 255, 0.6);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 11px;
          padding: 3px;
          margin: -3px;
        }
        .features-grid--mission {
          margin-top: 2px;
        }
        .feature-card {
          --feature-accent: var(--wm-cyan-strong);
          --feature-accent-rgb: 114, 221, 255;
          --feature-secondary: var(--wm-cyan);
          position: relative;
          min-height: 158px;
          padding: 14px 15px;
          border-radius: 24px;
          background:
            repeating-radial-gradient(circle at 100% -8%, rgba(var(--feature-accent-rgb), 0.075) 0 1px, transparent 1px 12px),
            radial-gradient(125% 105% at 100% -12%, rgba(114, 221, 255, 0.07), transparent 44%),
            linear-gradient(180deg, rgba(30, 46, 65, 0.82), rgba(9, 16, 27, 0.78)),
            linear-gradient(115deg, rgba(58, 168, 255, 0.05), transparent 54%, rgba(214, 168, 79, 0.03)),
            var(--wm-surface);
          border: 1px solid rgba(136, 176, 218, 0.23);
          display: flex;
          flex-direction: column;
          gap: 7px;
          overflow: hidden;
          outline: none;
          transition:
            border-color var(--wm-duration-fast) var(--wm-ease),
            transform var(--wm-duration-fast) var(--wm-ease),
            box-shadow var(--wm-duration-hover) var(--wm-ease);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 12px 26px -26px rgba(58, 168, 255, 0.7),
            0 8px 20px -22px rgba(0, 0, 0, 0.85);
        }
        .feature-card--compact {
          min-height: 138px;
        }
        .feature-card[data-feature-kind="engine"],
        .feature-card[data-feature-kind="workflow"] {
          --feature-accent: var(--wm-amber);
          --feature-accent-rgb: 214, 168, 79;
          --feature-secondary: #f0c66a;
        }
        .feature-card[data-feature-kind="python"],
        .feature-card[data-feature-kind="h3"] {
          --feature-accent: #8fe7c3;
          --feature-accent-rgb: 143, 231, 195;
          --feature-secondary: #56c8a3;
        }
        .feature-card[data-feature-kind="ai"],
        .feature-card[data-feature-kind="three-d"] {
          --feature-accent: #b7a6ff;
          --feature-accent-rgb: 183, 166, 255;
          --feature-secondary: #7f8cff;
        }
        .feature-card[data-feature-kind="network"],
        .feature-card[data-feature-kind="stream"] {
          --feature-accent: #7ee2ff;
          --feature-accent-rgb: 126, 226, 255;
          --feature-secondary: var(--wm-cyan);
        }
        .feature-card[data-feature-kind="evidence"] {
          --feature-accent: #f4d98c;
          --feature-accent-rgb: 244, 217, 140;
          --feature-secondary: var(--wm-amber);
        }
        .feature-card::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 78%;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          border: 1px solid rgba(var(--feature-accent-rgb), 0.14);
          box-shadow:
            0 0 0 9px rgba(var(--feature-accent-rgb), 0.032),
            0 0 0 19px rgba(214, 168, 79, 0.022);
          opacity: 0.55;
          pointer-events: none;
          transform: translate3d(30%, -42%, 0);
          transition: opacity 240ms var(--wm-ease), transform 300ms var(--wm-ease);
        }
        .feature-card:hover::before,
        .feature-card:focus-visible::before {
          opacity: 0.95;
          transform: translate3d(30%, -42%, 0) translate3d(-5px, 4px, 0);
        }
        .feature-card::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 42%;
          background: linear-gradient(90deg, transparent, rgba(114, 221, 255, 0.16), rgba(214, 168, 79, 0.07), transparent);
          opacity: 0;
          transform: translateX(-130%) skewX(-10deg);
          pointer-events: none;
        }
        .feature-card:hover,
        .feature-card:focus-visible {
          border-color: rgba(var(--feature-accent-rgb), 0.55);
          transform: translateY(-3px);
          box-shadow:
            0 16px 34px -24px rgba(58, 168, 255, 0.94),
            0 0 0 1px rgba(58, 168, 255, 0.16),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .feature-card:focus-visible {
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.75),
            0 0 0 4px rgba(58, 168, 255, 0.22),
            0 15px 32px -24px rgba(58, 168, 255, 0.9);
        }
        .feature-card:hover::after,
        .feature-card:focus-visible::after {
          opacity: 1;
          animation: wmSweep var(--wm-duration-sweep) ease-out both;
        }
        .feature-card:hover .feature-icon,
        .feature-card:focus-visible .feature-icon {
          color: var(--feature-accent);
          border-color: rgba(var(--feature-accent-rgb), 0.56);
          background: rgba(var(--feature-accent-rgb), 0.14);
          box-shadow: 0 0 18px rgba(var(--feature-accent-rgb), 0.32), inset 0 1px 0 rgba(255, 255, 255, 0.09);
        }
        @keyframes wmSweep {
          from { transform: translateX(-130%) skewX(-10deg); }
          to   { transform: translateX(180%) skewX(-10deg); }
        }
        .feature-icon {
          position: relative;
          z-index: 1;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(22, 39, 58, 0.84), rgba(8, 14, 24, 0.76));
          border: 1px solid rgba(136, 176, 218, 0.24);
          color: color-mix(in srgb, var(--wm-muted) 76%, var(--feature-accent));
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), inset 0 -5px 10px rgba(0, 0, 0, 0.22);
          transition: color 180ms ease, background-color 180ms ease, border-color 180ms ease, box-shadow 220ms ease;
        }
        .feature-icon::before,
        .feature-icon::after {
          content: "";
          position: absolute;
          inset: -5px;
          border-radius: 50%;
          pointer-events: none;
        }
        .feature-icon::before {
          border: 1px solid rgba(var(--feature-accent-rgb), 0.18);
          transform: rotate(24deg);
        }
        .feature-icon::after {
          inset: -8px;
          background: conic-gradient(from 0deg, transparent, rgba(var(--feature-accent-rgb), 0.36), transparent 38%);
          -webkit-mask: radial-gradient(circle, transparent 58%, #000 60%, #000 68%, transparent 70%);
          mask: radial-gradient(circle, transparent 58%, #000 60%, #000 68%, transparent 70%);
          opacity: 0.42;
          transform: rotate(-28deg);
          transition: opacity 220ms ease, transform 260ms var(--wm-ease);
        }
        .feature-card:hover .feature-icon::after,
        .feature-card:focus-visible .feature-icon::after {
          opacity: 0.86;
          transform: rotate(42deg);
        }
        .feature-icon svg { width: 17px; height: 17px; }
        .feature-title {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--wm-text);
          letter-spacing: 0;
        }
        .feature-title::before {
          content: "";
          display: inline-block;
          width: 6px;
          height: 6px;
          margin-right: 7px;
          border-radius: 50%;
          background: var(--feature-accent);
          box-shadow: 0 0 10px rgba(var(--feature-accent-rgb), 0.42);
          vertical-align: 1px;
        }
        .feature-desc {
          position: relative;
          z-index: 1;
          margin: 0;
          font-size: 11px;
          line-height: 1.46;
          color: color-mix(in srgb, var(--wm-muted) 90%, var(--wm-text));
        }
        .feature-tags {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-top: auto;
          padding-top: 3px;
        }
        .feature-tag {
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 2px 8px;
          border-radius: 999px;
          color: color-mix(in srgb, var(--feature-accent) 74%, var(--wm-text));
          background: rgba(var(--feature-accent-rgb), 0.08);
          border: 1px solid rgba(var(--feature-accent-rgb), 0.2);
          transition: background-color 160ms ease, border-color 160ms ease;
        }
        .feature-card:hover .feature-tag,
        .feature-card:focus-visible .feature-tag {
          background: rgba(var(--feature-accent-rgb), 0.14);
          border-color: rgba(var(--feature-accent-rgb), 0.34);
        }

        /* ───────── Tech badges + steps ───────── */

        .tech-badges { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
        .tech-badge {
          padding: 3px 8px;
          background: rgba(58, 168, 255, 0.1);
          border: 1px solid rgba(114, 221, 255, 0.22);
          border-radius: 7px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 10px;
          font-weight: 700;
          color: color-mix(in srgb, var(--wm-cyan-strong) 80%, var(--wm-text));
          letter-spacing: 0.08em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
          transition: background-color 160ms ease, box-shadow 220ms ease;
        }
        .tech-badge:hover { background: rgba(58, 168, 255, 0.16); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 12px rgba(58, 168, 255, 0.26); }

        .steps-list { display: flex; flex-direction: column; gap: 9px; padding: 2px 0; }
        .step-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 9px 10px;
          background: rgba(13, 21, 34, 0.58);
          border: 1px solid rgba(136, 176, 218, 0.14);
          border-radius: 12px;
          transition: border-color 160ms ease, background-color 160ms ease;
        }
        .step-item:hover { border-color: rgba(114, 221, 255, 0.26); background: rgba(20, 32, 49, 0.66); }
        .step-number {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(58, 168, 255, 0.12);
          border: 1px solid rgba(114, 221, 255, 0.28);
          color: var(--wm-cyan-strong);
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 12px;
          font-weight: 700;
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 0 10px rgba(58, 168, 255, 0.18);
        }
        .step-content { flex: 1; display: flex; flex-direction: column; gap: 3px; }
        .step-title { margin: 0; font-size: 12.5px; font-weight: 600; color: var(--wm-text); }
        .step-desc { margin: 0; font-size: 11.25px; line-height: 1.52; color: color-mix(in srgb, var(--wm-muted) 88%, var(--wm-text)); }

        /* ───────── Scroll hint ───────── */

        .welcome-disc__hint {
          position: absolute;
          left: 50%;
          bottom: clamp(86px, 17%, 150px);
          z-index: 4;
          transform: translateX(-50%);
          display: none;
          align-items: center;
          gap: 5px;
          padding: 4px 11px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: color-mix(in srgb, var(--wm-cyan-strong) 78%, var(--wm-text));
          background: rgba(8, 15, 25, 0.7);
          border: 1px solid rgba(114, 221, 255, 0.24);
          box-shadow: 0 6px 18px -10px rgba(0, 0, 0, 0.8);
          pointer-events: none;
          opacity: 0.9;
          transition: opacity 280ms ease, transform 280ms ease;
          animation: wmHintBob 2.4s ease-in-out infinite;
        }
        .welcome-disc__hint svg { color: var(--wm-cyan-strong); }
        .welcome-disc__hint.is-hidden {
          opacity: 0;
          transform: translateX(-50%) translateY(6px);
        }
        @keyframes wmHintBob {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%      { transform: translateX(-50%) translateY(3px); }
        }

        /* ───────── Footer command bar (bottom arc) ───────── */

        .welcome-disc__footer {
          position: relative;
          z-index: 3;
          flex: 0 0 auto;
          width: min(64%, 560px);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
          padding: 10px 18px 0;
          border-top: 1px solid rgba(114, 221, 255, 0.1);
          background:
            radial-gradient(120% 120% at 50% 100%, rgba(58, 168, 255, 0.1), transparent 48%),
            linear-gradient(90deg, transparent, rgba(114, 221, 255, 0.055) 48%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 16%, #000 84%, transparent 100%);
          animation: wmRevealDock var(--wm-duration-reveal) var(--wm-ease) 820ms both;
        }
        .welcome-disc__footer::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 56%;
          height: 1px;
          transform: translateX(-50%);
          background: linear-gradient(90deg, transparent, rgba(114, 221, 255, 0.45), rgba(214, 168, 79, 0.22), transparent);
          box-shadow: 0 0 14px rgba(58, 168, 255, 0.24);
          pointer-events: none;
        }
        .footer-dock__rail {
          position: absolute;
          top: 16px;
          width: 76px;
          height: 1px;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(114, 221, 255, 0.28), transparent);
          opacity: 0.72;
        }
        .footer-dock__rail--left {
          right: calc(50% + 130px);
          transform: rotate(6deg);
        }
        .footer-dock__rail--right {
          left: calc(50% + 130px);
          transform: rotate(-6deg);
        }
        .footer-meta { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .footer-status-row {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 2px;
        }
        .footer-state-row {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 5px;
          max-width: 100%;
          margin: 1px 0 2px;
        }
        .footer-status,
        .footer-mode {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 9px;
          border-radius: 999px;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .footer-status {
          color: color-mix(in srgb, var(--wm-cyan-strong) 76%, var(--wm-text));
          background: linear-gradient(180deg, rgba(58, 168, 255, 0.14), rgba(58, 168, 255, 0.06));
          border: 1px solid rgba(114, 221, 255, 0.24);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 0 12px rgba(58, 168, 255, 0.08);
        }
        .footer-status__dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 9px rgba(114, 221, 255, 0.76);
        }
        .footer-mode {
          color: color-mix(in srgb, var(--wm-amber) 72%, var(--wm-text));
          background: linear-gradient(180deg, rgba(214, 168, 79, 0.12), rgba(214, 168, 79, 0.045));
          border: 1px solid rgba(214, 168, 79, 0.24);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
        }
        .footer-state-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-height: 20px;
          padding: 3px 7px;
          border-radius: 999px;
          border: 1px solid rgba(136, 176, 218, 0.14);
          background: rgba(7, 13, 22, 0.42);
          color: color-mix(in srgb, var(--wm-muted) 82%, var(--wm-text));
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8px;
          line-height: 1;
          white-space: nowrap;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
        }
        .footer-state-chip__label {
          color: var(--wm-subtle);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .footer-state-chip__value {
          color: var(--wm-text);
          font-weight: 800;
          letter-spacing: 0;
        }
        .footer-state-chip--active {
          border-color: rgba(114, 221, 255, 0.28);
          background: linear-gradient(180deg, rgba(58, 168, 255, 0.12), rgba(58, 168, 255, 0.045));
        }
        .footer-state-chip--active .footer-state-chip__value,
        .footer-state-chip--count .footer-state-chip__value {
          color: var(--wm-cyan-strong);
        }
        .footer-state-chip--neutral {
          border-color: rgba(214, 168, 79, 0.2);
          background: linear-gradient(180deg, rgba(214, 168, 79, 0.08), rgba(7, 13, 22, 0.36));
        }
        .footer-state-chip--neutral .footer-state-chip__value {
          color: color-mix(in srgb, var(--wm-amber) 70%, var(--wm-text));
        }
        .footer-text {
          margin: 0;
          font-size: 11px;
          color: color-mix(in srgb, var(--wm-muted) 92%, var(--wm-text));
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0 4px;
        }
        .footer-text--credit { font-size: 10.5px; color: var(--wm-subtle); }
        .footer-text--credit strong { color: color-mix(in srgb, var(--wm-muted) 70%, var(--wm-text)); font-weight: 600; }

        .btn-start {
          position: relative;
          overflow: hidden;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 204px;
          padding: 12px 28px;
          border-radius: 999px;
          border: 1px solid rgba(114, 221, 255, 0.78);
          background:
            linear-gradient(90deg, rgba(214, 168, 79, 0.22), transparent 16%, transparent 84%, rgba(214, 168, 79, 0.2)),
            linear-gradient(180deg,
              color-mix(in srgb, var(--wm-cyan-strong) 52%, var(--wm-cyan)) 0%,
              color-mix(in srgb, var(--wm-cyan) 88%, #0b406d) 100%);
          color: #ffffff;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.01em;
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.26),
            inset 0 -12px 28px -22px rgba(0, 0, 0, 0.62),
            0 16px 34px -14px rgba(58, 168, 255, 0.9),
            0 0 0 1px rgba(58, 168, 255, 0.24),
            0 0 26px rgba(58, 168, 255, 0.2);
          transition:
            background-color var(--wm-duration-fast) var(--wm-ease),
            box-shadow var(--wm-duration-hover) var(--wm-ease),
            transform var(--wm-duration-fast) var(--wm-ease);
        }
        .btn-start::before {
          content: "";
          position: absolute;
          inset: 2px;
          border-radius: inherit;
          border: 1px solid rgba(255, 255, 255, 0.16);
          pointer-events: none;
        }
        .btn-start::after {
          content: "";
          position: absolute;
          inset-block: 0;
          inline-size: 42%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.36), transparent);
          opacity: 0;
          transform: translateX(-120%);
          pointer-events: none;
        }
        .btn-start__icon {
          position: relative;
          z-index: 1;
          width: 24px;
          height: 24px;
          display: inline-grid;
          place-items: center;
          border-radius: 50%;
          color: #ffffff;
          background: rgba(255, 255, 255, 0.13);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 14px rgba(255, 255, 255, 0.12);
          flex: 0 0 auto;
        }
        .btn-start__icon svg { width: 15px; height: 15px; }
        .btn-start__label {
          position: relative;
          z-index: 1;
        }
        .btn-start:hover {
          transform: none;
          background:
            linear-gradient(90deg, rgba(214, 168, 79, 0.28), transparent 16%, transparent 84%, rgba(214, 168, 79, 0.24)),
            linear-gradient(180deg,
              color-mix(in srgb, var(--wm-cyan-strong) 62%, var(--wm-cyan)) 0%,
              color-mix(in srgb, var(--wm-cyan) 93%, #0c4d82) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.3),
            inset 0 -12px 28px -22px rgba(0, 0, 0, 0.55),
            0 18px 34px -12px rgba(58, 168, 255, 0.96),
            0 0 0 1px rgba(114, 221, 255, 0.34),
            0 0 30px rgba(58, 168, 255, 0.42);
        }
        .btn-start:hover::after { opacity: 1; animation: wmSweep var(--wm-duration-sweep) ease-out both; }
        .btn-start:active { transform: translateY(0) scale(0.99); }
        .btn-start:focus-visible {
          outline: none;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.9),
            0 0 0 4px rgba(58, 168, 255, 0.38),
            0 0 0 7px rgba(214, 168, 79, 0.14),
            0 14px 30px -14px rgba(58, 168, 255, 0.9);
        }

        /* ───────── Section orbit navigation ───────── */

        .welcome-modal__section-orbit {
          position: absolute;
          z-index: 4;
          top: 50%;
          right: clamp(28px, 5.5%, 68px);
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 7px;
          width: var(--wm-orbit-nav-width);
          animation: wmRevealOrbit 520ms var(--wm-ease) 520ms both;
        }
        .welcome-modal__section-orbit::before {
          content: "";
          position: absolute;
          right: 6px;
          top: -18px;
          bottom: -18px;
          width: 48px;
          border-right: 1px solid rgba(114, 221, 255, 0.16);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.78;
          box-shadow: inset -8px 0 18px -18px rgba(114, 221, 255, 0.6);
        }
        @keyframes wmRevealOrbit {
          from { opacity: 0; transform: translateY(-50%) translateX(10px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
        .section-dot {
          --section-dot-offset: 0px;
          width: var(--wm-orbit-nav-width);
          height: 24px;
          display: grid;
          grid-template-columns: 12px 1fr;
          align-items: center;
          gap: 7px;
          padding: 0 8px;
          border-radius: 999px;
          border: 1px solid rgba(136, 176, 218, 0.14);
          background: rgba(7, 13, 22, 0.42);
          color: color-mix(in srgb, var(--wm-muted) 86%, var(--wm-text));
          cursor: pointer;
          opacity: 0.6;
          text-align: left;
          transform: translateX(var(--section-dot-offset));
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition:
            opacity var(--wm-duration-fast) var(--wm-ease),
            transform var(--wm-duration-fast) var(--wm-ease),
            background-color var(--wm-duration-fast) var(--wm-ease),
            border-color var(--wm-duration-fast) var(--wm-ease),
            color var(--wm-duration-fast) var(--wm-ease);
        }
        .section-dot:nth-child(1) { --section-dot-offset: 17px; }
        .section-dot:nth-child(2) { --section-dot-offset: 6px; }
        .section-dot:nth-child(3) { --section-dot-offset: 0px; }
        .section-dot:nth-child(4) { --section-dot-offset: 6px; }
        .section-dot:nth-child(5) { --section-dot-offset: 17px; }
        .section-dot:hover,
        .section-dot:focus-visible,
        .section-dot.is-active {
          opacity: 1;
          transform: translateX(calc(var(--section-dot-offset) - 4px));
          background: rgba(17, 31, 48, 0.72);
          border-color: rgba(114, 221, 255, 0.34);
          color: var(--wm-text);
        }
        .section-dot:focus-visible {
          outline: none;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.72), 0 0 0 4px rgba(58, 168, 255, 0.22);
        }
        .section-dot__marker {
          position: relative;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(114, 221, 255, 0.38);
          box-shadow: 0 0 0 1px rgba(114, 221, 255, 0.16);
        }
        .section-dot__marker::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 1px solid rgba(114, 221, 255, 0.12);
          opacity: 0;
          transform: scale(0.8);
          transition: opacity var(--wm-duration-fast) var(--wm-ease), transform var(--wm-duration-fast) var(--wm-ease);
        }
        .section-dot.is-active .section-dot__marker {
          background: var(--wm-cyan-strong);
          box-shadow: 0 0 0 1px rgba(114, 221, 255, 0.42), 0 0 12px rgba(58, 168, 255, 0.56);
        }
        .section-dot.is-active .section-dot__marker::after,
        .section-dot:hover .section-dot__marker::after,
        .section-dot:focus-visible .section-dot__marker::after {
          opacity: 1;
          transform: scale(1);
        }
        .section-dot__label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: var(--hdr-font-mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace);
          font-size: 8.5px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ───────── Responsive: circle → capsule ───────── */

        @media (max-width: 900px) {
          .welcome-modal { --wm-col-max: calc(var(--wm-disc) * 0.74); }
          .welcome-disc__brand { width: min(82%, 560px); }
          .welcome-disc__footer { width: min(74%, 480px); }
          .welcome-modal__section-orbit { display: none; }
        }

        /* Short viewports: reclaim vertical space so more content is visible
           at once between the brand and the always-anchored footer. */
        @media (max-height: 860px) {
          .welcome-modal__panel { padding: clamp(16px, 3.5%, 34px) 0 clamp(14px, 3%, 28px); }
          .welcome-disc__brand { gap: 6px; padding-top: 0; }
          .brand-subtitle { font-size: 12px; }
          .brand-metrics { margin-top: 2px; }
          .metric-chip { padding: 6px 12px; }
          .welcome-disc__scroll { margin: 6px 0 2px; }
          .welcome-section { padding: 13px 15px; }
          .section-icon { width: 28px; height: 28px; }
          .section-icon svg { width: 16px; height: 16px; }
          .section-text { font-size: 11.75px; line-height: 1.5; }
          .mission-step { min-height: 28px; font-size: 8.75px; }
          .feature-card { min-height: 148px; }
          .feature-card--compact { min-height: 126px; }
          .welcome-disc__hint,
          .footer-text--credit {
            display: none;
          }
          .footer-state-chip {
            padding-inline: 6px;
            font-size: 7.5px;
          }
          .welcome-disc__footer { gap: 8px; padding-top: 8px; }
          .btn-start { padding-block: 10px; }
        }

        @media (max-height: 760px) {
          .mission-flow { display: none; }
        }

        @media (max-width: 560px) {
          .welcome-modal { padding: 12px; }
          .welcome-modal__disc-wrap {
            width: calc(100vw - 24px);
            height: auto;
            aspect-ratio: auto;
            max-height: 92vh;
            display: flex;
          }
          .welcome-modal__halo { border-radius: 32px; inset: -4%; }
          .welcome-modal__panel {
            border-radius: 32px;
            height: auto;
            max-height: 92vh;
            clip-path: none !important;
            padding: 22px 0 18px;
            animation: wmCapsuleIn var(--wm-duration-panel) var(--wm-ease);
          }
          .welcome-modal--closing .welcome-modal__panel { animation: wmCapsuleOut var(--wm-duration-exit) var(--wm-ease-firm) forwards; }
          .welcome-modal__atmosphere,
          .welcome-modal__panel::before { border-radius: 32px; }
          .welcome-modal__rings,
          .welcome-modal__radar,
          .welcome-modal__polar-grid,
          .welcome-modal__progress,
          .welcome-modal__section-orbit { display: none; }
          .welcome-disc__brand { width: calc(100% - 36px); }
          .brand-title {
            flex-wrap: wrap;
            gap: 2px 8px;
            font-size: clamp(28px, 8vw, 32px);
            line-height: 1.22;
          }
          .brand-title__primary {
            flex: 1 1 100%;
            max-width: 100%;
          }
          .brand-title__sep { display: none; }
          .brand-title__secondary { flex: 0 1 auto; }
          .brand-chip {
            flex: 0 0 auto;
            padding: 3px 8px;
            font-size: 10px;
          }
          .welcome-disc__footer { width: calc(100% - 36px); }
          .welcome-disc__col { width: calc(100% - 32px); }
          .mission-flow,
          .guardrail-grid,
          .features-grid,
          .launch-grid {
            grid-template-columns: 1fr;
          }
          .mission-flow { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .mission-step:not(:last-child)::after { display: none; }
          .workbench-triad { flex-direction: column; gap: 11px; }
          .triad-link { display: none; }
          .evidence-facts { gap: 6px; }
          .evidence-fact { flex: 1 1 calc(50% - 6px); justify-content: center; text-align: center; }
          .footer-text--credit { display: none; }
          .btn-start { width: 100%; }
          .welcome-disc__hint { display: none; }
        }
        @keyframes wmCapsuleIn {
          from { opacity: 0; transform: translateY(26px) scale(.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes wmCapsuleOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(26px) scale(.95); }
        }

        @media (max-width: 380px) {
          .brand-title { font-size: clamp(24px, 8vw, 32px); }
          .brand-subtitle { font-size: 12px; }
        }

        /* ───────── Reduced motion ───────── */

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
          .welcome-modal__orbit-nodes,
          .welcome-modal__flow-canvas,
          .brand-logo__ring,
          .brand-logo__ticks,
          .brand-logo__glint {
            display: none !important;
          }
          /* Scroll hint stays visible (static) so reduced-motion users still
             perceive more content; the bob animation is frozen by the rule above. */
          .welcome-modal__rings { opacity: 0.4; }
          .welcome-modal__panel {
            clip-path: none !important;
            transform: none !important;
            animation: wmFadeIn var(--wm-duration-enter) ease-out !important;
          }
          .welcome-disc__brand > *,
          .welcome-disc__col > *,
          .welcome-disc__footer,
          .welcome-modal__section-orbit,
          .welcome-modal__progress {
            transform: none !important;
            animation-name: wmFadeIn !important;
          }
          .welcome-modal__panel.is-cta-armed::after,
          .btn-start::after {
            opacity: 0 !important;
            animation: none !important;
          }
          .btn-start:hover,
          .btn-start:active {
            transform: none !important;
          }
          .progress-ring--value,
          .progress-ring--accent {
            transition: none !important;
          }
          .welcome-modal--closing .welcome-modal__panel {
            animation: wmFadeOut var(--wm-duration-exit) ease-in forwards !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WelcomeModal;
