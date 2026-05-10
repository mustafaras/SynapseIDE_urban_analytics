// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { createElement, useEffect, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { act } from 'react';
import { useTerminalHistory } from '../useTerminalHistory';
import type { TerminalCommand } from '../../types/shellTypes';

// Tell React 19 we're in an act-enabled test environment so updates are
// flushed synchronously and the "not configured to support act(...)" warning
// is suppressed.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

type HookValue = ReturnType<typeof useTerminalHistory>;

const renderHook = <T,>(hook: () => T) => {
  const container = document.createElement('div');
  const current: { value: T } = { value: undefined as unknown as T };
  let root: Root | null = null;

  const Probe = () => {
    const v = hook();
    const ref = useRef(current);
    useEffect(() => {
      ref.current.value = v;
    });
    current.value = v;
    return null;
  };

  act(() => {
    root = createRoot(container);
    root.render(createElement(Probe));
  });

  return {
    get current() {
      return current.value;
    },
    unmount: () => {
      act(() => {
        root?.unmount();
      });
    },
  };
};

const makeCmd = (i: number): TerminalCommand => ({
  id: `cmd-${i}`,
  command: `echo`,
  args: [String(i)],
  timestamp: new Date('2026-05-06T00:00:00.000Z'),
  exitCode: 0,
  output: '',
  duration: 1,
});

describe('useTerminalHistory — Prompt 27 retention cap', () => {
  it('caps history at 200 entries and drops oldest first', () => {
    const hook = renderHook<HookValue>(() => useTerminalHistory());

    act(() => {
      for (let i = 0; i < 250; i++) {
        hook.current.addCommand(makeCmd(i));
      }
    });

    const cmds = hook.current.history.commands;
    expect(cmds).toHaveLength(200);
    // Oldest 50 dropped, so first retained is index 50, last is 249
    expect(cmds[0].id).toBe('cmd-50');
    expect(cmds[cmds.length - 1].id).toBe('cmd-249');

    hook.unmount();
  });

  it('does not slice when below the cap', () => {
    const hook = renderHook<HookValue>(() => useTerminalHistory());

    act(() => {
      for (let i = 0; i < 5; i++) {
        hook.current.addCommand(makeCmd(i));
      }
    });

    expect(hook.current.history.commands).toHaveLength(5);

    hook.unmount();
  });
});
