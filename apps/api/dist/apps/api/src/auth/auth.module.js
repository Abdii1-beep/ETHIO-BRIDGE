"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const password_service_1 = require("./password.service");
const otp_service_1 = require("./otp.service");
const tokens_service_1 = require("./tokens.service");
const otp_transport_1 = require("./otp-transport");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
Object.defineProperty(exports, "JwtAuthGuard", { enumerable: true, get: function () { return jwt_auth_guard_1.JwtAuthGuard; } });
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            jwt_1.JwtModule.registerAsync({
                useFactory: (config) => ({
                    secret: config.get('JWT_ACCESS_SECRET'),
                    signOptions: {
                        expiresIn: (config.get('JWT_ACCESS_TTL') || '15m'),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            password_service_1.PasswordService,
            otp_service_1.OtpService,
            tokens_service_1.TokensService,
            {
                provide: otp_transport_1.OTP_TRANSPORT,
                useFactory: (config) => (0, otp_transport_1.buildOtpTransportAsync)(config),
                inject: [config_1.ConfigService],
            },
        ],
        exports: [tokens_service_1.TokensService, password_service_1.PasswordService, otp_service_1.OtpService, otp_transport_1.OTP_TRANSPORT, jwt_1.JwtModule],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map