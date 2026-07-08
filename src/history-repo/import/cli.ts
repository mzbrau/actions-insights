import { importHistory, resolveGitHubToken, type ImportHistoryOptions } from './importer';

export interface CliOptions extends ImportHistoryOptions {}

export function parseCliArgs(argv: string[]): CliOptions {
  const positional: string[] = [];
  const options: Partial<CliOptions> = {
    artifactNames: [],
    artifactPatterns: [],
    testResultsGlob: '**/*.{trx,xml}',
    limit: 50,
    historyLimit: 20,
    retainDays: 30,
    dataPath: 'data',
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--artifact-name':
        options.artifactNames!.push(argv[++i]);
        break;
      case '--artifact-pattern':
        options.artifactPatterns!.push(argv[++i]);
        break;
      case '--test-results-glob':
        options.testResultsGlob = argv[++i];
        break;
      case '--workflow':
        options.workflow = argv[++i];
        break;
      case '--branch':
        options.branch = argv[++i];
        break;
      case '--since':
        options.since = argv[++i];
        break;
      case '--limit':
        options.limit = Number(argv[++i]);
        break;
      case '--history-limit':
        options.historyLimit = Number(argv[++i]);
        break;
      case '--retain-days':
        options.retainDays = Number(argv[++i]);
        break;
      case '--data-path':
        options.dataPath = argv[++i];
        break;
      case '--repo-path':
        options.repoPath = argv[++i];
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '-h':
      case '--help':
        printUsage();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown argument: ${arg}`);
        }
        positional.push(arg);
        break;
    }
  }

  if (positional.length < 1) {
    printUsage();
    process.exit(1);
  }

  const sourceRepo = positional[0];
  if (!sourceRepo.includes('/')) {
    throw new Error('Source repository must be owner/repo');
  }

  if (!options.repoPath) {
    throw new Error('--repo-path is required');
  }

  return {
    token: resolveGitHubToken(),
    sourceRepo,
    repoPath: options.repoPath,
    dataPath: options.dataPath!,
    artifactNames: options.artifactNames!,
    artifactPatterns: options.artifactPatterns!,
    testResultsGlob: options.testResultsGlob!,
    workflow: options.workflow,
    branch: options.branch,
    since: options.since,
    limit: options.limit!,
    historyLimit: options.historyLimit!,
    retainDays: options.retainDays!,
    dryRun: options.dryRun!,
  };
}

function printUsage(): void {
  console.error(`Usage: import-history <source-repo> --repo-path <path> [flags]

Flags:
  --repo-path <path>           Cloned history repository working tree
  --artifact-name <name>       Artifact name to download (repeatable)
  --artifact-pattern <glob>    Artifact name glob (repeatable)
  --test-results-glob <glob>   Glob inside artifact (default: **/*.{trx,xml})
  --workflow <name|id>         Filter by workflow name, path, or id
  --branch <name>              Filter by branch
  --since <ISO date>           Only runs after date
  --limit <n>                  Max runs to scan (default: 50)
  --history-limit <n>          Branch history limit (default: 20)
  --retain-days <n>            Retention window (default: 30)
  --data-path <path>           History data root (default: data)
  --dry-run                    Preview without downloading or writing
`);
}

export async function runImportCli(argv: string[]): Promise<number> {
  const options = parseCliArgs(argv);
  const result = await importHistory(options);

  console.log('');
  console.log('Import summary');
  console.log(`  Source repository: ${options.sourceRepo}`);
  console.log(`  Runs scanned:      ${result.candidateCount}`);
  console.log(`  Imported:          ${result.imported}`);
  console.log(`  Skipped:           ${result.skipped}`);

  if (result.skippedDetails.length > 0) {
    console.log('');
    console.log('Skipped runs:');
    for (const entry of result.skippedDetails.slice(0, 20)) {
      console.log(`  - ${entry.runId}: ${entry.reason}`);
    }
    if (result.skippedDetails.length > 20) {
      console.log(`  ... and ${result.skippedDetails.length - 20} more`);
    }
  }

  if (result.dryRun) {
    console.log('');
    console.log('[dry-run] No files were written.');
  }

  return 0;
}
