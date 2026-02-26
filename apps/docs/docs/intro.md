---
id: intro
title: Introduction
sidebar_position: 1
slug: /intro
---

# Duck

**Duck** is an AI-powered documentation agent that keeps your docs in sync with your code — automatically.

It parses TypeScript source files, uses Claude to write accurate markdown documentation, then validates everything: drift detection, screenshot hashes, code example execution, and an LLM review pass. One command. Zero manual editing.

---

## The problem

Documentation goes stale. Engineers ship features, forget to update docs, and teams lose trust in anything written down. Linters catch type errors. Nothing catches docs errors — until Duck.

## What duck does

```
Source code (.ts / .tsx)
        ↓
 Parse with TypeScript compiler API
        ↓
  Send structured metadata to Claude
        ↓
    Markdown docs written to disk
        ↓
  Snapshot stored (content hash)
        ↓
  Validate: drift · screenshots · examples · LLM review
```

## The three commands

| Command | What it does |
|---|---|
| `docsbot generate` | Parse source and write markdown docs |
| `docsbot validate` | Run four health checks — CI-ready |
| `docsbot screenshots` | Capture UI screenshots and generate user guides |

## Who it's for

- **Teams** that want docs to stay honest with no manual overhead
- **CI pipelines** that need a gate against stale documentation
- **Open source maintainers** who want professional docs without the work

---

Ready? Start with [Installation →](/docs/getting-started/installation)
