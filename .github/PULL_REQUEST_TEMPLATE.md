<!--
  ⛔ DO NOT delete sections of this template — write "n/a" if a section doesn't apply.
  This template enforces the drift contract in CONTRIBUTING.md §4.
  Reviewers will request changes if a section is missing or unticked.
-->

> **Before you submit:** read [`CONTRIBUTING.md`](../CONTRIBUTING.md) §3 (pre-merge bar) and §4 (the "if you change X, update Y" drift contract). Both are review-time blockers.

## Summary

<!-- 1–3 bullets: what changed and why. Reference files with @path/to/file.ts. -->

## Manual e2e walkthrough

<!-- Required by docs/roadmap/WORLD_CLASS.md §0. What you clicked through, in order. -->

## Pre-merge bar

- [ ] `bun run type-check` clean
- [ ] `bun run test` passes
- [ ] `bun run lint` 0 errors
- [ ] `bun run build` succeeds
- [ ] If schema/policy touched: `bun run security:db-lint` clean + Supabase Security Advisor reviewed

## Docs-drift check (CONTRIBUTING.md §4 — REQUIRED)

Tick everything that applies to this PR. **Reviewers will block on misses.** If your PR touches code in any of the categories below, the corresponding doc update is non-optional.

- [ ] Changed pricing or `src/lib/stripe.ts` → updated `README.md` + `OVERVIEW.md` + `PITCH.md`
- [ ] Changed `package.json` scripts → updated `README.md` + `docs/DEVELOPMENT.md`
- [ ] Changed `.env.example` → updated `docs/DEVELOPMENT.md`
- [ ] Added a migration → updated `docs/DATABASE.md` (§1 table + §3 migration index) + `docs/security/rls-matrix.md`
- [ ] Added an RPC → updated `docs/DATABASE.md` §2 + `docs/security/rls-matrix.md` "RPCs"
- [ ] Added an `api/**/route.ts` file → updated `docs/security/api-route-matrix.md` + `docs/security/threat-models.md`
- [ ] Added a `createAdminClient` callsite → updated `docs/security/admin-client-allowlist.md` (with **why** + **invariant**)
- [ ] Added a token-gated server page → updated `docs/security/api-route-matrix.md` + `docs/ARCHITECTURE.md` §6
- [ ] Changed `src/lib/regulatory-graph.ts` `LEGACY_RULES` → ran `WRITE_SEED=1 bun run test ...` to regenerate seed migration
- [ ] Changed `src/proxy.ts` → updated `docs/ARCHITECTURE.md` §2
- [ ] Added a new top-level `*.md` or `docs/**/*.md` → added a row in `docs/INDEX.md` + `docs/MAINTENANCE.md`
- [ ] Shipped a workstream → `MEMORY.md` entry written + `docs/roadmap/WORLD_CLASS.md` updated
- [ ] None of the above applies (please confirm — silent "n/a" not allowed)

## Hard stops confirmed

<!-- From ~/.claude/CLAUDE.md — these need an explicit yes in the PR if you're doing any of them. -->

- [ ] No production migration run by this PR (or: explicit confirmation given)
- [ ] No live Stripe / Resend send by this PR (or: explicit confirmation given)
- [ ] No `--force` push, `reset --hard`, or destructive op on `main`

## Memory entry

<!-- Per CONTRIBUTING.md §5 — significant decisions get an entry in MEMORY.md. Paste it here if you wrote one. -->
