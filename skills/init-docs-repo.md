# Init Docs Repo

Scaffold a Mintlify documentation repository for this application so it is ready to receive pages from `/generate-user-docs`.

## Usage

```
/init-docs-repo
```

Run from the consumer application repo root. `agent.yaml` must already exist and contain a `docs.repo` URL pointing to an empty GitHub repository you have already created.

## Steps

### 1. Read agent.yaml

Read `agent.yaml` from the repo root. Extract:

- `docs.repo` — GitHub URL of the documentation repository to scaffold
- `purpose` — one-sentence description of the app
- `description` — longer description (3–5 sentences)

If `docs.repo` is missing or empty, stop:
> `agent.yaml` is missing `docs.repo`. Add the GitHub URL of the empty docs repository you created and try again.

Derive a display name from the repo URL: take the last path segment, replace hyphens with spaces, and title-case each word. Example: `github.com/org/teamplanner-docs` → `TeamPlanner Docs`.

### 2. Verify the docs repo is reachable

Run `git ls-remote {docs.repo}`. If it fails, stop:
> Cannot reach `{docs.repo}`. Make sure the repository exists on GitHub and that your SSH key or HTTPS credentials are configured, then try again.

### 3. Clone the docs repo

Clone `{docs.repo}` into a temporary directory. GitHub will warn if the repo is empty — that is expected.

If `mint.json` already exists in the cloned repo, stop:
> `{docs.repo}` is already scaffolded (`mint.json` found). Run `/generate-user-docs <feature>` to add a feature page.

### 4. Create scaffold files

Create the following four files inside the cloned docs repo:

#### `mint.json`

```json
{
  "$schema": "https://mintlify.com/schema.json",
  "name": "{display_name}",
  "colors": {
    "primary": "#0D9373",
    "light": "#07C983",
    "dark": "#0D9373"
  },
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction"]
    },
    {
      "group": "Features",
      "pages": []
    }
  ]
}
```

Replace `{display_name}` with the value derived in step 1.

#### `introduction.mdx`

```mdx
---
title: Introduction
description: "{purpose}"
---

{description}

## Getting started

Browse the **Features** section in the sidebar to explore what {display_name} can do.
```

Replace `{purpose}`, `{description}`, and `{display_name}` with actual values from `agent.yaml`.

#### `features/.gitkeep`

An empty file so git tracks the `features/` directory before any feature pages exist.

#### `.github/workflows/validate-docs.yml`

```yaml
name: Validate docs
on:
  pull_request:
    branches: [main]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npx mintlify@latest check
```

### 5. Commit and push

Stage all four files. Commit with the message:
```
chore: initial Mintlify scaffold
```
Push to the `main` branch of the docs repo (`git push -u origin main`).

Confirm to the user once the push succeeds.

### 6. Print next steps

> **Done! Your docs repo is scaffolded.** Two things left:
>
> 1. **Connect Mintlify**: go to [dashboard.mintlify.com](https://dashboard.mintlify.com), create a project, and connect it to `{docs.repo}`. Mintlify will auto-deploy on every push to `main` — no extra CI setup needed.
>
> 2. **Publish your first feature page**: run `/generate-user-docs <feature>` in this repo once a feature spec exists under `{docs.specs_dir}`.

## Notes

- Do not scaffold a repo that already has a `mint.json` — the skill will stop early to avoid overwriting existing content.
- The `Features` navigation group must keep that exact name. The `/generate-user-docs` skill inserts new pages into a group called `Features`.
- Colors, logo, and other `mint.json` fields can be customised in the docs repo after scaffolding; this skill will not overwrite them.
- Mintlify deployment is handled by the Mintlify GitHub App (connected via their dashboard), not a GitHub Action. The `validate-docs.yml` workflow only runs `mintlify check` on pull requests.
