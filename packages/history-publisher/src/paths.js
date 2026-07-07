"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBranchKey = sanitizeBranchKey;
exports.resolveBranchKey = resolveBranchKey;
exports.resolveRepositoryKey = resolveRepositoryKey;
exports.formatRunFileName = formatRunFileName;
exports.resolveHistoryPaths = resolveHistoryPaths;
const history_models_1 = require("@actions-insights/history-models");
function sanitizeBranchKey(branch) {
    return branch.replace(/[^a-zA-Z0-9._/-]/g, '-');
}
function resolveBranchKey(context) {
    if (context.prNumber) {
        return {
            branchKey: `pr-${context.prNumber}`,
            branchLabel: `PR #${context.prNumber}`,
            branchType: 'pr',
        };
    }
    if (context.tag) {
        const safeTag = context.tag.replace(/[^a-zA-Z0-9._-]/g, '-');
        return {
            branchKey: `release-${safeTag}`,
            branchLabel: context.tag,
            branchType: 'tag',
        };
    }
    const safeBranch = sanitizeBranchKey(context.branch);
    return {
        branchKey: safeBranch,
        branchLabel: context.branch,
        branchType: 'branch',
    };
}
function resolveRepositoryKey(repositoryName) {
    return (0, history_models_1.repositoryKeyFromName)(repositoryName);
}
function formatRunFileName(date, runId) {
    const iso = date.replace(/[:.]/g, '-').replace(/\.\d{3}Z$/, 'Z');
    return `${iso}-${runId}.json`;
}
function resolveHistoryPaths(dataPath, repositoryKey, branchKey, runFileName, prNumber) {
    const dataRoot = dataPath.replace(/\/+$/, '');
    const repoDir = `${dataRoot}/repositories/${repositoryKey}`;
    const branchDir = `${repoDir}/branches/${branchKey}`;
    const paths = {
        dataRoot,
        repositoriesIndex: `${dataRoot}/repositories.json`,
        configFile: 'config.json',
        repoDir,
        metadata: `${repoDir}/metadata.json`,
        branchesIndex: `${repoDir}/branches.json`,
        branchDir,
        branchLatest: `${branchDir}/latest.json`,
        branchHistory: `${branchDir}/history.json`,
        branchRunsDir: `${branchDir}/runs`,
        runFile: `${branchDir}/runs/${runFileName}`,
        runFileName,
    };
    if (prNumber) {
        paths.prDir = `${repoDir}/pull-requests/${prNumber}`;
    }
    return paths;
}
//# sourceMappingURL=paths.js.map