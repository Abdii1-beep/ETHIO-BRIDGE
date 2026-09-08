"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageInterceptor = void 0;
const common_1 = require("@nestjs/common");
let LanguageInterceptor = class LanguageInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        let language = request.headers['accept-language'] || request.headers['Accept-Language'];
        if (!language) {
            language = request.query?.language;
        }
        if (language) {
            const normalized = this.normalizeLanguage(language);
            request['locale'] = normalized;
        }
        return next.handle();
    }
    normalizeLanguage(code) {
        const c = (code || 'en').trim().toLowerCase();
        if (c === 'cn' || c === 'zh' || c === 'zh-cn' || c === 'chs') {
            return 'zh-CN';
        }
        if (c === 'en' || c === 'en-us' || c === 'en-gb')
            return 'en';
        if (c === 'am' || c === 'amh')
            return 'am';
        if (c === 'om' || c === 'orm')
            return 'om';
        return c;
    }
};
exports.LanguageInterceptor = LanguageInterceptor;
exports.LanguageInterceptor = LanguageInterceptor = __decorate([
    (0, common_1.Injectable)()
], LanguageInterceptor);
//# sourceMappingURL=language.interceptor.js.map