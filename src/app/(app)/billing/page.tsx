import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/stripe";
import BillingActions from "@/components/dashboard/BillingActions";
import {
  H2,
  Body,
  Caption,
  Utility,
  Index,
  TagCard,
} from "@/components/doctrine";
import { PageHeader } from "@/components/doctrine/PageHeader";
import { PageSection } from "@/components/doctrine/PageSection";
import { PageShell } from "@/components/doctrine/PageShell";
import { billing as billingCopy } from "@/lib/ui-copy";
import { shouldSuggestLite } from "@/lib/entitlements";
import { loadBillingUsage } from "@/lib/billing/usage";
import { validateStripeConfig } from "@/lib/billing/env";

const PLAN_CODES: Record<string, { code: string; sort: string }> = {
  business: { code: "B-079", sort: "A" },
  accountant: { code: "A-299", sort: "B" },
  accountant_pro: { code: "A-499", sort: "C" },
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: businessRaw } = await (supabase.from("businesses") as any)
    .select(
      "id, plan_tier, billing_status, trial_ends_at, stripe_customer_id, industry_slug, employee_count, intended_plan"
    )
    .eq("owner_id", user.id)
    .single();
  const business = businessRaw as
    | {
        id: string;
        plan_tier: string;
        billing_status: string;
        trial_ends_at: string | null;
        stripe_customer_id: string | null;
        industry_slug: string | null;
        employee_count: number | null;
        intended_plan: "business" | "accountant" | null;
      }
    | null;

  if (!business) redirect("/onboarding");

  const isActive =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  const liteSuggested = shouldSuggestLite(
    business.industry_slug,
    business.employee_count
  );

  const usage = await loadBillingUsage(supabase, business.id, business.plan_tier);
  const stripeEnv = validateStripeConfig();

  return (
    <PageShell width="narrow">
      <PageHeader
        title={billingCopy.title}
        description={billingCopy.description}
        actions={
          business.stripe_customer_id ? (
            <Link
              href="/billing/invoices"
              className="t-utility hover:text-[var(--color-mark)]"
            >
              View invoices →
            </Link>
          ) : null
        }
      />

      {/* Stripe-not-configured banner — silently 500ing the checkout call is
          the worst failure mode. Surface it loudly so the founder knows
          what's missing instead of users seeing a dead button. */}
      {!stripeEnv.ready ? (
        <div className="border-2 border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-4 mb-5">
          <Utility className="!text-[var(--color-field)] !mb-2">
            STRIPE NOT CONFIGURED — CHECKOUT WILL FAIL
          </Utility>
          <Body className="!text-[var(--color-field)] !text-[14px] !mb-2">
            {stripeEnv.mode === "missing"
              ? "STRIPE_SECRET_KEY is empty or missing."
              : `Mode is ${stripeEnv.mode.toUpperCase()}, but some required vars are still missing.`}
          </Body>
          <ul className="flex flex-col gap-1 mb-2">
            {stripeEnv.issues.map((issue) => (
              <li
                key={issue}
                className="text-[13px]"
                style={{
                  fontFamily: "var(--font-index)",
                  color: "var(--color-field)",
                }}
              >
                → {issue}
              </li>
            ))}
          </ul>
          <a
            href="https://github.com/RahilBhavan/operatoros/blob/main/docs/billing/SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="t-utility !text-[12px] underline"
            style={{ color: "var(--color-field)" }}
          >
            Setup checklist (docs/billing/SETUP.md) →
          </a>
        </div>
      ) : null}

      {/* Current plan */}
      {isActive && business.plan_tier !== "free" && (
        <div className="border-2 border-[var(--color-mark)] mb-5">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <Utility className="!text-[var(--color-field)]">
              CURRENT PLAN · {business.billing_status === "trialing" ? "TRIAL" : "ACTIVE"}
            </Utility>
            <Index className="!text-[var(--color-field)] !text-[12px] ">
              {PLAN_CODES[business.plan_tier]?.code ?? business.plan_tier.toUpperCase()}
            </Index>
          </div>
          <div className="bg-[var(--color-field)] px-4 py-3 flex items-end justify-between flex-wrap gap-4">
            <div>
              <Utility className=" mb-1">PLAN</Utility>
              <H2 className="!capitalize">{business.plan_tier}</H2>
              {business.trial_ends_at &&
                business.billing_status === "trialing" && (
                  <Caption className="!mt-2 !text-[var(--color-mark)]">
                    Trial ends{" "}
                    <Index className="!text-[13px]">
                      {new Date(business.trial_ends_at).toLocaleDateString(
                        "en-US",
                        { month: "long", day: "numeric", year: "numeric" }
                      )}
                    </Index>
                  </Caption>
                )}
            </div>
            <BillingActions hasCustomer={!!business.stripe_customer_id} />
          </div>
        </div>
      )}

      {/* Usage tile — what counts against this plan's limits. */}
      {isActive && business.plan_tier !== "free" ? (
        <PageSection title="USAGE · THIS PLAN" className="mb-5">
          <div className="bg-[var(--color-field)] px-4 py-4 grid sm:grid-cols-3 gap-3">
            <UsageCell
              label="Team members"
              used={usage.teamMembers.used}
              max={usage.teamMembers.max}
              suffix=""
              href="/settings/team"
            />
            <UsageCell
              label="Documents tracked"
              used={usage.documents}
              max={null}
              suffix=""
              href="/deadlines"
            />
            <UsageCell
              label="Deadlines"
              used={usage.deadlines}
              max={null}
              suffix=""
              href="/deadlines"
            />
          </div>
        </PageSection>
      ) : null}

      {/* WS-1.5 — Lite suggestion for thin-compliance NAICS + small headcount.
          Lite tier is not yet purchasable (no Stripe price ID); the suggestion
          links to the homepage waitlist so we can notify on launch. */}
      {liteSuggested && business.plan_tier !== "accountant" ? (
        <div className="border-2 border-[var(--color-ground)] mb-5">
          <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
            <Utility className="!text-[var(--color-field)]">
              SUGGESTED · LITE TIER · COMING SOON
            </Utility>
            <Index className="!text-[var(--color-field)] !text-[12px]">L-039</Index>
          </div>
          <div className="bg-[var(--color-field)] px-4 py-3">
            <H2>Your shape may fit our Lite tier.</H2>
            <Caption className="!mt-2">
              Solo-or-near-solo operators in thin-compliance industries
              (photography, storage, vintage retail, single-person services)
              often find Business at $79 over-built for their needs. Lite is
              $39/mo, email-only, no AI/portal/share. We&apos;ll notify you
              when it ships.
            </Caption>
            <Link
              href="/#waitlist"
              className="t-utility mt-3 inline-block text-[var(--color-mark)] underline underline-offset-4"
            >
              Notify me when Lite launches →
            </Link>
          </div>
        </div>
      ) : null}

      {/* Plan cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-5">
        {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(
          ([key, plan]) => {
            const isCurrent = business.plan_tier === key && isActive;
            const isIntended =
              !isActive && business.intended_plan === key && !isCurrent;
            const codes = PLAN_CODES[key] ?? { code: key.toUpperCase(), sort: "C" };
            const variant = key === "business" ? "ground" : "mark";

            return (
              <TagCard
                key={key}
                variant={variant}
                topCode={codes.code}
                topRight={key.toUpperCase()}
                tabLabel={codes.sort}
                destination={`$${plan.amount}`}
                subtitle={plan.name.toUpperCase()}
                refNumber={`P-${codes.sort}, ${codes.code}`}
                sortSymbol={codes.sort}
              >
                <Caption className="!mb-4  !text-[12px]">
                  PER MONTH · BILLED VIA STRIPE
                </Caption>
                <ul className="flex flex-col gap-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-baseline gap-2.5">
                      <Index className="!text-[12px] shrink-0">→</Index>
                      <span className="t-body !text-[15px]">{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="border-2 border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)] text-center py-3 t-utility">
                    CURRENT PLAN
                  </div>
                ) : (
                  <>
                    {isIntended ? (
                      <Caption className="!text-[12px] !text-[var(--color-mark)] !font-bold !mb-2 text-center">
                        You picked this during onboarding →
                      </Caption>
                    ) : null}
                    <BillingActions
                      plan={key}
                      hasCustomer={!!business.stripe_customer_id}
                      isSubscribed={isActive && business.plan_tier !== "free"}
                      buttonLabel={isActive ? "Switch plan →" : "Start free trial →"}
                      highlighted={isIntended || (!business.intended_plan && key === "business")}
                    />
                  </>
                )}
              </TagCard>
            );
          }
        )}
      </div>

      <Caption className=" text-center !text-[12px]">
        14-day free trial · No credit card required to start · Cancel anytime
      </Caption>
    </PageShell>
  );
}

function UsageCell({
  label,
  used,
  max,
  suffix,
  href,
}: {
  label: string;
  used: number;
  max: number | null;
  suffix: string;
  href: string;
}) {
  const over = max != null && used > max;
  const near = max != null && !over && used >= Math.ceil(max * 0.8);
  const accent = over
    ? "var(--color-mark)"
    : near
      ? "var(--color-mark)"
      : "var(--color-ground)";
  return (
    <Link
      href={href}
      className="border-2 border-[var(--color-ground)] px-3 py-3 hover:border-[var(--color-mark)] transition-colors flex flex-col gap-1"
    >
      <Utility className="!text-[11px]">{label}</Utility>
      <div className="flex items-baseline gap-1">
        <span className="t-h1 tabular-nums" style={{ color: accent }}>
          {used}
        </span>
        {max != null ? (
          <span className="t-caption !text-[14px]">/ {max}</span>
        ) : null}
        {suffix ? <span className="t-caption !text-[12px]">{suffix}</span> : null}
      </div>
      {over ? (
        <Body className="!text-[12px] !text-[var(--color-mark)] !font-bold">
          Over plan limit — upgrade below.
        </Body>
      ) : null}
    </Link>
  );
}
