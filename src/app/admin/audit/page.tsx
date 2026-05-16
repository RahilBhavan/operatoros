import Link from "next/link";
import { loadAuditStream } from "@/lib/admin/data";
import { Body, Button, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ event_type?: string; business_id?: string }>;
}) {
  const sp = await searchParams;
  const events = await loadAuditStream(200, sp);

  const types = [...new Set(events.map((e) => e.event_type))].sort();

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] opacity-80">
              AUDIT · STREAM
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">AUDIT STREAM</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] opacity-70">
              EVENTS
            </Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">
              {events.length}
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            Cross-tenant activity stream. Every state-changing action that
            flows through the admin dashboard or the customer-facing app writes
            to audit_events. Most recent first.
          </Caption>
        </div>
      </header>

      {types.length > 0 && (
        <form
          className="border-2 border-[var(--color-ground)] bg-[var(--color-field)] p-4 mb-6 flex flex-wrap items-end gap-3"
          action="/admin/audit"
        >
          <label className="flex flex-col gap-1">
            <Utility className="!text-[12px]">EVENT TYPE</Utility>
            <select
              name="event_type"
              defaultValue={sp.event_type ?? ""}
              className="t-input"
            >
              <option value="">ALL</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" variant="ground">
            FILTER →
          </Button>
          {sp.event_type && (
            <Link
              href="/admin/audit"
              className="t-utility hover:text-[var(--color-mark)] self-end pb-3"
            >
              CLEAR
            </Link>
          )}
        </form>
      )}

      <div className="border-2 border-[var(--color-ground)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              <Th>WHEN</Th>
              <Th>EVENT</Th>
              <Th>BUSINESS</Th>
              <Th>ACTOR</Th>
              <Th>METADATA</Th>
            </tr>
          </thead>
          <tbody className="bg-[var(--color-field)]">
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center">
                  <Caption className="!opacity-60">
                    No events yet. Activity from invites, plan changes, and
                    revokes will appear here.
                  </Caption>
                </td>
              </tr>
            )}
            {events.map((e) => (
              <tr
                key={e.id}
                className="border-t-2 border-[var(--color-ground)]"
              >
                <td className="px-5 py-3 align-top whitespace-nowrap">
                  <Index className="!text-[12px]">
                    {new Date(e.occurred_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </Index>
                </td>
                <td className="px-5 py-3 align-top">
                  <span className="inline-flex items-center border-2 border-[var(--color-ground)] px-2 py-0.5 t-utility !text-[12px] bg-[var(--color-field)] text-[var(--color-ground)]">
                    {e.event_type}
                  </span>
                </td>
                <td className="px-5 py-3 align-top">
                  {e.business_name ? (
                    <Link
                      href={`/admin/businesses/${e.business_id}`}
                      className="t-link !no-underline hover:!text-[var(--color-mark)]"
                    >
                      <Body className="!text-[13px] !font-bold">
                        {e.business_name}
                      </Body>
                    </Link>
                  ) : (
                    <Caption className="!opacity-50">—</Caption>
                  )}
                </td>
                <td className="px-5 py-3 align-top">
                  <Caption className="!text-[12px]">
                    {e.actor_email ?? "system"}
                  </Caption>
                </td>
                <td className="px-5 py-3 align-top">
                  <Caption className="!text-[12px] font-mono truncate max-w-[300px] inline-block">
                    {Object.keys(e.metadata).length > 0
                      ? JSON.stringify(e.metadata)
                      : "—"}
                  </Caption>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-5 py-3 t-utility !text-[var(--color-field)] !text-[12px] text-left">
      {children}
    </th>
  );
}
