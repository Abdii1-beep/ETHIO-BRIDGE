"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiModule = void 0;
const common_1 = require("@nestjs/common");
const ai_controller_1 = require("./ai.controller");
const ai_service_1 = require("./ai.service");
const translation_service_1 = require("./translation.service");
const prisma_module_1 = require("../prisma/prisma.module");
const audit_service_1 = require("../audit/audit.service");
const monetization_module_1 = require("../monetization/monetization.module");
let AiModule = class AiModule {
};
exports.AiModule = AiModule;
exports.AiModule = AiModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, audit_service_1.AuditModule, monetization_module_1.MonetizationModule],
        controllers: [ai_controller_1.AiController],
        providers: [ai_service_1.AiService, translation_service_1.TranslationService],
        exports: [ai_service_1.AiService, translation_service_1.TranslationService],
    })
], AiModule);
//# sourceMappingURL=ai.module.js.map