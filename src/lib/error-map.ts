import type { ToastKind } from '@/ui/toast/types';

type UiFeedbackKind = Extract<ToastKind, 'error' | 'warning' | 'info'>;

const UI_FEEDBACK_KIND: Record<'error' | 'warning' | 'info', UiFeedbackKind> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
};

export type UserFacingError = {
  kind: UiFeedbackKind;
  userMessage: string;
  contextKey: string;
};

export function toUserFacing(e: { source: string; code?: string; message?: string; provider?: string; model?: string }): UserFacingError {
  const code = e.code || 'unknown';
  const baseKey = `err:${e.source}:${code}:${e.provider || 'na'}:${e.model || 'na'}`;

  switch (code) {
    case 'timeout':
      return { kind: UI_FEEDBACK_KIND.error, userMessage: 'Request timed out. Please try again.', contextKey: baseKey };
    case 'network':
      return { kind: UI_FEEDBACK_KIND.error, userMessage: 'Network error. Check your connection.', contextKey: baseKey };
    case 'http_4xx':
      return { kind: UI_FEEDBACK_KIND.error, userMessage: 'Request failed. Check settings and try again.', contextKey: baseKey };
    case 'http_5xx':
      return { kind: UI_FEEDBACK_KIND.error, userMessage: 'Server is unavailable. Please try again.', contextKey: baseKey };
    case 'aborted':
      return { kind: UI_FEEDBACK_KIND.info, userMessage: 'Generation cancelled.', contextKey: baseKey };
    case 'parse':
      return { kind: UI_FEEDBACK_KIND.error, userMessage: 'Response parsing failed.', contextKey: baseKey };
    default: {

      const raw = e.message?.trim?.() || '';
      const fallback = raw && raw.length <= 140 ? raw : 'Something went wrong.';
      return { kind: UI_FEEDBACK_KIND.error, userMessage: fallback, contextKey: baseKey };
    }
  }
}
