"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ETHEREAL_ACCOUNT_FILE = void 0;
exports.provisionEtherealAccount = provisionEtherealAccount;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
exports.ETHEREAL_ACCOUNT_FILE = process.env.ETHEREAL_ACCOUNT_FILE ?? path.join(process.cwd(), '.ethereal.env');
let provisionPromise = null;
function readAccountFile(logger) {
    try {
        if (!fs.existsSync(exports.ETHEREAL_ACCOUNT_FILE))
            return null;
        const raw = fs.readFileSync(exports.ETHEREAL_ACCOUNT_FILE, 'utf8');
        const map = new Map();
        for (const line of raw.split(/\r?\n/)) {
            const match = /^\s*([A-Z_]+)\s*=\s*"?(.*?)"?\s*$/.exec(line);
            if (match)
                map.set(match[1], match[2]);
        }
        if (!map.has('USER') || !map.has('PASS'))
            return null;
        return {
            user: map.get('USER'),
            pass: map.get('PASS'),
            smtp: {
                host: map.get('SMTP_HOST') ?? 'smtp.ethereal.email',
                port: Number(map.get('SMTP_PORT') ?? '587'),
                secure: map.get('SMTP_SECURE') === 'true',
            },
            web: map.get('WEB') ?? 'https://ethereal.email',
        };
    }
    catch (e) {
        logger.warn(`Could not read Ethereal account file: ${e.message}`);
        return null;
    }
}
function writeAccountFile(account, logger) {
    try {
        fs.writeFileSync(exports.ETHEREAL_ACCOUNT_FILE, [
            `USER="${account.user}"`,
            `PASS="${account.pass}"`,
            `SMTP_HOST="${account.smtp.host}"`,
            `SMTP_PORT="${account.smtp.port}"`,
            `SMTP_SECURE="${account.smtp.secure}"`,
            `WEB="${account.web}"`,
            '',
        ].join('\n'), 'utf8');
    }
    catch (e) {
        logger.warn(`Could not persist Ethereal account file: ${e.message}`);
    }
}
function provisionEtherealAccount(logger) {
    if (!provisionPromise) {
        provisionPromise = doProvision(logger).finally(() => {
            provisionPromise = null;
        });
    }
    return provisionPromise;
}
async function doProvision(logger) {
    const cached = readAccountFile(logger);
    if (cached)
        return cached;
    try {
        const res = await fetch('https://api.nodemailer.com/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                requestor: process.env.ETHEREAL_REQUESTOR ?? 'ehio-bridge',
                version: process.env.ETHEREAL_VERSION ?? '0.1.0',
            }),
        });
        if (!res.ok) {
            logger.warn(`Ethereal provisioning failed (HTTP ${res.status}).`);
            return null;
        }
        const data = (await res.json());
        if (data.status !== 'success' || !data.user || !data.pass) {
            logger.warn('Ethereal provisioning returned an unexpected payload.');
            return null;
        }
        const account = {
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
    }
    catch (e) {
        logger.warn(`Ethereal provisioning failed: ${e.message}`);
        return null;
    }
}
//# sourceMappingURL=ethereal.js.map