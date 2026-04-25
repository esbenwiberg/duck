#!/usr/bin/env bash
# Applies all Duck integration changes to a TeamPlanner repo.
# Usage: bash apply-to-teamplanner.sh [/path/to/TeamPlanner]
set -e

DUCK_DIR="$(cd "$(dirname "$0")/../../.." && pwd)"
TP_DIR="${1:-/Users/ewi/repos/TeamPlanner}"

echo "Duck: $DUCK_DIR"
echo "TeamPlanner: $TP_DIR"

cp "$DUCK_DIR/specs/user-docs-generator/teamplanner-staging/agent.yaml" "$TP_DIR/agent.yaml"

mkdir -p "$TP_DIR/.claude/skills"
cp "$DUCK_DIR/skills/generate-user-docs.md" "$TP_DIR/.claude/skills/generate-user-docs.md"

diff "$DUCK_DIR/skills/generate-user-docs.md" \
     "$TP_DIR/.claude/skills/generate-user-docs.md" \
  || { echo "ERROR: skill files differ after copy"; exit 1; }

# use python3 to avoid BSD/GNU sed differences on macOS vs Linux
if ! grep -q "generate-user-docs" "$TP_DIR/CLAUDE.md"; then
  python3 - "$TP_DIR/CLAUDE.md" <<'PYEOF'
import re, sys
path = sys.argv[1]
txt = open(path, encoding='utf-8').read()
row = '| `/generate-user-docs` | Generate user-facing docs from a feature spec and publish to docs site |'
patched = re.sub(r'(\|[^\n]*/changelog[^\n]*\n)', r'\1' + row + '\n', txt, count=1)
if patched == txt:
    sys.exit("ERROR: /changelog row not found in CLAUDE.md — add the row manually after the /changelog entry")
open(path, 'w', encoding='utf-8').write(patched)
print(f"Patched {path}")
PYEOF
fi

cd "$TP_DIR"
git add agent.yaml .claude/skills/generate-user-docs.md CLAUDE.md
git commit -m "feat: integrate Duck for user-facing docs generation"

if bash _scripts/changelog/create-fragment.sh <<EOF
feat
docs
Add Duck user-docs generator integration with agent.yaml manifest
EOF
then
  echo "Changelog fragment created."
else
  echo "WARNING: create-fragment.sh failed (non-TTY?). Create fragment manually:" >&2
  echo "  cd $TP_DIR && bash _scripts/changelog/create-fragment.sh" >&2
fi

echo "Done. Review with: git -C $TP_DIR show --stat"
