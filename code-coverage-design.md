# Implement Code Coverage Collection, Reporting and Historical Analysis

## Background

The existing GitHub Actions Insight project already provides comprehensive test reporting.

Current functionality includes:

* Parsing TRX, NUnit, xUnit and JUnit results.
* GitHub Checks integration.
* Rich GitHub Job Summary.
* Detailed PR comments.
* HTML report uploaded as a workflow artifact.
* Optional History Repository integration.
* React-based GitHub Pages dashboard for historical analysis.

The project already has a well-defined internal data model for workflow runs, repositories, branches and test results.

This task is to extend that model to support **code coverage**.

The implementation should feel like a natural extension of the existing architecture rather than a separate feature.

---

# Goals

The action should be able to collect code coverage produced during the workflow and surface it everywhere that test information is already displayed.

Coverage should become a first-class concept throughout the application.

Users should immediately be able to answer questions such as:

* What is the current coverage?
* Has coverage increased or decreased?
* Which projects have poor coverage?
* Did this PR reduce coverage?
* How has coverage changed over time?

---

# Supported Formats

Design the architecture to support multiple formats.

Implement support in this priority order:

1. Cobertura XML
2. Coverlet (Cobertura output)
3. OpenCover
4. LCOV
5. JaCoCo

Parser interfaces should make future formats easy to add.

Do not tightly couple the implementation to Cobertura.

---

# Collection

The action should accept one or more coverage files.

Example configuration:

```yaml
coverage:
  enabled: true

  files:
    - "**/coverage.cobertura.xml"

  fail-if-missing: false
```

Support glob patterns.

Support multiple reports.

Support merging multiple reports into one logical coverage model.

---

# Internal Data Model

Introduce a normalized coverage model.

Avoid exposing parser-specific concepts.

Suggested model:

Coverage Summary

* Line coverage
* Branch coverage
* Method coverage
* Class coverage
* File coverage
* Covered lines
* Total lines
* Covered branches
* Total branches

Projects

Files

Packages

Classes

Methods (optional)

The data model should allow future drill-down to file level.

---

# History Repository

Coverage should become part of every stored workflow run.
Store coverage in a seperate file alongside test information.

Do not duplicate data unnecessarily.

Historical runs should contain:
- Coverage summary
- Per-project summary
- Metadata

The JSON should remain compact.

---

# React Web Application

Make 2 changes within the web application:

## Coverage Tab on the repository

Add a new tab on the main repository page (alongside the existing tabs) called 'Test Coverage'. This tab will show the code coverage trends over time in a bar chart, similar to other bar charts within the application. The chart should have x and y keys, and tooltips for additional information. Coverage should be at an application and project level (with one chart per project).

## Workflow Run Page

On the summary tab, add some additional boxes to the existing boxes to show key code coverage information (if available). This should include the current code coverage and the change compared to the main branch or the previous run on the main branch (depending if this is the main branch or a feature branch).

Add a new Tab Called Test Coverage which will allow the user to dive deep into the coverage metrics, providing an interactive layout to display the available information in an intuitive way.

---

# Pull Request Comment

Enhance the PR comment with the current code coverage for this test run.

---

# Performance

Coverage reports may contain tens of thousands of files.
Avoid loading everything.
Avoid storing unnecessary data.
Support lazy loading.
Compress JSON where practical.

---

# Parsing

Implement parser interfaces.

Example:

ICoverageParser
CanParse()
Parse()

Coverage parsers should not know about GitHub.
Coverage parsers should produce only normalized models.

---

# Validation

Validate:

Percentages
Totals
Missing files
Malformed XML
Multiple reports
Conflicting reports
Gracefully report parser errors.

---

# Accessibility

Ensure:

Readable progress bars
Colour is not the only indicator
Dark mode and light mode compatibility

---

# Documentation

Update all relevent documentation to capture the new feature and configuration

---

# Testing

Implement:

Parser tests
Golden file tests
Snapshot tests
Integration tests
React component tests
Large report performance tests
Provide sample coverage reports for every supported format.

---

# Architecture

Coverage should follow the same architecture already established for test reporting.

Workflow

↓

Coverage Collectors

↓

Normalized Coverage Model

↓

Internal Run Model

↓

GitHub Outputs

↓

History Repository

↓

React Dashboard

Avoid introducing duplicate concepts.

Coverage should simply become another aspect of a workflow run.

---

# Future Compatibility

Design the implementation so future enhancements can be added without major refactoring.

Examples include:

Diff coverage

Changed-files coverage

Per-method coverage

Coverage badges

Coverage regression detection

Pull request coverage annotations

Coverage heat maps

Coverage ownership

Do not implement these now.

Simply ensure the architecture supports them.

