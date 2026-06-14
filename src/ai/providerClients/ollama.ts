import type { ListModelsFn } from './types';

function hasBaseUrl(baseUrl: string | undefined): baseUrl is string {
  return typeof baseUrl === 'string' && baseUrl.trim().length > 0;
}

function canUseImplicitLocalOllama(): boolean {
  return import.meta.env.MODE === 'development';
}

export const listModels: ListModelsFn = async ({ baseUrl }) => {
  if (!hasBaseUrl(baseUrl) && !canUseImplicitLocalOllama()) {
    return [];
  }

  const host = (baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
  try {
    const res = await fetch(`${host  }/api/tags`);
    if (!res.ok) return [];
    const json = await res.json();
    const arr = Array.isArray(json.models) ? json.models : [];
    return arr.map((m: any) => m.name).filter(Boolean);
  } catch { return []; }
};
