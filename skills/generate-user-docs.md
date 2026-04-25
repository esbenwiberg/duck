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

If `docs.repo` is missing or empty, stop and tell the user:
> `agent.yaml` is missing `docs.repo`. Add the URL of your docs repository and try again.

Begin cloning `{docs.repo}` into a temporary directory in the background while continuing
with the steps below.

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

### 3. Draft user-facing documentation

Synthesise the spec content into a user-facing page using the five template sections below.
Write in plain language for end users.

#### Template sections

1. **Overview** — two or three sentences: what this feature does and why it matters
2. **Key features** — 3–5 bullet points highlighting the most useful capabilities
3. **How to use** — numbered step-by-step walkthrough of the primary workflow
4. **Reference** — concise table or list of settings, options, or edge-case behaviour
5. **FAQ** — two or three anticipated questions with plain-English answers

Format as MDX. Use `##` headings for each section. Where the spec references screenshots,
include image tags using the path pattern `/{docs.images_dir}{feature}/{filename}`.

### 4. Approval gate

Show the full draft to the user. Then ask:

> Does this look good? Reply `yes` to publish, or give feedback to revise.

Wait for a response. If the user says `yes`, proceed to step 5. Otherwise incorporate
the feedback, show the revised draft, and ask again.

### 5. Write local copy

Write the approved draft to `{docs.specs_dir}{feature}/user-facing.md`.

### 6. Publish to docs repo

1. Ensure the clone of `{docs.repo}` from step 1 has completed (or `git pull` if the
   directory already existed).
2. Write the draft to `features/{feature}.mdx` inside the docs repo.
3. Open `docs.json` in the docs repo. If it does not exist, create it with an empty
   `features` group. Add an entry for the new page under `features`. Do not reorder
   existing entries.
4. Stage both files, commit with the message:
   `docs: add user-facing docs for {feature}`
5. Push the commit to the main branch of the docs repo.

Confirm to the user once the push succeeds, and include the expected URL where the page
will appear.

## Notes

- Never edit `user-facing.md` or `features/{feature}.mdx` directly without going through the
  approval gate — always show the draft first.
- Do not touch any other files in the docs repo.
- If the docs repo requires authentication and git push fails, tell the user to ensure their
  SSH key or HTTPS credentials are configured for `{docs.repo}`.
