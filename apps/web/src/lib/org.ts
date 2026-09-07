import { getActiveOrganizationId, setActiveOrganizationId } from './auth';
import type { MyMembership } from './types';

export function resolveActiveOrg(memberships: MyMembership[]): MyMembership | null {
  if (memberships.length === 0) return null;
  const stored = getActiveOrganizationId();
  const match =
    memberships.find((m) => m.status === 'ACTIVE' && m.organization.id === stored) ??
    memberships.find((m) => m.status === 'ACTIVE') ??
    memberships[0];
  if (match.organization.id !== stored) {
    setActiveOrganizationId(match.organization.id);
  }
  return match;
}