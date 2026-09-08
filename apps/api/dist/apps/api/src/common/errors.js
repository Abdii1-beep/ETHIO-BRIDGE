"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderNotConfiguredError = exports.ServiceUnavailableError = exports.FeatureNotEnabledError = exports.ValidationFailedError = exports.ConflictError = exports.NotFoundError = exports.UnauthorizedError = exports.ForbiddenError = exports.ApiError = void 0;
const common_1 = require("@nestjs/common");
class ApiError extends common_1.HttpException {
    constructor(code, message, status = common_1.HttpStatus.BAD_REQUEST, details) {
        super({ code, message, details }, status);
    }
}
exports.ApiError = ApiError;
class ForbiddenError extends ApiError {
    constructor(message = 'You do not have permission to perform this action.') {
        super('FORBIDDEN', message, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenError = ForbiddenError;
class UnauthorizedError extends ApiError {
    constructor(message = 'Authentication is required.') {
        super('UNAUTHORIZED', message, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class NotFoundError extends ApiError {
    constructor(message = 'Resource not found.') {
        super('NOT_FOUND', message, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends ApiError {
    constructor(message = 'The request conflicts with the current state.') {
        super('CONFLICT', message, common_1.HttpStatus.CONFLICT);
    }
}
exports.ConflictError = ConflictError;
class ValidationFailedError extends ApiError {
    constructor(message, details) {
        super('VALIDATION_FAILED', message, common_1.HttpStatus.BAD_REQUEST, details);
    }
}
exports.ValidationFailedError = ValidationFailedError;
class FeatureNotEnabledError extends ApiError {
    constructor(featureCode) {
        super('FEATURE_NOT_ENABLED', `The feature "${featureCode}" is not enabled for your organization.`, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.FeatureNotEnabledError = FeatureNotEnabledError;
class ServiceUnavailableError extends ApiError {
    constructor(message = 'The requested service is temporarily unavailable.', code = 'SERVICE_UNAVAILABLE') {
        super(code, message, common_1.HttpStatus.SERVICE_UNAVAILABLE);
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
class AIProviderNotConfiguredError extends ServiceUnavailableError {
    constructor(service) {
        super(`No AI provider is configured for "${service}". Configure a provider before enabling this service.`, 'AI_PROVIDER_NOT_CONFIGURED');
    }
}
exports.AIProviderNotConfiguredError = AIProviderNotConfiguredError;
//# sourceMappingURL=errors.js.map