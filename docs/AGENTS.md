# AGENTS.md — Documentation Site

Docusaurus 3 site published to [ghactionsinsights.com](https://www.ghactionsinsights.com/).

Parent guidance: [`../AGENTS.md`](../AGENTS.md).

## Content location

Documentation pages live in **`docs/docs/`** (not the `docs/` workspace root).

```
docs/
├── docusaurus.config.ts   Site configuration
├── sidebars.ts            Sidebar navigation
└── docs/                  ← actual content pages
    ├── setup/             User setup guides (including ai-setup.md)
    ├── reference/         Architecture, configuration
    ├── history-repository/
    ├── development.md
    └── contributing.md
```

## Commands

```bash
npm run docs:start    # Docusaurus dev server (from repo root)
npm run docs:build    # Production build
```

Or from the docs workspace:

```bash
npm run start --workspace=actions-insights-docs
npm run build --workspace=actions-insights-docs
```

## When to update docs

Update the matching page under `docs/docs/` when you:

- Add or change an input in `action.yml`
- Change user-facing behavior or defaults
- Add a new feature that users need to configure
- Change setup workflows or example YAMLs

Key reference pages:

| Topic | Path |
|-------|------|
| Configuration inputs | `docs/docs/reference/configuration.md` |
| Architecture | `docs/docs/reference/architecture.md` |
| Development | `docs/docs/development.md` |
| Contributing | `docs/docs/contributing.md` |

## ai-setup.md is not for repo development

[`docs/docs/setup/ai-setup.md`](docs/docs/setup/ai-setup.md) is the **consumer-facing** playbook — it guides AI assistants helping end users set up Actions Insights in their own repositories. Repo development guidance lives in the root [`AGENTS.md`](../AGENTS.md).

## Conventions

- Use frontmatter (`sidebar_position`, `title`) on each page.
- Mermaid diagrams are supported via `@docusaurus/theme-mermaid`.
- The canonical source for contributing guidelines is also in the root [`CONTRIBUTING.md`](../CONTRIBUTING.md) — keep both in sync when changing contribution rules.
