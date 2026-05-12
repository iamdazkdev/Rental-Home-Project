#!/usr/bin/env bash
# sync.sh — Fallback: copy .ai/ → .agents/ + .claude/ for environments that don't support symlinks
# Usage: bash .ai/scripts/sync.sh
# Idempotent: safe to run multiple times

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
AI_DIR="$ROOT/.ai"
AGENTS_DIR="$ROOT/.agents"
CLAUDE_DIR="$ROOT/.claude"

echo "🔄 Syncing .ai/ → .agents/ and .claude/ ..."

# ── .agents/ ──────────────────────────────────────────────────────────────────
for dir in agents rules skills workflows; do
  if [ -L "$AGENTS_DIR/$dir" ]; then
    echo "  [skip] .agents/$dir is already a symlink"
  else
    echo "  [copy] .ai/$dir → .agents/$dir"
    rm -rf "$AGENTS_DIR/$dir"
    cp -r "$AI_DIR/$dir" "$AGENTS_DIR/$dir"
  fi
done

# Sync README.md
if [ -L "$AGENTS_DIR/README.md" ]; then
  echo "  [skip] .agents/README.md is already a symlink"
else
  echo "  [copy] .ai/README.md → .agents/README.md"
  cp "$AI_DIR/README.md" "$AGENTS_DIR/README.md"
fi

# ── .claude/rules/ ────────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DIR/rules"
for f in platform-router.md security.md; do
  target="$AI_DIR/rules/shared/$f"
  dest="$CLAUDE_DIR/rules/$f"
  if [ -L "$dest" ]; then
    echo "  [skip] .claude/rules/$f is already a symlink"
  elif [ -f "$target" ]; then
    echo "  [copy] .ai/rules/shared/$f → .claude/rules/$f"
    cp "$target" "$dest"
  fi
done

# ── .claude/skills/ ───────────────────────────────────────────────────────────
mkdir -p "$CLAUDE_DIR/skills"
for skill in express-patterns flutter-patterns react-patterns; do
  if [ -L "$CLAUDE_DIR/skills/$skill" ]; then
    echo "  [skip] .claude/skills/$skill is already a symlink"
  else
    echo "  [copy] .ai/skills/$skill → .claude/skills/$skill"
    rm -rf "$CLAUDE_DIR/skills/$skill"
    cp -r "$AI_DIR/skills/$skill" "$CLAUDE_DIR/skills/$skill"
  fi
done

echo ""
echo "✅ Sync complete. Edit files in .ai/ only — this script propagates changes."
