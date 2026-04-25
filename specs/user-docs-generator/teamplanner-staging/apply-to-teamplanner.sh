#!/usr/bin/env bash
# Applies all Duck integration changes to a TeamPlanner repo.
# Run from anywhere: bash <duck-root>/specs/user-docs-generator/teamplanner-staging/apply-to-teamplanner.sh
# Pass an alternate TeamPlanner path as $1 to override the default.
set -euo pipefail

DUCK_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
TP_DIR="${1:-/Users/ewi/repos/TeamPlanner}"

echo "Duck:        $DUCK_DIR"
echo "TeamPlanner: $TP_DIR"

if [[ ! -d "$TP_DIR" ]]; then
  echo "ERROR: TeamPlanner repo not found at $TP_DIR" >&2
  echo "       Pass the correct path as the first argument." >&2
  exit 1
fi

# 1. Copy agent.yaml
cp "$DUCK_DIR/specs/user-docs-generator/teamplanner-staging/agent.yaml" "$TP_DIR/agent.yaml"
echo "Copied agent.yaml"

# 2. Copy skill
mkdir -p "$TP_DIR/.claude/skills"
cp "$DUCK_DIR/skills/generate-user-docs.md" "$TP_DIR/.claude/skills/generate-user-docs.md"
echo "Copied skill"

# 3. Patch CLAUDE.md — insert /generate-user-docs row after /changelog row
if grep -q "generate-user-docs" "$TP_DIR/CLAUDE.md"; then
  echo "CLAUDE.md already has /generate-user-docs row — skipping patch"
else
  python3 - "$TP_DIR/CLAUDE.md" <<'PYEOF'
import re, sys
path = sys.argv[1]
txt = open(path, encoding='utf-8').read()
row = '| `/generate-user-docs` | Generate user-facing docs from a feature spec and publish to docs site |'
patched = re.sub(r'(\|[^\n]*/changelog[^\n]*\n)', r'\1' + row + '\n', txt, count=1)
if patched == txt:
    sys.exit(
        "ERROR: /changelog row not found in CLAUDE.md\n"
        "Add this row manually after the /changelog entry:\n"
        "  " + row
    )
open(path, 'w', encoding='utf-8').write(patched)
print(f"Patched {path}")
PYEOF
fi

# 4. Commit
cd "$TP_DIR"
_files=(agent.yaml .claude/skills/generate-user-docs.md CLAUDE.md)
_status="$(git status --porcelain -- "${_files[@]}")"
if [[ -z "$_status" ]]; then
  echo "Nothing to commit — files already match HEAD"
else
  git add "${_files[@]}"
  git commit -m "feat: integrate Duck for user-facing docs generation"
  echo "Committed to TeamPlanner"
fi

# 5. Changelog fragment (best-effort — create-fragment.sh may require a TTY)
if [[ -f "_scripts/changelog/create-fragment.sh" ]]; then
  if printf 'feat\ndocs\nAdd Duck user-docs generator integration with agent.yaml manifest\n' \
       | bash _scripts/changelog/create-fragment.sh; then
    echo "Changelog fragment created"
  else
    echo "WARNING: create-fragment.sh did not complete (may need a TTY)." >&2
    echo "Run manually: cd $TP_DIR && bash _scripts/changelog/create-fragment.sh" >&2
  fi
fi

echo
echo "Done. Review with: git -C $TP_DIR show --stat"
