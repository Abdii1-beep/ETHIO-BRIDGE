"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestStoreStorage = void 0;
exports.runWithRequestStore = runWithRequestStore;
exports.getRequestStore = getRequestStore;
exports.updateRequestStore = updateRequestStore;
const async_hooks_1 = require("async_hooks");
exports.requestStoreStorage = new async_hooks_1.AsyncLocalStorage();
function runWithRequestStore(store, fn) {
    exports.requestStoreStorage.run(store, fn);
}
function getRequestStore() {
    return exports.requestStoreStorage.getStore() ?? {};
}
function updateRequestStore(patch) {
    const current = getRequestStore();
    const next = { ...current, ...patch };
    const store = exports.requestStoreStorage.getStore();
    if (store) {
        exports.requestStoreStorage.enterWith(next);
    }
}
//# sourceMappingURL=request-store.js.map