# OperatorOS

AI-native compliance deadline tracker for small businesses (1–50 employees).

Track federal, state, and local compliance deadlines. Get reminders before they're due. Share read-only views with auditors or accountants.

## Tech Stack

- **Next.js 15** (App Router)
- **Supabase** — PostgreSQL, Auth, Storage, RLS
- **Stripe** — Subscription billing (Starter / Growth / Scale)
- **Resend** — Transactional email reminders
- **Vercel** — Hosting + daily cron jobs

## Getting Started

### 1. Prerequisites

- Node.js 20+
- Supabase project
- Stripe account
- Resend account

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

### 3. Database Migrations

Apply migrations to your Supabase project:

```bash
supabase db push
```

Or run each file in `supabase/migrations/` in order via the Supabase SQL editor.

### 4. Supabase Storage

Create a storage bucket named `documents` and set it to private (RLS enforced).

### 5. Stripe Webhook

Set up a Stripe webhook pointing to `https://yourdomain.com/api/billing/webhook` with these events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### 6. Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── app/
│   ├── (app)/          # Authenticated app routes (dashboard, deadlines, billing)
│   ├── (auth)/         # Auth routes (sign-in, sign-up, callback)
│   ├── (onboarding)/   # First-run onboarding flow
│   ├── api/            # API routes (billing, cron, export, share, waitlist)
│   └── share/[token]/  # Public read-only share pages
├── components/
│   └── dashboard/      # UI components
├── lib/
│   ├── supabase/       # Supabase clients (server, client, admin)
│   ├── stripe.ts       # Stripe singleton + plan config
│   └── email.ts        # Resend email helpers
└── types/              # TypeScript types
```

## Plans

| Plan | Price | Deadlines | Users |
|------|-------|-----------|-------|
| Starter | $29/mo | 25 | 1 |
| Growth | $79/mo | 100 | 3 |
| Scale | $149/mo | Unlimited | 10 |

## Deployment

Deploy to Vercel. The `vercel.json` cron job runs daily reminder emails at 9am UTC.

Ensure all environment variables are set in your Vercel project settings.
