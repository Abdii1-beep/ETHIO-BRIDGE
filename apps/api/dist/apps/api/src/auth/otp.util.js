"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomDigits = randomDigits;
exports.randomToken = randomToken;
exports.sha256 = sha256;
const crypto_1 = require("crypto");
function randomDigits(length) {
    let out = '';
    for (let i = 0; i < length; i += 1) {
        out += Math.floor(Math.random() * 10).toString();
    }
    return out;
}
function randomToken(bytes = 48) {
    return (0, crypto_1.randomBytes)(bytes).toString('base64url');
}
function sha256(value) {
    return (0, crypto_1.createHash)('sha256').update(value).digest('hex');
}
//# sourceMappingURL=otp.util.js.map