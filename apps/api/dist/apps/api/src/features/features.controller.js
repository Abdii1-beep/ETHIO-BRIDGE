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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeaturesController = void 0;
const common_1 = require("@nestjs/common");
const features_service_1 = require("./features.service");
const org_member_guard_1 = require("../common/guards/org-member.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
let FeaturesController = class FeaturesController {
    features;
    constructor(features) {
        this.features = features;
    }
    catalog(member) {
        return this.features.catalog(member);
    }
    myFeatures(member) {
        return this.features.myFeatures(member);
    }
    request(member, dto) {
        return this.features.request(member, dto);
    }
    activate(member, id, dto) {
        return this.features.activate(member, id, dto.note);
    }
    deactivate(member, id) {
        return this.features.deactivate(member, id);
    }
};
exports.FeaturesController = FeaturesController;
__decorate([
    (0, permissions_guard_1.RequirePermissions)('features.view'),
    (0, common_1.Get)('features'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "catalog", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('features.view'),
    (0, common_1.Get)('organizations/me/features'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "myFeatures", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('features.request'),
    (0, common_1.Post)('features/request'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, features_service_1.FeatureRequestDto]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "request", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('features.activate'),
    (0, common_1.Post)('features/:id/activate'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "activate", null);
__decorate([
    (0, permissions_guard_1.RequirePermissions)('features.manage'),
    (0, common_1.Post)('features/:id/deactivate'),
    __param(0, (0, org_member_guard_1.CurrentMember)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], FeaturesController.prototype, "deactivate", null);
exports.FeaturesController = FeaturesController = __decorate([
    (0, org_member_guard_1.RequiresMember)(),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [features_service_1.FeaturesService])
], FeaturesController);
//# sourceMappingURL=features.controller.js.map