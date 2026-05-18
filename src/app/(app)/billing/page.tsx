import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/stripe";
import BillingActions from "@/components/dashboard/BillingActions";
import {
  H1,
  H2,
  Caption,
  Utility,
  Index,
  TagCard,
} from "@/components/doctrine";
import { shouldSuggestLite } from "@/lib/entitlements";

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

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, plan_tier, billing_status, trial_ends_at, stripe_customer_id, industry_slug, employee_count"
    )
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const isActive =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  const liteSuggested = shouldSuggestLite(
    business.industry_slug,
    business.employee_count
  );

  return (
    <div>
      <header className="border-b-4 border-[var(--color-ground)] pb-3 mb-5">
        <div className="flex items-center gap-3 mb-3">
          <Index className="!text-[15px]">PA-BILL</Index>
          <Utility className="">BILLING / SUBSCRIPTION</Utility>
        </div>
        <H1>Billing.</H1>
        <Caption className="!mt-2">Manage your subscription and plan.</Caption>
      </header>

      {/* Current plan */}
      {isActive && business.plan_tier !== "free" && (
        <div className="border-2 border-[var(--color-mark)] mb-10">
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

      {/* WS-1.5 — Lite suggestion for thin-compliance NAICS + small headcount.
          Lite tier is not yet purchasable (no Stripe price ID); the suggestion
          links to the homepage waitlist so we can notify on launch. */}
      {liteSuggested && business.plan_tier !== "accountant" ? (
        <div className="border-2 border-[var(--color-ground)] mb-10">
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
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(
          ([key, plan]) => {
            const isCurrent = business.plan_tier === key && isActive;
            const codes = PLAN_CODES[key] ?? { code: key.toUpperCase(), sort: "C" };
            const variant = key === "business" ? "ground" : "mark";

            return (
              <TagCard
                key={key}
                variant={variant}
                topCode={codes.code}
                topRight={`PA-${key.slice(0, 3).toUpperCase()}`}
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
                  <BillingActions
                    plan={key}
                    hasCustomer={!!business.stripe_customer_id}
                    isSubscribed={isActive && business.plan_tier !== "free"}
                    buttonLabel={isActive ? "Switch plan →" : "Start free trial →"}
                    highlighted={key === "business"}
                  />
                )}
              </TagCard>
            );
          }
        )}
      </div>

      <Caption className=" text-center !text-[12px]">
        14-day free trial · No credit card required to start · Cancel anytime
      </Caption>
    </div>
  );
}
