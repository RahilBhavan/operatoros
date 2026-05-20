<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Prioritize UI that is easy to read and digestible; avoid internal jargon (route codes like `PA-*`, terms like "Manifest", "File deadline") in user-facing copy.
- Use plain-language labels and short section descriptions; centralize reusable strings in `src/lib/ui-copy.ts` when touching dashboard or shared flows.
- Use `bun` for install/run commands when working in this repo (not npm/yarn/pnpm), unless a script or CI file explicitly requires otherwise.
- Keep app routes under `src/app/` only — never create a top-level `app/` directory.
- Minimize change scope; do not create git commits unless the user explicitly asks.
- When improving UI/UX, reuse Tag Doctrine layout primitives (`PageShell`, `PageHeader`, `PageSection`, etc.) rather than one-off page styles.

## Learned Workspace Facts

- OperatorOS is a compliance OS for small businesses (about 1–50 employees): pre-populated deadlines, compliance score, reminders, document storage, and an accountant multi-client portal.
- Stack: Next.js 16 App Router, React 19, Supabase (Postgres/Auth/RLS), Vercel hosting/crons, Stripe billing, Resend email, Anthropic for AI follow-ups.
- Tag Doctrine design system lives in `src/components/doctrine/`; shared app layout uses `PageShell`, `PageHeader`, `PageSection`, `PageEmptyState`, `ListRow`, and `SectionBlock`.
- `AppNav` groups links: Overview (Dashboard, Deadlines), Track (Staff, Projects, COI, Audit prep, Locations), Account (Settings); billing is under Settings, not the top nav.
- Dashboard information hierarchy: KPIs → urgent "do these next" actions → deadline groups → trends/AI insights → compare/share (peer benchmark, accountant invite).
- Product tracks obligations and evidence; it does not file on behalf of users. AI suggestions are advisory only.
- Accountant-first distribution is a core GTM wedge (portfolio view for CPAs/bookkeepers).
- Competitive positioning vs formation shops (e.g. Bizee): they sell entity formation/filing services; OperatorOS is ongoing compliance operations for operating businesses.
