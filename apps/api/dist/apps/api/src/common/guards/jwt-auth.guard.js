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
exports.JwtAuthGuard = exports.CurrentUser = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const errors_1 = require("../errors");
const request_store_1 = require("../request-store");
exports.IS_PUBLIC_KEY = 'ehio_is_public';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    return ctx.switchToHttp().getRequest().user;
});
let JwtAuthGuard = class JwtAuthGuard {
    reflector;
    jwt;
    config;
    constructor(reflector, jwt, config) {
        this.reflector = reflector;
        this.jwt = jwt;
        this.config = config;
    }
    async canActivate(ctx) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const req = ctx.switchToHttp().getRequest();
        const token = this.extractBearerToken(req.headers.authorization);
        if (!token) {
            throw new errors_1.UnauthorizedError('Missing bearer token.');
        }
        try {
            const payload = await this.jwt.verifyAsync(token, {
                secret: this.config.get('JWT_ACCESS_SECRET'),
            });
            req.user = payload;
            (0, request_store_1.updateRequestStore)({ userId: payload.sub });
            return true;
        }
        catch {
            throw new errors_1.UnauthorizedError('Invalid or expired access token.');
        }
    }
    extractBearerToken(header) {
        if (!header) {
            return undefined;
        }
        const [scheme, token] = header.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token) {
            return undefined;
        }
        return token;
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService])
], JwtAuthGuard);
//# sourceMappingURL=jwt-auth.guard.js.map