import React from 'react';
import { Folder, Plus } from 'lucide-react';

interface EmptyStateProps {
  onNewFile: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onNewFile }) => {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          opacity: 0.45,
          background: 'transparent',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Folder size={48} color="var(--syn-text-muted)" />
      </div>

      <div>
        <p
          style={{
            margin: '0 0 8px 0',
            color: 'var(--syn-text-secondary)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          No files in this workspace
        </p>
        <p
          style={{
            margin: '0 0 20px 0',
            fontSize: '12px',
            color: 'var(--syn-text-muted)',
          }}
        >
          Create your first file to get started
        </p>
      </div>

      <button
        onClick={onNewFile}
        style={{
          padding: '8px 14px',
          background: 'color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)',
          border: 'none',
          borderRadius: '6px',
          color: 'var(--syn-interaction-active)',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background 140ms ease, color 140ms ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background =
            'color-mix(in srgb, var(--syn-interaction-active) 22%, transparent)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background =
            'color-mix(in srgb, var(--syn-interaction-active) 14%, transparent)';
        }}
      >
        <Plus size={16} />
        Create New File
      </button>
    </div>
  );
};
