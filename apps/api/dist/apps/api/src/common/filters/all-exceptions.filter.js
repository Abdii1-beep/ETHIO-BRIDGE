"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_error_map_1 = require("./prisma-error-map");
const request_store_1 = require("../request-store");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    logger = new common_1.Logger(AllExceptionsFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const store = (0, request_store_1.getRequestStore)();
        let status;
        let code;
        let message;
        let details;
        if (exception instanceof common_1.HttpException) {
            const response = exception.getResponse();
            status = exception.getStatus();
            if (typeof response === 'object' && response !== null) {
                const body = response;
                if (typeof body.code === 'string') {
                    code = body.code;
                    message = typeof body.message === 'string' ? body.message : exception.message;
                    details = body.details;
                }
                else {
                    code = httpStatusToCode(status);
                    if (status === common_1.HttpStatus.BAD_REQUEST && Array.isArray(body.message)) {
                        code = 'VALIDATION_FAILED';
                        message = 'Validation failed.';
                        details = body.message;
                    }
                    else {
                        message = (messageFromResponse(body) ?? exception.message);
                    }
                }
            }
            else {
                code = httpStatusToCode(status);
                message = response;
            }
        }
        else if (exception instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            const mapped = prisma_error_map_1.PRISMA_ERROR_MAP[exception.code];
            if (mapped) {
                status = mapped.status;
                code = mapped.code;
                message = mapped.message;
                details = exception.meta;
            }
            else {
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                code = 'INTERNAL_ERROR';
                message = 'An internal error occurred.';
                this.logger.error(exception, exception.stack, store.requestId);
            }
        }
        else {
            status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            code = 'INTERNAL_ERROR';
            message = 'An internal error occurred.';
            this.logger.error(exception instanceof Error ? exception.stack ?? exception.message : String(exception), undefined, store.requestId);
        }
        res.status(status).json({
            success: false,
            error: {
                code,
                message,
                ...(details !== undefined ? { details } : {}),
                requestId: store.requestId,
            },
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
function messageFromResponse(body) {
    return body.message;
}
function httpStatusToCode(status) {
    switch (status) {
        case common_1.HttpStatus.UNAUTHORIZED:
            return 'UNAUTHORIZED';
        case common_1.HttpStatus.FORBIDDEN:
            return 'FORBIDDEN';
        case common_1.HttpStatus.NOT_FOUND:
            return 'NOT_FOUND';
        case common_1.HttpStatus.CONFLICT:
            return 'CONFLICT';
        case common_1.HttpStatus.TOO_MANY_REQUESTS:
            return 'RATE_LIMITED';
        default:
            return 'VALIDATION_FAILED';
    }
}
//# sourceMappingURL=all-exceptions.filter.js.map