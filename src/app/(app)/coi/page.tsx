import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkButton } from "@/components/doctrine/Button";

export const dynamic = "force-dynamic";

type Recipient = {
  id: string;
  name: string;
  email: string | null;
  recurring: boolean;
};

type Issue = {
  id: string;
  recipient_id: string;
  expiry_date: string;
  issued_at: string;
};

export default async function CoiIndex() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) redirect("/onboarding");

  const { data: recipients } = await supabase
    .from("coi_recipients")
    .select("id, name, email, recurring")
    .eq("business_id", business.id)
    .order("name", { ascending: true });

  const { data: issues } = await supabase
    .from("coi_issues")
    .select("id, recipient_id, expiry_date, issued_at")
    .eq("business_id", business.id)
    .order("expiry_date", { ascending: true });

  const issuesByRecipient = new Map<string, Issue[]>();
  for (const it of (issues ?? []) as Issue[]) {
    const arr = issuesByRecipient.get(it.recipient_id) ?? [];
    arr.push(it);
    issuesByRecipient.set(it.recipient_id, arr);
  }

  const nowMs = new Date().getTime();

  return (
    <div className="flex flex-col gap-5">
      <header className="border-b-4 border-[var(--color-ground)] pb-3 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="t-utility mb-2">PA-COI</div>
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
            COI distribution
          </h1>
          <p
            className="mt-3 max-w-[640px]"
            style={{ fontFamily: "var(--font-index)", fontSize: 15 }}
          >
            Manage Certificates of Insurance for every GC, owner, HOA, or
            property manager that asks for one. Track expiry and re-issue
            without chasing your broker.
          </p>
        </div>
        <LinkButton href="/coi/recipients/new" variant="mark">
          + Add recipient
        </LinkButton>
      </header>

      {(recipients ?? []).length === 0 ? (
        <div className="border-2 border-[var(--color-ground)] p-10">
          <h2
            style={{
              fontFamily: "var(--font-destination)",
              fontWeight: 800,
              fontSize: 32,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
            }}
          >
            No recipients yet.
          </h2>
          <p
            className="mt-3 max-w-[480px]"
            style={{ fontFamily: "var(--font-index)" }}
          >
            Add the GCs, property managers, or HOAs that regularly request
            your COI. We&rsquo;ll track expiry and remind you before each one
            lapses.
          </p>
        </div>
      ) : (
        <section className="border-2 border-[var(--color-ground)]">
          <div className="panel-ink px-4 py-2 flex items-center justify-between">
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              Recipients
            </span>
            <span className="t-utility" style={{ color: "var(--color-field)" }}>
              {String((recipients ?? []).length).padStart(2, "0")}
            </span>
          </div>
          <ul className="bg-[var(--color-field)]">
            {((recipients ?? []) as Recipient[]).map((r, i) => {
              const latest = issuesByRecipient.get(r.id)?.[
                (issuesByRecipient.get(r.id)?.length ?? 0) - 1
              ];
              return (
                <li
                  key={r.id}
                  className={
                    i === (recipients ?? []).length - 1
                      ? ""
                      : "border-b border-[var(--color-ground)]"
                  }
                >
                  <Link
                    href={`/coi/recipients/${r.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5 no-underline hover:bg-[var(--color-ground)] hover:text-[var(--color-field)]"
                  >
                    <div>
                      <div
                        className="font-bold text-[15px]"
                        style={{ fontFamily: "var(--font-index)" }}
                      >
                        {r.name}
                      </div>
                      <div className="t-utility mt-1">
                        {r.email ?? "no email"}
                        {r.recurring ? " · recurring" : ""}
                      </div>
                    </div>
                    <div className="t-utility shrink-0">
                      {(() => {
                        const e = latest?.expiry_date;
                        if (!e) return "Never issued";
                        const ms = new Date(e).getTime() - nowMs;
                        if (ms < 0) return "Expired";
                        if (ms < 30 * 86400 * 1000) return "Expiring ≤30d";
                        return "Current";
                      })()}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
