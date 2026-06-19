import React, { useEffect, useId, useState } from 'react';
import styled from 'styled-components';
import { useSettingsStore } from '@/store/useSettingsStore';
import { showToast } from '@/ui/toast/api';
import { useFocusTrap } from '@/hooks/useFocusTrap';


const ACCENT = 'var(--syn-interaction-active, #3794ff)';
const ACCENT_HOVER = 'var(--syn-status-info, #6aa9ff)';
const BG = 'var(--syn-surface-panel, #232832)';
const BG_ALT = 'var(--syn-surface-input, #1a1f26)';
const BORDER = 'var(--syn-border-subtle, #343a44)';
const BORDER_SOFT = 'var(--syn-border-subtle, #343a44)';
const TEXT = 'var(--syn-text-default, #d7dce5)';
const TEXT_MUTED = 'var(--syn-text-secondary, #a4adbb)';
const TEXT_FAINT = 'var(--syn-text-muted, #778190)';

const focusRing = () => `0 0 0 2px color-mix(in srgb, var(--syn-interaction-focus-ring, #3794ff) 50%, transparent)`;

const Backdrop = styled.div`
  position: fixed; inset: 0; background: var(--syn-surface-overlay, rgba(12,15,20,0.78));
  display: flex; align-items: center; justify-content: center; z-index: 2200;
  font-family: var(--font-mono, var(--font-code, "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace));
`;
const Dialog = styled.div`
  width: 520px; max-width: 95vw; border-radius: 12px; padding: 18px 20px 20px;
  background: ${BG};
  border: 1px solid ${BORDER};
  font-family: inherit;
  color: ${TEXT};
  box-shadow: 0 0 0 1px var(--syn-surface-workbench, #1e1f24);
`;
const Tabs = styled.div` display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; `;
const TabBtn = styled.button<{ $active?: boolean }>`
  padding: 6px 12px; border-radius: 7px; font-size: 12px; cursor: pointer; line-height:1.2;
  background: ${p => p.$active ? ACCENT : BG_ALT};
  color: ${p => p.$active ? 'var(--syn-text-inverse, #0f1218)' : TEXT_MUTED};
  border: 1px solid ${p => p.$active ? ACCENT : BORDER_SOFT};
  font-family: inherit; font-weight: 500; letter-spacing:.3px;
  transition: background .18s var(--syn-easing-bauhaus), color .18s var(--syn-easing-bauhaus), border-color .18s var(--syn-easing-bauhaus), transform .18s var(--syn-easing-bauhaus);
  position: relative;
  &:hover { background: ${p => p.$active ? ACCENT_HOVER : 'var(--syn-surface-hover, #303642)'}; color: ${p => p.$active ? 'var(--syn-text-inverse, #0f1218)' : ACCENT}; }
  &:focus-visible { outline: none; box-shadow: ${focusRing()}; }
  &:active { transform: translateY(1px); }
`;
const Row = styled.label`
  display: grid; grid-template-columns: 120px 1fr auto; gap: 10px; align-items: center; margin: 10px 0; font-size: 12px; font-family: inherit;
  color:${TEXT_MUTED};
  > div:first-child { text-transform: uppercase; letter-spacing:.5px; font-size:10px; color:${TEXT_FAINT}; }
`;
const Input = styled.input`
  width: 100%; padding: 7px 9px; border-radius: 8px; border: 1px solid ${BORDER_SOFT};
  background: ${BG_ALT}; color: ${TEXT}; font-family: inherit; font-size:12px;
  outline: none; transition: border-color .18s var(--syn-easing-bauhaus), background .18s var(--syn-easing-bauhaus), box-shadow .18s var(--syn-easing-bauhaus);
  &::placeholder { color:${TEXT_FAINT}; }
  &:focus { border-color: ${ACCENT}; background: var(--syn-surface-elevated, #2b3038); box-shadow: ${focusRing()}; }
  &:disabled { opacity:.5; cursor:not-allowed; }
`;
const Actions = styled.div` display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px; `;
const ActionBtn = styled.button<{ $primary?: boolean }>`
  min-width: 90px; height:34px; padding:0 16px; border-radius:7px; font-size:12px; cursor:pointer; font-family:inherit; font-weight:500; letter-spacing:.4px;
  background: ${p=>p.$primary?ACCENT:BG_ALT};
  color: ${p=>p.$primary?'var(--syn-text-inverse, #0f1218)':TEXT_MUTED};
  border:1px solid ${p=>p.$primary?ACCENT:BORDER_SOFT};
  display:flex; align-items:center; justify-content:center; gap:6px;
  transition: background .2s var(--syn-easing-bauhaus), color .2s var(--syn-easing-bauhaus), border-color .2s var(--syn-easing-bauhaus), transform .15s var(--syn-easing-bauhaus);
  &:hover { background:${p=>p.$primary?ACCENT_HOVER:'var(--syn-surface-hover, #303642)'}; color:${p=>p.$primary?'var(--syn-text-inverse, #0f1218)':ACCENT}; }
  &:focus-visible { outline:none; box-shadow:${focusRing()}; }
  &:active { transform:translateY(1px); }
`;
const ToggleBtn = styled.button`
  padding:6px 10px; border-radius:7px; font-size:11px; cursor:pointer; font-family:inherit; background:${BG_ALT}; color:${TEXT_MUTED}; border:1px solid ${BORDER_SOFT};
  transition: background .18s, color .18s, border-color .18s;
  &:hover { background:var(--syn-surface-hover, #303642); color:${ACCENT}; border-color:${ACCENT}; }
  &:focus-visible { outline:none; box-shadow:${focusRing()}; }
`;

export const KeysModal: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const id = useId();
  const { trapRef, activate } = useFocusTrap(open);
  const { profiles, activeProfileId, setApiKey, setOllamaBaseUrl } = useSettingsStore();
  const active = profiles.find(p => p.id === activeProfileId);
  const keys = (active?.data as any)?.keys || {};
  const settings = (active?.data as any)?.settings || {};
  const [tab, setTab] = useState<'openai'|'anthropic'|'gemini'|'ollama'>('openai');
  const [show, setShow] = useState(false);
  const [openai, setOpenai] = useState(keys?.openai?.apiKey || '');
  const [anthropic, setAnthropic] = useState(keys?.anthropic?.apiKey || '');
  const [google, setGoogle] = useState(keys?.google?.apiKey || '');
  const [ollama, setOllama] = useState(settings?.ollamaBaseUrl || '');

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    if (open) document.addEventListener('keydown', onKey, true);
    return () => { document.removeEventListener('keydown', onKey, true); };
  }, [open, onClose]);


  // Focus trap + restore-to-opener via the shared hook (MFP-02/13); move initial
  // focus into the dialog on open.
  useEffect(() => {
    if (open) activate();
  }, [open, activate]);

  if (!open) return null;

  const save = () => {
    if (openai) setApiKey('openai', openai);
    if (anthropic) setApiKey('anthropic', anthropic);
  if (google) setApiKey('gemini', google);
    setOllamaBaseUrl(ollama || '');
    try { showToast({ kind: 'success', message: 'Keys updated' }); } catch {}
    onClose();
  };

  const mask = (v: string) => v ? `Saved ••••${String(v).slice(-4)}` : '';

  const tabIds = {
    openai: `${id}-tab-openai`,
    anthropic: `${id}-tab-anthropic`,
    gemini: `${id}-tab-gemini`,
    ollama: `${id}-tab-ollama`,
  } as const;
  const panelIds = {
    openai: `${id}-panel-openai`,
    anthropic: `${id}-panel-anthropic`,
    gemini: `${id}-panel-gemini`,
    ollama: `${id}-panel-ollama`,
  } as const;

  return (
    <Backdrop aria-hidden={!open}>
      <Dialog
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        data-testid="keys-modal"
      >
        <div id={`${id}-title`} style={{ fontWeight:700, marginBottom:12, fontSize:14, letterSpacing:.5, textTransform:'uppercase', color: 'var(--syn-accent-gold, #f5b301)' }}>Provider Keys</div>
        <Tabs role="tablist" aria-label="Providers">
          {(['openai','anthropic','gemini','ollama'] as const).map(p => (
            <TabBtn
              key={p}
              id={tabIds[p]}
              role="tab"
              aria-selected={tab===p}
              aria-controls={panelIds[p]}
              $active={tab===p}
              onClick={() => setTab(p)}
            >
              {(p[0].toUpperCase()+p.slice(1))}
            </TabBtn>
          ))}
        </Tabs>
        {tab !== 'ollama' ? (
          <div role="tabpanel" id={panelIds[tab]} aria-labelledby={tabIds[tab]}>
            <Row>
              <div>API KEY</div>
              <Input id={`${id}-key`} type={show ? 'text' : 'password'} placeholder={mask(tab==='openai'?openai:tab==='anthropic'?anthropic:google)} value={tab==='openai'?openai:tab==='anthropic'?anthropic:google} onChange={e => {
                const v = e.target.value; if (tab==='openai') setOpenai(v); else if (tab==='anthropic') setAnthropic(v); else setGoogle(v);
              }} />
              <ToggleBtn onClick={() => setShow(s => !s)} aria-pressed={show} aria-label={show ? 'Hide API key' : 'Show API key'}>{show ? 'Hide' : 'Show'}</ToggleBtn>
            </Row>
          </div>
        ) : (
          <div role="tabpanel" id={panelIds[tab]} aria-labelledby={tabIds[tab]}>
            <Row>
              <div>BASE URL</div>
              <Input id={`${id}-ollama`} type="text" placeholder="http://localhost:11434" value={ollama} onChange={e => setOllama(e.target.value)} />
              <div />
            </Row>
          </div>
        )}
        <Actions>
          <ActionBtn onClick={onClose} aria-label="Cancel and close keys modal">Cancel</ActionBtn>
          <ActionBtn $primary onClick={save} aria-label="Save provider keys">Save</ActionBtn>
        </Actions>
      </Dialog>
    </Backdrop>
  );
};

export default KeysModal;
