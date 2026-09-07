import { Logger } from '@nestjs/common';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface EtherealAccount {
  user: string;
  pass: string;
  smtp: { host: string; port: number; secure: boolean };
  web: string;
}

export const ETHEREAL_ACCOUNT_FILE =
  process.env.ETHEREAL_ACCOUNT_FILE ?? path.join(process.cwd(), '.ethereal.env');

let provisionPromise: Promise<EtherealAccount | null> | null = null;

function readAccountFile(logger: Logger): EtherealAccount | null {
  try {
    if (!fs.existsSync(ETHEREAL_ACCOUNT_FILE)) return null;
    const raw = fs.readFileSync(ETHEREAL_ACCOUNT_FILE, 'utf8');
    const map = new Map<string, string>();
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/.exec(line);
      if (match) map.set(match[1], match[2]);
    }
    if (!map.has('USER') || !map.has('PASS')) return null;
    return {
      user: map.get('USER')!,
      pass: map.get('PASS')!,
      smtp: {
        host: map.get('SMTP_HOST') ?? 'smtp.ethereal.email',
        port: Number(map.get('SMTP_PORT') ?? '587'),
        secure: map.get('SMTP_SECURE') === 'true',
      },
      web: map.get('WEB') ?? 'https://ethereal.email',
    };
  } catch (e) {
    logger.warn(`Could not read Ethereal account file: ${(e as Error).message}`);
    return null;
  }
}

function writeAccountFile(account: EtherealAccount, logger: Logger): void {
  try {
    fs.writeFileSync(
      ETHEREAL_ACCOUNT_FILE,
      [
        `USER="${account.user}"`,
        `PASS="${account.pass}"`,
        `SMTP_HOST="${account.smtp.host}"`,
        `SMTP_PORT="${account.smtp.port}"`,
        `SMTP_SECURE="${account.smtp.secure}"`,
        `WEB="${account.web}"`,
        '',
      ].join('\n'),
      'utf8',
    );
  } catch (e) {
    logger.warn(`Could not persist Ethereal account file: ${(e as Error).message}`);
  }
}

/**
 * Returns a free nodemailer Ethereal sandbox SMTP account for dev-only delivery so the
 * real SMTP code path is exercised without any external credentials. Messages land in the
 * Ethereal web preview inbox (previewUrl), never in a real mailbox. The account file is
 * cached so restarts reuse the same inbox. Concurrent callers share a single provisioning.
 */
export function provisionEtherealAccount(logger: Logger): Promise<EtherealAccount | null> {
  if (!provisionPromise) {
    provisionPromise = doProvision(logger).finally(() => {
      provisionPromise = null;
    });
  }
  return provisionPromise;
}

async function doProvision(logger: Logger): Promise<EtherealAccount | null> {
  const cached = readAccountFile(logger);
  if (cached) return cached;

  try {
    const res = await fetch('https://api.nodemailer.com/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // The API requires requestor + version metadata.
      body: JSON.stringify({
        requestor: process.env.ETHEREAL_REQUESTOR ?? 'ehio-bridge',
        version: process.env.ETHEREAL_VERSION ?? '0.1.0',
      }),
    });
    if (!res.ok) {
      logger.warn(`Ethereal provisioning failed (HTTP ${res.status}).`);
      return null;
    }
    const data = (await res.json()) as {
      status?: string;
      user?: string;
      pass?: string;
      web?: string;
      smtp?: { host?: string; port?: number; secure?: boolean };
    };
    if (data.status !== 'success' || !data.user || !data.pass) {
      logger.warn('Ethereal provisioning returned an unexpected payload.');
      return null;
    }
    const account: EtherealAccount = {
      user: data.user,
      pass: data.pass,
      smtp: {
        host: data.smtp?.host ?? 'smtp.ethereal.email',
        port: data.smtp?.port ?? 587,
        secure: data.smtp?.secure ?? false,
      },
      web: data.web ?? 'https://ethereal.email',
    };
    writeAccountFile(account, logger);
    return account;
  } catch (e) {
    logger.warn(`Ethereal provisioning failed: ${(e as Error).message}`);
    return null;
  }
}