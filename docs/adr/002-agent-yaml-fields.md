# ADR-002: agent.yaml field scope

## Status

Accepted

## Context

`agent.yaml` is a repo-level manifest that any Duck skill can read. Skills may have
their own configuration needs (templates, output formats, publish targets). There is a
risk of `agent.yaml` becoming skill-specific over time, reducing its usefulness as a
general manifest.

## Decision

`agent.yaml` contains only fields that describe the **application itself** and are
useful to any skill:

- `purpose` — one-sentence end-user description
- `description` — 3–5 sentence overview for docs consumers
- `startup.command` — how to start the application
- `startup.notes` — human-readable notes about ports and warm-up time
- `validation.url` — URL to confirm the app is running
- `validation.expected_status` — expected HTTP status code
- `docs.repo` — URL of the documentation repository
- `docs.specs_dir` — directory containing feature specs
- `docs.images_dir` — directory containing screenshots

Fields that belong to a specific skill (e.g. section templates, publish formats,
approval behaviour) live inside the skill file, not in `agent.yaml`.

## Consequences

Skills that need extra configuration must carry that configuration themselves or
prompt the user at runtime. `agent.yaml` stays small and stable across skill versions.
