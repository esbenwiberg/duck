# Handover — agreeable-echidna

**Series:** user-docs-generator
**Date:** 2026-04-25

## What was built

### Duck infrastructure (in this repo)

| File | Purpose |
|------|---------|
| `skills/generate-user-docs.md` | Claude Code skill — invoked with `/generate-user-docs <feature>` |
| `docs/agent.yaml.example` | Annotated template for any consumer repo |
| `docs/adr/002-agent-yaml-fields.md` | ADR defining which fields belong in `agent.yaml` vs skill-specific config |

### TeamPlanner integration artifacts (staged, must be applied manually)

| File | Destination in TeamPlanner repo |
|------|--------------------------------|
| `specs/user-docs-generator/teamplanner-staging/agent.yaml` | → `TeamPlanner/agent.yaml` |
| `specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh` | Run once to apply all three changes |

## Sandbox constraint (hard blocker)

This Autopod runs inside the Duck repo workspace only. The container:

- Cannot write to `/Users/ewi/repos/` (EACCES permission denied, verified attempt 2)
- Cannot clone from GitHub (network restricted to package registries)

All acceptance criteria that check files at `/Users/ewi/repos/TeamPlanner/` cannot be satisfied from this sandbox. The three TeamPlanner changes must be applied on the user's local machine.

## Applying the TeamPlanner changes

Run the script once from the duck repo root:

```bash
bash specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh
```

This will:
1. Copy `agent.yaml` to `TeamPlanner/agent.yaml`
2. Copy the skill to `TeamPlanner/.claude/skills/generate-user-docs.md`
3. Add the `/generate-user-docs` row to `TeamPlanner/CLAUDE.md` after the `/changelog` row
4. Verify byte-identical copy
5. Commit the three files in TeamPlanner
6. Create a changelog fragment

## End-to-end smoke test (once manual steps are done)

Open Claude Code inside the TeamPlanner repo and run:

```
/generate-user-docs scheduler-ui
```

Expected flow:
1. Skill reads `agent.yaml` and all files under `specs/scheduler-ui/`
2. Draft with all 5 template sections (Overview, Key features, How to use, Reference, FAQ)
3. Approval gate — reply `yes`
4. `specs/scheduler-ui/user-facing.md` is written
5. `features/scheduler-ui.mdx` and updated `mint.json` (or `docs.json`) are committed and pushed to `https://github.com/esbenwiberg/teamplanner-docs`

## Skill changes (attempt 2)

- **Fixed**: Step 6 previously hardcoded `docs.json` as the Mintlify navigation file. Mintlify's canonical config is `mint.json`. The skill now checks for `mint.json` first, falls back to `docs.json`, and warns the user if it must create a new file.

## Interfaces / contracts

- `agent.yaml` schema is defined in `docs/adr/002-agent-yaml-fields.md`
- The skill reads `docs.repo`, `docs.specs_dir`, `docs.images_dir` from `agent.yaml`
- Output files: `specs/{feature}/user-facing.md` (local) and `features/{feature}.mdx` + `mint.json` (docs repo)

## Files owned by this pod — do not modify without good reason

- `skills/generate-user-docs.md` — source of truth; TeamPlanner carries a copy
- `docs/agent.yaml.example` — canonical template
- `docs/adr/002-agent-yaml-fields.md` — ADR governing field scope

## Discovered constraints / landmines

- **Sandbox cannot write to /Users/ewi/repos/**: verified in two attempts. Any TeamPlanner-side changes must be applied on the user's local machine or via a TeamPlanner-targeted Autopod.
- **GitHub unreachable from sandbox**: `git clone` / `git push` to external repos must run locally.
- **mint.json vs docs.json**: Mintlify uses `mint.json`; the skill was incorrectly targeting `docs.json`. Fixed in attempt 2. Any copy of the skill made before attempt 2 should be refreshed.
- **`docs.repo`** is set to `https://github.com/esbenwiberg/teamplanner-docs`. Update `agent.yaml` if the repo is renamed.
- **Skill publish step**: requires SSH or HTTPS credentials for `github.com/esbenwiberg/teamplanner-docs` on the user's machine.
