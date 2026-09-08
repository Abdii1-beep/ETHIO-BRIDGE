"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUDIT_ACTIONS = exports.APPOINTMENT_STATUSES = exports.ORIGIN_COUNTRIES = exports.PRODUCT_CATEGORIES = exports.CURRENCY_CODES = exports.VISIBILITY_LEVELS = exports.CHART_ACCOUNT_TYPES = exports.FINANCE_TRANSACTION_TYPES = exports.FEATURE_REQUEST_STATUSES = exports.ORGANIZATION_FEATURE_STATUSES = exports.MEMBER_STATUSES = exports.ORGANIZATION_STATUSES = exports.VERIFICATION_LEVELS = exports.ORGANIZATION_BUSINESS_TYPES = void 0;
exports.ORGANIZATION_BUSINESS_TYPES = [
    'PLC',
    'PRIVATE_COMPANY',
    'SOLE_PROPRIETORSHIP',
    'PARTNERSHIP',
    'COOPERATIVE',
    'NGO',
    'SME',
    'MANUFACTURER',
    'TRADER',
    'IMPORTER',
    'EXPORTER',
    'SERVICE_PROVIDER',
    'OTHER',
];
exports.VERIFICATION_LEVELS = [
    'UNVERIFIED',
    'BASIC_VERIFIED',
    'BUSINESS_VERIFIED',
    'PREMIUM_VERIFIED',
    'SUSPENDED',
];
exports.ORGANIZATION_STATUSES = ['ACTIVE', 'SUSPENDED'];
exports.MEMBER_STATUSES = ['INVITED', 'ACTIVE', 'DISABLED'];
exports.ORGANIZATION_FEATURE_STATUSES = [
    'REQUESTED',
    'ACTIVE',
    'DISABLED',
    'EXPIRED',
    'SUSPENDED',
];
exports.FEATURE_REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
exports.FINANCE_TRANSACTION_TYPES = [
    'INCOME',
    'EXPENSE',
    'TRANSFER',
    'PAYMENT',
    'RECEIPT',
];
exports.CHART_ACCOUNT_TYPES = [
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'INCOME',
    'EXPENSE',
];
exports.VISIBILITY_LEVELS = ['PRIVATE', 'BUSINESS', 'PUBLIC'];
exports.CURRENCY_CODES = ['ETB', 'CNY', 'USD', 'EUR', 'GBP'];
exports.PRODUCT_CATEGORIES = [
    'Agriculture & Livestock',
    'Agro-processing & Machinery',
    'Coffee & Beverages',
    'Ceramics & Glass',
    'Textiles, Garments & Leather',
    'Wood & Wood Products',
    'Metals & Steel Products',
    'Electronics & IT',
    'Electrical & Solar Energy',
    'Construction & Building Materials',
    'Machinery & Industrial Equipment',
    'Automotive & Spare Parts',
    'Chemicals & Plastics',
    'Pharmaceuticals & Healthcare',
    'Packaging & Paper',
    'Furniture & Home Appliances',
    'Food Processing & Staples',
    'Jewellery & Precious Metals',
    'Gifts, Handcrafts & Art',
    'Logistics, Transport & Services',
];
exports.ORIGIN_COUNTRIES = [
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
    { code: 'CN', name: 'China', flag: '🇨🇳' },
    { code: 'IN', name: 'India', flag: '🇮🇳' },
    { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪' },
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' },
];
exports.APPOINTMENT_STATUSES = [
    'PENDING',
    'ACCEPTED',
    'DECLINED',
    'CANCELLED',
    'COMPLETED',
];
exports.AUDIT_ACTIONS = {
    LOGIN: 'LOGIN',
    FAILED_LOGIN: 'FAILED_LOGIN',
    REGISTER: 'REGISTER',
    LOGOUT: 'LOGOUT',
    CREATE_ORGANIZATION: 'CREATE_ORGANIZATION',
    EDIT_ORGANIZATION: 'EDIT_ORGANIZATION',
    INVITE_USER: 'INVITE_USER',
    JOIN_ORGANIZATION: 'JOIN_ORGANIZATION',
    DISABLE_USER: 'DISABLE_USER',
    ENABLE_USER: 'ENABLE_USER',
    CHANGE_ROLE: 'CHANGE_ROLE',
    CREATE_ROLE: 'CREATE_ROLE',
    UPDATE_ROLE: 'UPDATE_ROLE',
    DELETE_ROLE: 'DELETE_ROLE',
    CREATE_BRANCH: 'CREATE_BRANCH',
    UPDATE_BRANCH: 'UPDATE_BRANCH',
    DELETE_BRANCH: 'DELETE_BRANCH',
    CREATE_DEPARTMENT: 'CREATE_DEPARTMENT',
    UPDATE_DEPARTMENT: 'UPDATE_DEPARTMENT',
    DELETE_DEPARTMENT: 'DELETE_DEPARTMENT',
    FEATURE_ACTIVATION: 'FEATURE_ACTIVATION',
    FEATURE_DEACTIVATION: 'FEATURE_DEACTIVATION',
    FEATURE_REQUEST: 'FEATURE_REQUEST',
    FEATURE_REQUEST_REVIEW: 'FEATURE_REQUEST_REVIEW',
    CREATE_TRANSACTION: 'CREATE_TRANSACTION',
    DELETE_TRANSACTION: 'DELETE_TRANSACTION',
    CREATE_ACCOUNT: 'CREATE_ACCOUNT',
    UPDATE_ACCOUNT: 'UPDATE_ACCOUNT',
    AI_REQUEST: 'AI_REQUEST',
    EXPORT_DATA: 'EXPORT_DATA',
};
//# sourceMappingURL=constants.js.map