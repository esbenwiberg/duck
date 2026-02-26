---
id: generate
title: docsbot generate
sidebar_position: 1
---

# docsbot generate

Parse TypeScript source and generate markdown documentation using Claude.

## Usage

```bash
docsbot generate [options]
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--target <dir>` | `.` (cwd) | Source directory to parse |
| `--output <dir>` | `docs/agent` | Where to write markdown files |
| `--force` | `false` | Regenerate all files, ignoring hashes |

## Examples

```bash
# Generate docs for ./src, write to ./docs/api
docsbot generate --target ./src --output ./docs/api

# Regenerate everything
docsbot generate --force

# Using defaults (source = ., output = docs/agent)
docsbot generate
```

## What it does

1. **Find files** — recursively globs for `*.ts` and `*.tsx` under `--target`
2. **Parse** — TypeScript Compiler API extracts functions, types, classes, JSDoc
3. **Hash** — SHA-256 each file; compare against `docsbot-snapshot.json`
4. **Generate** — send metadata to Claude for files that changed (or all, with `--force`)
5. **Write** — saves markdown to `--output/<module>.md` and `index.md`
6. **Snapshot** — updates `docsbot-snapshot.json` with new hashes

## Output structure

```
docs/agent/
├── index.md          ← links to every module
├── api.md
├── routes.md
├── store.md
├── types.md
└── docsbot-snapshot.json
```

## Console output

```
Generating agent docs
  source : /project/src
  output : /project/docs/api

  found 12 source file(s)

  generated: 3 module(s)
  skipped  : 9 module(s) (unchanged)

Done.
```

## Snapshot file

`docsbot-snapshot.json` stores the generation timestamp and per-module content hashes:

```json
{
  "generatedAt": "2024-11-15T10:32:00.000Z",
  "modules": {
    "src/api/routes.ts": {
      "hash": "a3f1c8...",
      "docPath": "docs/agent/routes.md"
    }
  }
}
```

Commit this file alongside your docs so validation has a baseline.

## Environment

Requires `ANTHROPIC_API_KEY` to be set. Duck uses **Claude Sonnet 4.6**.
