"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const password_service_1 = require("./password.service");
const otp_service_1 = require("./otp.service");
const otp_transport_1 = require("./otp-transport");
const tokens_service_1 = require("./tokens.service");
const audit_service_1 = require("../audit/audit.service");
const errors_1 = require("../common/errors");
const shared_1 = require("../shared");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    password;
    otp;
    tokens;
    audit;
    config;
    otpTransport;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, password, otp, tokens, audit, config, otpTransport) {
        this.prisma = prisma;
        this.password = password;
        this.otp = otp;
        this.tokens = tokens;
        this.audit = audit;
        this.config = config;
        this.otpTransport = otpTransport;
    }
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new errors_1.ConflictError('An account with this email already exists.');
        }
        const passwordHash = await this.password.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                phone: dto.phone,
                passwordHash,
                preferredLanguage: dto.preferredLanguage ?? 'en',
                isEmailVerified: !this.isOtpRequired(),
            },
        });
        await this.audit.record({ action: shared_1.AUDIT_ACTIONS.REGISTER, userId: user.id });
        if (this.isOtpRequired()) {
            const code = await this.otp.generateForUser(user.id, 'REGISTER_EMAIL', user.email);
            await this.deliverOtp('REGISTER_EMAIL', user.email, code);
            return { userId: user.id, ...this.devOtp(code) };
        }
        await this.recordLoginAttempt(user.email, user.id, true, undefined);
        const pair = await this.tokens.issueTokenPair(user);
        return { ...pair, user: this.publicUser(user) };
    }
    async verifyEmail(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new errors_1.NotFoundError('No account found for this email.');
        }
        await this.otp.verifyForUser(user.id, 'REGISTER_EMAIL', dto.code, user.email);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { isEmailVerified: true },
        });
        return { verified: true };
    }
    async resendOtp(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            throw new errors_1.NotFoundError('No account found for this email.');
        }
        const code = await this.otp.generateForUser(user.id, 'REGISTER_EMAIL', user.email);
        await this.deliverOtp('REGISTER_EMAIL', user.email, code);
        return { sent: true, ...this.devOtp(code) };
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (!user) {
            await this.recordLoginAttempt(dto.email, null, false, 'no_such_account');
            throw new errors_1.UnauthorizedError('Invalid email or password.');
        }
        if (!user.isActive) {
            throw new errors_1.ApiError('ACCOUNT_DISABLED', 'This account is disabled.', 403);
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            throw new errors_1.ApiError('ACCOUNT_LOCKED', 'This account is temporarily locked. Try again later.', 403);
        }
        if (user.approvalStatus !== 'APPROVED' && !user.platformRole) {
            throw new errors_1.ApiError('ACCOUNT_PENDING_APPROVAL', 'Your account is pending approval from the platform administrator.', 403);
        }
        const ok = await this.password.compare(dto.password, user.passwordHash);
        if (!ok) {
            const failed = user.failedLoginCount + 1;
            const lockedUntil = failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
            await this.prisma.user.update({
                where: { id: user.id },
                data: { failedLoginCount: failed, lockedUntil },
            });
            await this.recordLoginAttempt(dto.email, user.id, false, 'wrong_password');
            throw new errors_1.UnauthorizedError('Invalid email or password.');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
        });
        await this.recordLoginAttempt(dto.email, user.id, true, undefined);
        await this.audit.record({ action: shared_1.AUDIT_ACTIONS.LOGIN, userId: user.id, metadata: { email: user.email } });
        const pair = await this.tokens.issueTokenPair(user);
        return { ...pair, user: this.publicUser(user) };
    }
    async refresh(dto) {
        return this.tokens.rotateRefreshToken(dto.refreshToken);
    }
    async logout(dto) {
        await this.tokens.revokeRefreshToken(dto.refreshToken);
        return { loggedOut: true };
    }
    async me(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isActive) {
            throw new errors_1.UnauthorizedError();
        }
        const rows = await this.prisma.organizationMember.findMany({
            where: { userId: user.id },
            include: {
                organization: {
                    select: { id: true, legalName: true, tradingName: true, verificationLevel: true, status: true },
                },
                roleAssignments: {
                    include: {
                        role: {
                            include: {
                                permissions: {
                                    where: { permission: { isActive: true } },
                                    include: { permission: { select: { id: true, code: true, category: true, nameKey: true } } },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { joinedAt: 'asc' },
        });
        const memberships = rows.map((m) => ({
            status: m.status,
            title: m.title,
            organization: m.organization,
            roles: m.roleAssignments.map((ra) => ({
                id: ra.role.id,
                name: ra.role.name,
                code: ra.role.code,
                isBuiltIn: ra.role.isBuiltIn,
                permissions: ra.role.permissions.map((rp) => rp.permission),
            })),
        }));
        return { ...this.publicUser(user), memberships };
    }
    async updateProfile(userId, dto) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new errors_1.NotFoundError('User not found.');
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(dto.name !== undefined ? { name: dto.name } : {}),
                ...(dto.preferredLanguage !== undefined ? { preferredLanguage: dto.preferredLanguage } : {}),
            },
        });
    }
    async deliverOtp(purpose, to, code) {
        try {
            await this.otpTransport.send({ to, purpose, code });
        }
        catch (e) {
            const message = e.message ?? 'unknown';
            this.logger.error(`OTP delivery failed [${purpose}] -> ${to}: ${message}`);
            throw new errors_1.ApiError('OTP_DELIVERY_FAILED', 'Could not deliver the verification code. Please try again.', 502);
        }
    }
    devOtp(code) {
        if (process.env.NODE_ENV === 'production') {
            return {};
        }
        return { devOtpCode: code };
    }
    isOtpRequired() {
        return this.config.get('OTP_REQUIRED') === 'true';
    }
    async recordLoginAttempt(email, userId, success, reason) {
        await this.prisma.loginAttempt.create({
            data: { email, userId, success, reason },
        });
    }
    publicUser(user) {
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            preferredLanguage: user.preferredLanguage,
            platformRole: user.platformRole ?? null,
            isEmailVerified: user.isEmailVerified,
            isPhoneVerified: user.isPhoneVerified ?? false,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, common_1.Inject)(otp_transport_1.OTP_TRANSPORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        password_service_1.PasswordService,
        otp_service_1.OtpService,
        tokens_service_1.TokensService,
        audit_service_1.AuditService,
        config_1.ConfigService, Object])
], AuthService);
//# sourceMappingURL=auth.service.js.map