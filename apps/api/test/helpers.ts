import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { execSync } from 'child_process';
import * as path from 'path';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { seedCatalog } from '../prisma/seed';

const API_PREFIX = process.env.API_PREFIX ?? 'api/v1';
const API_DIR = path.resolve(__dirname, '..');

let app: INestApplication;
let prisma: PrismaService;

export function baseURL(): string {
  return `/${API_PREFIX}`;
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const instance = moduleRef.createNestApplication();
  instance.setGlobalPrefix(API_PREFIX, { exclude: ['health'] });
  instance.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await instance.init();
  prisma = instance.get(PrismaService);
  app = instance;
  return instance;
}

export function resetTestDatabase(): void {
  execSync(`npx --no-install prisma db push --skip-generate --force-reset`, {
    cwd: API_DIR,
    stdio: 'pipe',
    env: process.env,
  });
}

export async function seedTestCatalog(): Promise<void> {
  await seedCatalog(prisma);
}

interface RegisteredUser {
  userId: string;
  devOtpCode?: string;
}

export async function registerAndVerifyUser(
  email: string,
  password = 'Passw0rd!1',
  name = 'E2E Tester',
): Promise<RegisteredUser> {
  const reg = await request(app.getHttpServer())
    .post(`${baseURL()}/auth/register`)
    .send({ name, email, password })
    .expect(201);
  const data = reg.body as { data: { userId: string; devOtpCode?: string } };
  const code = data.data.devOtpCode;
  if (!code) {
    throw new Error(`No dev OTP returned in test environment for ${email}`);
  }
  await request(app.getHttpServer())
    .post(`${baseURL()}/auth/verify`)
    .send({ email, code })
    .expect(200);
  return { userId: data.data.userId, devOtpCode: code };
}

export async function loginUser(
  email: string,
  password = 'Passw0rd!1',
): Promise<{ accessToken: string; refreshToken: string; user: Record<string, unknown> }> {
  const res = await request(app.getHttpServer())
    .post(`${baseURL()}/auth/login`)
    .send({ email, password })
    .expect(200);
  return (res.body as { data: { accessToken: string; refreshToken: string; user: Record<string, unknown> } }).data;
}

export async function createOrganization(
  token: string,
  payload: Record<string, unknown>,
): Promise<{ orgId: string }> {
  const res = await request(app.getHttpServer())
    .post(`${baseURL()}/organizations`)
    .set('Authorization', `Bearer ${token}`)
    .send(payload)
    .expect(201);
  return { orgId: (res.body as { data: { id: string } }).data.id };
}

export function get(token: string, path: string, orgId?: string): request.Test {
  let r = request(app.getHttpServer()).get(path).set('Authorization', `Bearer ${token}`);
  if (orgId) {
    r = r.set('X-Organization-Id', orgId);
  }
  return r;
}

export function post(token: string, path: string, orgId?: string): request.Test {
  let r = request(app.getHttpServer()).post(path).set('Authorization', `Bearer ${token}`);
  if (orgId) {
    r = r.set('X-Organization-Id', orgId);
  }
  return r;
}

export function put(token: string, path: string, orgId?: string): request.Test {
  let r = request(app.getHttpServer()).put(path).set('Authorization', `Bearer ${token}`);
  if (orgId) {
    r = r.set('X-Organization-Id', orgId);
  }
  return r;
}

export function del(token: string, path: string, orgId?: string): request.Test {
  let r = request(app.getHttpServer()).delete(path).set('Authorization', `Bearer ${token}`);
  if (orgId) {
    r = r.set('X-Organization-Id', orgId);
  }
  return r;
}

export async function closeApp(): Promise<void> {
  if (app) {
    await app.close();
  }
  if (prisma) {
    await prisma.$disconnect();
  }
}

export { request };