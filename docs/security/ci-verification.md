# Security verification in CI

## GitHub Actions

- **`.github/workflows/security.yml`**: Semgrep (TS/JS/SQL rulesets), `bun audit` (advisory; install via `oven-sh/setup-bun`).
- **`.github/workflows/codeql.yml`**: CodeQL for `javascript-typescript` on push/PR to default branches.

## Local / release checks

```bash
bun run security:deps   # dependency audit
bun run security:sast   # Semgrep (requires semgrep CLI installed)
```

## Supabase

After schema or policy changes:

```bash
supabase db lint
```

Use the Supabase Dashboard **Security Advisor** to catch RLS gaps and accidental `service_role` exposure in the browser.
