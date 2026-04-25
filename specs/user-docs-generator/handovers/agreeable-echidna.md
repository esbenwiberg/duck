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

- Cannot write to `/Users/ewi/repos/` (permission denied — root-owned, no sudo)
- Cannot clone from GitHub (network restricted to package registries)

All acceptance criteria that check files at `/Users/ewi/repos/TeamPlanner/` cannot be satisfied from this sandbox. The three TeamPlanner changes must be applied on the user's local machine.

## Applying the TeamPlanner changes

Pull the duck repo on your Mac, then run:

```bash
bash specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh
```

This will:
1. Copy `agent.yaml` to `TeamPlanner/agent.yaml`
2. Copy the skill to `TeamPlanner/.claude/skills/generate-user-docs.md`
3. Add the `/generate-user-docs` row to `TeamPlanner/CLAUDE.md` after the `/changelog` row (via python3 — no sed portability issues)
4. Verify byte-identical copy with `diff`
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
5. `features/scheduler-ui.mdx` and updated `mint.json` (or `docs.json`) committed and pushed to `https://github.com/esbenwiberg/teamplanner-docs`

## Bugs fixed across attempts

| Attempt | Bug | Fix |
|---------|-----|-----|
| 2 | Step 6 hardcoded `docs.json`; Mintlify uses `mint.json` | Skill now checks `mint.json` first, falls back to `docs.json` |
| 3 | `DUCK_DIR` resolved 4 levels up instead of 3, targeting wrong directory | Fixed to `../../..` |
| 3 | `create-fragment.sh` failure with `set -e` caused silent abort after commit | Wrapped in `if/then/else` with warning |
| 4 | BSD/macOS `sed -i '' '/pattern/a\\'` with double-backslash prepends a literal `\` to the appended row | Replaced sed with `python3 re.sub` — portable on macOS and Linux |

## Interfaces / contracts

- `agent.yaml` schema: `docs/adr/002-agent-yaml-fields.md`
- Skill reads: `docs.repo`, `docs.specs_dir`, `docs.images_dir` from `agent.yaml`
- Output: `specs/{feature}/user-facing.md` (local) and `features/{feature}.mdx` + `mint.json` (docs repo)

## Files owned by this pod — do not modify without good reason

- `skills/generate-user-docs.md` — source of truth; TeamPlanner carries a copy
- `docs/agent.yaml.example` — canonical template
- `docs/adr/002-agent-yaml-fields.md` — ADR governing field scope

## Discovered constraints / landmines

- **Sandbox cannot write to `/Users/ewi/repos/`**: root-owned, no sudo, verified across all attempts. TeamPlanner-side changes must run on the user's machine.
- **GitHub unreachable from sandbox**: `git clone`/`git push` must run locally.
- **`mint.json` vs `docs.json`**: Mintlify uses `mint.json`; skill copies made before attempt 2 should be refreshed.
- **`docs.repo`**: set to `https://github.com/esbenwiberg/teamplanner-docs` — update `agent.yaml` if the repo is renamed.
- **Skill publish step**: requires SSH or HTTPS credentials for `github.com/esbenwiberg/teamplanner-docs` on the user's machine.
