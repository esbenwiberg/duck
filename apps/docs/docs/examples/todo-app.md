---
id: todo-app
title: Todo App Example
sidebar_position: 1
---

# Todo App Example

The `apps/todo` directory is a full-stack reference application that demonstrates duck's complete workflow: from generating API docs to capturing UI screenshots.

## Architecture

```
apps/todo/
├── src/
│   ├── api/
│   │   ├── server.ts     ← Hono server
│   │   ├── routes.ts     ← REST endpoints
│   │   ├── store.ts      ← In-memory state
│   │   └── types.ts      ← Todo interface
│   └── ui/
│       ├── App.tsx       ← React component
│       ├── api.ts        ← HTTP client
│       └── main.tsx      ← Entry point
├── scenarios.yaml        ← Screenshot scenarios
└── package.json
```

## Data model

```typescript
interface Todo {
  id: string;        // UUID
  title: string;     // Display text
  completed: boolean;
  createdAt: string; // ISO timestamp
}
```

## API endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create a todo |
| `GET` | `/api/todos/:id` | Get one todo |
| `PATCH` | `/api/todos/:id` | Update title or completed |
| `DELETE` | `/api/todos/:id` | Delete a todo |

## Running the app

```bash
# From monorepo root
bun run dev:todo
```

This starts:
- **API server** on `http://localhost:3000`
- **UI** on `http://localhost:5173`

## Generating docs for it

```bash
# Generate API docs
bun run docs:generate
# → equivalent to: docsbot generate --target apps/todo/src --output apps/todo/docs/agent

# Capture UI screenshots
docsbot screenshots \
  --app http://localhost:5173 \
  --manifest apps/todo/scenarios.yaml \
  --output apps/todo/docs/user

# Validate everything
bun run docs:validate
```

## Screenshot scenarios

The `scenarios.yaml` demonstrates four states:

```yaml
- id: empty-state
  name: Empty state — no todos yet
  actions:
    - wait: 500

- id: add-todo
  name: Add a single todo
  actions:
    - fill: "input[placeholder='What needs to be done?']" with "Buy groceries"
    - click: "button[type='submit']"
    - waitForSelector: ".todo-item"

- id: multiple-todos
  name: Multiple todos in the list
  actions:
    - fill: "input" with "Walk the dog"
    - click: "button[type='submit']"
    - fill: "input" with "Read a book"
    - click: "button[type='submit']"
    - fill: "input" with "Call mom"
    - click: "button[type='submit']"
    - wait: 300

- id: completed-item
  name: Mark the first item as complete
  actions:
    - click: ".todo-item:first-child input[type='checkbox']"
    - wait: 200
```

## What duck generates

After running generate + screenshots, you'll find:

```
apps/todo/docs/
├── agent/
│   ├── index.md
│   ├── routes.md       ← API endpoint docs
│   ├── store.md        ← Store function docs
│   ├── types.md        ← Todo interface docs
│   └── docsbot-snapshot.json
└── user/
    ├── empty-state.md
    ├── add-todo.md
    ├── multiple-todos.md
    └── completed-item.md
```

Each file in `docs/agent/` documents a module. Each file in `docs/user/` is a screenshot-backed user guide with an AI-generated caption.

## Using it as a template

The todo app is intentionally simple — one backend file per concern, one frontend component. It's designed to be easy to follow and extend when building your own duck integration.
