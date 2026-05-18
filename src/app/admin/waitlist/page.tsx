import Link from "next/link";
import { loadWaitlist } from "@/lib/admin/data";
import PromoteWaitlistButton from "@/components/admin/PromoteWaitlistButton";
import { Body, Button, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const rows = await loadWaitlist({ state: sp.state, search: sp.q });

  // Aggregate state + industry breakdowns from the rows we already loaded.
  const byState = new Map<string, number>();
  const byIndustry = new Map<string, number>();
  const byReferrer = new Map<string, number>();
  for (const r of rows) {
    if (r.state) byState.set(r.state, (byState.get(r.state) ?? 0) + 1);
    if (r.industry_slug) byIndustry.set(r.industry_slug, (byIndustry.get(r.industry_slug) ?? 0) + 1);
    if (r.referred_by_code)
      byReferrer.set(r.referred_by_code, (byReferrer.get(r.referred_by_code) ?? 0) + 1);
  }
  const top = (m: Map<string, number>, n = 6) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] ">
              WAITLIST · MANIFEST
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">WAITLIST</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] ">
              SIGNUPS LOGGED
            </Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">
              {rows.length}
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            Cohort signups with referral chain and jurisdiction breakdown. Use
            INVITE to send the early-access email and mark the row as invited.
          </Caption>
        </div>
      </header>

      <section className="grid md:grid-cols-3 gap-4 mb-6">
        <Breakdown title="BY STATE" data={top(byState)} />
        <Breakdown title="BY INDUSTRY" data={top(byIndustry)} />
        <Breakdown
          title="TOP REFERRERS"
          data={top(byReferrer)}
          empty="No referrals yet."
        />
      </section>

      <form
        className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-4 mb-6 flex flex-wrap items-end gap-3"
        action="/admin/waitlist"
      >
        <label className="flex-1 min-w-[200px] flex flex-col gap-1">
          <Utility className="!text-[12px]">SEARCH EMAIL</Utility>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="email@example.com"
            className="t-input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <Utility className="!text-[12px]">STATE</Utility>
          <input
            name="state"
            defaultValue={sp.state ?? ""}
            placeholder="XX"
            maxLength={2}
            className="t-input w-24 uppercase"
          />
        </label>
        <Button type="submit" variant="ground">
          APPLY →
        </Button>
        {(sp.q || sp.state) && (
          <Link
            href="/admin/waitlist"
            className="t-utility hover:text-[var(--color-mark)] self-end pb-3"
          >
            CLEAR
          </Link>
        )}
      </form>

      <div className="border-2 border-[var(--color-ground)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              <Th>#</Th>
              <Th>EMAIL</Th>
              <Th>STATE</Th>
              <Th>INDUSTRY</Th>
              <Th>SOURCE</Th>
              <Th>SIGNED UP</Th>
              <Th align="right">ACTION</Th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-field)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center">
                  <Caption className="">
                    No waitlist signups match these filters.
                  </Caption>
                </td>
              </tr>
            )}
            {rows.map((w, i) => (
              <tr
                key={w.id}
                className="border-t-2 border-[var(--color-ground)]"
              >
                <td className="px-5 py-3 align-top">
                  <Index className="!text-[15px]">
                    {String(i + 1).padStart(3, "0")}
                  </Index>
                </td>
                <td className="px-5 py-3 align-top">
                  <Body className="!font-bold !text-[15px] truncate max-w-[220px]">
                    {w.email}
                  </Body>
                  <Caption className="!text-[12px]  !mt-0">
                    ref{" "}
                    <span className="font-mono">
                      {w.referral_code.slice(0, 8)}…
                    </span>
                    {w.referred_by_code && (
                      <>
                        {" · via "}
                        <span className="font-mono">
                          {w.referred_by_code.slice(0, 8)}…
                        </span>
                      </>
                    )}
                  </Caption>
                </td>
                <td className="px-5 py-3 align-top">
                  <Index className="!text-[15px]">{w.state ?? "—"}</Index>
                </td>
                <td className="px-5 py-3 align-top">
                  <Body className="!text-[13px]">{w.industry_slug ?? "—"}</Body>
                </td>
                <td className="px-5 py-3 align-top">
                  <Caption className="!text-[12px]">
                    {w.utm_source ?? "—"}
                    {w.utm_campaign ? ` / ${w.utm_campaign}` : ""}
                  </Caption>
                </td>
                <td className="px-5 py-3 align-top">
                  <Index className="!text-[12px]">
                    {new Date(w.signed_up_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Index>
                </td>
                <td className="px-5 py-3 text-right align-top">
                  <PromoteWaitlistButton
                    id={w.id}
                    email={w.email}
                    invited={!!w.invited_at}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Breakdown({
  title,
  data,
  empty,
}: {
  title: string;
  data: Array<[string, number]>;
  empty?: string;
}) {
  const max = data[0]?.[1] ?? 1;
  return (
    <div className="border-2 border-[var(--color-ground)] bg-[var(--color-field)]">
      <div className="border-b-2 border-[var(--color-ground)] px-5 py-3">
        <Utility>{title}</Utility>
      </div>
      <div className="px-5 py-4">
        {data.length === 0 ? (
          <Caption className="">{empty ?? "No data yet."}</Caption>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-ground)]">
            {data.map(([k, v]) => (
              <li
                key={k}
                className="flex items-center justify-between py-2 gap-3"
              >
                <Body className="!text-[13px] !font-bold uppercase truncate max-w-[110px]">
                  {k}
                </Body>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 border border-[var(--color-ground)]">
                    <div
                      className="h-full bg-[var(--color-ground)]"
                      style={{ width: `${(v / max) * 100}%` }}
                    />
                  </div>
                  <Index className="!text-[15px] w-8 text-right">{v}</Index>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Th({
  children,
  align,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`px-5 py-3 t-utility !text-[var(--color-field)] !text-[12px] ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
