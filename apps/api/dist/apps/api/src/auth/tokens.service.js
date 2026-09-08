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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokensService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const errors_1 = require("../common/errors");
const prisma_service_1 = require("../prisma/prisma.service");
const otp_util_1 = require("./otp.util");
let TokensService = class TokensService {
    jwt;
    config;
    prisma;
    constructor(jwt, config, prisma) {
        this.jwt = jwt;
        this.config = config;
        this.prisma = prisma;
    }
    async issueAccessToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
            platformRole: user.platformRole ?? null,
        };
        return this.jwt.signAsync(payload, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: (this.config.get('JWT_ACCESS_TTL') ?? '15m'),
        });
    }
    async issueRefreshToken(userId) {
        const raw = (0, otp_util_1.randomToken)(48);
        const ttlDays = Number(this.config.get('JWT_REFRESH_TTL_DAYS') ?? 30);
        await this.prisma.refreshToken.create({
            data: {
                userId,
                tokenHash: (0, otp_util_1.sha256)(raw),
                expiresAt: new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000),
            },
        });
        return raw;
    }
    async issueTokenPair(user) {
        const accessToken = await this.issueAccessToken(user);
        const refreshToken = await this.issueRefreshToken(user.id);
        const expiresInSeconds = this.parseTtlSeconds(this.config.get('JWT_ACCESS_TTL') ?? '15m');
        return { accessToken, refreshToken, expiresInSeconds };
    }
    async rotateRefreshToken(rawRefreshToken) {
        const hashed = (0, otp_util_1.sha256)(rawRefreshToken);
        const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: hashed } });
        if (!stored || stored.revokedAt) {
            throw new errors_1.UnauthorizedError('Invalid or revoked refresh token.');
        }
        if (stored.expiresAt < new Date()) {
            await this.prisma.refreshToken.update({
                where: { id: stored.id },
                data: { revokedAt: new Date() },
            });
            throw new errors_1.UnauthorizedError('Refresh token has expired.');
        }
        const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
        if (!user || !user.isActive) {
            throw new errors_1.ApiError('ACCOUNT_DISABLED', 'This account is disabled.', 403);
        }
        const rawNew = (0, otp_util_1.randomToken)(48);
        const accessToken = await this.issueAccessToken(user);
        const refreshToken = await this.issueRefreshToken(user.id);
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date(), replacedById: refreshToken },
        });
        const expiresInSeconds = this.parseTtlSeconds(this.config.get('JWT_ACCESS_TTL') ?? '15m');
        return { accessToken, refreshToken, expiresInSeconds };
    }
    async revokeRefreshToken(rawRefreshToken) {
        const hashed = (0, otp_util_1.sha256)(rawRefreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { tokenHash: hashed, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    parseTtlSeconds(ttl) {
        const match = /^(\d+)([smhd])$/.exec(ttl);
        if (!match) {
            return 900;
        }
        const value = Number(match[1]);
        switch (match[2]) {
            case 's':
                return value;
            case 'm':
                return value * 60;
            case 'h':
                return value * 3600;
            case 'd':
                return value * 86400;
            default:
                return 900;
        }
    }
};
exports.TokensService = TokensService;
exports.TokensService = TokensService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        prisma_service_1.PrismaService])
], TokensService);
//# sourceMappingURL=tokens.service.js.map