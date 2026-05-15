import React from 'react';
import styled from 'styled-components';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { ProviderId } from '@/lib/settings/settings.types';

const Badge = styled.span<{ kind: 'ok'|'warn' }>`
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  line-height: 1;
  background: ${p => p.kind === 'ok'
    ? 'color-mix(in srgb, var(--syn-status-valid, #4ec27d) 18%, transparent)'
    : 'color-mix(in srgb, var(--syn-status-warning, #d6a84f) 16%, transparent)'};
  color: ${p => p.kind === 'ok' ? 'var(--syn-status-valid, #4ec27d)' : 'var(--syn-status-warning, #d6a84f)'};
  border: 1px solid ${p => p.kind === 'ok'
    ? 'color-mix(in srgb, var(--syn-status-valid, #4ec27d) 38%, transparent)'
    : 'color-mix(in srgb, var(--syn-status-warning, #d6a84f) 38%, transparent)'};
`;

export const StatusBadge: React.FC = () => {
  const { profiles, activeProfileId } = useSettingsStore();
  const active = profiles.find(p => p.id === activeProfileId);
  const provider = (active?.data?.settings?.provider || active?.data?.provider || 'openai') as ProviderId;
  const keys = (active?.data as any)?.keys || {};
  const base = active?.data?.settings as any;

  let text = 'Ready';
  let kind: 'ok'|'warn' = 'ok';
  if (provider === 'ollama') {
    const hasBase = !!(base?.ollamaBaseUrl);
    if (!hasBase) { text = 'Local not set'; kind = 'warn'; }
  } else {
    const hasKey = !!(keys?.[provider]?.apiKey);
    if (!hasKey) { text = 'Key missing'; kind = 'warn'; }
  }
  return (
    <Badge kind={kind} aria-label={`Connection status: ${text}`}>{text}</Badge>
  );
};

export default StatusBadge;
