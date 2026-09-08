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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmtpEmailTransport_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpEmailTransport = exports.DevConsoleTransport = exports.otpRuntime = exports.OTP_TRANSPORT = void 0;
exports.otpTransportMode = otpTransportMode;
exports.buildOtpTransportAsync = buildOtpTransportAsync;
const common_1 = require("@nestjs/common");
const nodemailer_1 = require("nodemailer");
exports.OTP_TRANSPORT = 'ETHIO_OTP_TRANSPORT';
exports.otpRuntime = {
    kind: 'console',
    smtpConfigured: false,
    ethereal: null,
};
let DevConsoleTransport = class DevConsoleTransport {
    kind = 'console';
    logger = new common_1.Logger('OtpTransport');
    async send(message) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`No production OTP transport configured for ${message.purpose}.`);
        }
        this.logger.log(`[OTP:${message.purpose}] -> ${message.to} | code: ${message.code}`);
    }
    async verify() {
        this.logger.log('OTP transport is "console": connectivity check not applicable.');
    }
};
exports.DevConsoleTransport = DevConsoleTransport;
exports.DevConsoleTransport = DevConsoleTransport = __decorate([
    (0, common_1.Injectable)()
], DevConsoleTransport);
let SmtpEmailTransport = SmtpEmailTransport_1 = class SmtpEmailTransport {
    options;
    kind;
    logger = new common_1.Logger(SmtpEmailTransport_1.name);
    transporter;
    from;
    constructor(options) {
        this.options = options;
        this.from = options.from;
        this.kind = options.kind ?? 'smtp';
        this.transporter = (0, nodemailer_1.createTransport)({
            host: options.host,
            port: options.port,
            secure: options.secure,
            auth: options.user ? { user: options.user, pass: options.pass ?? '' } : undefined,
            tls: options.tlsRejectUnauthorized ? undefined : { rejectUnauthorized: false },
        });
    }
    async send(message) {
        await this.transporter.sendMail({
            from: this.from,
            to: message.to,
            subject: 'Your ETHIO-BRIDGE verification code',
            text: `Your ETHIO-BRIDGE verification code is ${message.code}. ` +
                `It expires in 10 minutes. If you did not request this code, ignore this email.`,
            html: `<p>Your ETHIO-BRIDGE verification code is</p>` +
                `<p style="font-size:28px;font-weight:600;letter-spacing:4px">${message.code}</p>` +
                `<p>It expires in 10 minutes. If you did not request this code, you can safely ignore this email.</p>`,
        });
        this.logger.log(`[OTP:${message.purpose}] email sent via SMTP to ${message.to}`);
    }
    async verify() {
        const t = this.transporter;
        try {
            if (typeof t.close === 'function' && (!t.isIdle || t.isIdle())) {
                t.close();
            }
        }
        catch {
        }
        await t.verify?.();
        this.logger.log(`SMTP connectivity OK for ${this.options.user ?? this.options.host}:${this.options.port}`);
    }
};
exports.SmtpEmailTransport = SmtpEmailTransport;
exports.SmtpEmailTransport = SmtpEmailTransport = SmtpEmailTransport_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], SmtpEmailTransport);
function otpTransportMode(config) {
    const explicit = config.get('OTP_TRANSPORT');
    if (explicit) {
        if (explicit !== 'smtp' && explicit !== 'console' && explicit !== 'ethereal') {
            throw new Error(`Invalid OTP_TRANSPORT "${explicit}". Use "smtp", "ethereal" or "console".`);
        }
        return explicit;
    }
    if (config.get('SMTP_HOST'))
        return 'smtp';
    return 'ethereal';
}
function buildSmtpTransport(config, kind = 'smtp') {
    const host = config.get('SMTP_HOST');
    if (!host) {
        throw new Error('OTP_TRANSPORT is "smtp" but SMTP_HOST is not set.');
    }
    const secure = config.get('SMTP_SECURE') === 'true';
    return new SmtpEmailTransport({
        host,
        port: Number(config.get('SMTP_PORT') ?? (secure ? 465 : 587)),
        secure,
        user: config.get('SMTP_USER') ?? undefined,
        pass: config.get('SMTP_PASS') ?? undefined,
        from: config.get('SMTP_FROM') ?? 'ETHIO-BRIDGE <no-reply@ethio-bridge.local>',
        tlsRejectUnauthorized: config.get('SMTP_TLS_REJECT_UNAUTHORIZED') !== 'false',
        kind,
    });
}
async function buildOtpTransportAsync(config) {
    const smtpHost = config.get('SMTP_HOST');
    const isProduction = process.env.NODE_ENV === 'production';
    const mode = otpTransportMode(config);
    if (mode === 'smtp' && !smtpHost) {
        throw new Error('OTP_TRANSPORT is "smtp" but SMTP_HOST is not set.');
    }
    if (mode === 'smtp') {
        exports.otpRuntime.kind = 'smtp';
        exports.otpRuntime.smtpConfigured = true;
        exports.otpRuntime.ethereal = null;
        exports.otpRuntime.bootError = undefined;
        return buildSmtpTransport(config);
    }
    if (mode === 'console') {
        exports.otpRuntime.kind = 'console';
        exports.otpRuntime.smtpConfigured = false;
        exports.otpRuntime.ethereal = null;
        exports.otpRuntime.bootError = undefined;
        return new DevConsoleTransport();
    }
    if (isProduction && config.get('OTP_TRANSPORT') !== 'ethereal') {
        exports.otpRuntime.kind = 'console';
        exports.otpRuntime.smtpConfigured = false;
        exports.otpRuntime.ethereal = null;
        exports.otpRuntime.bootError =
            'No OTP transport configured for production: set SMTP_HOST (and OTP_TRANSPORT="smtp") so verification codes can be emailed.';
        return new DevConsoleTransport();
    }
    const { provisionEtherealAccount } = await Promise.resolve().then(() => __importStar(require('./ethereal')));
    const account = await provisionEtherealAccount(new common_1.Logger('OtpTransport'));
    if (account) {
        exports.otpRuntime.kind = 'ethereal';
        exports.otpRuntime.smtpConfigured = false;
        exports.otpRuntime.ethereal = {
            configured: true,
            previewUrl: account.web,
            account: account.user,
        };
        exports.otpRuntime.bootError = undefined;
        const transport = new SmtpEmailTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            user: account.user,
            pass: account.pass,
            from: `ETHIO-BRIDGE <${account.user}>`,
            tlsRejectUnauthorized: false,
            kind: 'ethereal',
        });
        transport
            .verify()
            .catch((e) => common_1.Logger.warn(`Ethereal SMTP connectivity check failed: ${e.message}`, 'OtpTransport'));
        return transport;
    }
    exports.otpRuntime.kind = 'console';
    exports.otpRuntime.smtpConfigured = false;
    exports.otpRuntime.ethereal = null;
    exports.otpRuntime.bootError =
        'Ethereal sandbox provisioning failed (network?) - fell back to console delivery. Check the API log.';
    return new DevConsoleTransport();
}
//# sourceMappingURL=otp-transport.js.map