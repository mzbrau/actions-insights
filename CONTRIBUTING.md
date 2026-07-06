# Contributing

Thank you for contributing to Actions Insights!

## Adding a Test Result Parser

1. Implement the `TestResultParser` interface in `src/parsers/types.ts`:

```typescript
export interface TestResultParser {
  readonly format: 'trx' | 'nunit' | 'xunit' | 'junit' | 'myformat';
  canParse(filePath: string, peek: string): boolean;
  parse(content: string, filePath: string): TestCase[];
}
```

2. Map results to the normalized `TestCase` model in `src/model/test-case.ts`.

3. Register your parser in `src/parsers/registry.ts`. Place it before more generic parsers if your format is specific.

4. Add a fixture file to `test/fixtures/` and tests to `test/parsers/`.

5. Run `npm test` and `npm run build`.

## Code Style

- TypeScript strict mode
- Match existing naming and module structure
- Keep changes focused — no unrelated refactors
- Add tests for parser and history logic

## Pull Requests

- Include a clear description of changes
- Ensure CI passes (`npm test`, `npm run build`)
- Update docs if adding inputs or changing behavior

## License

By contributing, you agree that your contributions will be licensed under the Apache 2.0 License.
