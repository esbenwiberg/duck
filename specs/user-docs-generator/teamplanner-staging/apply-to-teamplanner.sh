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

if ! grep -q "generate-user-docs" "$TP_DIR/CLAUDE.md"; then
  # BSD (macOS) sed requires an empty string after -i; GNU sed does not
  if sed --version 2>/dev/null | grep -q GNU; then
    sed -i '/`\/changelog`/a | `\/generate-user-docs` | Generate user-facing docs from a feature spec and publish to docs site |' \
      "$TP_DIR/CLAUDE.md"
  else
    sed -i '' '/`\/changelog`/a\\
| \`\/generate-user-docs\` | Generate user-facing docs from a feature spec and publish to docs site |' \
      "$TP_DIR/CLAUDE.md"
  fi
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
  echo "WARNING: create-fragment.sh exited non-zero (non-TTY?). Create fragment manually:" >&2
  echo "  cd $TP_DIR && bash _scripts/changelog/create-fragment.sh" >&2
fi

echo "Done. Review with: git -C $TP_DIR show --stat"
