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
| `specs/user-docs-generator/teamplanner-staging/agent.yaml` | Ready-to-copy `agent.yaml` for TeamPlanner |
| `specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh` | Run once on the Mac to apply all three TeamPlanner changes |

## Hard sandbox constraint

This Autopod runs inside the Duck repo workspace only. The container cannot write to `/Users/ewi/repos/` (root-owned, no sudo, no GitHub network access to clone TeamPlanner).

**All acceptance criteria that check `/Users/ewi/repos/TeamPlanner/` must be satisfied by the human running the apply script on their Mac.** This is not a fixable blocker — it is a structural constraint of the pod environment.

## Applying the TeamPlanner changes (human action required)

Pull the latest duck repo on your Mac, then run:

```bash
bash /Users/ewi/repos/duck/specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh
```

This script will:
1. Copy `agent.yaml` to `TeamPlanner/agent.yaml`
2. Copy the skill to `TeamPlanner/.claude/skills/generate-user-docs.md`
3. Verify the skill copy is byte-identical with `cmp -s`
4. Insert the `/generate-user-docs` row into `TeamPlanner/CLAUDE.md` after the `/changelog` row
5. Check `git status --porcelain` before staging — skips commit if files already match HEAD (catches untracked files too)
6. Commit the three files in TeamPlanner
7. Attempt to create a changelog fragment (best-effort; may need a TTY)

The script is idempotent: re-running it when files already match HEAD prints "Nothing to commit" and exits cleanly.

## agent.yaml content

```yaml
purpose: TeamPlanner helps teams visualise and manage work schedules, capacity, and assignments across projects.

description: |
  TeamPlanner is a web-based tool for managing team capacity and scheduling.
  It gives managers and team leads a clear view of who is working on what and when,
  across multiple projects and time horizons.
  Teams use it to balance workloads, spot scheduling conflicts early, and keep
  stakeholders informed about bandwidth and priorities.

startup:
  command: bash _scripts/start-fast-agent-mode.sh
  notes: |
    Starts frontend at http://localhost:3001 and API at http://localhost:5000.
    Allow ~30s for both services to fully warm up.

validation:
  url: http://localhost:5000/health
  expected_status: 200

docs:
  repo: https://github.com/esbenwiberg/teamplanner-docs
  specs_dir: specs/
  images_dir: images/
```

## End-to-end smoke test (after apply script)

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

## Apply script fixes across pods

| Pod | Fix |
|-----|-----|
| agreeable-echidna (this) | Inline redundant `SCRIPT_DIR`; use `cmp -s` for byte-identical check; idempotency check now uses `git status --porcelain` (replaces `git diff HEAD` which silently ignored untracked files); drop `2>/dev/null` that hid real errors |
| Previous pod | `sed` → `python3` for CLAUDE.md patch; removed background clone hint from skill |

## Bugs fixed in skill across all attempts

| Attempt | Bug | Fix |
|---------|-----|-----|
| 2 | Step 6 hardcoded `docs.json`; Mintlify uses `mint.json` | Skill now checks `mint.json` first, falls back to `docs.json` |
| 3 | `DUCK_DIR` resolved 4 levels up instead of 3 | Fixed to `../../..` |
| 3 | `create-fragment.sh` failure with `set -e` caused silent abort | Wrapped in `if/then/else` |
| 4 | BSD `sed -i ''` prepended literal `\` to appended row | Replaced with `python3 re.sub` |
| 5 | `open(path).read()` used platform locale encoding | Added `encoding='utf-8'` |
| 5 | Background clone hint was non-deterministic | Clone is now synchronous |

## Interfaces / contracts

- `agent.yaml` schema: `docs/adr/002-agent-yaml-fields.md`
- Skill reads: `docs.repo`, `docs.specs_dir`, `docs.images_dir` from `agent.yaml`
- Output: `specs/{feature}/user-facing.md` (local) and `features/{feature}.mdx` + `mint.json` (docs repo)

## Files owned by this pod — do not modify without good reason

- `skills/generate-user-docs.md` — source of truth; TeamPlanner carries a copy
- `docs/agent.yaml.example` — canonical template
- `docs/adr/002-agent-yaml-fields.md` — ADR governing field scope
- `specs/user-docs-generator/teamplanner-staging/` — all three staging files

## Discovered constraints / landmines

- **Sandbox cannot write to `/Users/ewi/repos/`**: root-owned, no sudo. TeamPlanner-side changes must run on the user's machine.
- **GitHub unreachable from sandbox**: `git clone`/`git push` must run locally.
- **`mint.json` vs `docs.json`**: Mintlify uses `mint.json`; the skill checks `mint.json` first.
- **`docs.repo`**: `https://github.com/esbenwiberg/teamplanner-docs` — update `agent.yaml` if the repo is renamed.
- **Skill publish step**: requires SSH or HTTPS credentials for `github.com/esbenwiberg/teamplanner-docs` on the user's machine.
- **`create-fragment.sh` may need a TTY**: the apply script passes input via `printf |` pipe, which may not satisfy an interactive prompt. If it fails, run `bash _scripts/changelog/create-fragment.sh` manually in TeamPlanner.
