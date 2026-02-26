---
id: overview
title: Overview
sidebar_position: 1
---

# How Duck Works

Duck treats documentation like a build artifact — generated from source, validated against it, and cached with content hashes.

## The pipeline

```
Source files (.ts / .tsx)
        │
        ▼
┌───────────────────┐
│      Parser       │  TypeScript Compiler API
│  glob.ts          │  Finds all source files
│  parse.ts         │  Extracts metadata (AST)
└────────┬──────────┘
         │  ParsedModule[]
         ▼
┌───────────────────┐
│    Generator      │  Claude Sonnet 4.6
│  render.ts        │  Builds prompt from metadata
│  llm.ts           │  Calls Claude API
│  generate.ts      │  Writes markdown + snapshot
└────────┬──────────┘
         │  docs/agent/*.md
         ▼
┌───────────────────┐
│    Validator      │  4 independent checks
│  validate.ts      │  Drift · Screenshots
│                   │  Examples · LLM review
└───────────────────┘
```

---

## Step 1: Parsing

Duck's parser (`packages/docsbot/src/parser/`) uses the **TypeScript Compiler API** — not regular expressions. This means it handles:

- Generic types correctly
- Complex overloaded functions
- Re-exports and ambient declarations
- JSDoc with `@param`, `@returns`, `@example` tags

For every source file, it produces a `ParsedModule`:

```typescript
interface ParsedModule {
  path: string;          // relative source path
  contentHash: string;   // SHA-256 of file contents
  functions: ParsedFunction[];
  types: ParsedType[];
  classes: ParsedClass[];
}
```

---

## Step 2: Generation

The generator (`packages/docsbot/src/generator/`) builds a structured prompt from each `ParsedModule` and sends it to Claude:

```
You are a technical documentation writer.
Given the following TypeScript module metadata, write clear markdown docs...

Module: src/api/routes.ts
Functions:
  - getTodos(): Promise<Todo[]>    // GET /api/todos
  - createTodo(title: string): Promise<Todo>
...
```

Claude returns markdown. Duck writes it to `docs/agent/<module>.md` and saves the content hash in `docsbot-snapshot.json`.

**Smart regeneration:** if a file's hash hasn't changed since the last run, duck skips it entirely. Only modified files incur an API call.

---

## Step 3: Screenshots (optional)

The screenshotter (`packages/docsbot/src/screenshotter/`) uses Playwright to capture UI states defined in a `scenarios.yaml` file. Claude's vision API generates captions. The result is a user-facing guide in `docs/user/`.

See [screenshots command →](/docs/cli-reference/screenshots)

---

## Step 4: Validation

The validator runs four independent checks and exits 1 if any fail:

| Check | Mechanism |
|---|---|
| **Drift** | Recomputes source hash, compares to snapshot |
| **Screenshots** | SHA-256 of PNG files vs stored hashes |
| **Examples** | Extracts code blocks from docs, runs via `bun eval` |
| **LLM review** | Claude reads source + docs, flags inaccuracies |

See [validation in depth →](/docs/core-concepts/validation)
