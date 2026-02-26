---
id: screenshots
title: docsbot screenshots
sidebar_position: 3
---

# docsbot screenshots

Capture UI screenshots using Playwright and generate user-facing documentation with AI-written captions.

## Usage

```bash
docsbot screenshots [options]
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--app <url>` | `http://localhost:5173` | Running app URL |
| `--manifest <path>` | `scenarios.yaml` | Scenario definitions file |
| `--screenshots <dir>` | `docs/screenshots` | Where to save PNGs |
| `--output <dir>` | `docs/user` | Where to write user guides |

## Example

```bash
# Start your app first
bun run dev &

# Then capture
docsbot screenshots \
  --app http://localhost:5173 \
  --manifest ./scenarios.yaml \
  --output ./docs/user
```

## Scenarios file

Define browser automation steps in `scenarios.yaml`:

```yaml
- id: empty-state
  name: Empty state
  actions:
    - wait: 500

- id: add-todo
  name: Add a todo item
  actions:
    - fill: "input[placeholder='Add a todo']" with "Buy milk"
    - click: "button[type='submit']"
    - waitForSelector: ".todo-item"

- id: multiple-todos
  name: Multiple todos
  actions:
    - fill: "input" with "Walk the dog"
    - click: "button[type='submit']"
    - fill: "input" with "Read a book"
    - click: "button[type='submit']"
    - wait: 300

- id: completed-item
  name: Mark item as complete
  actions:
    - click: ".todo-item:first-child .toggle"
    - wait: 200
```

## Supported actions

| Action | Syntax | Description |
|---|---|---|
| `fill` | `fill: "selector" with "text"` | Type text into an input |
| `click` | `click: "selector"` | Click an element |
| `wait` | `wait: 500` | Wait N milliseconds |
| `waitForSelector` | `waitForSelector: "selector"` | Wait until element appears |

## What it produces

For each scenario:
1. Playwright navigates to `--app` and executes the actions
2. A full-page screenshot is saved as `docs/screenshots/<id>.png`
3. Claude's vision API generates a caption
4. A markdown user guide is written to `docs/user/`
5. Screenshot hashes are saved to `docs/screenshots/hashes.json`

```
docs/user/
├── empty-state.md
├── add-todo.md
├── multiple-todos.md
└── completed-item.md

docs/screenshots/
├── empty-state.png
├── add-todo.png
├── multiple-todos.png
├── completed-item.png
└── hashes.json
```

## Console output

```
Capturing screenshots
  app      : http://localhost:5173
  manifest : /project/scenarios.yaml
  output   : /project/docs/user

  ✓ empty-state
  ✓ add-todo
  ✓ multiple-todos
  ✓ completed-item

  saved screenshot hashes → docs/screenshots/hashes.json

Captured 4 scenario(s). Done.
```

## Environment

Requires `ANTHROPIC_API_KEY`. Playwright must be installed:

```bash
bunx playwright install chromium
```
