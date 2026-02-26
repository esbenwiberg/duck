---
id: validate
title: docsbot validate
sidebar_position: 2
---

# docsbot validate

Validate documentation against source code. Exits with code `1` if any check fails.

## Usage

```bash
docsbot validate [options]
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--target <dir>` | `.` (cwd) | Source directory |
| `--output <dir>` | `docs/agent` | Agent docs directory |
| `--screenshots <dir>` | `docs/screenshots` | Screenshots directory |
| `--skip <checks>` | (none) | Comma-separated list of checks to skip |

## Examples

```bash
# Run all checks
docsbot validate

# Skip slow/expensive checks in fast CI
docsbot validate --skip screenshots,llm

# Skip just LLM review
docsbot validate --skip llm

# Custom paths
docsbot validate --target ./src --output ./docs/api
```

## Checks

| Check | Flag | What it catches |
|---|---|---|
| `drift` | `--skip drift` | Source changed without regenerating docs |
| `screenshots` | `--skip screenshots` | PNG files modified since capture |
| `examples` | `--skip examples` | Code blocks in docs that fail `bun eval` |
| `llm` | `--skip llm` | Semantic inaccuracies reviewed by Claude |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All enabled checks passed |
| `1` | One or more checks failed |

## CI integration

```yaml title=".github/workflows/ci.yml"
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install
        run: bun install

      - name: Validate docs
        run: docsbot validate --skip screenshots
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

## Console output

```
Validating docs
  source      : /project/src
  agent docs  : /project/docs/agent
  screenshots : /project/docs/screenshots

✓ Drift check      — all modules up to date
✓ Screenshots      — 4 screenshots unchanged
✓ Doc examples     — 6 code blocks passed
✗ LLM review       — 1 issue found

  routes.ts: createTodo is documented as returning void
  but source shows it returns Promise<Todo>.

Checks: 3 passed, 1 failed
exit 1
```
