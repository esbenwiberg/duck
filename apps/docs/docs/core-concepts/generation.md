---
id: generation
title: Doc Generation
sidebar_position: 2
---

# Doc Generation

Duck uses the TypeScript Compiler API and Claude to convert source code into markdown documentation.

## Parsing: what gets extracted

Duck's parser (`parse.ts`) walks every `.ts` and `.tsx` file and extracts:

### Functions

```typescript
interface ParsedFunction {
  name: string;
  params: { name: string; type: string; optional: boolean }[];
  returnType: string;
  isAsync: boolean;
  jsDoc?: string;         // raw JSDoc comment
  examples?: string[];    // @example tags
}
```

### Types and interfaces

```typescript
interface ParsedType {
  name: string;
  kind: "interface" | "type" | "enum";
  members: { name: string; type: string; optional: boolean }[];
  jsDoc?: string;
}
```

### Classes

```typescript
interface ParsedClass {
  name: string;
  methods: ParsedFunction[];
  jsDoc?: string;
}
```

---

## Prompt construction

Each `ParsedModule` is formatted into a deterministic prompt:

```
You are a technical documentation writer. Given the following module metadata,
write clear and accurate markdown documentation.

Module: src/api/routes.ts

Functions:
  getTodos
    params: none
    returns: Promise<Todo[]>
    async: true

  createTodo
    params: title (string)
    returns: Promise<Todo>
    async: true
...
```

Prompts are entirely data-driven — no hardcoded examples or creative variation.

---

## Content hashing

Before sending anything to Claude, duck computes a SHA-256 of each source file:

```typescript
import { createHash } from "crypto";

const hash = createHash("sha256").update(source).digest("hex");
```

If the hash matches what's in `docsbot-snapshot.json`, the file is **skipped**. This keeps subsequent runs fast and API costs low, even in large codebases.

---

## Output format

Generated docs follow a consistent structure:

```markdown
# moduleName

Brief module description.

## Functions

### functionName

Description of what the function does.

**Parameters**
- `paramName` (`Type`) — description

**Returns** `ReturnType`

**Example**
\```typescript
// usage example
\```
```

The index page (`docs/agent/index.md`) links to every generated module.

---

## Force regeneration

To regenerate all files regardless of hash:

```bash
docsbot generate --force
```

Use this after updating docsbot itself or changing model parameters.
