# Generate User Docs

Generate user-facing documentation from a feature spec and publish it to the docs site.

## Usage

```
/generate-user-docs <feature>
```

`<feature>` is the name of a subdirectory under `docs.specs_dir` in `agent.yaml`
(e.g. `scheduler-ui`).

## Steps

### 1. Read agent.yaml

Read `agent.yaml` from the repo root. Extract:

- `docs.repo` — GitHub URL of the documentation repository
- `docs.specs_dir` — directory containing feature specs (default: `specs/`)
- `docs.images_dir` — directory containing screenshots (default: `images/`)
- `startup.command` — command to start the application locally (optional)
- `startup.notes` — human-readable notes about ports and warm-up time (optional)
- `validation.url` — URL to confirm the app is running (optional)
- `validation.expected_status` — expected HTTP status code (optional, default: 200)

If `docs.repo` is missing or empty, stop and tell the user:
> `agent.yaml` is missing `docs.repo`. Add the URL of your docs repository and try again.

### 2. Read the feature spec

If `{docs.specs_dir}{feature}/` does not exist, list all directories under `{docs.specs_dir}`
and stop:
> Spec `{feature}` not found. Available specs: …

Otherwise read every file under `{docs.specs_dir}{feature}/` in this order (skip any that are
absent):

- `context.md` — background and goals
- `contracts.md` — data shapes and API surface
- `briefs/*.md` — design briefs
- `decisions/*.md` — decision records

### 3. Clarification gate

Before asking the user anything, exhaust every available source:

1. **Re-read the spec** — `context.md`, `contracts.md`, briefs, and decisions may already
   answer the question.
2. **Search the codebase** — look for answers in source files:
   - **Permissions / roles**: search for role guards, permission checks, or authorization
     decorators on the relevant controllers, routes, or components.
   - **Navigation path**: search for route definitions, menu config, or sidebar config that
     reveals the exact path to the feature.
   - **Prerequisites**: look for feature flags, required config keys, or setup steps referenced
     in the code or README.
   - **Scope / built vs. unbuilt**: check whether the components or API endpoints described in
     the spec actually exist in the codebase.

Only surface a question to the user if it genuinely cannot be answered from the spec or the
code. Ask all remaining open questions in a single message — never one at a time.

When asking a question, present options wherever the answer is one of a knowable set — infer
plausible choices from the spec and codebase. Always include a final "Other: …" option so the
user can supply a custom answer. Example format:

> **Which roles can access this feature?**
> A) Administrator only
> B) Administrator and Manager
> C) All authenticated users
> D) Other: ___

If everything is clear, skip this step entirely and proceed without asking.

Wait for the user's answers before continuing.

### 4. Start the app and capture screenshots

If `startup.command` is present in `agent.yaml`:

1. Run `startup.command` to start the application.
2. Poll `validation.url` (up to 60 s) until it returns `validation.expected_status`.
   If it does not respond in time, warn the user and continue without screenshots:
   > App did not become healthy — skipping screenshot capture. You can add screenshots manually later.
3. Navigate to the feature using the path identified in step 3 (or derived from the spec).
4. Capture screenshots for:
   - The main feature landing page / list view
   - The primary create/edit form (if applicable)
   - Any non-obvious UI element mentioned in the spec (run history tab, inline toggles, etc.)
5. Save each screenshot to `{docs.images_dir}{feature}/{descriptive-name}.png`.
6. Note the saved filenames — they will be referenced in the draft.

If `startup.command` is absent, skip this step silently.

### 5. Draft user-facing documentation

Synthesise the spec content and your answers from step 3 into a user-facing page using the
template below. Write in plain language for end users.

#### Writing style rules

- **Second person, active voice** — "Click Save", not "The Save button should be clicked"
- **Outcomes first** — "Create a job to automate recurring tasks", not "The job creation form has the following fields"
- **Navigation breadcrumbs** — always show the full path: `Modern Settings → System → Scheduler`
- **One task per How-to section** — do not combine Create and Edit into a single flow
- **No implementation leakage** — "runs in the background" is fine; "on the API server" is not end-user language
- **Destructive actions need a warning callout** — use `<Warning>` for permanent deletions and irreversible changes

#### Template

```mdx
---
title: {Feature display name}
description: "{One sentence: what this feature does and for whom.}"
sidebarTitle: {Short label for the sidebar (omit if same as title)}
icon: {Mintlify icon name, e.g. clock, user, gear — omit if unsure}
---

## Overview

{Two or three sentences: what this feature does and why it matters to the user.}

## Permissions

{Table of roles and their access level. Mark clearly if the feature is restricted.}

| Role | Access |
|------|--------|
| Administrator | Full access |
| All other roles | Not visible |

## Prerequisites

{Optional section. Only include if the user must complete setup steps before using the feature.
Delete this section if there are no prerequisites.}

- {Prerequisite 1}
- {Prerequisite 2}

## Key features

- **{Feature 1}** — {one-line description}
- **{Feature 2}** — {one-line description}
- **{Feature 3}** — {one-line description}

## How to use

### {Primary task title, e.g. "Create a new job"}

<Steps>
  <Step title="{Step 1 title}">
    {Step 1 instructions. Include the navigation path on the first step.}

    {Screenshot if available: ![{Alt text}](/{docs.images_dir}{feature}/{filename}.png)}
  </Step>
  <Step title="{Step 2 title}">
    {Step 2 instructions.}
  </Step>
</Steps>

### {Secondary task title, e.g. "Edit an existing job"}

<Steps>
  <Step title="{Step 1 title}">
    {Instructions.}
  </Step>
</Steps>

## Reference

{Concise table or list of settings, columns, statuses, or options.}

| Column / Field | Description |
|----------------|-------------|
| {Name} | {Description} |

## FAQ

**{Question 1}**
{Answer.}

**{Question 2}**
{Answer.}
```

Where the spec references screenshots and you captured them in step 4, include image tags using
the path pattern `/{docs.images_dir}{feature}/{filename}.png`. If no screenshots were captured,
omit the image tags.

### 6. Approval gate

Show the full draft to the user. Then ask:

> Does this look good? Reply `yes` to publish, or give feedback to revise.

Wait for a response. If the user says `yes`, proceed to step 7. Otherwise incorporate
the feedback, show the revised draft, and ask again.

### 7. Write local copy

Write the approved draft to `{docs.specs_dir}{feature}/user-facing.md`.

### 8. Publish to docs repo

1. Clone `{docs.repo}` into a temporary directory. If you already cloned it earlier in this session, `git pull` to get the latest instead.
2. Write the draft to `features/{feature}.mdx` inside the docs repo.
3. If screenshots were captured in step 4, copy them to `{docs.images_dir}{feature}/` inside the docs repo.
4. Look for the navigation config file in the docs repo root. Check for `mint.json`
   first (Mintlify standard), then `docs.json` (other platforms). If neither exists,
   create `mint.json` and warn the user:
   > Neither `mint.json` nor `docs.json` found — created `mint.json`. Verify this is
   > correct for your docs platform before pushing.
   Add `features/{feature}` to the `pages` array inside the group named `Features`.
   If no `Features` group exists, append one at the end of the `navigation` array.
   Do not reorder existing entries.
5. Stage all changed files, commit with the message:
   `docs: add user-facing docs for {feature}`
6. Push the commit to the main branch of the docs repo.

Confirm to the user once the push succeeds, and include the expected URL where the page
will appear.

## Notes

- Never edit `user-facing.md` or `features/{feature}.mdx` directly without going through the
  approval gate — always show the draft first.
- Do not touch any other files in the docs repo beyond `features/{feature}.mdx`, `mint.json`/`docs.json`, and screenshot images.
- If the docs repo requires authentication and git push fails, tell the user to ensure their
  SSH key or HTTPS credentials are configured for `{docs.repo}`.
- The `sidebarTitle` and `icon` frontmatter fields are optional — omit them rather than guessing.
