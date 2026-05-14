# OperatorOS

**AI-native compliance OS for small businesses (1–50 employees).**

OperatorOS auto-populates a business's regulatory obligation calendar on signup — federal deadlines, state filings, payroll taxes, industry licenses — then tracks compliance score, sends reminders, and lets accountants manage their entire client portfolio from one place.

> The average small business has 47 annual compliance obligations. 80% track them on spreadsheets or memory. The average cost of a missed deadline: $14,200 in penalties.

---

## Why OperatorOS wins

### 1. Auto-populated compliance calendar on signup
Most tools require you to manually enter what you need to track. OperatorOS uses your industry, state, entity type, and employee count to pre-populate your calendar with the federal and state deadlines that actually apply — IRS quarterly 941s, annual entity filings, OSHA logs, industry-specific licenses — from day one.

### 2. Accountant-first distribution
A CPA or bookkeeper manages 40–200 small business clients. When one accountant invites their clients to OperatorOS, that is 40+ paying customers with near-zero marginal CAC. The accountant portal lets a CPA see every client's compliance score, upcoming deadlines, and document status in one view — a tool no other compliance platform offers at this price point.

### 3. AI compliance intelligence
Claude (Anthropic) analyzes your business profile and active deadlines to surface compliance obligations you may have missed — quarterly payroll tax thresholds, state-specific franchise taxes, license renewal patterns for your industry. Every insight is sourced to the responsible agency and carries a disclosure to verify with your accountant.

### 4. Compliance score that reflects real risk
The compliance score penalizes overdue items heavily (−20 pts each) and distinguishes between "compliant" (proven) and "upcoming" (tracked but unconfirmed). One missed deadline collapses the score — which is the right behavior when the consequences are real.

---

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** — PostgreSQL, Auth, Storage, RLS
- **Anthropic Claude** — AI compliance insights + document expiry extraction
- **Stripe** — Subscription billing (Starter / Growth / Scale)
- **Resend** — Transactional email reminders
- **Vercel** — Hosting + daily cron jobs

---

## Architecture

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes (dashboard, deadlines, billing)
│   ├── (auth)/         # Auth routes (sign-in, sign-up, callback)
│   ├── (onboarding)/   # First-run onboarding — seeds jurisdiction-aware deadlines
│   ├── accountant/     # Accountant portal (magic-link, no login required)
│   ├── api/            # API routes (billing, cron, export, share, ai, accountant)
│   └── share/[token]/  # Public read-only share pages for auditors
├── components/
│   └── dashboard/      # UI components (score chart, AI insights, accountant invite)
├── lib/
│   ├── supabase/       # Supabase clients (server, client, admin)
│   ├── deadline-utils.ts  # Scoring algorithm + status helpers
│   └── email.ts        # Resend email helpers
└── types/              # TypeScript types
```

---

## Plans

| Plan | Price | Deadlines | Users | Accountant Portal |
|------|-------|-----------|-------|-------------------|
| Starter | $29/mo | 25 | 1 | — |
| Growth | $79/mo | 100 | 3 | ✓ |
| Scale | $149/mo | Unlimited | 10 | ✓ |

---

## Compliance Score Algorithm

The score weights each deadline by outcome, not just presence:

| Status | Weight | Rationale |
|--------|--------|-----------|
| Compliant | +10 | Proven — human confirmed |
| Upcoming | +5 | Tracked but unconfirmed |
| In Progress (due ≤30d) | 0 | Pay attention |
| Overdue | −20 | Failure — penalizes score severely |

Score = max(0, min(100, actualPoints / (total × 10) × 100))

One overdue deadline on an otherwise clean calendar scores ~70/100. Three overdue items with a full calendar approach 0. This matches real-world risk.

---

## Getting Started

### 1. Prerequisites
- Node.js 20+
- Supabase project
- Stripe account
- Resend account
- Anthropic API key

### 2. Environment Variables

```bash
cp .env.example .env.local
```

### 3. Database Migrations

```bash
supabase db push
```

Or run each file in `supabase/migrations/` in order via the Supabase SQL editor.

### 4. Supabase Storage

Create a storage bucket named `documents` (private, RLS enforced).

### 5. Stripe Webhook

Point to `https://yourdomain.com/api/billing/webhook` with:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

Deploy to Vercel. The `vercel.json` cron job runs daily reminder emails at 9am UTC.
