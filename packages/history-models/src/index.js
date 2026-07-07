"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CODE_TO_OUTCOME = exports.OUTCOME_TO_CODE = exports.HISTORY_SCHEMA_VERSION = void 0;
exports.repositoryKeyFromName = repositoryKeyFromName;
exports.repositoryNameFromKey = repositoryNameFromKey;
exports.HISTORY_SCHEMA_VERSION = 1;
exports.OUTCOME_TO_CODE = {
    passed: 0,
    failed: 1,
    skipped: 2,
    inconclusive: 3,
};
exports.CODE_TO_OUTCOME = ['passed', 'failed', 'skipped', 'inconclusive'];
function repositoryKeyFromName(name) {
    return name.replace('/', '.');
}
function repositoryNameFromKey(key) {
    const dot = key.indexOf('.');
    if (dot < 0)
        return key;
    return `${key.slice(0, dot)}/${key.slice(dot + 1)}`;
}
//# sourceMappingURL=index.js.map