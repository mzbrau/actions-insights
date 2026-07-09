import { type ImportHistoryOptions } from './importer';
export interface CliOptions extends ImportHistoryOptions {
}
export declare function parseCliArgs(argv: string[]): CliOptions;
export declare function runImportCli(argv: string[]): Promise<number>;
//# sourceMappingURL=cli.d.ts.map