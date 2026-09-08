"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRISMA_ERROR_MAP = void 0;
exports.isPrismaUniqueError = isPrismaUniqueError;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
exports.PRISMA_ERROR_MAP = {
    P2002: {
        status: common_1.HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'A resource with the same unique value already exists.',
    },
    P2003: {
        status: common_1.HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: 'The request references a resource that does not exist.',
    },
    P2025: {
        status: common_1.HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: 'Resource not found.',
    },
};
function isPrismaUniqueError(e) {
    return e instanceof client_1.Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
}
//# sourceMappingURL=prisma-error-map.js.map