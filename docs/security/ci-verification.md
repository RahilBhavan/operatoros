# Security verification in CI

## GitHub Actions

- **`.github/workflows/security.yml`**: Semgrep (TypeScript and JavaScript rulesets), `npm audit` (advisory, `continue-on-error`), and a unit-tests job (type-check, lint, build, `npm test`).
- **`.github/workflows/codeql.yml`**: CodeQL for `javascript-typescript` on push/PR to default branches.

## Local / release checks

```bash
npm run security:deps   # dependency audit
npm run security:sast   # Semgrep (requires semgrep CLI installed)
```

## Supabase

After schema or policy changes:

```bash
supabase db lint
```

Use the Supabase Dashboard **Security Advisor** to catch RLS gaps and accidental `service_role` exposure in the browser.
