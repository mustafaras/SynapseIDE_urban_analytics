import { useMemo } from 'react';
import en, { type EnMessages } from './locales/en';
import tr from './locales/tr';

type Messages = EnMessages;
type Primitive = string | number | boolean | null | undefined;

type MessageKey<T> = T extends Primitive
  ? never
  : {
    [K in Extract<keyof T, string>]: T[K] extends Primitive
      ? K
      : `${K}.${MessageKey<T[K]>}`;
  }[Extract<keyof T, string>];

type I18nKey = MessageKey<Messages>;

const DICTS: Record<string, Messages> = {
  en: en as unknown as Messages,
  tr: tr as unknown as Messages,
};

function getLang(): keyof typeof DICTS {
  const win = globalThis as typeof globalThis & { __APP_LANG__?: string };
  const hinted = (win && win.__APP_LANG__) ? String(win.__APP_LANG__).toLowerCase() : undefined;

  if (hinted && DICTS[hinted]) return hinted as keyof typeof DICTS;
  return 'en';
}

function resolvePath(dict: Messages, key: string): string | undefined {
  const parts = key.split('.');
  let cursor: unknown = dict;

  for (const p of parts) {
    if (cursor && typeof cursor === 'object' && p in (cursor as Record<string, unknown>)) {
      cursor = (cursor as Record<string, unknown>)[p];
      continue;
    }
    return undefined;
  }

  return typeof cursor === 'string' ? cursor : undefined;
}

export function useI18n() {
  const lang = getLang();
  const dict = DICTS[lang] ?? en;
  const t = useMemo(() => {
    return (key: I18nKey | string): string => {
      const rawKey = String(key);
      // Fall back to English to avoid user-facing key drift when one locale lags behind.
      return resolvePath(dict, rawKey) ?? resolvePath(en, rawKey) ?? rawKey;
    };
  }, [dict]);
  return { lang, t };
}
