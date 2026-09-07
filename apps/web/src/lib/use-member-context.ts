'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { resolveActiveOrg } from './org';
import type { MyMembership, Profile } from './types';

export interface MemberContext {
  membership: MyMembership | null;
  permissionCodes: Set<string>;
  has: (code: string) => boolean;
  hasAny: (codes: string[]) => boolean;
  loading: boolean;
  refresh: () => void;
}

function collectCodes(membership: MyMembership): string[] {
  const codes = new Set<string>();
  membership.roles.forEach((role) =>
    role.permissions.forEach((p) => codes.add(p.code)),
  );
  return Array.from(codes);
}

export function useMemberContext(): MemberContext {
  const [membership, setMembership] = useState<MyMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api<Profile>('/auth/me');
      const resolved = resolveActiveOrg(me.memberships ?? []);
      setMembership(resolved ? { ...resolved, permissions: collectCodes(resolved) } : null);
    } catch {
      setMembership(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const permissionCodes = useMemo(() => {
    const set = new Set<string>();
    membership?.roles.forEach((role) =>
      role.permissions.forEach((p) => set.add(p.code)),
    );
    return set;
  }, [membership]);

  const has = useCallback((code: string) => permissionCodes.has(code), [permissionCodes]);
  const hasAny = useCallback(
    (codes: string[]) => codes.some((c) => permissionCodes.has(c)),
    [permissionCodes],
  );

  return { membership, permissionCodes, has, hasAny, loading, refresh: load };
}