import { getAccessToken, getActiveOrganizationId, getRefreshToken, storeSession, clearSession, getCachedUser } from './auth';
import type { LoginResult } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
const BASE = `${API_URL}/api/v1`;

const DEVICE_KEY = 'ethio.device';

/**
 * Stable anonymous id for THIS browser/device. It uniquely identifies the device
 * across requests so the API can count each product view exactly once.
 */
function deviceId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: string[];

  constructor(code: string, message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
}

function headersFor(auth: boolean): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const orgId = getActiveOrganizationId();
  if (orgId) {
    headers['X-Organization-Id'] = orgId;
  }
  const dev = deviceId();
  if (dev) {
    headers['X-Device-Id'] = dev;
  }
  // Only add Authorization header if auth is explicitly true
  if (auth === true) {
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  // Add language header from URL locale
  if (typeof window !== 'undefined') {
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1]; // Get locale from URL (e.g., /en, /zh, /am, /om)
    if (locale && ['en', 'zh', 'am', 'om'].includes(locale)) {
      headers['Accept-Language'] = locale;
    }
  }
  return headers;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined as T;
  }
}

async function rawRequest(path: string, options: ApiOptions, accessToken?: string): Promise<Response> {
  const headers = headersFor(options.auth ?? true);
  if (options.auth !== false && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  const hasBody = options.body !== undefined;
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    cache: 'no-store',
  });
  return res;
}

/**
 * Application API client with automatic access-token refresh on 401. Tenant context is
 * attached from the client via X-Organization-Id (mirrors the backend tenant resolution).
 */
export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const refreshToken = getRefreshToken();
  let res = await rawRequest(path, options);

  if (res.status === 401 && refreshToken) {
    try {
      const refreshed = await fetch(`${BASE}/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      });
      if (refreshed.ok) {
        const payload = await parseJson<{ data: { accessToken: string; refreshToken?: string } }>(refreshed);
        if (payload?.data?.accessToken) {
          storeSession({
            accessToken: payload.data.accessToken,
            refreshToken: payload.data.refreshToken || refreshToken,
            user: getCachedUser(),
          });
          res = await rawRequest(path, options, payload.data.accessToken);
        }
      } else {
        clearSession();
      }
    } catch {
      // Ignore refresh error
    }
  }

  const json = await parseJson<{
    success?: boolean;
    data?: T;
    error?: { code?: string; message?: string; details?: string[] };
  }>(res);

  if (!res.ok) {
    const code = json?.error?.code ?? 'UNKNOWN';
    const message = json?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiClientError(code, message, res.status, json?.error?.details);
  }

  return json?.data as T;
}

export function logout(): void {
  clearSession();
}