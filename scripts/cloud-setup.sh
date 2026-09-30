#!/bin/bash
# Setup script for the Claude Code cloud environment. Paste this into the environment's
# "Setup script" field at claude.ai/code. It runs as root before the session starts and its
# result is cached for later sessions. Keep it under ~5 minutes and always exit 0.
#
# Per-session work (dependency install, git identity, hooks) lives in scripts/session-start.sh.

# Match the Bun version used locally; installed from the npm registry, which the network allowlist permits.
npm install -g bun@1.4.2 || true

# Chromium and its system libraries for Vitest browser tests and Playwright end-to-end tests.
# Keep the version in sync with "playwright" in bun.lock.
npx -y playwright@1.61.1 install --with-deps chromium || true

git config --global user.name "Bram"
git config --global user.email "brdv@pm.me"

exit 0
