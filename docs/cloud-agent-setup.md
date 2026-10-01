# Cloud agent setup

One-time setup for running Claude Code cloud sessions on this repository. Agent instructions
themselves live in `AGENTS.md`.

## One-time setup

1. **GitHub access.** Install the Claude GitHub App on `brdv/ripasso` (claude.ai/code onboarding).
   Do not enable Auto-fix on the stack's PRs: its GitHub replies are labelled as Claude Code.
2. **Cloud environment.** At claude.ai/code, create an environment named `ripasso`:
   - Network access: **Custom**, with "Also include default list of common package managers"
     checked, plus these domains for Playwright's browser download (Playwright 1.61):
     - `cdn.playwright.dev` (Chromium builds come from here)
     - `playwright.download.prss.microsoft.com` (fallback mirror for other downloads)

     The rest of what the setup script fetches is already on the default list: the npm registry
     for Bun and Playwright, and `archive.ubuntu.com` / `security.ubuntu.com` for the system
     libraries that `--with-deps` installs.
   - Setup script: the contents of `scripts/cloud-setup.sh`.
   - Environment variables:

     ```text
     CI=true
     PLAYWRIGHT_BROWSERS_PATH=/opt/ms-playwright
     BASH_DEFAULT_TIMEOUT_MS=300000
     BASH_MAX_TIMEOUT_MS=600000
     ```

     `CI=true` keeps Vitest out of watch mode if an agent runs it directly.
     `PLAYWRIGHT_BROWSERS_PATH` points sessions at the Chromium the setup script cached.
     The timeouts give the full verification run (including D1 and auth tests) room to finish.
   - No secrets. Local D1 needs no Cloudflare account, and the test setup creates a local auth
     secret from `.dev.vars.example`. Environment variables are visible to anyone using the environment,
     so never put real credentials there.
3. **Dry run.** Start a session on `main` with a throwaway task, for example:

   > Read `AGENTS.md`. Add one sentence to the README's Verification section saying that
   > `AGENTS.md` lists the pre-PR checks. Run all verification commands and open a draft PR.

   Then check:
   - `git log --format='%an <%ae> | %cn <%ce>%n%B'` on the PR branch shows `Bram <brdv@pm.me>`
     and no `Co-Authored-By`, `Claude-Session`, or session links.
   - The PR description has no "Generated with" line.
   - The session transcript shows it read `AGENTS.md` and that `bun install`, Chromium, and all
     four verification commands worked.

   Close the PR and delete the branch afterwards.

## Cloud session limits

The GitHub proxy in cloud sessions only lets a session push its own branch, so `gh stack` cannot
run there.

Deployment steps are human-only and listed in the README's Deployment section.
