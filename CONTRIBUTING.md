# Contributing

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->

The load-bearing mechanism for "world-class continuously updated docs" is this file plus the [PR template](./.github/PULL_REQUEST_TEMPLATE.md). Both are reviewed at merge time.

For the global commit / branch / hard-stop rules that apply across every project, see `~/.claude/CLAUDE.md`. This file is the OperatorOS-specific addendum — what to read first, what to update when you change X, and the pre-merge bar.

---

## 1. Read first

Every session should start by reading these (in order):

1. `MEMORY.md` — project decision log; never contradict without flagging
2. `docs/INDEX.md` — full doc map
3. `docs/roadmap/WORLD_CLASS.md` — current workstream sequence + pre-merge bar
4. `AGENTS.md` — **this is not the Next.js you know**; check `node_modules/next/dist/docs/` before guessing APIs

For background context once: `OVERVIEW.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`.

---

## 2. Branch, commit, PR

- **Never commit to `main`.** Branch from main: `git checkout -b <kind>/<short-slug>` where `<kind>` ∈ `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `security`, `workstream`.
- **Commits:** conventional commits — `feat(scope): summary`, `fix(scope): summary`, etc.
- **PR size:** aim under 400 lines; split if larger unless the work is genuinely atomic (a workstream PR per `WORLD_CLASS.md` may exceed this — annotate why).
- **PR body:** use the template in `.github/PULL_REQUEST_TEMPLATE.md`. The docs-update checklist is the mechanism that catches drift.

---

## 3. Pre-merge bar

From `docs/roadmap/WORLD_CLASS.md` §0 — these gate every merge:

```
bun run type-check     # tsc --noEmit, 0 errors
bun run test           # vitest run, 100% pass
bun run lint           # eslint, 0 errors
bun run build          # next build succeeds
```

Plus:

- 1 manual e2e walkthrough documented in the PR body.
- If the change touches schema or RLS: `bun run security:db-lint` and a glance at the Supabase Dashboard Security Advisor.
- If the change adds a `service_role` callsite: row added to `docs/security/admin-client-allowlist.md`.

---

## 4. If you change X, update Y (the drift contract)

The whole point. Reviewers will block on missing rows.

| If you change… | Update… |
|----------------|---------|
| `src/lib/stripe.ts` PLAN catalog or pricing | `README.md` tech stack table · `OVERVIEW.md` §3.8 + §9 + §13 |
| `package.json` scripts | `README.md` "Common scripts" · `docs/DEVELOPMENT.md` §4 |
| `.env.example` | `docs/DEVELOPMENT.md` §3 |
| A migration in `supabase/migrations/` | `docs/DATABASE.md` §1 (table) and §3 (migration row) · `docs/security/rls-matrix.md` |
| A new RPC | `docs/DATABASE.md` §2 · `docs/security/rls-matrix.md` "RPCs" |
| A new file under `src/app/api/**/route.ts` | `docs/security/api-route-matrix.md` · `docs/security/threat-models.md` |
| A new `createAdminClient` callsite | `docs/security/admin-client-allowlist.md` (with **why** + **invariant**) |
| A new token-gated server page | `docs/security/api-route-matrix.md` "Token-gated public pages" · `docs/ARCHITECTURE.md` §6 |
| `src/lib/regulatory-graph.ts` LEGACY_RULES | `WRITE_SEED=1 bun run test src/__tests__/lib/regulatory-graph-seed.test.ts` to regenerate the seed migration |
| `src/proxy.ts` matcher or route | `docs/ARCHITECTURE.md` §2 |
| Anything in `docs/` | The "Last reviewed" comment at the top of that file + the row in `docs/INDEX.md` |
| A new top-level `.md` file | `docs/INDEX.md` (add a row) · `docs/MAINTENANCE.md` (owner + trigger) |
| A new workstream completed | `MEMORY.md` (decision entry following existing format) · `docs/roadmap/WORLD_CLASS.md` (mark shipped) |

If the change touches a class of file not in this table, propose a new row in the same PR.

---

## 5. Memory protocol (per-session)

From `~/.claude/CLAUDE.md`:

- Significant decisions: append a dated `## [Date] — Title` block to `MEMORY.md` with What / Why / Rejected.
- 2+ attempts on the same task: append a block to `ERRORS.md` with Failed / Worked / Note.
- Session end: append a `## Session [Date]` block to `MEMORY.md` with Worked on / Completed / In progress / Decisions / Next session.

---

## 6. Hard stops (require explicit confirmation in-session)

From `~/.claude/CLAUDE.md`. Restated for emphasis because three of them have project-specific surface area here:

- Running migrations on a remote Supabase project
- Sending Stripe / Resend live API calls
- Force-pushing or destructive git ops
- Anything irreversible against `main`

Prior approval doesn't carry over.

---

## 7. Communication norms

From `~/.claude/CLAUDE.md` — restated because we lean on them:

- Reference files with `@path/to/file.ts` syntax in PR descriptions.
- Paste raw errors; don't paraphrase.
- After any coding task: end with **Files changed**, **What was modified**, **Needs attention**.
- If you're uncertain about a fact, say so before including it.
