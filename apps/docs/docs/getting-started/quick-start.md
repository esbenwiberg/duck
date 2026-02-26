---
id: quick-start
title: Quick Start
sidebar_position: 2
---

# Quick Start

Get duck running on a TypeScript project in under 2 minutes.

## 1. Set your API key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## 2. Generate docs

Point duck at your source directory:

```bash
docsbot generate --target ./src --output ./docs/api
```

Duck will:
1. Walk every `.ts` and `.tsx` file under `./src`
2. Parse each file with the TypeScript compiler API
3. Extract functions, types, classes, and JSDoc
4. Send structured metadata to Claude
5. Write markdown to `./docs/api/`
6. Save a `docsbot-snapshot.json` with content hashes

**Output example:**

```
Generating agent docs
  source : /your-project/src
  output : /your-project/docs/api

  found 8 source file(s)

  generated: 8 module(s)
  skipped  : 0 module(s) (unchanged)

Done.
```

## 3. Browse your docs

```bash
ls ./docs/api
# api.md  store.md  types.md  routes.md  index.md
```

Each file is clean markdown — ready to commit, publish, or feed into another tool.

## 4. Run on just changed files

Run generate again after modifying a source file:

```bash
docsbot generate
```

Only the changed file regenerates (the others are skipped via content hash). Fast even on large codebases.

## 5. Validate

```bash
docsbot validate
```

This runs four checks:

| Check | What it catches |
|---|---|
| Drift | Source changed but docs weren't regenerated |
| Screenshots | UI screenshot files changed |
| Examples | Code blocks in docs no longer execute |
| LLM review | Claude flags inaccuracies or missing coverage |

Exit code `1` if any check fails — plug this into CI.

## 6. Add to CI

```yaml title=".github/workflows/docs.yml"
- name: Validate docs
  run: docsbot validate
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

---

That's it. Check [Core Concepts](/docs/core-concepts/overview) to understand how the pipeline works, or jump to the [CLI Reference](/docs/cli-reference/generate) for all available flags.
