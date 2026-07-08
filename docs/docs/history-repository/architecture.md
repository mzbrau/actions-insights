---
sidebar_position: 1
title: Architecture
---

# History Repository Architecture

Actions Insights uses a three-part architecture for long-term test history:

## Components

1. **GitHub Action** — Parses test results and optionally publishes JSON to a history repository. Existing artifact, cache, PR comment, job summary, and check outputs are unchanged when history is disabled.

2. **History Repository** — A dedicated git repository containing JSON data and the React dashboard source. No HTML reports are committed.

3. **GitHub Pages** — Hosts the built React SPA. The dashboard loads JSON at runtime; new workflow runs do not require rebuilding the app.

## Data vs Presentation

The history repository is a **data store**, not a report generator:

- The action writes structured JSON only
- The React application is solely responsible for presentation
- Full run payloads live in `runs/*.json`
- Index files (`repositories.json`, `branches.json`, `history.json`) contain summaries only

## Concurrency

Multiple source repositories may write simultaneously. To minimize merge conflicts:

- Each run creates a unique file under `runs/`
- Writers only update their `owner.repo/` subtree plus their entry in `repositories.json`
- The action retries push with rebase on conflict (up to 3 attempts)

## Authentication

History publishing requires a dedicated `history-token` (PAT or GitHub App token) with `contents: write` on the history repository. This is separate from `github-token` used for PR comments and checks.
