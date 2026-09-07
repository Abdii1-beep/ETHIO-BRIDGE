import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';

export interface OtpMessage {
  to: string;
  purpose: string;
  code: string;
}

export type OtpTransportKind = 'console' | 'smtp' | 'ethereal';

export interface OtpTransport {
  /** What backend is carrying the message. */
  readonly kind: OtpTransportKind;
  send(message: OtpMessage): Promise<void>;
  /** Lightweight connectivity check (SMTP handshake). No-op for console/ethereal. */
  verify(): Promise<void>;
}

export interface SmtpOptions {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  tlsRejectUnauthorized: boolean;
  kind?: OtpTransportKind;
}

export const OTP_TRANSPORT = 'ETHIO_OTP_TRANSPORT';

/**
 * Shared, post-boot facts about the active transport so synchronous code (health checks,
 * admin status) can describe it without awaiting the async factory.
 */
export const otpRuntime: {
  kind: OtpTransportKind;
  smtpConfigured: boolean;
  ethereal: { configured: boolean; previewUrl?: string; account?: string } | null;
  bootError?: string;
} = {
  kind: 'console',
  smtpConfigured: false,
  ethereal: null,
};

/**
 * Provider-based OTP delivery. The interface is the contract; the concrete transport is
 * configurable. The default dev transport logs the code to the API console so flows are
 * testable end-to-end without an external email/SMS provider (delivery provider boundary).
 */
@Injectable()
export class DevConsoleTransport implements OtpTransport {
  readonly kind: OtpTransportKind = 'console';
  private readonly logger = new Logger('OtpTransport');

  async send(message: OtpMessage): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`No production OTP transport configured for ${message.purpose}.`);
    }
    this.logger.log(`[OTP:${message.purpose}] -> ${message.to} | code: ${message.code}`);
  }

  async verify(): Promise<void> {
    this.logger.log('OTP transport is "console": connectivity check not applicable.');
  }
}

/**
 * Real email delivery via SMTP (nodemailer). Used for configured SMTP (kind "smtp") and
 * for the dev-only Ethereal sandbox (kind "ethereal").
 */
@Injectable()
export class SmtpEmailTransport implements OtpTransport {
  readonly kind: OtpTransportKind;
  private readonly logger = new Logger(SmtpEmailTransport.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor(private readonly options: SmtpOptions) {
    this.from = options.from;
    this.kind = options.kind ?? 'smtp';
    this.transporter = createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth: options.user ? { user: options.user, pass: options.pass ?? '' } : undefined,
      tls: options.tlsRejectUnauthorized ? undefined : { rejectUnauthorized: false },
    });
  }

  async send(message: OtpMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: 'Your ETHIO-BRIDGE verification code',
      text:
        `Your ETHIO-BRIDGE verification code is ${message.code}. ` +
        `It expires in 10 minutes. If you did not request this code, ignore this email.`,
      html:
        `<p>Your ETHIO-BRIDGE verification code is</p>` +
        `<p style="font-size:28px;font-weight:600;letter-spacing:4px">${message.code}</p>` +
        `<p>It expires in 10 minutes. If you did not request this code, you can safely ignore this email.</p>`,
    });
    this.logger.log(`[OTP:${message.purpose}] email sent via SMTP to ${message.to}`);
  }

  async verify(): Promise<void> {
    const t = this.transporter as unknown as {
      verify?: () => Promise<unknown>;
      isIdle?: () => boolean;
      close?: () => void;
    };
    try {
      if (typeof t.close === 'function' && (!t.isIdle || t.isIdle())) {
        t.close();
      }
    } catch {
      // close is opportunistic; a fresh connection is opened by verify().
    }
    await t.verify?.();
    this.logger.log(
      `SMTP connectivity OK for ${this.options.user ?? this.options.host}:${this.options.port}`,
    );
  }
}

export type OtpTransportMode = 'console' | 'smtp' | 'ethereal';

export function otpTransportMode(config: Pick<ConfigService, 'get'>): OtpTransportMode {
  const explicit = config.get<string>('OTP_TRANSPORT');
  if (explicit) {
    if (explicit !== 'smtp' && explicit !== 'console' && explicit !== 'ethereal') {
      throw new Error(
        `Invalid OTP_TRANSPORT "${explicit}". Use "smtp", "ethereal" or "console".`,
      );
    }
    return explicit;
  }
  if (config.get<string>('SMTP_HOST')) return 'smtp';
  return 'ethereal';
}

function buildSmtpTransport(config: Pick<ConfigService, 'get'>, kind: OtpTransportKind = 'smtp'): SmtpEmailTransport {
  const host = config.get<string>('SMTP_HOST');
  if (!host) {
    throw new Error('OTP_TRANSPORT is "smtp" but SMTP_HOST is not set.');
  }
  const secure = config.get<string>('SMTP_SECURE') === 'true';
  return new SmtpEmailTransport({
    host,
    port: Number(config.get<string>('SMTP_PORT') ?? (secure ? 465 : 587)),
    secure,
    user: config.get<string>('SMTP_USER') ?? undefined,
    pass: config.get<string>('SMTP_PASS') ?? undefined,
    from: config.get<string>('SMTP_FROM') ?? 'ETHIO-BRIDGE <no-reply@ethio-bridge.local>',
    tlsRejectUnauthorized: config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false',
    kind,
  });
}

/**
 * Resolves the OTP transport for a module. Selection order (see otpTransportMode):
 *  - "smtp"    -> SMTP via SMTP_* env (SMTP_HOST required; throws a clear error otherwise)
 *  - "console" -> logs the code to the API log
 *  - "ethereal" (default in dev) -> real SMTP against the Ethereal sandbox (preview inbox,
 *                                   no credentials). Falls back to console on failure.
 * In production with nothing configured, the console transport is returned but refuses to
 * deliver, surfacing the misconfiguration with a boot error.
 */
export async function buildOtpTransportAsync(
  config: Pick<ConfigService, 'get'>,
): Promise<OtpTransport> {
  const smtpHost = config.get<string>('SMTP_HOST');
  const isProduction = process.env.NODE_ENV === 'production';
  const mode = otpTransportMode(config);

  if (mode === 'smtp' && !smtpHost) {
    throw new Error('OTP_TRANSPORT is "smtp" but SMTP_HOST is not set.');
  }
  if (mode === 'smtp') {
    otpRuntime.kind = 'smtp';
    otpRuntime.smtpConfigured = true;
    otpRuntime.ethereal = null;
    otpRuntime.bootError = undefined;
    return buildSmtpTransport(config);
  }
  if (mode === 'console') {
    otpRuntime.kind = 'console';
    otpRuntime.smtpConfigured = false;
    otpRuntime.ethereal = null;
    otpRuntime.bootError = undefined;
    return new DevConsoleTransport();
  }

  // mode === 'ethereal': sandbox is the dev default; in production it must be explicit.
  if (isProduction && config.get<string>('OTP_TRANSPORT') !== 'ethereal') {
    otpRuntime.kind = 'console';
    otpRuntime.smtpConfigured = false;
    otpRuntime.ethereal = null;
    otpRuntime.bootError =
      'No OTP transport configured for production: set SMTP_HOST (and OTP_TRANSPORT="smtp") so verification codes can be emailed.';
    return new DevConsoleTransport();
  }

  // Dev bootstrap: exercise the real SMTP path against the Ethereal sandbox.
  const { provisionEtherealAccount } = await import('./ethereal');
  const account = await provisionEtherealAccount(new Logger('OtpTransport'));
  if (account) {
    otpRuntime.kind = 'ethereal';
    otpRuntime.smtpConfigured = false;
    otpRuntime.ethereal = {
      configured: true,
      previewUrl: account.web,
      account: account.user,
    };
    otpRuntime.bootError = undefined;
    const transport = new SmtpEmailTransport({
      host: account.smtp.host,
      port: account.smtp.port,
      secure: account.smtp.secure,
      user: account.user,
      pass: account.pass,
      from: `ETHIO-BRIDGE <${account.user}>`,
      // Ethereal's sandbox SMTP uses an internal CA; nodemailer's docs require disabling
      // cert verification for the sandbox transport.
      tlsRejectUnauthorized: false,
      kind: 'ethereal',
    });

    transport
      .verify()
      .catch((e: Error) =>
        Logger.warn(
          `Ethereal SMTP connectivity check failed: ${e.message}`,
          'OtpTransport',
        ),
      );
    return transport;
  }

  otpRuntime.kind = 'console';
  otpRuntime.smtpConfigured = false;
  otpRuntime.ethereal = null;
  otpRuntime.bootError =
    'Ethereal sandbox provisioning failed (network?) - fell back to console delivery. Check the API log.';
  return new DevConsoleTransport();
}