/**
 * NarrativeGenerationPanel — analytical narrative drafting surface for any
 * result view. Drives `ReportNarrativeGenerator`, supports tone switching with
 * a live preview, per-section accept/reject/edit workflow, and an
 * "Add to Report" action that writes generated prose into the Note
 * (report) slots used by the reporting engine.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  editSectionText,
  generateNarrativeReport,
  NARRATIVE_TONES,
  type NarrativeInput,
  type NarrativeReport,
  type NarrativeSection,
  type NarrativeTone,
  type SectionStatus,
  serializeForReport,
  setSectionStatus,
  TONE_DESCRIPTORS,
} from '@/engine/geoai/nlp/ReportNarrativeGenerator';
import { buildPendingInsertFromNarrativeReport } from '@/services/reporting/AutoNarrative';
import { enqueuePendingInsert } from '@/services/reporting/storage';
import type { ReportCitationRecord } from '@/services/reporting/types';

/* ── Tokens ──────────────────────────────────────────── */

const PANEL: React.CSSProperties = {
  background: '#1a1a1a',
  border: '1px solid rgba(245, 158, 11, 0.2)',
  padding: '1.25rem',
  color: '#e5e5e5',
  fontSize: '0.78rem',
  lineHeight: 1.45,
};

/* ══════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════ */

interface NarrativeGenerationPanelProps {
  /** Structured analysis result to narrate. */
  input?: NarrativeInput | undefined;
  /** Label surfaced in the header; falls back to input.analysisTitle. */
  subject?: string | undefined;
  /** Optional empty-state helper shown when no structured result is available. */
  emptyStateMessage?: string | undefined;
}

export const NarrativeGenerationPanel: React.FC<NarrativeGenerationPanelProps> = ({
  input,
  subject,
  emptyStateMessage,
}) => {
  const effectiveInput = input ?? null;
  const [tone, setTone] = useState<NarrativeTone>('academic');
  const [report, setReport] = useState<NarrativeReport | null>(null);
  const [insertedFlash, setInsertedFlash] = useState<null | 'ok' | 'error'>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!effectiveInput) return;
    try {
      const next = generateNarrativeReport(effectiveInput, { tone });
      setReport(next);
      setEditingId(null);
    } catch (_err) {
      setReport(null);
      setInsertedFlash('error');
    }
  }, [effectiveInput, tone]);

  // Re-generate when tone changes after an initial generation, so the preview updates live.
  useEffect(() => {
    if (!report || !effectiveInput) return;
    setReport(generateNarrativeReport(effectiveInput, { tone }));
    setEditingId(null);
  }, [effectiveInput, report, tone]);

  const updateSection = (id: string, next: NarrativeSection) => {
    setReport((prev) => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.map((s) => (s.id === id ? next : s)) };
    });
  };

  const insertToReport = useCallback(() => {
    if (!report) return;
    const citations: ReportCitationRecord[] = report.citations.map((citation) => {
      const yearMatch = citation.reference.match(/\b(19|20)\d{2}\b/);
      const nextCitation: ReportCitationRecord = {
        id: citation.id,
        type: 'report',
        title: citation.reference,
        authors: [{ family: citation.label, given: '' }],
        year: yearMatch ? Number(yearMatch[0]) : new Date().getFullYear(),
      };
      if (citation.uri) {
        nextCitation.url = citation.uri;
      }
      return nextCitation;
    });
    const suggestedTitle = subject ?? effectiveInput?.analysisTitle;
    const pendingInsert = suggestedTitle
      ? {
          source: subject ?? effectiveInput?.analysisTitle ?? 'narrative-panel',
          report,
          citations,
          suggestedTitle,
        }
      : {
          source: subject ?? effectiveInput?.analysisTitle ?? 'narrative-panel',
          report,
          citations,
        };
    enqueuePendingInsert(buildPendingInsertFromNarrativeReport(pendingInsert));
    window.dispatchEvent(new CustomEvent('reporting/pending-changed'));
    window.dispatchEvent(new CustomEvent('synapse:navigate', { detail: { tab: 'Report' } }));
    setInsertedFlash('ok');
    window.setTimeout(() => setInsertedFlash(null), 1800);
  }, [effectiveInput?.analysisTitle, report, subject]);

  const title = subject ?? effectiveInput?.analysisTitle ?? 'Narrative drafting';

  return (
    <section style={PANEL} aria-labelledby="narrative-heading">
      <header style={{ marginBottom: '0.75rem' }}>
        <h3
          id="narrative-heading"
          style={{ color: '#F59E0B', margin: 0, fontSize: '0.95rem', fontWeight: 700, letterSpacing: '0.03em' }}
        >
          Analytical Narrative Drafting
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', margin: '0.25rem 0 0 0' }}>
          Draft report-ready prose for <span style={{ color: '#FAFAF9' }}>{title}</span> from structured findings,
          comparisons, trends, and method notes. Every generated section remains traceable to the source claims
          used by the reporting engine.
        </p>
      </header>

      {!effectiveInput ? (
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            background: '#0d0d0d',
            padding: '0.85rem 0.9rem',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '0.74rem',
          }}
        >
          {emptyStateMessage ?? 'Narrative drafting becomes available once this view exposes a structured result package. Run the analysis or open a saved completed run to continue.'}
        </div>
      ) : (
        <>
          <ToneSelector tone={tone} onChange={setTone} />

          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={generate}
              style={{
                padding: '0.4rem 0.9rem',
                background: 'rgba(245,158,11,0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.5)',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {report ? 'Redraft Narrative' : 'Draft Narrative'}
            </button>
            {report ? (
              <button
                type="button"
                onClick={insertToReport}
                style={{
                  padding: '0.4rem 0.9rem',
                  background: 'rgba(52,211,153,0.12)',
                  color: '#34D399',
                  border: '1px solid rgba(52,211,153,0.4)',
                  fontSize: '0.76rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: 0,
                }}
              >
                Add to Report
              </button>
            ) : null}
            {insertedFlash === 'ok' && (
              <span style={{ fontSize: '0.72rem', color: '#34D399' }} role="status">
                Added to report builder
              </span>
            )}
            {insertedFlash === 'error' && (
              <span style={{ fontSize: '0.72rem', color: '#FB7185' }} role="alert">
                Narrative generation failed
              </span>
            )}
          </div>

          {report ? (
            <>
              {report.warnings.length > 0 && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ color: '#F59E0B', fontSize: '0.7rem', fontWeight: 600, marginBottom: 4 }}>
                    Generation notes
                  </div>
                  <ul style={{ margin: '0 0 0 1rem', color: '#F59E0B', fontSize: '0.72rem' }}>
                    {report.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {report.sections.map((section) => (
                  <NarrativeSectionCard
                    key={section.id}
                    section={section}
                    isEditing={editingId === section.id}
                    onEditStart={() => setEditingId(section.id)}
                    onEditCancel={() => setEditingId(null)}
                    onCommit={(next) => {
                      updateSection(section.id, next);
                      setEditingId(null);
                    }}
                    onStatusChange={(status) =>
                      updateSection(section.id, setSectionStatus(section, status))
                    }
                  />
                ))}
                {report.sections.length === 0 && (
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem' }}>
                    No narrative sections could be drafted from the current result package.
                  </p>
                )}
              </div>

              {report.citations.length > 0 && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
                    Citation list
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)' }}>
                    {report.citations.map((c) => (
                      <li key={c.id}>
                        <strong style={{ color: '#F59E0B' }}>[{c.label}]</strong> {c.reference}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <details style={{ marginTop: '0.75rem' }}>
                <summary style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                  Insertion preview
                </summary>
                <pre
                  style={{
                    marginTop: 6,
                    background: '#0d0d0d',
                    padding: 8,
                    fontSize: '0.7rem',
                    whiteSpace: 'pre-wrap',
                    color: 'rgba(255,255,255,0.75)',
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  {serializeForReport(report)}
                </pre>
              </details>
            </>
          ) : null}
        </>
      )}
    </section>
  );
};

export default NarrativeGenerationPanel;

/* ══════════════════════════════════════════════════════
   Tone selector
   ══════════════════════════════════════════════════════ */

const ToneSelector: React.FC<{ tone: NarrativeTone; onChange: (t: NarrativeTone) => void }> = ({
  tone,
  onChange,
}) => {
  const descriptor = TONE_DESCRIPTORS[tone];
  return (
    <div>
      <div
        role="radiogroup"
        aria-label="Narrative voice"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
      >
        {NARRATIVE_TONES.map((t) => {
          const active = t === tone;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(t)}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: active ? 'rgba(245,158,11,0.15)' : 'transparent',
                color: active ? '#F59E0B' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${active ? '#F59E0B' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer',
                borderRadius: 0,
              }}
            >
              {TONE_DESCRIPTORS[t].label}
            </button>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 6,
          padding: '6px 8px',
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.7rem',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <div style={{ color: '#F59E0B', fontWeight: 600, marginBottom: 2 }}>
          Voice: {descriptor.label} · <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{descriptor.audience}</span>
        </div>
        <div style={{ fontStyle: 'italic', marginBottom: 3 }}>&ldquo;{descriptor.preview}&rdquo;</div>
        <div style={{ fontSize: '0.66rem', color: 'rgba(255,255,255,0.45)' }}>
          {descriptor.characteristics.join(' · ')}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   Section card (with highlighted citation anchors + inline edit)
   ══════════════════════════════════════════════════════ */

const STATUS_COLORS: Record<SectionStatus, string> = {
  draft: 'rgba(255,255,255,0.3)',
  accepted: '#34D399',
  rejected: '#FB7185',
};

const NarrativeSectionCard: React.FC<{
  section: NarrativeSection;
  isEditing: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onCommit: (next: NarrativeSection) => void;
  onStatusChange: (status: SectionStatus) => void;
}> = ({ section, isEditing, onEditStart, onEditCancel, onCommit, onStatusChange }) => {
  const [draft, setDraft] = useState(section.text);

  // Reset local draft when the section resets (tone change, regenerate).
  useEffect(() => {
    setDraft(section.text);
  }, [section.text, section.id]);

  return (
    <article
      style={{
        border: `1px solid ${section.status === 'rejected' ? 'rgba(251,113,133,0.3)' : 'rgba(255,255,255,0.08)'}`,
        padding: '0.6rem 0.75rem',
        background: section.status === 'rejected' ? 'rgba(251,113,133,0.04)' : 'rgba(255,255,255,0.02)',
        opacity: section.status === 'rejected' ? 0.6 : 1,
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 600, color: '#FAFAF9' }}>
          <span style={{ color: STATUS_COLORS[section.status], marginRight: 6 }}>●</span>
          {section.title}
          <span style={{ marginLeft: 6, fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {section.kind.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {!isEditing && (
            <>
              <SectionButton onClick={onEditStart}>Edit</SectionButton>
              <SectionButton onClick={() => onStatusChange('accepted')} active={section.status === 'accepted'}>
                Accept
              </SectionButton>
              <SectionButton onClick={() => onStatusChange('rejected')} active={section.status === 'rejected'}>
                Reject
              </SectionButton>
            </>
          )}
          {!!isEditing && <>
              <SectionButton
                onClick={() => {
                  onCommit(editSectionText(section, draft));
                }}
              >
                Save
              </SectionButton>
              <SectionButton
                onClick={() => {
                  setDraft(section.text);
                  onEditCancel();
                }}
              >
                Cancel
              </SectionButton>
            </>}
        </div>
      </header>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.max(3, Math.ceil(draft.length / 90))}
          style={{
            width: '100%',
            background: '#0d0d0d',
            color: '#FAFAF9',
            border: '1px solid rgba(245,158,11,0.3)',
            padding: '6px 8px',
            fontSize: '0.75rem',
            fontFamily: 'inherit',
            lineHeight: 1.45,
            resize: 'vertical',
          }}
        />
      ) : (
        <p style={{ margin: 0, fontSize: '0.77rem', color: 'rgba(255,255,255,0.85)' }}>
          {renderWithAnchors(section)}
        </p>
      )}

      {section.warnings && section.warnings.length > 0 ? (
        <ul style={{ margin: '6px 0 0 1rem', color: '#F59E0B', fontSize: '0.68rem' }}>
          {section.warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      ) : null}

      {section.sourceFields.length > 0 ? (
        <div style={{ marginTop: 4, fontSize: '0.64rem', color: 'rgba(255,255,255,0.4)' }}>
          Source: {section.sourceFields.join(' · ')}
        </div>
      ) : null}
    </article>
  );
};

function renderWithAnchors(section: NarrativeSection): React.ReactNode {
  if (section.citationAnchors.length === 0) return <>{section.text}</>;
  const nodes: React.ReactNode[] = [];
  const sorted = [...section.citationAnchors].sort((a, b) => a.start - b.start);
  let cursor = 0;
  sorted.forEach((anchor, i) => {
    if (anchor.start > cursor) {
      nodes.push(section.text.slice(cursor, anchor.start));
    }
    nodes.push(
      <span
        key={`${anchor.citationId}-${i}`}
        title={`Citation: ${anchor.citationId}`}
        style={{
          background: 'rgba(245,158,11,0.2)',
          color: '#F59E0B',
          padding: '0 3px',
          borderRadius: 2,
          fontWeight: 600,
        }}
      >
        {section.text.slice(anchor.start, anchor.end)}
      </span>,
    );
    cursor = anchor.end;
  });
  if (cursor < section.text.length) {
    nodes.push(section.text.slice(cursor));
  }
  return nodes;
}

const SectionButton: React.FC<{
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}> = ({ onClick, active, children }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      padding: '2px 8px',
      fontSize: '0.66rem',
      fontWeight: 600,
      background: active ? 'rgba(245,158,11,0.18)' : 'transparent',
      color: active ? '#F59E0B' : 'rgba(255,255,255,0.7)',
      border: `1px solid ${active ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`,
      cursor: 'pointer',
      borderRadius: 0,
    }}
  >
    {children}
  </button>
);
