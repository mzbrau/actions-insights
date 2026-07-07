"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHistoryUpdate = buildHistoryUpdate;
exports.createEmptyRepositoriesIndex = createEmptyRepositoriesIndex;
const history_models_1 = require("@actions-insights/history-models");
const paths_1 = require("./paths");
const retention_1 = require("./retention");
function buildHistoryUpdate(run, options) {
    const repositoryKey = (0, paths_1.resolveRepositoryKey)(options.repositoryName);
    const { branchKey, branchLabel, branchType } = (0, paths_1.resolveBranchKey)(run.context);
    const runDate = run.context.completedAt || new Date().toISOString();
    const runFileName = (0, paths_1.formatRunFileName)(runDate, run.id);
    const paths = (0, paths_1.resolveHistoryPaths)(options.dataPath, repositoryKey, branchKey, runFileName, run.context.prNumber);
    const runRecord = buildRunRecord(run, branchKey, branchLabel, branchType, runFileName);
    const runSummary = buildRunSummary(run, runFileName);
    const branchHistory = updateBranchHistory(options.existing.branchHistory, branchKey, branchLabel, runSummary, { historyLimit: options.historyLimit, retainDays: options.retainDays });
    const branchLatest = buildBranchLatest(run, runFileName);
    const branchesIndex = updateBranchesIndex(options.existing.branchesIndex, branchKey, branchLabel, branchType, run, branchHistory.runs.length);
    const metadata = updateRepositoryMetadata(options.existing.metadata, repositoryKey, options.repositoryName, run.context.repositoryUrl, run, branchesIndex.branches.length);
    const repositoriesIndex = updateRepositoriesIndex(options.existing.repositoriesIndex, metadata);
    const repoConfig = updateRepoConfig(options.existing.repoConfig, options.defaultRepository);
    const files = [
        { path: paths.repositoriesIndex, content: repositoriesIndex },
        { path: paths.metadata, content: metadata },
        { path: paths.branchesIndex, content: branchesIndex },
        { path: paths.branchLatest, content: branchLatest },
        { path: paths.branchHistory, content: branchHistory },
        { path: paths.runFile, content: runRecord },
    ];
    if (repoConfig) {
        files.push({ path: paths.configFile, content: repoConfig });
    }
    const commitPaths = [
        paths.repositoriesIndex,
        paths.metadata,
        paths.branchesIndex,
        paths.branchLatest,
        paths.branchHistory,
        paths.runFile,
    ];
    if (repoConfig) {
        commitPaths.push(paths.configFile);
    }
    return {
        repositoryKey,
        branchKey,
        runId: run.id,
        runFileName,
        paths,
        files,
        commitPaths,
    };
}
function buildRunRecord(run, branchKey, branchLabel, branchType, runFileName) {
    const tests = run.tests.map((t, i) => ({
        i,
        n: t.fullName,
        o: history_models_1.OUTCOME_TO_CODE[t.outcome],
        d: t.durationMs,
        ...(t.assembly ? { a: t.assembly } : {}),
        ...(t.namespace ? { ns: t.namespace } : {}),
        ...(t.className ? { c: t.className } : {}),
        ...(t.method ? { m: t.method } : {}),
        ...(t.stackTrace ? { st: t.stackTrace } : {}),
        ...(t.isNewFailure ? { nf: true } : {}),
    }));
    const failures = run.tests
        .filter((t) => t.outcome === 'failed')
        .map((t) => ({
        testName: t.name,
        fullName: t.fullName,
        message: t.message,
        stackTrace: t.stackTrace,
        stdout: t.stdout,
        stderr: t.stderr,
    }));
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        runId: run.id,
        workflowRunId: run.context.runId,
        status: run.status,
        date: run.context.completedAt,
        durationMs: run.stats.durationMs,
        context: {
            repository: run.context.repository,
            repositoryUrl: run.context.repositoryUrl,
            workflow: run.context.workflow,
            branch: run.context.branch,
            branchKey,
            branchLabel,
            branchType,
            ref: run.context.ref,
            tag: run.context.tag,
            prNumber: run.context.prNumber,
            prUrl: run.context.prUrl,
            baseBranch: run.context.baseBranch,
            commitSha: run.context.commitSha,
            commitShortSha: run.context.commitShortSha,
            commitMessage: run.context.commitMessage,
            commitUrl: run.context.commitUrl,
            author: run.context.author,
            actor: run.context.actor,
            startedAt: run.context.startedAt,
            completedAt: run.context.completedAt,
        },
        stats: { ...run.stats },
        tests,
        failures,
        links: {
            workflowUrl: run.context.workflowUrl,
            commitUrl: run.context.commitUrl,
            prUrl: run.context.prUrl,
            jobUrl: run.context.jobUrl,
        },
    };
}
function buildRunSummary(run, runFileName) {
    return {
        runId: run.id,
        workflowRunId: run.context.runId,
        status: run.status,
        date: run.context.completedAt,
        durationMs: run.stats.durationMs,
        total: run.stats.total,
        passed: run.stats.passed,
        failed: run.stats.failed,
        skipped: run.stats.skipped,
        commitSha: run.context.commitSha,
        commitShortSha: run.context.commitShortSha,
        commitMessage: run.context.commitMessage,
        author: run.context.author,
        runFile: runFileName,
    };
}
function buildBranchLatest(run, runFileName) {
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        runId: run.id,
        runFile: runFileName,
        status: run.status,
        date: run.context.completedAt,
        durationMs: run.stats.durationMs,
        commitSha: run.context.commitSha,
        commitShortSha: run.context.commitShortSha,
        commitMessage: run.context.commitMessage,
        author: run.context.author,
        total: run.stats.total,
        passed: run.stats.passed,
        failed: run.stats.failed,
        skipped: run.stats.skipped,
    };
}
function updateBranchHistory(existing, branchKey, branchLabel, summary, retention) {
    const runs = existing?.runs.filter((r) => r.runId !== summary.runId) ?? [];
    runs.unshift(summary);
    const history = {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        branchKey,
        branchLabel,
        updatedAt: new Date().toISOString(),
        runs,
    };
    return (0, retention_1.pruneBranchHistory)(history, retention);
}
function updateBranchesIndex(existing, branchKey, branchLabel, branchType, run, runCount) {
    const entry = {
        key: branchKey,
        label: branchLabel,
        type: branchType,
        latestStatus: run.status,
        latestDate: run.context.completedAt,
        latestDurationMs: run.stats.durationMs,
        latestCommitShortSha: run.context.commitShortSha,
        latestAuthor: run.context.author,
        runCount,
    };
    const branches = (existing?.branches ?? []).filter((b) => b.key !== branchKey);
    branches.push(entry);
    branches.sort((a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime());
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        branches,
    };
}
function updateRepositoryMetadata(existing, key, name, url, run, branchCount) {
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        key,
        name,
        url,
        updatedAt: new Date().toISOString(),
        latestStatus: run.status,
        branchCount,
        lastRunDate: run.context.completedAt,
        latestCommitShortSha: run.context.commitShortSha,
    };
}
function updateRepositoriesIndex(existing, metadata) {
    const entry = {
        key: metadata.key,
        name: metadata.name,
        url: metadata.url,
        latestStatus: metadata.latestStatus,
        branchCount: metadata.branchCount,
        lastUpdated: metadata.updatedAt,
        latestCommitShortSha: metadata.latestCommitShortSha,
    };
    const repositories = (existing?.repositories ?? []).filter((r) => r.key !== entry.key);
    repositories.push(entry);
    repositories.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        repositories,
    };
}
function updateRepoConfig(existing, defaultRepository) {
    if (existing?.defaultRepository || !defaultRepository) {
        return existing;
    }
    return { defaultRepository };
}
function createEmptyRepositoriesIndex() {
    return {
        version: history_models_1.HISTORY_SCHEMA_VERSION,
        updatedAt: new Date().toISOString(),
        repositories: [],
    };
}
//# sourceMappingURL=build-update.js.map