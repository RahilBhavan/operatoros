# Docs Maintenance

<!-- Last reviewed: 2026-05-16 — owner: rbhavanzim@gmail.com -->

The bookkeeping that makes "world-class continuously updated docs" actually true. Three mechanisms keep this honest:

1. **Per-doc owner + trigger** — every doc has someone responsible and a concrete signal that fires a re-review (not just a calendar quarter).
2. **Drift contract in `CONTRIBUTING.md` §4** — "if you change X update Y" — enforced at PR review time.
3. **PR template checklist** — the load-bearing review prompt.

If any of the three breaks, drift creeps in. Fix the mechanism, not the symptom.

---

## 1. Doc registry

| Doc | Owner | Last reviewed | Trigger that fires a re-review |
|-----|-------|---------------|-------------------------------|
| `README.md` | rbhavanzim@gmail.com | 2026-05-15 | `package.json` scripts change · pricing in `src/lib/stripe.ts` changes · `.env.example` changes · regulatory-graph top-level architecture changes |
| `OVERVIEW.md` | rbhavanzim@gmail.com | 2026-05-15 | Pricing change in `src/lib/stripe.ts` · plan tier in `src/types/billing` · status entry in `MEMORY.md` · vertical ICP shift |
| `PITCH.md` | rbhavanzim@gmail.com | — | New fundraising round · material market data shift · pricing change |
| `OperatorOS_Project_Plan.md` | rbhavanzim@gmail.com | 2026-05-16 | Quarterly · or major roadmap pivot. Live specs override this doc when in conflict. |
| `DESIGN_PHILOSOPHY.md` | rbhavanzim@gmail.com | — | New design primitive · color/type scale change |
| `AGENTS.md` | rbhavanzim@gmail.com | — | Next.js major version bump |
| `CLAUDE.md` | rbhavanzim@gmail.com | — | Only via `AGENTS.md` (re-exports) |
| `CONTRIBUTING.md` | rbhavanzim@gmail.com | 2026-05-16 | New "if you change X" rule needed · pre-merge bar change |
| `MEMORY.md` | rbhavanzim@gmail.com | continuous | Every significant decision + every session end |
| `ERRORS.md` | rbhavanzim@gmail.com | continuous | Every 2+-attempt task |
| `docs/INDEX.md` | rbhavanzim@gmail.com | 2026-05-15 | Any new `*.md` file in repo or under `docs/` |
| `docs/ARCHITECTURE.md` | rbhavanzim@gmail.com | 2026-05-16 | `src/proxy.ts` change · new Supabase client wrapper · regulatory-graph runtime change · new cron · new token-gated surface |
| `docs/DATABASE.md` | rbhavanzim@gmail.com | 2026-05-16 | Any file in `supabase/migrations/` |
| `docs/DEVELOPMENT.md` | rbhavanzim@gmail.com | 2026-05-16 | `package.json` scripts · new test type · CI workflow change · local-stack step change |
| `docs/MAINTENANCE.md` | rbhavanzim@gmail.com | 2026-05-16 | Any change to the doc registry (this table) |
| `docs/roadmap/WORLD_CLASS.md` | rbhavanzim@gmail.com | 2026-05-15 | Workstream completion · new deferred item from `MEMORY.md` |
| `docs/audit/LIMITATIONS_AND_FIXES.md` | rbhavanzim@gmail.com | 2026-05-15 | Material change in product readiness · new launch blocker discovered · quarterly re-audit |
| `docs/security/rls-matrix.md` | rbhavanzim@gmail.com | 2026-05-15 | New `create table` or `create policy` in `supabase/migrations/` |
| `docs/security/api-route-matrix.md` | rbhavanzim@gmail.com | 2026-05-15 | New file under `src/app/api/**/route.ts` or new token-gated server page |
| `docs/security/admin-client-allowlist.md` | rbhavanzim@gmail.com | — | New `createAdminClient` callsite |
| `docs/security/threat-models.md` | rbhavanzim@gmail.com | — | New external attack surface · new auth/trust mode |
| `docs/security/ci-verification.md` | rbhavanzim@gmail.com | — | Change to `.github/workflows/security.yml` or `codeql.yml` · new security tool in `package.json` |
| `docs/vc-review/CONSENSUS.md` | rbhavanzim@gmail.com | — | New review round |
| `docs/vc-review/round-{N}.md` | rbhavanzim@gmail.com | — | Immutable per round |

When you create a doc that isn't here, add a row to this table **in the same PR**. When you do a material re-review, bump the date in the doc's `<!-- Last reviewed -->` comment and in this table.

---

## 2. Why event-triggered, not calendar-triggered

Calendar-based "review every quarter" is theater. Most docs don't decay on a fixed clock — they decay when specific code changes. A trigger column like *"new file under `src/app/api/**/route.ts`"* is concrete: a reviewer can check the diff and see whether the trigger fired. A "review by 2026-08-01" line gets snoozed and lies.

Two docs are calendar-triggered because the underlying material moves slowly: `OperatorOS_Project_Plan.md` (quarterly) and the VC review docs (immutable per round). Everything else fires on a code-change signal.

---

## 3. When to retire a doc

Retire (move to `docs/_archive/` and remove from `INDEX.md` + this registry) when:

- The feature it describes has been removed.
- It's been superseded by a newer doc — link the replacement.
- It hasn't fired its trigger in 6+ months and no longer reflects real practice (rare; usually the answer is to update, not retire).

Don't delete. Move and link. Decisions get re-litigated; the prior reasoning is evidence.

---

## 4. PR review prompt

When reviewing a PR, ask:

1. **Does the diff touch any of the "trigger" cells in §1?** If yes, is the corresponding doc updated in the same PR?
2. **Does the PR add a new doc?** If yes, is there a row in §1 and in `docs/INDEX.md`?
3. **Does the PR claim to ship a workstream?** If yes, is there a `MEMORY.md` decision entry?

These three are the questions on the PR template. If reviewers don't ask them, the contract fails. Fix the reviewers, not the docs.
