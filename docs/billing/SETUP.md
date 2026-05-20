# Billing setup checklist

This is the founder-side checklist for getting Stripe billing fully wired. The
app code is in place — `src/app/api/billing/{checkout,portal,webhook}/route.ts`,
`src/lib/stripe.ts`, the `/billing` page, and the `stripe_subscriptions` mirror
table from WS-F. What's left is the Stripe-dashboard side: products, prices,
webhooks, and env vars.

Do test mode first. Live mode is a copy-paste of the same steps with the
dashboard toggle flipped.

---

## 1 · Test mode (do this first)

1. **Get the test secret key.**
   Stripe dashboard → top-right toggle to **Test mode** → Developers → API
   keys → reveal the "Secret key" (`sk_test_...`). Put it in `.env.local` as
   `STRIPE_SECRET_KEY=sk_test_...`.

2. **Create the Business product + price.**
   Products → Add product:
   - Name: `OperatorOS Business`
   - Pricing: `Recurring`, `$79.00 USD / month`, `Standard pricing`
   - Save. Copy the price ID (looks like `price_1Q...`) into
     `STRIPE_BUSINESS_PRICE_ID=price_...`

3. **Create the Accountant product + price.**
   - Name: `OperatorOS Accountant`
   - Pricing: `Recurring`, `$299.00 USD / month`
   - Copy the price ID into `STRIPE_ACCOUNTANT_PRICE_ID=price_...`

4. **(Optional) Reserve the Lite price.**
   Lite ($39/mo, email-only) isn't checkoutable yet — `/billing` shows it as
   "coming soon" via `shouldSuggestLite()`. You can either skip this step or
   create the product now so the env var resolves; leaving it unset is fine
   today, the code only reads it when a Lite checkout actually happens.

5. **Set up the webhook endpoint.**
   Developers → Webhooks → Add endpoint:
   - URL: `https://<your-domain>/api/billing/webhook` (in dev: use the Stripe
     CLI to tunnel, see step 6).
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.paid`
     - `invoice.payment_failed`
   - After creation, reveal the signing secret (`whsec_...`) → put it in
     `STRIPE_WEBHOOK_SECRET=whsec_...`

6. **Local development: Stripe CLI for webhook tunneling.**
   `brew install stripe/stripe-cli/stripe`
   `stripe login` (browser auth)
   `stripe listen --forward-to localhost:3000/api/billing/webhook`
   The CLI prints a `whsec_...` — use this in `.env.local` instead of the
   dashboard webhook secret for local dev. The dashboard secret is for the
   deployed webhook on Vercel.

7. **Configure the customer portal.**
   Settings → Billing → Customer portal → Activate:
   - Allowed updates: `Subscription`, `Subscription cancel`, `Payment method`,
     `Billing address`, `Invoice history`.
   - Save. This is what `/api/billing/portal` opens for the user.

8. **Smoke test the checkout flow.**
   - Restart `bun run dev` so the new env vars load.
   - Sign in → `/billing` → click **Start free trial →** on Business.
   - On Stripe checkout, use card `4242 4242 4242 4242`, any future expiry,
     any CVC, any ZIP.
   - You should land on `/billing/success`, then `/billing` should show
     **CURRENT PLAN · TRIAL · B-079**.
   - Run `select * from stripe_subscriptions order by updated_at desc limit 5;`
     — the new sub should be there with `status = 'trialing'`.

---

## 2 · Live mode (only when ready to sell)

Repeat steps 1-7 with the dashboard toggle on **Live mode**. The price IDs
will be different (`price_1...` vs `price_2...`). Set live env vars in your
hosting environment (Vercel: Project → Settings → Environment Variables →
Production only). Keep test env vars in local `.env.local`.

**Don't mix modes** — using a `sk_test_` key with a `price_` from live mode
(or vice versa) errors with "No such price" at checkout creation time.

---

## 3 · Stripe test cards reference

Quick cards for verifying flows in test mode:

| Card | Behavior |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0341` | Charge succeeds, attaching to customer fails |
| `4000 0000 0000 9995` | Declined (insufficient funds) |
| `4000 0025 0000 3155` | Requires 3D Secure auth |
| `4000 0000 0000 0002` | Declined (generic) |

More at https://stripe.com/docs/testing.

---

## 4 · What the env validator checks

`src/lib/billing/env.ts` exports `validateStripeConfig()` — returns a report
of which vars are set vs missing. The startup log surfaces missing required
vars; the `/admin` billing tile shows it visually so you know test vs live is
sane without grepping logs.
