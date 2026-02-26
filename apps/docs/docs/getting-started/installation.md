---
id: installation
title: Installation
sidebar_position: 1
---

# Installation

## Requirements

- **Node.js** ≥ 18 or **Bun** ≥ 1.0
- An **Anthropic API key** — duck uses Claude Sonnet 4.6 for doc generation and review

## Install docsbot

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install -g @duck/docsbot
```

</TabItem>
<TabItem value="bun" label="Bun">

```bash
bun add -g @duck/docsbot
```

</TabItem>
<TabItem value="dev" label="Dev (workspace)">

```bash
# From the duck monorepo root
bun install
```

</TabItem>
</Tabs>

## Set your API key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

Add this to your shell profile (`.bashrc`, `.zshrc`) or your CI secrets to persist it.

## Verify the install

```bash
docsbot --help
```

You should see:

```
docsbot — auto documentation agent

Commands:
  generate    Parse source and generate agent docs
  validate    Validate docs against source (drift, screenshots, examples, LLM review)
  screenshots Capture UI screenshots and generate user-facing docs
```

---

Next: [Quick start →](/docs/getting-started/quick-start)
