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
var TranslationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TranslationService = TranslationService_1 = class TranslationService {
    config;
    logger = new common_1.Logger(TranslationService_1.name);
    supported = new Set(['en', 'zh', 'zh-CN', 'am', 'om']);
    cache = new Map();
    constructor(config) {
        this.config = config;
    }
    normalize(code) {
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
    isTranslatableLength(text) {
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < 2)
            return false;
        return true;
    }
    apiKey() {
        return this.config.get('AI_TRANSLATE_API_KEY') || undefined;
    }
    apiUrl() {
        return (this.config.get('AI_TRANSLATE_API_URL') ||
            'https://api.mymemory.translated.net/get');
    }
    async translate(text, source, target) {
        const from = this.normalize(source);
        const to = this.normalize(target);
        if (!this.isTranslatableLength(text)) {
            return { ok: true, text: text.trim() };
        }
        if (from === to) {
            return { ok: true, text: text.trim() };
        }
        const apiResult = await this.tryApiTranslation(text, from, to);
        if (apiResult.ok) {
            return apiResult;
        }
        const fallback = this.getFallbackTranslation(text, from, to);
        if (fallback) {
            return { ok: true, text: fallback };
        }
        return { ok: false, error: apiResult.error || 'Translation failed' };
    }
    async tryApiTranslation(text, from, to) {
        if (!this.supported.has(from) || !this.supported.has(to)) {
            return { ok: false, error: `Unsupported language pair: ${from} -> ${to}` };
        }
        const cacheKey = `${from}|${to}|${text}`;
        const cached = this.cache.get(cacheKey);
        if (cached !== undefined) {
            return cached ? { ok: true, text: cached } : { ok: false, error: 'Previously failed' };
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);
        try {
            const url = new URL(this.apiUrl());
            url.searchParams.set('q', text.length > 500 ? text.slice(0, 500) : text);
            url.searchParams.set('langpair', `${from}|${to}`);
            if (this.apiKey())
                url.searchParams.set('key', this.apiKey());
            const res = await fetch(url.toString(), {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            });
            if (!res.ok) {
                const msg = `MT provider responded ${res.status}`;
                this.cache.set(cacheKey, '');
                return { ok: false, error: msg };
            }
            const json = await res.json();
            if (json.responseStatus !== 200 || !json.responseData?.translatedText) {
                this.cache.set(cacheKey, '');
                return { ok: false, error: `MT provider error: ${json.responseStatus ?? 'unknown'}` };
            }
            const out = json.responseData.translatedText;
            if (out.length > 2 && out !== text) {
                this.cache.set(cacheKey, out);
                return { ok: true, text: out };
            }
            this.cache.set(cacheKey, '');
            return { ok: false, error: 'MT provider returned empty/unusable translation' };
        }
        catch (err) {
            this.cache.set(cacheKey, '');
            this.logger.warn(`Translation failed (${from}->${to}): ${err.message}`);
            return { ok: false, error: err.message };
        }
        finally {
            clearTimeout(timer);
        }
    }
    getFallbackTranslation(text, from, to) {
        const dictionary = {
            'product': { zh: '产品', am: 'ምርት', om: 'Muraanii' },
            'new': { zh: '新', am: 'አዲስ', om: 'Haara' },
            'create': { zh: '创建', am: 'ፍጠር', om: 'Uumuu' },
            'marketplace': { zh: '市场', am: 'ገበያ', om: 'Maarkitii' },
            'publish': { zh: '发布', am: 'አስታውስት', om: 'Buusuu' },
            'cancel': { zh: '取消', am: 'ሰርዝ', om: 'Haquu' },
            'title': { zh: '标题', am: 'ርዕስ', om: 'Mataduree' },
            'description': { zh: '描述', am: 'መግለጫ', om: 'Ibsa' },
            'price': { zh: '价格', am: 'ዋጋ', om: 'Gatii' },
            'quality': { zh: '质量', am: 'ጥራት', om: 'Olaana' },
            'high': { zh: '高', am: 'ከፍተኛ', om: 'Olkaa' },
            'durable': { zh: '耐用', am: 'ጠቢት', om: 'Dabarsuu' },
            'certified': { zh: '认证', am: 'ምስክር', om: 'Mirkaneessaa' },
            'warranty': { zh: '保修', am: 'ዋስት', om: 'Waardii' },
            'machinery': { zh: '机械设备', am: 'ማሽነሪ', om: 'Meeshaalee maashinii' },
            'coffee': { zh: '咖啡', am: 'ቡና', om: 'Buna' },
            'generator': { zh: '发电机', am: 'ጄኔሬተር', om: 'Jeneraatara' },
            'solar water pump': { zh: '太阳能水泵', am: 'የፀሐይ ውሃ ፓምፕ', om: 'Pampii bishaanii humna aduu' },
            'agricultural': { zh: '农业', am: 'እርሻት', om: 'Qonnaa' },
            'industrial': { zh: '工业', am: 'ኢንዱስትሪ', om: 'Industirii' },
            'equipment': { zh: '设备', am: 'ቅርጽት', om: 'Qabxii' },
            'category': { zh: '类别', am: 'ምድብ', om: 'Qabxii' },
            'country': { zh: '国家', am: 'ሀገር', om: 'Biyya' },
            'origin': { zh: '原产地', am: 'ምንጫፍ', om: 'Iddoo' },
            'unit': { zh: '单位', am: 'አንት', om: 'Yoo' },
            'currency': { zh: '货币', am: 'ገንዘብ', om: 'Qarshii' },
            'images': { zh: '图片', am: 'ምስሎች', om: 'Suuraalee' },
            'video': { zh: '视频', am: 'ቪዲዮ', om: 'Viidiyoo' },
            'contact': { zh: '联系', am: 'ያግኙ', om: 'Qabanneessi' },
            'information': { zh: '信息', am: 'መረጃ', om: 'Oduu' },
            'wechat': { zh: '微信', am: 'ዌቻት', om: 'Wiichaat' },
            'whatsapp': { zh: 'WhatsApp', am: 'ዋትስአፕ', om: 'Waatsappii' },
            'phone': { zh: '电话', am: 'ስልክ', om: 'Bilbila' },
            'email': { zh: '电子邮件', am: 'ኢሜይል', om: 'Iimeelii' },
            'generate': { zh: '生成', am: 'ፍጥረት', om: 'Uumuu' },
            'translate': { zh: '翻译', am: 'ትርጉም', om: 'Hiikuu' },
            'language': { zh: '语言', am: 'ቋንቋ', om: 'Afaan' },
            'english': { zh: '英语', am: 'እንግሊዝኛ', om: 'Afaan Ingiliffaa' },
            'chinese': { zh: '中文', am: 'ቻይንኛ', om: 'Afaan Cheenaa' },
            'amharic': { zh: '阿姆哈拉语', am: 'አማርኛ', om: 'Afaan Amaaraa' },
            'oromo': { zh: '奥罗莫语', am: 'ኦሮሞኛ', om: 'Afaan Oromoo' },
            'available': { zh: '可用', am: 'ይገኛል', om: 'Jira' },
            'pending': { zh: '待定', am: 'በመጠባበብ ላይ', om: 'Eegamaa jira' },
            'click': { zh: '点击', am: 'ይጫኑ', om: 'Dhiifachi' },
            'content': { zh: '内容', am: 'ይዘት', om: 'Qabxii' },
            'multilingual': { zh: '多语言', am: 'ባለብዙ ቋንቋ', om: 'Afaan balaa' },
            'automatic': { zh: '自动', am: 'ራስ-ሰር', om: 'Ofii' },
            'typing': { zh: '打字', am: 'መጻፍ', om: 'Barreessuu' },
            'stops': { zh: '停止', am: 'ማቆም', om: 'Dhiifachi' },
            'discount': { zh: '折扣', am: 'ቅናሽ', om: 'Qabxii' },
            'minimum': { zh: '最小', am: 'አነስተኛ', om: 'Xiqqaa' },
            'order': { zh: '订单', am: 'ትዕዛዝ', om: 'Ajajii' },
            'quantity': { zh: '数量', am: 'ብዛት', om: 'Baayinaa' },
            'add': { zh: '添加', am: 'አክል', om: 'Idi' },
            'remove': { zh: '删除', am: 'አጥፍ', om: 'Haquu' },
            'edit': { zh: '编辑', am: 'አርትዕ', om: 'Gulaaluu' },
            'save': { zh: '保存', am: 'አስቀምጥ', om: 'Kayisisuu' },
            'submit': { zh: '提交', am: 'አስተላልፍ', om: 'Eeguu' },
            'success': { zh: '成功', am: 'ስኬት', om: 'Milgoona' },
            'error': { zh: '错误', am: 'ስህተት', om: 'Dogoggora' },
            'warning': { zh: '警告', am: 'ማስጠንቀቂያ', om: 'Dhiibeecha' },
            'loading': { zh: '加载中', am: 'በመጫን ላይ', om: 'Feeramaa jira' },
            'processing': { zh: '处理中', am: 'በስራ ላይ', om: 'Hojjechaa jira' },
            'completed': { zh: '已完成', am: 'ተጠናቀቀ', om: 'Xumurame' },
            'failed': { zh: '失败', am: 'አልተሳካም', om: 'Hincinnu' },
        };
        const lowerText = text.trim().toLowerCase();
        if (dictionary[lowerText] && dictionary[lowerText][to]) {
            return dictionary[lowerText][to];
        }
        for (const [key, translations] of Object.entries(dictionary)) {
            if (lowerText.includes(key) && translations[to]) {
                return text.replace(new RegExp(key, 'gi'), translations[to]);
            }
        }
        if (to === 'zh')
            return `[中文] ${text}`;
        if (to === 'am')
            return `[አማርኛ] ${text}`;
        if (to === 'om')
            return `[Afaan Oromoo] ${text}`;
        if (to === 'en')
            return text;
        return null;
    }
};
exports.TranslationService = TranslationService;
exports.TranslationService = TranslationService = TranslationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TranslationService);
//# sourceMappingURL=translation.service.js.map