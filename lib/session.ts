const encoder = new TextEncoder();
export const SESSION_SECONDS = 28800;
export const COOKIE_NAME = 'atlas_session';

export function authConfig() {
  const env = (globalThis as typeof globalThis & {
    process?: { env: Record<string, string | undefined> };
  }).process?.env;
  const email = env?.AUTH_EMAIL?.trim().toLowerCase();
  const passwordHash = env?.AUTH_PASSWORD_SHA256;
  const secret = env?.AUTH_SECRET;
  if (!email || !passwordHash || !/^[a-f0-9]{64}$/.test(passwordHash) || !secret) return null;
  return { email, passwordHash, secret };
}

export function constantTimeEqual(a: string, b: string): boolean {
  let difference = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    difference |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return difference === 0;
}

function base64url(bytes: Uint8Array): string {
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signature(payload: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return base64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(payload))));
}

export async function passwordDigest(password: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(password));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createSession(email: string, secret: string): Promise<string> {
  const expires = Date.now() + SESSION_SECONDS * 1000;
  const payload = `${expires}.${base64url(encoder.encode(email))}`;
  return `${payload}.${await signature(payload, secret)}`;
}

export async function verifySession(cookie: string | undefined): Promise<boolean> {
  const config = authConfig();
  if (!config || !cookie) return false;
  const parts = cookie.split('.');
  if (parts.length !== 3) return false;
  const [expires, email, signed] = parts;
  if (!/^\d+$/.test(expires) || !Number.isSafeInteger(Number(expires)) || Number(expires) <= Date.now()) return false;
  if (!constantTimeEqual(email, base64url(encoder.encode(config.email)))) return false;
  return constantTimeEqual(signed, await signature(`${expires}.${email}`, config.secret));
}

export function platformNext(value: FormDataEntryValue | null): string {
  if (typeof value !== 'string' || !value.startsWith('/plataforma/')) return '/plataforma/';
  // Normalize as the browser does so dot segments and backslashes cannot escape the platform.
  const base = new URL('https://session.invalid');
  const target = new URL(value, base);
  return target.origin === base.origin && target.pathname.startsWith('/plataforma/')
    ? `${target.pathname}${target.search}${target.hash}` : '/plataforma/';
}
