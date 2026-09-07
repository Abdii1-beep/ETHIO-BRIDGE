import { PERMISSION_CODES, BUILT_IN_ROLES, FEATURES, ALL_PERMISSIONS } from '../../../packages/shared/src';

describe('shared domain catalog', () => {
  it('permission codes are unique', () => {
    const unique = new Set(PERMISSION_CODES);
    expect(unique.size).toBe(PERMISSION_CODES.length);
  });

  it('every built-in role references known permission codes only', () => {
    for (const permissions of Object.values(BUILT_IN_ROLES)) {
      for (const code of permissions) {
        expect(ALL_PERMISSIONS[code]).toBe(true);
      }
    }
  });

  it('owner role includes every permission', () => {
    expect(BUILT_IN_ROLES.COMPANY_OWNER.sort()).toEqual(PERMISSION_CODES.sort());
  });

  it('feature codes are unique', () => {
    const codes = FEATURES.map((f) => f.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('Phase 1 core features are catalogued as implemented and operational', () => {
    const coreImplemented = FEATURES.filter(
      (f) => f.category === 'CORE' && f.implementationStatus === 'IMPLEMENTED',
    );
    expect(coreImplemented.length).toBeGreaterThanOrEqual(6);
    for (const f of coreImplemented) {
      expect(f.isOperational).toBe(true);
    }
  });

  it('unimplemented features are never advertised as operational', () => {
    for (const f of FEATURES) {
      if (f.implementationStatus === 'NOT_IMPLEMENTED') {
        expect(f.isOperational).toBe(false);
      }
    }
  });
});