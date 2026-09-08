"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const members_controller_1 = require("./members.controller");
const members_service_1 = require("./members.service");
const otp_transport_1 = require("../auth/otp-transport");
let MembersModule = class MembersModule {
};
exports.MembersModule = MembersModule;
exports.MembersModule = MembersModule = __decorate([
    (0, common_1.Module)({
        controllers: [members_controller_1.MembersController],
        providers: [
            members_service_1.MembersService,
            {
                provide: otp_transport_1.OTP_TRANSPORT,
                useFactory: (config) => (0, otp_transport_1.buildOtpTransportAsync)(config),
                inject: [config_1.ConfigService],
            },
        ],
    })
], MembersModule);
//# sourceMappingURL=members.module.js.map