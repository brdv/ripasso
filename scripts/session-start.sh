#!/bin/bash
# Runs at the start of every Claude Code session (see .claude/settings.json).
# Only acts in cloud sessions; local sessions exit immediately.

if [ "$CLAUDE_CODE_REMOTE" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Commits must be authored by the repository owner, and the commit-msg hook strips AI trailers.
git config user.name "Bram"
git config user.email "brdv@pm.me"
git config core.hooksPath .githooks

# Bun has known issues with the cloud network proxy; fall back to npm if it fails.
if ! bun install --frozen-lockfile; then
  echo "bun install failed, falling back to npm install" >&2
  npm install --no-audit --no-fund || true
fi

# No-op when the setup script already installed the matching browser.
bunx playwright install chromium || true

exit 0
