import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('hashes and verifies a password', async () => {
    const hash = await service.hash('SuperSecret123');
    expect(hash).not.toBe('SuperSecret123');
    expect(await service.compare('SuperSecret123', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('SuperSecret123');
    expect(await service.compare('WrongPassword1', hash)).toBe(false);
  });

  it('produces different hashes for the same password (salting)', async () => {
    const a = await service.hash('SuperSecret123');
    const b = await service.hash('SuperSecret123');
    expect(a).not.toBe(b);
  });
});