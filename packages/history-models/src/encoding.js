"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeMethodName = normalizeMethodName;
exports.deriveQualifiedClassName = deriveQualifiedClassName;
exports.resolveTestFullName = resolveTestFullName;
exports.encodeRunTests = encodeRunTests;
exports.encodeRunFailures = encodeRunFailures;
exports.expandRunTests = expandRunTests;
exports.expandRunFailures = expandRunFailures;
exports.normalizeRunRecord = normalizeRunRecord;
exports.decodeRepositoryTestsFile = decodeRepositoryTestsFile;
exports.encodeRepositoryTestsFile = encodeRepositoryTestsFile;
exports.normalizeTestsFile = normalizeTestsFile;
function normalizeMethodName(fullName, method) {
    if (!method) {
        const lastDot = fullName.lastIndexOf('.');
        return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
    }
    if (method === fullName) {
        const lastDot = fullName.lastIndexOf('.');
        return lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
    }
    if (fullName.endsWith(`.${method}`)) {
        return method;
    }
    if (method.includes('.')) {
        const lastDot = method.lastIndexOf('.');
        const shortMethod = method.slice(lastDot + 1);
        if (fullName.endsWith(`.${shortMethod}`)) {
            return shortMethod;
        }
    }
    return method;
}
function deriveQualifiedClassName(test) {
    const suffix = `.${test.method}`;
    if (test.fullName.endsWith(suffix)) {
        const prefix = test.fullName.slice(0, -suffix.length);
        return prefix || undefined;
    }
    if (test.namespace && test.className) {
        return `${test.namespace}.${test.className}`;
    }
    if (test.className?.includes('.')) {
        return test.className;
    }
    if (test.className) {
        return test.namespace ? `${test.namespace}.${test.className}` : test.className;
    }
    return undefined;
}
function resolveTestFullName(classes, test) {
    if (test.n)
        return test.n;
    const cls = test.c !== undefined ? classes?.[test.c] : undefined;
    if (cls && test.m)
        return `${cls}.${test.m}`;
    return test.m ?? '';
}
function encodeRunTests(inputs) {
    const classToIndex = new Map();
    const classes = [];
    const tests = [];
    for (const input of inputs) {
        const method = normalizeMethodName(input.fullName, input.method);
        const qualifiedClass = deriveQualifiedClassName({
            fullName: input.fullName,
            namespace: input.namespace,
            className: input.className,
            method,
        });
        const stored = {
            o: input.outcomeCode,
            d: input.durationMs,
            ...(input.assembly ? { a: input.assembly } : {}),
            ...(input.stackTrace ? { st: input.stackTrace } : {}),
            ...(input.isNewFailure ? { nf: true } : {}),
        };
        if (qualifiedClass && `${qualifiedClass}.${method}` === input.fullName) {
            let classIndex = classToIndex.get(qualifiedClass);
            if (classIndex === undefined) {
                classIndex = classes.length;
                classes.push(qualifiedClass);
                classToIndex.set(qualifiedClass, classIndex);
            }
            tests.push({ ...stored, c: classIndex, m: method });
        }
        else {
            tests.push({ ...stored, n: input.fullName });
        }
    }
    return classes.length > 0 ? { classes, tests } : { tests };
}
function encodeRunFailures(inputs) {
    return inputs.map((input) => ({
        t: input.testIndex,
        ...(input.message ? { message: input.message } : {}),
        ...(input.stackTrace ? { stackTrace: input.stackTrace } : {}),
        ...(input.stdout ? { stdout: input.stdout } : {}),
        ...(input.stderr ? { stderr: input.stderr } : {}),
    }));
}
function expandRunTests(run) {
    return run.tests.map((test, index) => ({
        i: index,
        n: resolveTestFullName(run.classes, test),
        o: test.o,
        d: test.d,
        ...(test.a ? { a: test.a } : {}),
        ...(test.st ? { st: test.st } : {}),
        ...(test.nf ? { nf: true } : {}),
    }));
}
function expandRunFailures(failures, expandedTests) {
    return failures.map((failure) => {
        const test = expandedTests[failure.t];
        const fullName = test?.n ?? `test-${failure.t}`;
        const lastDot = fullName.lastIndexOf('.');
        const testName = lastDot >= 0 ? fullName.slice(lastDot + 1) : fullName;
        return {
            testName,
            fullName,
            message: failure.message,
            stackTrace: failure.stackTrace,
            stdout: failure.stdout,
            stderr: failure.stderr,
        };
    });
}
function normalizeRunRecord(run) {
    const tests = expandRunTests(run);
    const failures = expandRunFailures(run.failures, tests);
    const { classes: _classes, ...rest } = run;
    return { ...rest, tests, failures };
}
function decodeRepositoryTestsFile(file) {
    const result = {};
    for (const [id, entry] of Object.entries(file.entries)) {
        const name = file.names[Number(id)];
        if (name) {
            result[name] = entry;
        }
    }
    return result;
}
function encodeRepositoryTestsFile(tests, existingFile, updatedAt) {
    const names = existingFile ? [...existingFile.names] : [];
    const nameToId = new Map();
    names.forEach((name, index) => nameToId.set(name, index));
    const entries = {};
    for (const [fullName, entry] of Object.entries(tests)) {
        let id = nameToId.get(fullName);
        if (id === undefined) {
            id = names.length;
            names.push(fullName);
            nameToId.set(fullName, id);
        }
        entries[String(id)] = entry;
    }
    return {
        version: 2,
        updatedAt: updatedAt ?? new Date().toISOString(),
        names,
        entries,
    };
}
function normalizeTestsFile(file) {
    return decodeRepositoryTestsFile(file);
}
//# sourceMappingURL=encoding.js.map