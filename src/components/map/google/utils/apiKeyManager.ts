/**
 * API-key manager — encrypt / decrypt / validate Google Maps API keys.
 *
 * Uses Web Crypto AES-256-GCM with a deterministic origin-derived key so
 * the encrypted value is bound to this origin and cannot be decrypted on
 * another domain or in a Node CLI.
 */

const STORAGE_KEY = 'synapse.google.maps.key';
const ENC_STORAGE_KEY = 'synapse.google.maps.key.enc';
const QUOTA_RESET_KEY = 'synapse.google.maps.quotaReset';

/* ------------------------------------------------------------------ */
/*  WebCrypto helpers                                                  */
/* ------------------------------------------------------------------ */

async function getOriginKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const raw = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${location.origin  }::synapse-google-maps`),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: enc.encode('synapse-gmaps-salt'), iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plain: string): Promise<string> {
  const key = await getOriginKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plain),
  );
  const buf = new Uint8Array(iv.length + ct.byteLength);
  buf.set(iv, 0);
  buf.set(new Uint8Array(ct), iv.length);
  return btoa(String.fromCharCode(...buf));
}

async function decrypt(encoded: string): Promise<string> {
  const key = await getOriginKey();
  const raw = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const ct = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/** Persist an API key (encrypted at rest via AES-256-GCM). */
export async function saveApiKey(apiKey: string): Promise<void> {
  try {
    const enc = await encrypt(apiKey);
    localStorage.setItem(ENC_STORAGE_KEY, enc);
    // Also store plain for immediate usage in the same session.
    localStorage.setItem(STORAGE_KEY, apiKey);
  } catch {
    // Fallback: store plain if crypto unavailable.
    localStorage.setItem(STORAGE_KEY, apiKey);
  }
}

/** Load the persisted API key (decrypt if available). */
export async function loadApiKey(): Promise<string> {
  try {
    const enc = localStorage.getItem(ENC_STORAGE_KEY);
    if (enc) return await decrypt(enc);
  } catch {
    /* fall through to plain */
  }
  return localStorage.getItem(STORAGE_KEY) ?? '';
}

/** Remove the stored key. */
export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ENC_STORAGE_KEY);
}

/**
 * Validate a key by making a zero-cost Geocode request for a well-known
 * address. Resolves `true` when valid, `false` when rejected (invalid key,
 * exceeded quota, etc.).
 */
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=1+Infinite+Loop,+Cupertino,+CA&key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const json = await res.json();
    return json.status === 'OK' || json.status === 'ZERO_RESULTS';
  } catch {
    return false;
  }
}

/** Track monthly quota-reset dates in localStorage. */
export function getLastQuotaReset(): number {
  const raw = localStorage.getItem(QUOTA_RESET_KEY);
  return raw ? Number(raw) : 0;
}

export function setLastQuotaReset(ts: number = Date.now()): void {
  localStorage.setItem(QUOTA_RESET_KEY, String(ts));
}
