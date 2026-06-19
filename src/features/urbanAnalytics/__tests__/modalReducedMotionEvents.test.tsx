// @vitest-environment jsdom

import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { synapseBus } from '@/services/synapseBus';
import type { SynapseBusEventMap } from '@/types/synapse-bus';
import UrbanAnalyticsModal from '../UrbanAnalyticsModal';
import WelcomeModal from '../WelcomeModal';
import { buildFullLibrary } from '../seeds';
import { useUrbanStore } from '../store';

const insertIntoActiveMock = vi.hoisted(() =>
  vi.fn<(opts: { code: string; language?: 'markdown' }) => Promise<{ tabId: string }>>(),
);

const urbanCardFixture = vi.hoisted(() => ({
  id: 'ua-card-1',
  title: 'Transit Equity Audit',
  summary: 'Evaluate transit access gaps for priority neighborhoods.',
  sectionId: 'mobility',
  tags: ['equity', 'transit'],
}));

vi.mock('@/services/editorBridge', () => ({
  default: {
    insertIntoActive: insertIntoActiveMock,
  },
  editorBridge: {
    insertIntoActive: insertIntoActiveMock,
  },
  insertIntoActive: insertIntoActiveMock,
}));

vi.mock('@/hooks/useFocusTrap', () => ({
  useFocusTrap: () => ({
    trapRef: React.createRef<HTMLElement>(),
    activate: vi.fn(),
  }),
}));

vi.mock('@/centerpanel/components/MapExplorerButton', () => ({
  MapExplorerButton: ({ onOpen }: { onOpen: () => void }) =>
    React.createElement('button', { type: 'button', onClick: onOpen }, 'Map'),
}));

vi.mock('@/centerpanel/CenterPanelShell', () => ({
  default: () => React.createElement('div', { 'data-testid': 'center-panel-shell' }, 'Center panel'),
}));

vi.mock('@/centerpanel/OutlineNav', () => ({
  default: () => React.createElement('nav', { 'data-testid': 'outline-nav' }, 'Outline'),
}));

vi.mock('@/utils/lazyWithRetry', () => ({
  ChunkLoadBoundary: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  lazyWithRetry: () => () =>
    React.createElement('div', { 'data-testid': 'right-panel-boundary' }, 'Right panel'),
}));

vi.mock('../seeds/index', () => ({
  buildFullLibrary: () => [urbanCardFixture],
}));

vi.mock('../rail/RailContainer', () => ({
  RailContainer: () => React.createElement('div', { 'data-testid': 'rail-container' }, 'Rail'),
}));

vi.mock('../evidence/UrbanEvidenceTray', () => ({
  UrbanEvidenceTray: () => React.createElement('div', { 'data-testid': 'urban-evidence-tray' }, 'Evidence'),
}));

vi.mock('../StudyAreaPicker', () => ({
  StudyAreaPicker: () => React.createElement('button', { type: 'button' }, 'Study area'),
}));

vi.mock('../context/mapContextAdapter', () => ({
  subscribeMapContextToUrban: () => () => undefined,
}));

vi.mock('../useUrbanContextStore', () => {
  const state = {
    context: null,
    evidenceArtifacts: [],
  };
  const useUrbanContextStore = Object.assign(
    <T,>(selector: (value: typeof state) => T): T => selector(state),
    {
      getState: () => state,
      subscribe: () => () => undefined,
    },
  );
  return {
    useUrbanContextStore,
    useUrbanContextSummary: () => ({
      hasContext: false,
      scale: null,
      flowId: null,
      layerCount: 0,
      runId: null,
      artifactCount: 0,
      fitnessStatus: null,
      hasRestoreWarnings: false,
      restoreWarningCount: 0,
      restoreWarnings: [],
      syncState: 'idle',
    }),
  };
});

type BusEvent = keyof SynapseBusEventMap;
type BusPayload = SynapseBusEventMap[BusEvent];

const NOW = new Date('2026-06-19T12:00:00.000Z');

function setReducedMotion(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn((query: string): MediaQueryList => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  });
}

function installBrowserShims(): void {
  const canvasContext: Partial<CanvasRenderingContext2D> = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    ellipse: vi.fn(),
    stroke: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    lineWidth: 1,
    strokeStyle: '',
    shadowBlur: 0,
    shadowColor: '',
    fillStyle: '',
  };
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: vi.fn((contextId: string) => (
      contextId === '2d' ? canvasContext as CanvasRenderingContext2D : null
    )),
  });
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: vi.fn(() => Promise.resolve()),
    },
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    configurable: true,
    value: (callback: FrameRequestCallback): number =>
      window.setTimeout(() => callback(performance.now()), 16),
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    configurable: true,
    value: (id: number): void => window.clearTimeout(id),
  });
}

function selectedCard() {
  const card = buildFullLibrary()[0];
  if (!card) throw new Error('Urban Analytics library fixture is empty.');
  return card;
}

function prepareUrbanStore(): ReturnType<typeof selectedCard> {
  const card = selectedCard();
  useUrbanStore.setState({
    isOpen: true,
    query: '',
    section: 'all',
    selectedCardId: card.id,
    activeTags: new Set(),
    favOnly: false,
    recMode: false,
    favorites: [],
    recentlyViewedIds: [card.id],
  });
  return card;
}

function renderUrban(onClose = vi.fn()) {
  prepareUrbanStore();
  return {
    onClose,
    ...render(<UrbanAnalyticsModal open onClose={onClose} />),
  };
}

function emittedPayload<T extends BusEvent>(
  emitSpy: ReturnType<typeof vi.spyOn<typeof synapseBus, 'emit'>>,
  eventName: T,
): SynapseBusEventMap[T] {
  const calls = emitSpy.mock.calls as Array<[BusEvent, BusPayload]>;
  const call = calls.find(([type]) => type === eventName);
  if (!call) throw new Error(`Missing bus event: ${eventName}`);
  return call[1] as SynapseBusEventMap[T];
}

afterEach(() => {
  cleanup();
  synapseBus._resetForTesting();
  insertIntoActiveMock.mockReset();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  installBrowserShims();
  setReducedMotion(false);
  insertIntoActiveMock.mockResolvedValue({ tabId: 'tab-1' });
});

describe('MFP-17 reduced-motion close behavior', () => {
  it('closes WelcomeModal immediately when reduced motion is requested', () => {
    setReducedMotion(true);
    const onClose = vi.fn();

    render(<WelcomeModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close welcome modal'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the WelcomeModal close delay for non-reduced motion users', () => {
    const onClose = vi.fn();

    render(<WelcomeModal open onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close welcome modal'));

    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(399));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes UrbanAnalyticsModal immediately when reduced motion is requested', () => {
    setReducedMotion(true);
    const { onClose } = renderUrban();

    fireEvent.click(screen.getByLabelText('Close urban analytics'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the UrbanAnalyticsModal close delay for non-reduced motion users', () => {
    const { onClose } = renderUrban();

    fireEvent.click(screen.getByLabelText('Close urban analytics'));

    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(299));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('MFP-17 Urban Analytics bus actions', () => {
  it('emits typed ID/ref-only events for status-bar shell actions', () => {
    const card = prepareUrbanStore();
    const emitSpy = vi.spyOn(synapseBus, 'emit');
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<UrbanAnalyticsModal open onClose={() => undefined} />);
    fireEvent.click(screen.getByTitle(/Recent items/));
    fireEvent.click(screen.getByTitle(/Refresh recommendations/));
    fireEvent.click(screen.getByTitle('Toggle theme'));
    fireEvent.click(screen.getByTitle(/Keyboard shortcuts/));
    fireEvent.click(screen.getByTitle('Compare with another card'));

    expect(emittedPayload(emitSpy, 'analytics.recent.open')).toMatchObject({
      source: 'urban-analytics',
      requestedAt: NOW.toISOString(),
    });
    expect(emittedPayload(emitSpy, 'analytics.recommendations.refresh')).toMatchObject({
      source: 'urban-analytics',
      requestedAt: NOW.toISOString(),
    });
    expect(emittedPayload(emitSpy, 'ui.theme.toggle')).toMatchObject({
      source: 'urban-analytics',
      requestedAt: NOW.toISOString(),
    });
    expect(emittedPayload(emitSpy, 'ui.shortcuts.open')).toMatchObject({
      source: 'urban-analytics',
      requestedAt: NOW.toISOString(),
    });

    const comparePayload = emittedPayload(emitSpy, 'analytics.compare.open');
    expect(comparePayload).toMatchObject({
      source: 'urban-analytics',
      requestedAt: NOW.toISOString(),
      cardId: card.id,
    });
    expect('plainText' in comparePayload).toBe(false);
    expect('html' in comparePayload).toBe(false);

    const synapseDomEvents = dispatchSpy.mock.calls
      .map(([event]) => event)
      .filter((event): event is CustomEvent<unknown> => (
        event instanceof CustomEvent && event.type.startsWith('synapse:')
      ))
      .map((event) => event.type);

    expect(synapseDomEvents).not.toContain('synapse:urban:open-recent');
    expect(synapseDomEvents).not.toContain('synapse:urban:refresh-recs');
    expect(synapseDomEvents).not.toContain('synapse:open-shortcuts');
    expect(synapseDomEvents).not.toContain('synapse:theme:toggle');
    expect(synapseDomEvents).not.toContain('synapse:urban:compare');
  });

  it('routes editor bulk content through the editor bridge instead of a synapse DOM event', async () => {
    const card = prepareUrbanStore();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(<UrbanAnalyticsModal open onClose={() => undefined} />);
    fireEvent.click(screen.getByTitle('Insert to Editor (Alt+Enter)'));
    await act(async () => Promise.resolve());

    expect(insertIntoActiveMock).toHaveBeenCalledWith({
      code: expect.stringContaining(card.title),
      language: 'markdown',
    });

    const synapseDomEvents = dispatchSpy.mock.calls
      .map(([event]) => event)
      .filter((event): event is CustomEvent<unknown> => (
        event instanceof CustomEvent && event.type.startsWith('synapse:')
      ))
      .map((event) => event.type);

    expect(synapseDomEvents).not.toContain('synapse:editor:insert');
  });
});
