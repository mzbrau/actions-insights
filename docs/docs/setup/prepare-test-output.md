---
sidebar_position: 4
title: Prepare Test Output
---

# Prepare Test Output

Actions Insights reads test result files in their **native format**. Your test runner must write compatible output files before the Actions Insights step runs.

## Supported Formats

| Format | Typical extensions | Test runners |
|--------|-------------------|--------------|
| TRX | `.trx` | .NET (`dotnet test`), Visual Studio |
| JUnit XML | `.xml` | Java (Maven, Gradle), Python (pytest), JavaScript |
| NUnit XML | `.xml` | NUnit (.NET) |
| xUnit XML | `.xml` | xUnit (.NET) |

The action auto-detects the format from file content. Use the `test-results` input to specify which files to parse.

## .NET (TRX)

```yaml
- name: Run tests
  run: dotnet test --logger "trx;LogFileName=results.trx"

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
```

## Java (JUnit)

```yaml
- name: Run tests
  run: mvn test

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/TEST-*.xml'
```

See the [Java example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/java.yml).

## Python (JUnit via pytest)

```yaml
- name: Run tests
  run: pytest --junitxml=test-results.xml

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

See the [Python example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/python.yml).

## JavaScript / TypeScript (JUnit)

### Jest

```yaml
- name: Run tests
  run: npx jest --ci --reporters=default --reporters=jest-junit

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'junit.xml'
```

Install `jest-junit` and configure it in `jest.config.js` to write `junit.xml`.

### Vitest

```yaml
- name: Run tests
  run: npx vitest run --reporter=junit --outputFile=test-results.xml

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

See the [JavaScript example workflow](https://github.com/mzbrau/actions-insights/blob/main/examples/javascript.yml).

## Go (JUnit via gotestsum)

```yaml
- name: Run tests
  run: gotestsum --junitfile test-results.xml -- ./...

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

Install `gotestsum` before running tests (e.g. `go install gotest.tools/gotestsum@latest`).

## Ruby (JUnit via rspec_junit_formatter)

```yaml
- name: Run tests
  run: bundle exec rspec --format RspecJunitFormatter --out test-results.xml

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

Add the `rspec_junit_formatter` gem to your project.

## Multiple Result Files

Use a glob pattern to match multiple files:

```yaml
with:
  test-results: '**/*.{trx,xml}'
```

## Troubleshooting

- **No results found** — verify the glob matches your output path and that tests ran before the Actions Insights step
- **Wrong format detected** — ensure XML files use a supported schema; place specific parsers before generic ones
- **Empty report** — check that test files are not in `.gitignore` paths excluded from the workspace

## Code Coverage

When `coverage-enabled: true`, Actions Insights parses coverage files alongside test results. Supported formats: **Cobertura** (including Coverlet output), **OpenCover**, **LCOV**, and **JaCoCo**. Coverage appears in PR comments, job summaries, HTML artifacts, and the history dashboard.

| Format | Typical output | Default glob |
|--------|---------------|--------------|
| Cobertura XML | `coverage.cobertura.xml` | `**/coverage.cobertura.xml` |
| OpenCover XML | `*.opencover.xml` | `**/coverage.opencover.xml` |
| JaCoCo XML | `jacoco.xml` | `**/jacoco*.xml` |
| LCOV | `lcov.info` | `**/lcov.info` |

Set `coverage-files` to a glob matching your test runner's output. Use comma-separated patterns for multiple globs.

### .NET (Cobertura via Coverlet)

```yaml
- name: Run tests
  run: dotnet test --collect:"XPlat Code Coverage" --results-directory ./coverage --logger "trx;LogFileName=results.trx"

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/*.trx'
    coverage-enabled: true
    coverage-files: '**/coverage.cobertura.xml'
```

See the [.NET example workflow with coverage](https://github.com/mzbrau/actions-insights/blob/main/examples/dotnet.yml).

### Java (JaCoCo)

```yaml
- name: Run tests
  run: mvn test jacoco:report

- uses: mzbrau/actions-insights@v1
  with:
    test-results: '**/TEST-*.xml'
    coverage-enabled: true
    coverage-files: '**/jacoco*.xml'
```

Configure the JaCoCo Maven plugin to write XML reports. Gradle projects typically use the JaCoCo plugin with `reports { xml.required = true }`.

### Python (LCOV via pytest-cov)

```yaml
- name: Run tests
  run: pytest --junitxml=test-results.xml --cov --cov-report=lcov:coverage/lcov.info

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
    coverage-enabled: true
    coverage-files: 'coverage/lcov.info'
```

For Cobertura XML output instead, use `--cov-report=xml:coverage/coverage.xml` and set `coverage-files: 'coverage/coverage.xml'`.

### JavaScript / TypeScript (LCOV via Vitest)

```yaml
- name: Run tests
  run: npx vitest run --reporter=junit --outputFile=test-results.xml --coverage

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
    coverage-enabled: true
    coverage-files: '**/lcov.info'
```

### Jest (LCOV via nyc or built-in coverage)

```yaml
- name: Run tests
  run: npx jest --ci --coverage --coverageReporters=lcov

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'junit.xml'
    coverage-enabled: true
    coverage-files: 'coverage/lcov.info'
```

### Optional: fail when coverage is missing

```yaml
with:
  coverage-enabled: true
  coverage-files: '**/coverage.cobertura.xml'
  coverage-fail-if-missing: true
```

See [Configuration Reference — Code coverage](../reference/configuration#code-coverage) for all coverage inputs.

## Next Step

[Add the action to your workflow](./add-action).
