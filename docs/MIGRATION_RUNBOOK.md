# Migration runbook

> Apply every migration in `supabase/migrations/` in timestamp order. The wave-2 and wave-3 migrations below were added in May 2026 alongside the buyer-panel response plan.

## How to apply

Local first (recommended):
```bash
supabase db reset                         # rebuilds local DB from all migrations
npm run test                              # confirm app code still passes
```

Then promote to the remote project:
```bash
supabase link --project-ref <ref>         # one-time
supabase db push                          # applies anything new
```

Verify in the dashboard SQL editor:
```sql
select rolname, count(*)
from pg_tables t
join pg_roles r on t.tableowner = r.rolname
where t.schemaname = 'public'
group by 1;

-- New tables should be present:
select tablename from pg_tables
where schemaname = 'public'
  and tablename in (
    'staff_members', 'credential_types', 'staff_credentials',
    'credential_renewals_log', 'audit_binders', 'coi_recipients',
    'coi_issues', 'projects', 'project_deadlines', 'project_documents',
    'ce_requirements', 'ce_credits', 'notification_preferences',
    'sms_log', 'business_associate_agreements', 'phi_access_log',
    'integration_connections', 'filings'
  );
```

---

## May 2026 wave 2 + wave 3 migrations (in order)

| # | File | Workstream | What it adds |
|---|---|---|---|
| 1 | `20260518000001_staff_credentials.sql` | WS-2.1 | `staff_members`, `credential_types` (with seed library), `staff_credentials`, `credential_renewals_log` |
| 2 | `20260518000002_audit_binders.sql` | WS-1.2 | `audit_binders` |
| 3 | `20260518000003_coi.sql` | WS-3.1 | `coi_recipients`, `coi_issues` |
| 4 | `20260518000004_projects.sql` | WS-3.2 | `projects`, `project_deadlines`, `project_documents` |
| 5 | `20260518000005_locations_v2.sql` | WS-3.4 | adds `name`, `open_date`, `close_date`, timestamps to existing `locations` |
| 6 | `20260518000006_ce_credits.sql` | WS-2.3 | `ce_requirements`, `ce_credits` |
| 7 | `20260518000007_sms_notifications.sql` | WS-1.1 | `notification_preferences`, `sms_log` |
| 8 | `20260518000008_baa_and_phi.sql` | WS-2.2 | `business_associate_agreements`, `phi_access_log` |
| 9 | `20260518000009_integrations.sql` | WS-2.4 + WS-3.3 | `integration_connections` |
| 10 | `20260518000010_plan_tier_lite.sql` | WS-0.3 | widens `businesses.plan_tier` CHECK to include `"lite"` |
| 11 | `20260518000011_reminder_log_sms.sql` | WS-1.1 | extends `reminder_log.reminder_type` CHECK to accept `sms-*` variants |
| 12 | `20260518000012_filings.sql` | WS-4.1 | `filings` (one-time charge filing-as-a-service) |

All migrations are RLS-protected to business owner; cross-tenant tables (`credential_types`, `ce_requirements`) are admin-write / authenticated-read.

---

## Env vars to set after migrations land

Each integration is gated on its env vars. If a var is missing, the surrounding code falls through cleanly — no errors at runtime, but the feature is dark.

```bash
# WS-0.3 — Lite tier checkout (Stripe price created in dashboard)
STRIPE_LITE_PRICE_ID=price_...

# WS-1.1 — SMS reminders (Twilio account)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# WS-2.4 — SimplePractice OAuth (partner-approved app)
SIMPLEPRACTICE_CLIENT_ID=...
SIMPLEPRACTICE_CLIENT_SECRET=...

# WS-3.3 — Karbon OAuth
KARBON_CLIENT_ID=...
KARBON_CLIENT_SECRET=...

# WS-3.3 — QuickBooks Online OAuth (Intuit developer app)
INTUIT_CLIENT_ID=...
INTUIT_CLIENT_SECRET=...
# Optional — defaults to production:
INTUIT_API_BASE=https://quickbooks.api.intuit.com

# WS-3.3 — TaxDome OAuth
TAXDOME_CLIENT_ID=...
TAXDOME_CLIENT_SECRET=...

# WS-4.1 — Filings-as-a-service partner (either unlocks the path)
HARBOR_COMPLIANCE_API_KEY=...
# OR
LICENSE_LOGIX_API_KEY=...
```

---

## Hard stops the engineer cannot bypass

These remain after every migration lands:

1. **Stripe `lite_monthly` price** — create the product in the Stripe dashboard, copy the price ID into `STRIPE_LITE_PRICE_ID`. Required for actual Lite checkout (the entitlements code is already in place).
2. **Twilio account + budget cap** — provision a Twilio sub-account, verify a sending number, set a daily spend cap, then add the three env vars.
3. **HIPAA BAA legal review** — replace the placeholder agreement text in `src/app/(app)/settings/baa/page.tsx` with attorney-drafted language. The acceptance flow, signing UI, and `business_associate_agreements` schema are already wired.
4. **Sub-processor BAAs** — execute BAAs with Supabase, Resend, Twilio, and Anthropic (or move to Anthropic via Bedrock). The `/security#sub-processors` page lists them with current status.
5. **Practice-management / accountant partnerships** — register OperatorOS as a developer app with SimplePractice, Karbon, Intuit, TaxDome to receive OAuth credentials.
6. **Compliance researcher** — for state-depth beyond CA/TX/NY/DE/FL/IL/PA/GA. The admin rule editor + versioned RPC are ready; the work is curation, not engineering.
7. **Filing-partner contract** — Harbor Compliance or LicenseLogix agreement to actually file deadlines on customers' behalf. The schema + UI placeholder are ready.

---

## Smoke tests post-apply

```bash
npm run type-check
npm run lint
npm test
npm run build
```

If all four pass, the migrations are coherent with the app code.
