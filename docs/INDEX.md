# OperatorOS — Documentation Index

<!-- Last reviewed: 2026-05-15 — owner: rbhavanzim@gmail.com -->
<!-- This file is the single navigable map of every doc in the repo. -->
<!-- Update trigger: any new top-level *.md, any new doc under docs/. PR template enforces. -->

The full doc map. Grouped by who's reading. If you're not sure where something lives, start here.

---

## 1. Product story (founder / investor / partner)

| Doc | What it covers | Last touched |
|-----|----------------|--------------|
| [`README.md`](../README.md) | One-page intro · setup · scripts · doc map | 2026-05-15 |
| [`OVERVIEW.md`](../OVERVIEW.md) | Master narrative: problem · product · architecture-at-a-glance · GTM · market · moat · roadmap | 2026-05-15 |
| [`PITCH.md`](../PITCH.md) | Investor narrative | — |
| [`OperatorOS_Project_Plan.md`](../OperatorOS_Project_Plan.md) | The deep master plan: survey methodology · vertical deep-dives · 5-phase rollout | — |
| [`DESIGN_PHILOSOPHY.md`](../DESIGN_PHILOSOPHY.md) | The Tag Doctrine — Pan Am luggage-tag design system | — |
| [`docs/vc-review/CONSENSUS.md`](./vc-review/CONSENSUS.md) | 10-GP review outcome (website-validity) | — |
| [`docs/vc-review/features/CONSENSUS.md`](./vc-review/features/CONSENSUS.md) (referenced from `MEMORY.md`) | 10-GP review outcome (per-feature moat rubric) | — |

## 2. Working in this repo (contributor / engineer)

| Doc | What it covers | Last touched |
|-----|----------------|--------------|
| [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) | System architecture: request flow, Supabase client types, regulatory-graph runtime, cron, share/accountant token paths | 2026-05-15 |
| [`docs/DATABASE.md`](./DATABASE.md) | Schema overview by domain · RPC catalog · migration index | 2026-05-15 |
| [`docs/DEVELOPMENT.md`](./DEVELOPMENT.md) | Local setup · scripts · testing · debugging · adding a migration | 2026-05-15 |
| [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Branch / PR / commit conventions · doc-update rules · "if you change X update Y" | 2026-05-15 |
| [`AGENTS.md`](../AGENTS.md) | Next.js breaking-changes warning for AI agents | — |
| [`docs/MAINTENANCE.md`](./MAINTENANCE.md) | How docs stay current — per-doc owner, trigger, review cadence | 2026-05-15 |

## 3. Security & operations (engineer / reviewer / auditor)

| Doc | What it covers | Last touched |
|-----|----------------|--------------|
| [`docs/security/rls-matrix.md`](./security/rls-matrix.md) | Every table × every role × policy + RPC catalog | 2026-05-15 |
| [`docs/security/api-route-matrix.md`](./security/api-route-matrix.md) | Every reachable HTTP route × auth × Supabase client × data | 2026-05-15 |
| [`docs/security/admin-client-allowlist.md`](./security/admin-client-allowlist.md) | Every `service_role` callsite + why + invariant | — |
| [`docs/security/threat-models.md`](./security/threat-models.md) | Per-route threat models — assets, boundary, attacker, mitigations, residual | — |
| [`docs/security/ci-verification.md`](./security/ci-verification.md) | GitHub Actions security workflows · local Semgrep · Supabase Advisor | — |

## 4. Roadmap & decisions

| Doc | What it covers |
|-----|----------------|
| [`docs/roadmap/WORLD_CLASS.md`](./roadmap/WORLD_CLASS.md) | Source of truth for closing every deferred item · moat-first sequencing · workstreams A–I · dependency DAG · cadence |
| [`docs/audit/LIMITATIONS_AND_FIXES.md`](./audit/LIMITATIONS_AND_FIXES.md) | Honest audit of what blocks real-business adoption today, tiered fix order |
| [`MEMORY.md`](../MEMORY.md) | Project decision log — read at session start, never contradicted without flagging |
| [`ERRORS.md`](../ERRORS.md) | Approaches that took 2+ attempts — checked before re-trying similar tasks |

## 5. Repository configuration

| File | What it covers |
|------|----------------|
| `CLAUDE.md` / `AGENTS.md` | Loaded automatically by Claude Code into every session in this repo |
| `.env.example` | Environment-variable reference |
| `.github/workflows/security.yml` | Semgrep + `bun audit` on push/PR |
| `.github/workflows/codeql.yml` | CodeQL on push/PR |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR checklist (incl. docs-drift check) |
| `.github/CODEOWNERS` | Review routing — docs, security, billing, and migration paths route to the owner so drift can't merge unnoticed |

---

## How this index stays current

- **Every doc file in the repo is listed here.** If you create a new one, add a row.
- **Every row carries a "Last touched" date** when it materially changed.
- **The maintenance rules** (per-doc owner, what triggers a re-review) live in [`docs/MAINTENANCE.md`](./MAINTENANCE.md).
- **The PR template** asks "did you update affected docs?" and lists which doc each kind of change touches. That is the load-bearing mechanism — review-time enforcement, not CI.

If you find a doc that doesn't appear here, or an entry here that points to a missing file, that's a bug — open a PR.
