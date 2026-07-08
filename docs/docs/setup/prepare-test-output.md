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

## Python (JUnit via pytest)

```yaml
- name: Run tests
  run: pytest --junitxml=test-results.xml

- uses: mzbrau/actions-insights@v1
  with:
    test-results: 'test-results.xml'
```

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

## Next Step

[Add the action to your workflow](./add-action).
