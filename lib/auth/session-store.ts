import { deleteSession, getSession, setSession } from '@/lib/d1';
import type { TenantSession } from './types';

export const SESSION_COOKIE_NAME = 'tenant-auth';
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const INLINE_PREFIX = 'inline.';

function generateSessionId(): string {
  const cryptoObj = (globalThis as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  // Fallback for environments without crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function encodeInline(session: TenantSession): string {
  const json = JSON.stringify(session);
  if (typeof btoa === 'function') {
    return `${INLINE_PREFIX}${btoa(json)}`;
  }
  const bufferCtor = (globalThis as { Buffer?: typeof Buffer }).Buffer;
  if (bufferCtor) {
    return `${INLINE_PREFIX}${bufferCtor.from(json, 'utf-8').toString('base64')}`;
  }
  throw new Error('No base64 encoder available in current runtime');
}

function decodeInline(value: string): TenantSession | null {
  try {
    const payload = value.slice(INLINE_PREFIX.length);
    const json = typeof atob === 'function'
      ? atob(payload)
      : ((globalThis as { Buffer?: typeof Buffer }).Buffer?.from(payload, 'base64').toString('utf-8') ?? '');
    if (!json) {
      throw new Error('Base64 decoder is not available');
    }
    return JSON.parse(json) as TenantSession;
  } catch (error) {
    console.error('Failed to decode inline session payload:', error);
    return null;
  }
}

function isInlineSession(value: string): boolean {
  return value.startsWith(INLINE_PREFIX);
}

export async function persistSession(
  session: TenantSession,
  env?: Record<string, unknown>
): Promise<string> {
  const sessionId = generateSessionId();

  try {
    await setSession(sessionId, session.userId, session.tenantId, session, SESSION_TTL_SECONDS, env);
    return sessionId;
  } catch (error) {
    console.warn('Falling back to inline session storage:', error);
    return encodeInline(session);
  }
}

export async function retrieveSession(
  sessionId: string,
  env?: Record<string, unknown>
): Promise<TenantSession | null> {
  if (!sessionId) {
    return null;
  }

  if (isInlineSession(sessionId)) {
    return decodeInline(sessionId);
  }

  const record = await getSession(sessionId, env).catch(error => {
    console.error('Failed to retrieve session from D1:', error);
    return null;
  });

  if (!record?.data) {
    return null;
  }

  return record.data as TenantSession;
}

export async function removeSession(
  sessionId: string,
  env?: Record<string, unknown>
): Promise<void> {
  if (!sessionId) {
    return;
  }

  if (isInlineSession(sessionId)) {
    return;
  }

  await deleteSession(sessionId, env).catch(error => {
    console.error('Failed to delete session from D1:', error);
  });
}
