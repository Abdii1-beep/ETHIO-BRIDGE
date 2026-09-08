"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LANGUAGE = exports.LANGUAGE_CODES = exports.SUPPORTED_LANGUAGES = void 0;
exports.isSupportedLanguage = isSupportedLanguage;
exports.SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', default: true },
    { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
    { code: 'om', name: 'Afaan Oromo', nativeName: 'Afaan Oromoo' },
    { code: 'zh', name: 'Simplified Chinese', nativeName: '简体中文' },
];
exports.LANGUAGE_CODES = exports.SUPPORTED_LANGUAGES.map((l) => l.code);
exports.DEFAULT_LANGUAGE = 'en';
function isSupportedLanguage(code) {
    return exports.LANGUAGE_CODES.includes(code);
}
//# sourceMappingURL=languages.js.map