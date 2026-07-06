import type { TestCase } from '../model/test-case';

export type ParserFormat = 'trx' | 'nunit' | 'xunit' | 'junit';

export interface TestResultParser {
  readonly format: ParserFormat;
  canParse(filePath: string, peek: string): boolean;
  parse(content: string, filePath: string): TestCase[];
}
