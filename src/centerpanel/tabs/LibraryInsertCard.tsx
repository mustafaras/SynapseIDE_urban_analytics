/**
 * LibraryInsertCard — Insert methodology content from the right-panel library into the active report slot.
 *
 * Appears in NoteRail. Based on the active report slot, it recommends matching
 * cards from the methods library and lets users insert methodology text, tool references,
 * or dataset info directly into the report with one click.
 */

import React, { useMemo, useState } from 'react';
import styles from '../styles/note.module.css';
import { usePanelBridgeStore } from '../../stores/usePanelBridgeStore';
import { useUrbanStore } from '../../features/urbanAnalytics/store';
import type { SlotKey } from '../../stores/useNoteStore';

interface CardLite {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  sectionId?: string;
  methodology?: string;
  tools?: string[];
  datasets?: string[];
}

// Slot → relevant section IDs
const SLOT_SECTIONS: Record<string, string[]> = {
  objective: ['project_scoping', 'baseline_assessment'],
  methodology: ['spatial_stats', 'gis_methods', 'network_analysis', 'remote_sensing', 'data_engineering'],
  findings: ['urban_indicators', 'spatial_stats', 'kpi_dashboard'],
  recommendations: ['policy_instruments', 'intervention_design', 'stakeholder_engagement'],
  dataRefs: ['data_engineering', 'remote_sensing'],
  limitations: ['spatial_stats', 'gis_methods'],
};

// Slot → keywords
const SLOT_KEYWORDS: Record<string, string[]> = {
  objective: ['objective', 'scope', 'research', 'question', 'study area'],
  methodology: ['method', 'analysis', 'regression', 'classification', 'spatial', 'statistic'],
  findings: ['result', 'indicator', 'index', 'metric', 'score', 'clustering'],
  recommendations: ['policy', 'recommendation', 'intervention', 'equity', 'improve'],
  dataRefs: ['data', 'dataset', 'source', 'sentinel', 'osm', 'census', 'raster'],
  limitations: ['limitation', 'uncertainty', 'assumption', 'bias', 'caveat'],
};

function getSlotRelevantCards(
  slotKey: string,
  allCards: CardLite[],
  maxCards = 5,
): CardLite[] {
  if (!allCards.length) return [];
  const sections = new Set(SLOT_SECTIONS[slotKey] ?? []);
  const keywords = SLOT_KEYWORDS[slotKey] ?? [];

  type Scored = CardLite & { _s: number };
  const scored: Scored[] = allCards.map((c) => {
    let s = 0;
    if (c.sectionId && sections.has(c.sectionId)) s += 3;
    const hay = `${c.title} ${c.summary} ${c.methodology ?? ''}`.toLowerCase();
    for (const kw of keywords) {
      if (hay.includes(kw)) s += 1;
    }
    return { ...c, _s: s };
  });

  return scored
    .filter((c) => c._s > 0)
    .sort((a, b) => b._s - a._s)
    .slice(0, maxCards);
}

function buildInsertText(card: CardLite, slotKey: string): string {
  if (slotKey === 'methodology' && card.methodology) {
    const toolLine = card.tools?.length ? `\nTools: ${card.tools.join(', ')}.` : '';
    return `${card.title}: ${card.methodology}${toolLine}`;
  }
  if (slotKey === 'dataRefs') {
    const dsLine = card.datasets?.length ? card.datasets.join('; ') : '';
    const toolLine = card.tools?.length ? `Tools: ${card.tools.join(', ')}.` : '';
    return `${card.title} — ${dsLine || card.summary}${toolLine ? ` ${  toolLine}` : ''}`;
  }
  if (slotKey === 'findings') {
    return `[${card.title}] ${card.summary}`;
  }
  return `${card.title}: ${card.summary}`;
}

const LibraryInsertCard: React.FC<{
  activeSlot: SlotKey;
  canEdit: boolean;
  onInsert: (text: string) => void;
}> = ({ activeSlot, canEdit, onInsert }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [justInserted, setJustInserted] = useState<string | null>(null);

  const visibleCardsFn = useUrbanStore((s) => s.visibleCards);
  const selectCard = useUrbanStore((s) => s.selectCard);

  const allCards: CardLite[] = useMemo(() => {
    try {
      return (visibleCardsFn?.() ?? []) as CardLite[];
    } catch {
      return [];
    }
  }, [visibleCardsFn]);

  const relevant = useMemo(
    () => getSlotRelevantCards(activeSlot, allCards),
    [activeSlot, allCards],
  );

  const handleInsert = (card: CardLite) => {
    const text = buildInsertText(card, activeSlot);
    onInsert(text);
    usePanelBridgeStore.getState().recordInsertedCard(card.id);
    setJustInserted(card.id);
    setTimeout(() => setJustInserted(null), 1500);
  };

  if (relevant.length === 0) return null;

  return (
    <div className={styles.railCard} role="group" aria-label="Library Insert">
      <div className={styles.railTitleRow}>
        <div className={styles.railTitle}>
          From Methods Library
        </div>
        <button
          className={styles.railToggle}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((v) => !v)}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>

      <div className={styles.railBody} hidden={!isOpen}>
        <div
          style={{
            fontSize: '0.66rem',
            color: 'rgba(255,255,255,0.45)',
            padding: '0 2px 6px',
            lineHeight: 1.35,
          }}
        >
          Cards matching the active "{activeSlot}" section. Click to insert, or view in right panel.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {relevant.map((card) => {
            const isInserted = justInserted === card.id;
            return (
              <div
                key={card.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  padding: '5px 6px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: isInserted
                    ? 'rgba(245,158,11,0.1)'
                    : 'rgba(255,255,255,0.02)',
                  transition: 'background 200ms ease',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => {
                      try {
                        selectCard(card.id);
                      } catch { /* noop */ }
                    }}
                    style={{
                      display: 'block',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'rgba(250,250,249,0.85)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textAlign: 'left',
                      lineHeight: 1.3,
                      fontFamily: 'inherit',
                    }}
                    title={`View "${card.title}" in the right panel`}
                  >
                    {card.title}
                  </button>
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: 'rgba(255,255,255,0.35)',
                      lineHeight: 1.3,
                      marginTop: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {card.summary.length > 80 ? `${card.summary.slice(0, 80)  }...` : card.summary}
                  </div>
                </div>
                <button
                  onClick={() => handleInsert(card)}
                  disabled={!canEdit}
                  style={{
                    flexShrink: 0,
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid rgba(245,158,11,0.3)',
                    background: isInserted
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(245,158,11,0.08)',
                    color: isInserted ? '#F59E0B' : 'rgba(245,158,11,0.8)',
                    cursor: canEdit ? 'pointer' : 'default',
                    opacity: canEdit ? 1 : 0.4,
                    fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                    transition: 'all 150ms ease',
                  }}
                  title={`Insert ${card.title} content into ${activeSlot}`}
                >
                  {isInserted ? 'Inserted' : 'Insert'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LibraryInsertCard;
