import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";
import { Breadcrumb } from "@/components/doctrine/Breadcrumb";
import AcceptBaaForm from "@/components/settings/AcceptBaaForm";

export const dynamic = "force-dynamic";

const HEALTHCARE_NAICS = new Set([
  "healthcare",
  // Future: more granular slugs as the taxonomy expands.
]);

export default async function BaaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: active } = await supabase
    .from("business_associate_agreements")
    .select("id, version, signed_at, signer_name, signer_title")
    .eq("business_id", business.id)
    .is("revoked_at", null)
    .order("signed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const isHealthcare = HEALTHCARE_NAICS.has(business.industry_slug ?? "");

  return (
    <div className="flex flex-col gap-5 max-w-[720px]">
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" },
          { label: "BAA" },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="t-utility mb-2">PA-BAA</div>
        <h1
          style={{
            fontFamily: "var(--font-destination)",
            fontWeight: 900,
            fontSize: "clamp(30px, 4vw, 44px)",
            lineHeight: 1,
            letterSpacing: "-0.02em",
            textTransform: "uppercase",
          }}
        >
          Business Associate Agreement
        </h1>
        <p
          className="mt-3 max-w-[640px]"
          style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
        >
          Required for healthcare-vertical customers who will store
          PHI-adjacent documents in OperatorOS. Sign once per business; we
          countersign automatically and email you the executed copy.
        </p>
      </header>

      {!isHealthcare ? (
        <div className="border-2 border-[var(--color-ground)] px-4 py-2.5">
          <p style={{ fontFamily: "var(--font-index)", fontSize: 14 }}>
            Your industry is not flagged as healthcare. A BAA is not required
            for your account. If that&rsquo;s wrong, update your industry in
            onboarding or contact support.
          </p>
        </div>
      ) : null}

      {active ? (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-3">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              BAA on file
            </span>
          </div>
          <div className="bg-[var(--color-field)] px-4 py-2.5 flex flex-col gap-2">
            <div>
              <span className="t-utility">Version: </span>
              <span style={{ fontFamily: "var(--font-index)" }}>
                {active.version}
              </span>
            </div>
            <div>
              <span className="t-utility">Signed: </span>
              <span style={{ fontFamily: "var(--font-index)" }}>
                {new Date(active.signed_at).toLocaleDateString()} by{" "}
                {active.signer_name}
                {active.signer_title ? `, ${active.signer_title}` : ""}
              </span>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="border-2 border-[var(--color-ground)]">
            <div className="panel-ink px-4 py-2 flex items-center justify-between flex-wrap gap-2">
              <span className="t-utility" style={{ color: "var(--color-field)" }}>
                What is a BAA?
              </span>
              <span className="t-utility" style={{ color: "var(--color-field)" }}>
                Required · HIPAA
              </span>
            </div>
            <div className="bg-[var(--color-field)] px-4 py-3 text-[14px] flex flex-col gap-3"
              style={{ fontFamily: "var(--font-index)" }}
            >
              <p>
                A Business Associate Agreement is a contract between a HIPAA-covered
                entity (you) and a service provider (us) that defines how we may
                handle Protected Health Information on your behalf.
              </p>
              <p>
                Sign once per business. We countersign automatically and email
                you the executed copy. Until a BAA is on file, OperatorOS will
                reject any write to PHI-adjacent tables (staff credentials,
                project documents, audit binders).
              </p>
            </div>
          </section>

          <section className="border-2 border-[var(--color-ground)]">
            <details>
              <summary className="panel-ink px-4 py-2 cursor-pointer list-none flex items-center justify-between">
                <span className="t-utility" style={{ color: "var(--color-field)" }}>
                  Agreement preview (v1.0 · draft pending legal review)
                </span>
                <span className="t-utility" style={{ color: "var(--color-field)" }}>
                  Show ▾
                </span>
              </summary>
              <div
                className="bg-[var(--color-field)] px-4 py-3 text-[14px] whitespace-pre-wrap border-t-2 border-[var(--color-ground)]"
                style={{ fontFamily: "var(--font-index)" }}
              >
                {`OperatorOS, Inc. (“Business Associate”) and ${business.name} (“Covered Entity”) enter into this Business Associate Agreement to comply with the requirements of HIPAA (45 CFR Parts 160 and 164).

[PLACEHOLDER TEXT — DRAFTED BY HEALTHCARE-DATA ATTORNEY BEFORE PRODUCTION USE]

Key terms (final version pending attorney review):

• Permitted uses: Business Associate may use and disclose PHI only as
  necessary to perform the services described in the underlying SaaS
  agreement, or as required by law.
• Safeguards: Business Associate will implement administrative, physical,
  and technical safeguards to protect PHI, including encryption at rest
  and in transit, role-based access controls, and an append-only audit
  log of PHI access.
• Sub-processors: Business Associate maintains current BAAs with all
  sub-processors that may access PHI. Current list at
  /security#sub-processors.
• Breach notification: Business Associate will notify Covered Entity
  within 30 days of discovery of any Breach of Unsecured PHI, with the
  60-day outer limit required by 45 CFR 164.410.
• Term: This BAA remains in effect for as long as the underlying SaaS
  agreement is active.

— DO NOT EXECUTE THIS DRAFT IN PRODUCTION. Replace with attorney-drafted
text before enabling acceptance flow for live customers.`}
              </div>
            </details>
          </section>

          <AcceptBaaForm businessName={business.name} />
        </>
      )}

      <div>
        <LinkButton href="/settings" variant="ghost">
          ← Back to settings
        </LinkButton>
      </div>
    </div>
  );
}
