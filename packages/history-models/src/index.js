"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTestFullName = exports.normalizeTestsFile = exports.normalizeRunRecord = exports.normalizeMethodName = exports.expandRunTests = exports.expandRunFailures = exports.encodeRunTests = exports.encodeRunFailures = exports.encodeRepositoryTestsFile = exports.deriveQualifiedClassName = exports.decodeRepositoryTestsFile = exports.CODE_TO_OUTCOME = exports.OUTCOME_TO_CODE = exports.HISTORY_SCHEMA_VERSION = void 0;
exports.repositoryKeyFromName = repositoryKeyFromName;
exports.repositoryNameFromKey = repositoryNameFromKey;
exports.HISTORY_SCHEMA_VERSION = 2;
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
var encoding_1 = require("./encoding");
Object.defineProperty(exports, "decodeRepositoryTestsFile", { enumerable: true, get: function () { return encoding_1.decodeRepositoryTestsFile; } });
Object.defineProperty(exports, "deriveQualifiedClassName", { enumerable: true, get: function () { return encoding_1.deriveQualifiedClassName; } });
Object.defineProperty(exports, "encodeRepositoryTestsFile", { enumerable: true, get: function () { return encoding_1.encodeRepositoryTestsFile; } });
Object.defineProperty(exports, "encodeRunFailures", { enumerable: true, get: function () { return encoding_1.encodeRunFailures; } });
Object.defineProperty(exports, "encodeRunTests", { enumerable: true, get: function () { return encoding_1.encodeRunTests; } });
Object.defineProperty(exports, "expandRunFailures", { enumerable: true, get: function () { return encoding_1.expandRunFailures; } });
Object.defineProperty(exports, "expandRunTests", { enumerable: true, get: function () { return encoding_1.expandRunTests; } });
Object.defineProperty(exports, "normalizeMethodName", { enumerable: true, get: function () { return encoding_1.normalizeMethodName; } });
Object.defineProperty(exports, "normalizeRunRecord", { enumerable: true, get: function () { return encoding_1.normalizeRunRecord; } });
Object.defineProperty(exports, "normalizeTestsFile", { enumerable: true, get: function () { return encoding_1.normalizeTestsFile; } });
Object.defineProperty(exports, "resolveTestFullName", { enumerable: true, get: function () { return encoding_1.resolveTestFullName; } });
//# sourceMappingURL=index.js.map