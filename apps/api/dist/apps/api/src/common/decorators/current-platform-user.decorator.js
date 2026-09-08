"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentPlatformUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentPlatformUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    return ctx.switchToHttp().getRequest().platformUser;
});
//# sourceMappingURL=current-platform-user.decorator.js.map