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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const errors_1 = require("../common/errors");
const prisma_service_1 = require("../prisma/prisma.service");
const otp_util_1 = require("./otp.util");
let OtpService = class OtpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateForUser(userId, purpose, target, channel = 'EMAIL') {
        const code = (0, otp_util_1.randomDigits)(6);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await this.prisma.otpCode.create({
            data: {
                userId,
                purpose,
                channel,
                target,
                codeHash: this.hash(code),
                expiresAt,
            },
        });
        return code;
    }
    async verifyForUser(userId, purpose, code, target) {
        const otp = await this.prisma.otpCode.findFirst({
            where: { userId, purpose, target, consumedAt: null, verifiedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp) {
            throw new errors_1.ApiError('INVALID_OTP', 'Invalid or missing verification code.', 400);
        }
        if (otp.expiresAt < new Date()) {
            throw new errors_1.ApiError('OTP_EXPIRED', 'This verification code has expired.', 400);
        }
        if (otp.attempts >= otp.maxAttempts) {
            throw new errors_1.ApiError('OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect attempts. Request a new code.', 400);
        }
        if (otp.codeHash !== this.hash(code)) {
            await this.prisma.otpCode.update({
                where: { id: otp.id },
                data: { attempts: otp.attempts + 1 },
            });
            throw new errors_1.ApiError('INVALID_OTP', 'Incorrect verification code.', 400);
        }
        await this.prisma.otpCode.update({
            where: { id: otp.id },
            data: { consumedAt: new Date(), verifiedAt: new Date() },
        });
        return true;
    }
    hash(code) {
        return (0, crypto_1.createHash)('sha256').update(code).digest('hex');
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OtpService);
//# sourceMappingURL=otp.service.js.map