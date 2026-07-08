---
sidebar_position: 8
title: Adding Repositories
---

# Adding Source Repositories

A single history repository supports multiple source projects. No manual registration is required.

## Steps

1. Use the same `history-repository` in each project's workflow
2. Each project writes to `data/repositories/{owner.repo}/`
3. The global `repositories.json` index is updated automatically
4. The dashboard discovers all repositories from the index

## Example

Three projects sharing one history repo:

```yaml
# repo-a workflow
history-repository: my-org/test-history
history-repository-name: auto  # writes to my-org.repo-a

# repo-b workflow
history-repository: my-org/test-history
history-repository-name: auto  # writes to my-org.repo-b
```

## Default repository

Set `history-default-repository` on first publish, or edit `config.json`:

```json
{ "defaultRepository": "my-org/repo-a" }
```
