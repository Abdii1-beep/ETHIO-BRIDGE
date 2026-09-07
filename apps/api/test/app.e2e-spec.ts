import { INestApplication } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import {
  createTestApp,
  resetTestDatabase,
  seedTestCatalog,
  registerAndVerifyUser,
  loginUser,
  createOrganization,
  get,
  post,
  put,
  del,
  closeApp,
  baseURL,
} from './helpers';
import { PrismaService } from '../src/prisma/prisma.service';

const API = baseURL();

jest.setTimeout(120_000);

describe('ETHIO-BRIDGE Phase 1 e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let ownerA: { token: string; refresh: string };
  let ownerB: { token: string; refresh: string };
  let orgA: string;
  let orgB: string;

  beforeAll(async () => {
    resetTestDatabase();
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await seedTestCatalog();

    const adminHash = await bcrypt.hash('AdminPass!1', 10);
    await prisma.user.create({
      data: {
        email: 'platform-admin@e2e.test',
        name: 'Platform Admin',
        passwordHash: adminHash,
        platformRole: 'PLATFORM_SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await closeApp();
  });

  describe('health', () => {
    it('returns database + redis status', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      const data = (res.body as { data: { db: string; redis: string } }).data;
      expect(data.db).toBe('up');
      expect(['up', 'down', 'disabled']).toContain(data.redis);
    });
  });

  describe('authentication flow', () => {
    it('registers, verifies, logs in, refreshes, and logs out', async () => {
      const email = 'auth-flow@e2e.test';
      const { devOtpCode } = await registerAndVerifyUser(email);
      expect(devOtpCode).toBeTruthy();

      const login = await loginUser(email);
      expect(login.accessToken).toBeTruthy();
      expect(login.refreshToken).toBeTruthy();
      expect(login.user).toMatchObject({ email, isEmailVerified: true });

      const me = await request(app.getHttpServer())
        .get(`${API}/auth/me`)
        .set('Authorization', `Bearer ${login.accessToken}`)
        .expect(200);
      expect((me.body as { data: { email: string } }).data.email).toBe(email);

      const refresh = await request(app.getHttpServer())
        .post(`${API}/auth/refresh`)
        .send({ refreshToken: login.refreshToken })
        .expect(200);
      const refreshed = (refresh.body as { data: { accessToken: string; refreshToken: string } }).data;
      expect(refreshed.accessToken).toBeTruthy();

      await request(app.getHttpServer())
        .post(`${API}/auth/logout`)
        .send({ refreshToken: refreshed.refreshToken })
        .expect(200);

      await request(app.getHttpServer())
        .post(`${API}/auth/refresh`)
        .send({ refreshToken: refreshed.refreshToken })
        .expect(401);
    });

    it('rejects unauthenticated protected routes with 401', async () => {
      await request(app.getHttpServer()).get(`${API}/organizations/me`).expect(401);
    });

    it('rejects wrong credentials', async () => {
      await request(app.getHttpServer())
        .post(`${API}/auth/login`)
        .send({ email: 'nobody@e2e.test', password: 'WrongPass1' })
        .expect(401);
    });
  });

  describe('setup: two isolated organizations', () => {
    it('creates ORG_A and ORG_B with verified owners', async () => {
      const a = await registerAndVerifyUser('owner-a@e2e.test');
      const b = await registerAndVerifyUser('owner-b@e2e.test');
      const loginA = await loginUser('owner-a@e2e.test');
      const loginB = await loginUser('owner-b@e2e.test');
      ownerA = { token: loginA.accessToken, refresh: loginA.refreshToken };
      ownerB = { token: loginB.accessToken, refresh: loginB.refreshToken };

      const resA = await createOrganization(ownerA.token, {
        legalName: 'ORG_A Trading PLC',
        businessType: 'IMPORTER',
        country: 'Ethiopia',
        city: 'Addis Ababa',
      });
      const resB = await createOrganization(ownerB.token, {
        legalName: 'ORG_B Machinery Co.',
        businessType: 'MANUFACTURER',
        country: 'China',
        city: 'Shenzhen',
      });
      orgA = resA.orgId;
      orgB = resB.orgId;
      expect(orgA).not.toBe(orgB);
    });

    it('seeds built-in roles and core features for a new tenant', async () => {
      const roles = await get(ownerA.token, `${API}/roles`, orgA).expect(200);
      const codes = ((roles.body as { data: Array<{ code: string }> }).data).map((r) => r.code);
      expect(codes).toEqual(
        expect.arrayContaining([
          'COMPANY_OWNER',
          'COMPANY_ADMIN',
          'COMPANY_MANAGER',
          'EMPLOYEE',
          'INTERNAL_AUDITOR',
          'EXTERNAL_AUDITOR',
        ]),
      );

      const features = await get(ownerA.token, `${API}/organizations/me/features`, orgA).expect(200);
      const active = (features.body as { data: { active: Array<{ code: string }> } }).data.active;
      expect(active.map((f) => f.code)).toEqual(
        expect.arrayContaining([
          'COMPANY_PROFILE',
          'USERS',
          'BRANCHES',
          'DEPARTMENTS',
          'NOTIFICATIONS',
          'FOUR_LANGUAGE_UI',
        ]),
      );
      expect(active.map((f) => f.code)).not.toContain('AI_AUDIT');
    });
  });

  describe('mandatory: tenant isolation (SDD §165)', () => {
    let branchA: string;
    let branchB: string;

    it('creates a branch in each org', async () => {
      const ra = await post(ownerA.token, `${API}/branches`, orgA)
        .send({ name: 'Addis Branch', city: 'Addis Ababa' })
        .expect(201);
      const rb = await post(ownerB.token, `${API}/branches`, orgB)
        .send({ name: 'Shenzhen Branch', city: 'Shenzhen' })
        .expect(201);
      branchA = (ra.body as { data: { id: string } }).data.id;
      branchB = (rb.body as { data: { id: string } }).data.id;
    });

    it('ORG_A user cannot read ORG_B branch (403 FORBIDDEN)', async () => {
      const res = await get(ownerA.token, `${API}/branches/${branchB}`, orgA).expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('ORG_B user cannot read ORG_A branch (403 FORBIDDEN)', async () => {
      const res = await get(ownerB.token, `${API}/branches/${branchA}`, orgB).expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('ORG_A user cannot read ORG_B organization record (403)', async () => {
      const res = await get(ownerA.token, `${API}/organizations/${orgB}`, orgA).expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('borrowing another org id header is forbidden (403)', async () => {
      const res = await get(ownerA.token, `${API}/branches`, orgB).expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('missing organization header returns 400 ORGANIZATION_HEADER_REQUIRED', async () => {
      const res = await get(ownerA.token, `${API}/branches`).expect(400);
      expect((res.body as { error: { code: string } }).error.code).toBe('ORGANIZATION_HEADER_REQUIRED');
    });
  });

  describe('mandatory: feature entitlement (SDD §166)', () => {
    it('POST /ai/audit without AI_AUDIT entitlement => 403 FEATURE_NOT_ENABLED', async () => {
      const res = await post(ownerA.token, `${API}/ai/audit`, orgA)
        .send({ query: 'Look for duplicate invoices in this quarter.' })
        .expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FEATURE_NOT_ENABLED');
    });

    it('requesting an unimplemented PAID feature creates a pending platform request, not fake activation', async () => {
      const res = await post(ownerA.token, `${API}/features/request`, orgA)
        .send({ featureCode: 'AI_AUDIT', note: 'We need audit AI.' })
        .expect(201);
      expect((res.body as { data: { activated: boolean; status: string } }).data).toMatchObject({
        activated: false,
        status: 'REQUESTED',
      });
      expect((res.body as { data: { status: string } }).data.status).toBe('REQUESTED');
    });
  });

  describe('mandatory: role enforcement — auditor cannot delete a financial transaction (SDD §167)', () => {
    let txId: string;
    let auditor: { token: string };

    it('owner creates a finance transaction (real permission-checked flow)', async () => {
      const res = await post(ownerA.token, `${API}/transactions`, orgA)
        .send({
          type: 'EXPENSE',
          amount: 12500.5,
          currency: 'ETB',
          description: 'Office supplies',
        })
        .expect(201);
      txId = (res.body as { data: { id: string } }).data.id;
      expect(txId).toBeTruthy();
    });

    it('invites an internal auditor, auditor registers and claims the invitation', async () => {
      const invite = await post(ownerA.token, `${API}/users/invite`, orgA)
        .send({ email: 'auditor@e2e.test', name: 'Internal Auditor' })
        .expect(201);
      const inviteData = (invite.body as { data: { devInviteCode: string; devOtp: string } }).data;

      const auditorUser = await registerAndVerifyUser('auditor@e2e.test');
      expect(auditorUser.userId).toBeTruthy();

      const loginAuditor = await loginUser('auditor@e2e.test');
      auditor = { token: loginAuditor.accessToken };

      const claim = await post(auditor.token, `${API}/users/invitations/claim`)
        .send({ inviteCode: inviteData.devInviteCode, otp: inviteData.devOtp })
        .expect(201);
      expect((claim.body as { data: { organizationId: string } }).data.organizationId).toBe(orgA);

      // Assign the INTERNAL_AUDITOR built-in role to the claimed member.
      const members = await get(ownerA.token, `${API}/users`, orgA).expect(200);
      const member = (
        members.body as {
          data: { members: Array<{ id: string; user?: { email?: string } | null }> };
        }
      ).data.members.find((m) => m.user?.email === 'auditor@e2e.test');
      expect(member).toBeTruthy();
      const roles = await get(ownerA.token, `${API}/roles`, orgA).expect(200);
      const auditorRole = (roles.body as { data: Array<{ id: string; code: string | null }> }).data.find(
        (r) => r.code === 'INTERNAL_AUDITOR',
      );
      await put(ownerA.token, `${API}/users/${member!.id}`, orgA)
        .send({ roleIds: [auditorRole!.id] })
        .expect(200);
    });

    it('auditor DELETE on a financial transaction => 403 FORBIDDEN', async () => {
      const res = await del(auditor.token, `${API}/transactions/${txId}`, orgA).expect(403);
      const body = res.body as { error: { code: string } };
      expect(body.error.code).toBe('FORBIDDEN');
    });

    it('auditor cannot create a transaction either (finance.create missing)', async () => {
      const res = await post(auditor.token, `${API}/transactions`, orgA)
        .send({ type: 'INCOME', amount: 100, currency: 'ETB', description: 'nope' })
        .expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('owner CAN delete the transaction (authorized), softly', async () => {
      await del(ownerA.token, `${API}/transactions/${txId}`, orgA).expect(200);
      const list = await get(ownerA.token, `${API}/transactions`, orgA).expect(200);
      const items = (list.body as { data: { items: Array<{ id: string }> } }).data.items;
      expect(items.map((i) => i.id)).not.toContain(txId);
    });

    it('cross-tenant: ORG_B user cannot see/delete ORG_A transactions (404)', async () => {
      await get(ownerB.token, `${API}/transactions/${txId}`, orgB).expect(404);
      const res = await del(ownerB.token, `${API}/transactions/${txId}`, orgB).expect(404);
      expect((res.body as { error: { code: string } }).error.code).toBe('NOT_FOUND');
    });
  });

  describe('RBAC permission matrix', () => {
    it('owner can manage branches (branches.manage)', async () => {
      const res = await post(ownerA.token, `${API}/branches`, orgA)
        .send({ name: 'Adama Branch', city: 'Adama' })
        .expect(201);
      expect((res.body as { data: { id: string } }).data.id).toBeTruthy();

      const list = await get(ownerA.token, `${API}/branches`, orgA).expect(200);
      expect((list.body as { data: Array<{ name: string }> }).data.map((b) => b.name)).toContain('Adama Branch');
    });

    it('features catalog reports implementation status (no fake operational features)', async () => {
      const res = await get(ownerA.token, `${API}/features`, orgA).expect(200);
      const catalog = (res.body as { data: Array<{ code: string; implementationStatus: string; isOperational: boolean }> }).data;
      const aiAudit = catalog.find((f) => f.code === 'AI_AUDIT');
      expect(aiAudit).toMatchObject({ implementationStatus: 'PARTIAL', isOperational: false });
      const messenger = catalog.find((f) => f.code === 'MESSAGING');
      expect(messenger).toMatchObject({ implementationStatus: 'IMPLEMENTED', isOperational: true });
    });
  });

  describe('platform administration', () => {
    let adminToken: string;

    it('platform admin logs in and reaches admin endpoints', async () => {
      const login = await loginUser('platform-admin@e2e.test', 'AdminPass!1');
      adminToken = login.accessToken;

      const me = await get(adminToken, `${API}/admin/me`).expect(200);
      expect((me.body as { data: { platformRole: string } }).data.platformRole).toBe('PLATFORM_SUPER_ADMIN');

      const overview = await get(adminToken, `${API}/admin/overview`).expect(200);
      expect((overview.body as { data: { organizations: number } }).data.organizations).toBeGreaterThanOrEqual(2);
    });

    it('a regular owner cannot access admin endpoints (403)', async () => {
      const res = await get(ownerA.token, `${API}/admin/overview`).expect(403);
      expect((res.body as { error: { code: string } }).error.code).toBe('FORBIDDEN');
    });

    it('reviewing a pending feature request approves and activates the feature', async () => {
      const pending = await get(adminToken, `${API}/admin/feature-requests`).expect(200);
      const items = (pending.body as { data: { items: Array<{ id: string; feature: { code: string }; organization: { id: string } }> } }).data.items;
      const reqForOrgA = items.find((i) => i.organization.id === orgA && i.feature.code === 'AI_AUDIT');
      expect(reqForOrgA).toBeTruthy();

      await post(adminToken, `${API}/admin/feature-requests/${reqForOrgA!.id}/approve`)
        .send({ note: 'Approved for evaluation.' })
        .expect(201);

      const features = await get(ownerA.token, `${API}/organizations/me/features`, orgA).expect(200);
      const active = (features.body as { data: { active: Array<{ code: string }> } }).data.active;
      expect(active.map((f) => f.code)).toContain('AI_AUDIT');
    });

    it('now that AI_AUDIT is entitled, the real provider guard returns 503 AI_PROVIDER_NOT_CONFIGURED (SDD §145)', async () => {
      const res = await post(ownerA.token, `${API}/ai/audit`, orgA)
        .send({ query: 'Check for unusual supplier price changes.' })
        .expect(503);
      expect((res.body as { error: { code: string } }).error.code).toBe('AI_PROVIDER_NOT_CONFIGURED');
    });

    it('audit log captured sensitive actions', async () => {
      const res = await get(adminToken, `${API}/admin/audit-logs`).expect(200);
      const items = (res.body as { data: { items: Array<{ action: string }> } }).data.items;
      const actions = items.map((i) => i.action);
      expect(actions).toEqual(
        expect.arrayContaining(['CREATE_ORGANIZATION', 'CREATE_TRANSACTION', 'DELETE_TRANSACTION', 'FEATURE_REQUEST_REVIEW']),
      );
    });
  });

  describe('organization profile update', () => {
    it('owner can update own organization profile', async () => {
      const res = await put(ownerA.token, `${API}/organizations/${orgA}`, orgA)
        .send({ city: 'Hawassa', description: 'Updated by e2e test' })
        .expect(200);
      expect((res.body as { data: { city: string } }).data.city).toBe('Hawassa');
    });

    it('owner cannot update another organization (403)', async () => {
      await put(ownerA.token, `${API}/organizations/${orgB}`, orgA)
        .send({ city: 'Hacked' })
        .expect(403);
    });
  });
});