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

### TeamPlanner integration artifacts (staged)

| File | Destination in TeamPlanner repo |
|------|--------------------------------|
| `specs/user-docs-generator/teamplanner-staging/agent.yaml` | → `TeamPlanner/agent.yaml` |
| `specs/user-docs-generator/teamplanner-staging/CLAUDE-md-patch.md` | Documents the CLAUDE.md Commands table row to add |

The staging files were created because this Autopod runs inside the Duck repo workspace
only (`github.com/esbenwiberg/duck`). GitHub is not reachable from the sandbox and the
TeamPlanner repo is not mounted, so the files cannot be written there directly.

## What the human must do manually

```bash
# 1. Copy agent.yaml into TeamPlanner
cp /path/to/duck/specs/user-docs-generator/teamplanner-staging/agent.yaml \
   /Users/ewi/repos/TeamPlanner/agent.yaml

# 2. Copy the skill into TeamPlanner
cp /path/to/duck/skills/generate-user-docs.md \
   /Users/ewi/repos/TeamPlanner/.claude/skills/generate-user-docs.md

# 3. Add the CLAUDE.md row (after the /changelog row):
#    | `/generate-user-docs` | Generate user-facing docs from a feature spec and publish to docs site |

# 4. Commit in TeamPlanner
cd /Users/ewi/repos/TeamPlanner
git add agent.yaml .claude/skills/generate-user-docs.md CLAUDE.md
git commit -m "feat: integrate Duck for user-facing docs generation"

# 5. Create changelog fragment
bash _scripts/changelog/create-fragment.sh
# type: feat | scope: docs | description: Add Duck user-docs generator integration with agent.yaml manifest
```

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
5. `features/scheduler-ui.mdx` and updated `docs.json` are committed and pushed to `https://github.com/esbenwiberg/teamplanner-docs`

## Interfaces / contracts

- `agent.yaml` schema is defined in `docs/adr/002-agent-yaml-fields.md`
- The skill reads `docs.repo`, `docs.specs_dir`, `docs.images_dir`, and `purpose` from `agent.yaml`
- Output files: `specs/{feature}/user-facing.md` (local) and `features/{feature}.mdx` + `docs.json` (docs repo)

## Files owned by this pod — do not modify without good reason

- `skills/generate-user-docs.md` — source of truth; TeamPlanner carries a copy
- `docs/agent.yaml.example` — canonical template
- `docs/adr/002-agent-yaml-fields.md` — ADR governing field scope

## Discovered constraints / landmines

- **Sandbox has no outbound GitHub access**: cloning or pushing to GitHub repos from within the Autopod is not possible. Any skill step that does `git clone` or `git push` to an external repo must be run in the user's local environment.
- **TeamPlanner repo is not accessible from the Duck Autopod**: files that belong in TeamPlanner must be staged here and applied manually, or a separate Autopod configured with the TeamPlanner repo must be used.
- **`docs.repo` in agent.yaml** is set to `https://github.com/esbenwiberg/teamplanner-docs` — if this URL changes (repo renamed), the agent.yaml must be updated.
- **The skill's publish step** does `git clone` + `git push`. For this to succeed locally, the user must have SSH or HTTPS credentials configured for `github.com/esbenwiberg/teamplanner-docs`.
