'use client';

import { useEffect, useState } from 'react';
import { getCachedUser } from '@/lib/auth';
import type { Profile } from '@/lib/types';

/**
 * Reads the cached session user only after hydration, so the server and the first
 * client render both treat the user as unknown (avoids React hydration mismatch #418).
 */
export function useSessionUser(): Profile | null {
  const [user, setUser] = useState<Profile | null>(null);

  useEffect(() => {
    setUser(getCachedUser());
  }, []);

  return user;
}