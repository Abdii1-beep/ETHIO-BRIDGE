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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("../../prisma/prisma.service");
const otp_transport_1 = require("../../auth/otp-transport");
let HealthService = HealthService_1 = class HealthService {
    prisma;
    config;
    logger = new common_1.Logger(HealthService_1.name);
    redis;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const url = this.config.get('REDIS_URL');
        if (url) {
            this.redis = new ioredis_1.default(url, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                retryStrategy: () => null,
                reconnectOnError: () => false,
                enableOfflineQueue: false,
            });
            this.redis.on('error', () => { });
        }
        else {
            this.redis = null;
        }
    }
    async onModuleDestroy() {
        if (this.redis) {
            await this.redis.quit().catch(() => undefined);
        }
    }
    async check() {
        const db = await this.checkDb();
        const redis = await this.checkRedis();
        const otp = {
            transport: otp_transport_1.otpRuntime.kind,
            smtpConfigured: otp_transport_1.otpRuntime.smtpConfigured,
            ethereal: otp_transport_1.otpRuntime.ethereal ? { configured: true, previewUrl: otp_transport_1.otpRuntime.ethereal.previewUrl } : { configured: false },
            ...(otp_transport_1.otpRuntime.bootError ? { bootError: otp_transport_1.otpRuntime.bootError } : {}),
        };
        return {
            status: db === 'up' && redis !== 'down' ? 'ok' : 'degraded',
            db,
            redis,
            otp,
            timestamp: new Date().toISOString(),
        };
    }
    async checkDb() {
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return 'up';
        }
        catch {
            return 'down';
        }
    }
    async checkRedis() {
        if (!this.redis) {
            return 'disabled';
        }
        try {
            if (this.redis.status === 'wait' || this.redis.status === 'end') {
                await this.redis.connect();
            }
            const pong = await this.redis.ping();
            return pong === 'PONG' ? 'up' : 'down';
        }
        catch (e) {
            this.logger.debug(`Redis unavailable: ${e.message}`);
            return 'down';
        }
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], HealthService);
//# sourceMappingURL=health.service.js.map