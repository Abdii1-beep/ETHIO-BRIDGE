import type { LoginResult, Profile } from './types';

const ACCESS_KEYS = ['ehio.access', 'ethio.access'];
const REFRESH_KEYS = ['ehio.refresh', 'ethio.refresh'];
const USER_KEYS = ['ehio.user', 'ethio.user'];
const ORG_KEYS = ['ehio.organizationId', 'ethio.organizationId'];

function store(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

function getItem(keys: string[]): string | null {
  const s = store();
  if (!s) return null;
  for (const k of keys) {
    const v = s.getItem(k);
    if (v) return v;
  }
  return null;
}

function setItem(keys: string[], value: string): void {
  const s = store();
  if (!s) return;
  for (const k of keys) {
    s.setItem(k, value);
  }
}

function removeItem(keys: string[]): void {
  const s = store();
  if (!s) return;
  for (const k of keys) {
    s.removeItem(k);
  }
}

export function storeSession(session: { accessToken: string; refreshToken: string; user?: Profile | null }): void {
  setItem(ACCESS_KEYS, session.accessToken);
  setItem(REFRESH_KEYS, session.refreshToken);
  if (session.user) {
    setItem(USER_KEYS, JSON.stringify(session.user));
  }
}

export function getAccessToken(): string | null {
  return getItem(ACCESS_KEYS);
}

export function getRefreshToken(): string | null {
  return getItem(REFRESH_KEYS);
}

export function getCachedUser(): Profile | null {
  const raw = getItem(USER_KEYS);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Profile;
  } catch {
    return null;
  }
}

export function getActiveOrganizationId(): string | null {
  return getItem(ORG_KEYS);
}

export function setActiveOrganizationId(id: string): void {
  setItem(ORG_KEYS, id);
}

export function clearSession(): void {
  removeItem(ACCESS_KEYS);
  removeItem(REFRESH_KEYS);
  removeItem(USER_KEYS);
  removeItem(ORG_KEYS);
}