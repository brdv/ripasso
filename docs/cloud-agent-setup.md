# Cloud agent setup

One-time setup for running the roadmap in `docs/roadmap.md` with Claude Code cloud sessions, and
the loop for running each step. Agent instructions themselves live in `AGENTS.md`.

## One-time setup

1. **GitHub access.** Install the Claude GitHub App on `brdv/ripasso` (claude.ai/code onboarding).
   Do not enable Auto-fix on the stack's PRs: its GitHub replies are labelled as Claude Code.
2. **Cloud environment.** At claude.ai/code, create an environment named `ripasso`:
   - Network access: **Custom**, with "Also include default list of common package managers"
     checked, plus these domains for Playwright's browser download:
     - `cdn.playwright.dev`
     - `playwright.download.prss.microsoft.com`
     - `playwright.azureedge.net`
   - Setup script: the contents of `scripts/cloud-setup.sh`.
   - No environment variables or secrets are needed. Local D1 needs no Cloudflare account.
3. **Dry run.** Start a session on `main` (or on `prep/agent-setup` before it merges) with a throwaway task, for example:

   > Read `AGENTS.md`. Add one sentence to the README's Verification section saying that
   > `AGENTS.md` lists the pre-PR checks. Run all verification commands and open a draft PR.

   Then check:
   - `git log --format='%an <%ae> | %cn <%ce>%n%B'` on the PR branch shows `Bram <brdv@pm.me>`
     and no `Co-Authored-By`, `Claude-Session`, or session links.
   - The PR description has no "Generated with" line.
   - The session transcript shows it read `AGENTS.md` and that `bun install`, Chromium, and all
     four verification commands worked.

   Close the PR and delete the branch afterwards.

## Running the stack

The GitHub proxy in cloud sessions only lets a session push its own branch, so `gh stack` cannot
run there. Instead each step is its own session, started from the previous step's branch, with its
PR based on that branch. Together the PRs form a stack.

For each step N:

1. Find the previous step's branch in the Status table of `docs/roadmap.md` (on that branch), or
   `main` for step 1.
2. Start a cloud session on that branch in the `ripasso` environment with the kickoff prompt from
   `docs/roadmap.md`.
3. Review the PR. Answer questions in the session if it stops.
4. Start step N+1 once step N's PR is open. Review feedback on step N that changes code means the
   branches above it need a rebase: ask the session of the higher step to rebase onto the updated
   branch.

A Claude Project can run this loop for you: put the "Running the stack" rules in the project
instructions and ask it to start each step's thread when the previous one has opened its PR.

## Merging

Merge bottom-up. After merging a PR, retarget the next PR to `main` (GitHub does this
automatically when the merged branch is deleted). Prefer rebase or merge commits over squash so
the higher branches rebase cleanly. Optionally adopt the chain into `gh stack` locally to manage
rebases.

Deployment steps are listed under "Human-only tasks" in `docs/roadmap.md`.
