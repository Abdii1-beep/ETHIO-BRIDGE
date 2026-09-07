import * as nodemailer from 'nodemailer';
import {
  buildOtpTransportAsync,
  DevConsoleTransport,
  otpRuntime,
  OTP_TRANSPORT,
  otpTransportMode,
  SmtpEmailTransport,
} from './otp-transport';
import { provisionEtherealAccount } from './ethereal';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

jest.mock('./ethereal', () => ({
  ETHEREAL_ACCOUNT_FILE: 'test-ethereal.env',
  provisionEtherealAccount: jest.fn(),
}));

const mockedCreateTransport = nodemailer.createTransport as jest.Mock;
const mockedProvision = provisionEtherealAccount as jest.Mock;

function fakeConfig(values: Record<string, string | undefined>): { get: (k: string) => string | undefined } {
  return { get: (k: string) => values[k] };
}

function resetRuntime(): void {
  otpRuntime.kind = 'console';
  otpRuntime.smtpConfigured = false;
  otpRuntime.ethereal = null;
  otpRuntime.bootError = undefined;
}

describe('otpTransportMode', () => {
  it('defaults to ethereal in dev when no SMTP and no explicit transport', () => {
    expect(otpTransportMode(fakeConfig({}))).toBe('ethereal');
  });

  it('infers smtp when SMTP_HOST is set', () => {
    expect(otpTransportMode(fakeConfig({ SMTP_HOST: 'smtp.example.com' }))).toBe('smtp');
  });

  it('honors an explicit OTP_TRANSPORT', () => {
    expect(otpTransportMode(fakeConfig({ OTP_TRANSPORT: 'smtp' }))).toBe('smtp');
    expect(otpTransportMode(fakeConfig({ OTP_TRANSPORT: 'ethereal' }))).toBe('ethereal');
    expect(otpTransportMode(fakeConfig({ OTP_TRANSPORT: 'console', SMTP_HOST: 'smtp.example.com' }))).toBe('console');
  });

  it('rejects unknown transport values', () => {
    expect(() => otpTransportMode(fakeConfig({ OTP_TRANSPORT: 'fax' }))).toThrow(/Invalid OTP_TRANSPORT/);
  });
});

describe('buildOtpTransportAsync', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  beforeEach(() => {
    resetRuntime();
    mockedProvision.mockReset();
    mockedCreateTransport.mockReset();
    process.env.NODE_ENV = 'development';
  });
  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('returns the console transport in console mode and reports it', async () => {
    const transport = await buildOtpTransportAsync(fakeConfig({ OTP_TRANSPORT: 'console' }));
    expect(transport).toBeInstanceOf(DevConsoleTransport);
    expect(otpRuntime.kind).toBe('console');
    expect(otpRuntime.smtpConfigured).toBe(false);
  });

  it('throws when smtp is requested without SMTP_HOST', async () => {
    await expect(buildOtpTransportAsync(fakeConfig({ OTP_TRANSPORT: 'smtp' }))).rejects.toThrow(/SMTP_HOST is not set/);
  });

  it('returns an SMTP transport when SMTP_HOST is configured', async () => {
    const transport = await buildOtpTransportAsync(
      fakeConfig({
        SMTP_HOST: 'smtp.example.com',
        SMTP_PORT: '587',
        SMTP_USER: 'u@example.com',
        SMTP_PASS: 's3cret',
        SMTP_FROM: 'ETHIO <no-reply@example.com>',
      }),
    );
    expect(transport).toBeInstanceOf(SmtpEmailTransport);
    expect(transport.kind).toBe('smtp');
    expect(otpRuntime.kind).toBe('smtp');
    expect(otpRuntime.smtpConfigured).toBe(true);
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: { user: 'u@example.com', pass: 's3cret' },
      }),
    );
  });

  it('bootstraps the Ethereal sandbox in dev when nothing is configured', async () => {
    mockedProvision.mockResolvedValue({
      user: 'dev@ethereal.email',
      pass: 'devpass',
      smtp: { host: 'smtp.ethereal.email', port: 587, secure: false },
      web: 'https://ethereal.email/messages',
    });
    const transport = await buildOtpTransportAsync(fakeConfig({}));

    expect(transport).toBeInstanceOf(SmtpEmailTransport);
    expect(transport.kind).toBe('ethereal');
    expect(otpRuntime.kind).toBe('ethereal');
    expect(otpRuntime.ethereal?.configured).toBe(true);
    expect(otpRuntime.ethereal?.previewUrl).toBe('https://ethereal.email/messages');
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.ethereal.email',
        auth: { user: 'dev@ethereal.email', pass: 'devpass' },
      }),
    );
  });

  it('falls back to console delivery when Ethereal provisioning fails', async () => {
    mockedProvision.mockResolvedValue(null);
    const transport = await buildOtpTransportAsync(fakeConfig({}));
    expect(transport).toBeInstanceOf(DevConsoleTransport);
    expect(otpRuntime.kind).toBe('console');
    expect(otpRuntime.bootError).toContain('fell back to console');
  });

  it('refuses to bootstrap Ethereal in production', async () => {
    process.env.NODE_ENV = 'production';
    const transport = await buildOtpTransportAsync(fakeConfig({}));
    expect(transport).toBeInstanceOf(DevConsoleTransport);
    expect(otpRuntime.bootError).toContain('No OTP transport configured for production');
  });
});

describe('SmtpEmailTransport', () => {
  const sendMail = jest.fn().mockResolvedValue({ accepted: ['a@example.com'] });
  beforeEach(() => {
    sendMail.mockClear();
    mockedCreateTransport.mockReturnValue({ sendMail, verify: jest.fn().mockResolvedValue(true), isIdle: () => false });
  });

  it('sends the OTP in an email without leaking the code into the subject', async () => {
    const transport = new SmtpEmailTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'u@example.com',
      pass: 's3cret',
      from: 'ETHIO <no-reply@example.com>',
      tlsRejectUnauthorized: true,
    });

    await transport.send({ to: 'b@example.com', purpose: 'REGISTER_EMAIL', code: '123456' });

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mail = sendMail.mock.calls[0][0] as { from: string; to: string; subject: string; text: string; html: string };
    expect(mail.from).toBe('ETHIO <no-reply@example.com>');
    expect(mail.to).toBe('b@example.com');
    expect(mail.subject).not.toContain('123456');
    expect(mail.text).toContain('123456');
    expect(mail.html).toContain('123456');
  });

  it('disables TLS verification when requested', () => {
    mockedCreateTransport.mockClear();
    new SmtpEmailTransport({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'u@example.com',
      pass: 's3cret',
      from: 'ETHIO <no-reply@example.com>',
      tlsRejectUnauthorized: false,
    });
    expect(mockedCreateTransport).toHaveBeenCalledWith(
      expect.objectContaining({ secure: true, tls: { rejectUnauthorized: false } }),
    );
  });

  it('verifies the SMTP connection lazily', async () => {
    const verify = jest.fn().mockResolvedValue(true);
    mockedCreateTransport.mockReturnValue({ sendMail, verify, isIdle: () => false });
    const transport = new SmtpEmailTransport({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      from: 'ETHIO <no-reply@example.com>',
      tlsRejectUnauthorized: true,
    });
    await transport.verify();
    expect(verify).toHaveBeenCalledTimes(1);
  });
});

describe('DevConsoleTransport', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs the code without throwing outside production', async () => {
    process.env.NODE_ENV = 'development';
    const transport = new DevConsoleTransport();
    await expect(transport.send({ to: 'b@example.com', purpose: 'REGISTER_EMAIL', code: '123456' })).resolves.toBeUndefined();
  });

  it('refuses to deliver in production (forces an SMTP transport)', async () => {
    process.env.NODE_ENV = 'production';
    const transport = new DevConsoleTransport();
    await expect(transport.send({ to: 'b@example.com', purpose: 'REGISTER_EMAIL', code: '123456' })).rejects.toThrow(/No production OTP transport/);
  });
});