import React, { useMemo, useState } from 'react';
import { FileCode2, Search, ListTree, AlertCircle } from 'lucide-react';
import styled from 'styled-components';
import {
  type OutlineSymbol,
  flattenOutlineSymbols,
  useOutlineStore,
} from '@/stores/outlineStore';

interface OutlinePaneProps {
  tabId: string | null;
  fileName?: string;
  onJumpToSymbol: (symbol: OutlineSymbol) => void;
}

const Root = styled.section`
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  color: var(--ide-text-primary);
  background: var(--ide-bg-panel);
`;

const Header = styled.div`
  flex: 0 0 auto;
  display: grid;
  gap: 8px;
  padding: 10px;
  border-bottom: 1px solid var(--ide-border-subtle);
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ide-text-primary);
  font: 700 12px/1.2 var(--font-code);
`;

const Kicker = styled.div`
  color: var(--syn-interaction-active, var(--ide-accent));
  font: 700 10px/1 var(--font-code);
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const InputWrap = styled.label`
  height: 30px;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  border-radius: var(--ide-radius-sm);
  background: var(--ide-bg-control);
  color: var(--ide-text-muted);
`;

const FilterInput = styled.input`
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--ide-text-primary);
  font: 600 11px/1.2 var(--font-code);

  &::placeholder {
    color: var(--ide-text-muted);
  }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--ide-text-muted);
  font: 600 10px/1.2 var(--font-code);
`;

const SourcePill = styled.span`
  flex: 0 0 auto;
  padding: 2px 6px;
  border-radius: var(--ide-radius-pill);
  background: var(--ide-bg-control);
  color: var(--ide-text-secondary);
  text-transform: uppercase;
`;

const List = styled.div`
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 6px;
`;

const SymbolButton = styled.button<{ $depth: number }>`
  width: 100%;
  min-height: 28px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  padding: 4px 6px 4px ${({ $depth }) => 6 + $depth * 12}px;
  border: none;
  border-radius: var(--ide-radius-sm);
  background: transparent;
  color: var(--ide-text-secondary);
  cursor: pointer;
  text-align: left;
  font: 600 11px/1.2 var(--font-code);

  &:hover,
  &:focus-visible {
    color: var(--ide-text-primary);
    background: color-mix(in srgb, var(--syn-interaction-hover, var(--ide-bg-control-hover)) 75%, transparent);
    outline: none;
  }
`;

const SymbolName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SymbolMeta = styled.span`
  color: var(--ide-text-muted);
  font: 700 10px/1 var(--font-code);
  text-transform: uppercase;
`;

const StateBlock = styled.div`
  display: grid;
  gap: 8px;
  padding: 12px 10px;
  color: var(--ide-text-muted);
  font: 500 12px/1.45 var(--font-code);
`;

const StateTitle = styled.strong`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: var(--ide-text-primary);
  font-size: 12px;
`;

function filterTree(symbols: OutlineSymbol[], query: string): OutlineSymbol[] {
  const q = query.trim().toLowerCase();
  if (!q) return symbols;
  const visit = (items: OutlineSymbol[]): OutlineSymbol[] =>
    items
      .map(symbol => {
        const children = symbol.children ? visit(symbol.children) : [];
        const matches =
          symbol.name.toLowerCase().includes(q) ||
          symbol.kind.toLowerCase().includes(q) ||
          (symbol.detail || '').toLowerCase().includes(q);
        if (!matches && children.length === 0) return null;
        return children.length ? { ...symbol, children } : symbol;
      })
      .filter((symbol): symbol is OutlineSymbol => Boolean(symbol));
  return visit(symbols);
}

function renderSymbols(
  symbols: OutlineSymbol[],
  depth: number,
  onJumpToSymbol: (symbol: OutlineSymbol) => void
): React.ReactNode {
  return symbols.map(symbol => (
    <React.Fragment key={symbol.id}>
      <SymbolButton
        type="button"
        $depth={depth}
        onClick={() => onJumpToSymbol(symbol)}
        title={`${symbol.name} (${symbol.kind}) line ${symbol.selectionRange.startLine}`}
      >
        <SymbolName>{symbol.name}</SymbolName>
        <SymbolMeta>
          {symbol.kind} · {symbol.selectionRange.startLine}
        </SymbolMeta>
      </SymbolButton>
      {symbol.children?.length ? renderSymbols(symbol.children, depth + 1, onJumpToSymbol) : null}
    </React.Fragment>
  ));
}

export const OutlinePane: React.FC<OutlinePaneProps> = ({ tabId, fileName, onJumpToSymbol }) => {
  const [filter, setFilter] = useState('');
  const entry = useOutlineStore(state => (tabId ? state.byTabId[tabId] : undefined));
  const visibleSymbols = useMemo(() => filterTree(entry?.symbols ?? [], filter), [entry?.symbols, filter]);
  const flatCount = useMemo(() => flattenOutlineSymbols(entry?.symbols ?? []).length, [entry?.symbols]);
  const visibleCount = useMemo(() => flattenOutlineSymbols(visibleSymbols).length, [visibleSymbols]);
  const sourceLabel = entry?.source === 'monaco' ? 'Monaco' : entry?.source === 'heuristic' ? 'Limited' : 'None';

  const stateTitle =
    !tabId ? 'No Active File' :
    !entry ? 'Outline Pending' :
    entry.status === 'loading' ? 'Reading Symbols' :
    entry.status === 'unsupported' ? 'Unsupported Language' :
    entry.status === 'error' ? 'Outline Error' :
    entry.status === 'empty' ? 'No Symbols' :
    'Symbols';

  return (
    <Root aria-label="Symbol outline">
      <Header>
        <Kicker>Outline</Kicker>
        <TitleRow>
          <ListTree size={15} aria-hidden="true" />
          <Title title={fileName || entry?.path || 'No active file'}>{fileName || entry?.path || 'No active file'}</Title>
        </TitleRow>
        <InputWrap>
          <Search size={13} aria-hidden="true" />
          <FilterInput
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filter symbols"
            aria-label="Filter symbols"
            disabled={!entry || entry.symbols.length === 0}
          />
        </InputWrap>
        <Meta>
          <span>{visibleCount} / {flatCount} symbols</span>
          <SourcePill>{sourceLabel}</SourcePill>
        </Meta>
      </Header>
      <List>
        {entry?.status === 'ready' && visibleSymbols.length > 0 ? (
          renderSymbols(visibleSymbols, 0, onJumpToSymbol)
        ) : (
          <StateBlock role="status">
            <StateTitle>
              {entry?.status === 'error' || entry?.status === 'unsupported' ? (
                <AlertCircle size={14} aria-hidden="true" />
              ) : (
                <FileCode2 size={14} aria-hidden="true" />
              )}
              {stateTitle}
            </StateTitle>
            <span>
              {entry?.message ||
                'Open a file in the editor; the outline updates from the active Monaco model when a provider is available.'}
            </span>
          </StateBlock>
        )}
      </List>
    </Root>
  );
};

export default OutlinePane;
