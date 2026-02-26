---
id: validation
title: Validation
sidebar_position: 3
---

# Validation

`docsbot validate` runs four independent checks and exits with code `1` if any fail. Designed to be a CI gate.

---

## Check 1: Drift detection

**What it catches:** source changed but `docsbot generate` wasn't run.

**How it works:**

1. Parses all source files (same as generate)
2. Computes SHA-256 hash for each
3. Compares against hashes stored in `docsbot-snapshot.json`
4. If any hash differs → fail

```
✗ Drift check
  src/api/routes.ts has changed since last generation
  Run: docsbot generate
```

---

## Check 2: Screenshots

**What it catches:** PNG screenshots were modified after capture (corruption, tampering, or stale captures).

**How it works:**

1. Reads `docs/screenshots/hashes.json` (written by `docsbot screenshots`)
2. Recomputes SHA-256 of every `.png` in `docs/screenshots/`
3. Compares — any mismatch fails

```
✗ Screenshots check
  docs/screenshots/empty-state.png hash mismatch
  Re-run: docsbot screenshots
```

---

## Check 3: Doc examples

**What it catches:** code examples in generated docs that no longer execute correctly.

**How it works:**

1. Reads `docs/agent/index.md`
2. Extracts fenced code blocks tagged `` ```typescript ``
3. Runs each block through `bun eval`
4. Any non-zero exit = fail

```
✗ Examples check
  Code block in docs/agent/api.md line 42 failed:
  ReferenceError: Todo is not defined
```

:::tip
Keep examples self-contained or import from the module being documented.
:::

---

## Check 4: LLM review

**What it catches:** semantic inaccuracies, missing coverage, or misleading descriptions in generated docs.

**How it works:**

1. Sends source code + generated docs to Claude
2. Claude reviews accuracy and completeness
3. Returns PASS/FAIL with specific issues flagged

```
✗ LLM review
  routes.ts: deleteTask is documented as returning void but
  source shows it returns the deleted Todo object.
```

This is the most thorough check — and the most expensive (one API call per module). Skip it in fast CI runs with `--skip llm`.

---

## Skipping checks

```bash
# Skip expensive LLM review
docsbot validate --skip llm

# Skip multiple
docsbot validate --skip drift,screenshots

# Run only drift check
docsbot validate --skip screenshots,examples,llm
```

Available values: `drift`, `screenshots`, `examples`, `llm`

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | All enabled checks passed |
| `1` | One or more checks failed |

CI integration:

```yaml
- name: Validate docs
  run: docsbot validate --skip screenshots
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```
