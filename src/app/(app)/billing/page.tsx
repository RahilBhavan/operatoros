import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS } from "@/lib/stripe";
import { CheckCircle } from "lucide-react";
import BillingActions from "@/components/dashboard/BillingActions";

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select(
      "id, plan_tier, billing_status, trial_ends_at, stripe_customer_id"
    )
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const isActive =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Billing</h1>
      <p className="text-slate-500 mb-8">Manage your subscription and plan.</p>

      {/* Current plan */}
      {isActive && business.plan_tier !== "free" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Current plan</p>
              <p className="text-xl font-bold text-slate-900 capitalize mt-0.5">
                {business.plan_tier} —{" "}
                {business.billing_status === "trialing"
                  ? "Free trial"
                  : "Active"}
              </p>
              {business.trial_ends_at &&
                business.billing_status === "trialing" && (
                  <p className="text-sm text-amber-600 mt-1">
                    Trial ends{" "}
                    {new Date(business.trial_ends_at).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </p>
                )}
            </div>
            <BillingActions hasCustomer={!!business.stripe_customer_id} />
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-5">
        {(Object.entries(PLANS) as [keyof typeof PLANS, (typeof PLANS)[keyof typeof PLANS]][]).map(
          ([key, plan]) => {
            const isCurrent = business.plan_tier === key && isActive;
            const isHighlighted = key === "growth";

            return (
              <div
                key={key}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col ${
                  isHighlighted
                    ? "border-blue-500 ring-2 ring-blue-500"
                    : "border-slate-200"
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-bold text-slate-900">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      ${plan.amount}
                    </span>
                    <span className="text-slate-500 text-sm">/month</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-slate-500">
                    Current plan
                  </div>
                ) : (
                  <BillingActions
                    plan={key}
                    hasCustomer={!!business.stripe_customer_id}
                    isSubscribed={isActive && business.plan_tier !== "free"}
                    buttonLabel={isActive ? "Switch plan" : "Start free trial"}
                    highlighted={isHighlighted}
                  />
                )}
              </div>
            );
          }
        )}
      </div>

      <p className="text-xs text-slate-400 mt-6 text-center">
        14-day free trial · No credit card required to start · Cancel anytime
      </p>
    </div>
  );
}
