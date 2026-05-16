import { createAdminClient } from "@/lib/supabase/admin";
import CreateAdminInviteForm from "@/components/admin/CreateAdminInviteForm";
import RevokeAdminInviteButton from "@/components/admin/RevokeAdminInviteButton";
import { Body, Caption, H1, Index, Utility } from "@/components/doctrine";

export const dynamic = "force-dynamic";

export default async function AdminInvitesPage() {
  const supabase = createAdminClient();
  const renderedAt = new Date();

  const [{ data: admins }, { data: invites }] = await Promise.all([
    supabase
      .from("platform_admins")
      .select("user_id, display_name, created_at, revoked_at"),
    supabase
      .from("platform_admin_invites")
      .select(
        "id, token, invited_email, created_at, expires_at, used_at, used_by, revoked_at, created_by"
      )
      .order("created_at", { ascending: false }),
  ]);

  // Resolve emails for both admins and inviters in one batch.
  const userIds = new Set<string>();
  for (const a of admins ?? []) userIds.add(a.user_id);
  for (const i of invites ?? []) {
    userIds.add(i.created_by);
    if (i.used_by) userIds.add(i.used_by);
  }
  const emailById = new Map<string, string>();
  await Promise.all(
    [...userIds].map(async (uid) => {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) emailById.set(uid, data.user.email);
    })
  );

  const activeInvites = (invites ?? []).filter(
    (i) => !i.used_at && !i.revoked_at && new Date(i.expires_at) > renderedAt
  );
  const usedInvites = (invites ?? []).filter((i) => i.used_at);
  const otherInvites = (invites ?? []).filter(
    (i) => !i.used_at && (i.revoked_at || new Date(i.expires_at) <= renderedAt)
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const activeAdminCount = (admins ?? []).filter((a) => !a.revoked_at).length;

  return (
    <div>
      <header className="border-2 border-[var(--color-ground)] mb-6">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-6 py-5 flex items-end justify-between flex-wrap gap-4">
          <div>
            <Index className="!text-[var(--color-field)] !text-[15px] opacity-80">
              ADMINS · ACCESS CONTROL
            </Index>
            <H1 className="!text-[var(--color-field)] mt-1">PLATFORM ADMINS</H1>
          </div>
          <div className="text-right">
            <Utility className="!text-[var(--color-field)] opacity-70">
              ACTIVE
            </Utility>
            <div className="t-display !text-[38px] !text-[var(--color-field)]">
              {activeAdminCount}
            </div>
          </div>
        </div>
        <div className="bg-[var(--color-field)] px-6 py-4">
          <Caption>
            Manage who can see this dashboard. Invites are one-time tokens that
            expire after 7 days.
          </Caption>
        </div>
      </header>

      <section className="mb-6">
        <CreateAdminInviteForm />
      </section>

      <SectionTable
        title={`ACTIVE ADMINS (${activeAdminCount})`}
        headers={["ADMIN", "EMAIL", "STATE", "ADDED"]}
        empty={(admins ?? []).length === 0 ? "No admins yet." : null}
      >
        {(admins ?? []).map((a) => (
          <tr
            key={a.user_id}
            className="border-t-2 border-[var(--color-ground)]"
          >
            <td className="px-5 py-3">
              <Body className="!font-bold !text-[15px]">
                {a.display_name ?? "—"}
              </Body>
            </td>
            <td className="px-5 py-3">
              <Caption className="!text-[12px]">
                {emailById.get(a.user_id) ?? a.user_id.slice(0, 8)}
              </Caption>
            </td>
            <td className="px-5 py-3">
              <StatePill kind={a.revoked_at ? "revoked" : "active"} />
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {new Date(a.created_at).toLocaleDateString("en-US")}
              </Index>
            </td>
          </tr>
        ))}
      </SectionTable>

      <SectionTable
        title={`PENDING INVITES (${activeInvites.length})`}
        headers={["EMAIL", "CREATED BY", "EXPIRES", "ACCEPT URL", ""]}
        align={["left", "left", "left", "left", "right"]}
        empty={activeInvites.length === 0 ? "No pending invites." : null}
      >
        {activeInvites.map((i) => (
          <tr key={i.id} className="border-t-2 border-[var(--color-ground)]">
            <td className="px-5 py-3">
              <Body className="!font-bold !text-[15px]">{i.invited_email}</Body>
            </td>
            <td className="px-5 py-3">
              <Caption className="!text-[12px]">
                {emailById.get(i.created_by) ?? "—"}
              </Caption>
            </td>
            <td className="px-5 py-3">
              <Index className="!text-[12px]">
                {new Date(i.expires_at).toLocaleDateString("en-US")}
              </Index>
            </td>
            <td className="px-5 py-3">
              <Caption className="!text-[12px] font-mono truncate max-w-[280px] inline-block">
                {`${appUrl}/admin-accept/${i.token}`}
              </Caption>
            </td>
            <td className="px-5 py-3 text-right">
              <RevokeAdminInviteButton id={i.id} />
            </td>
          </tr>
        ))}
      </SectionTable>

      {(usedInvites.length > 0 || otherInvites.length > 0) && (
        <SectionTable
          title={`HISTORY (${usedInvites.length + otherInvites.length})`}
          headers={["EMAIL", "STATE", "WHEN"]}
          empty={null}
        >
          {[...usedInvites, ...otherInvites].map((i) => (
            <tr key={i.id} className="border-t-2 border-[var(--color-ground)]">
              <td className="px-5 py-3">
                <Body className="!text-[15px]">{i.invited_email}</Body>
              </td>
              <td className="px-5 py-3">
                {i.used_at ? (
                  <span className="inline-flex flex-col gap-0.5">
                    <StatePill kind="active" label="ACCEPTED" />
                    <Caption className="!text-[12px] !opacity-60">
                      by{" "}
                      {i.used_by ? emailById.get(i.used_by) ?? "user" : "user"}
                    </Caption>
                  </span>
                ) : i.revoked_at ? (
                  <StatePill kind="revoked" />
                ) : (
                  <StatePill kind="expired" />
                )}
              </td>
              <td className="px-5 py-3">
                <Index className="!text-[12px]">
                  {new Date(
                    i.used_at ?? i.revoked_at ?? i.expires_at
                  ).toLocaleDateString("en-US")}
                </Index>
              </td>
            </tr>
          ))}
        </SectionTable>
      )}
    </div>
  );
}

function SectionTable({
  title,
  headers,
  align,
  empty,
  children,
}: {
  title: string;
  headers: string[];
  align?: Array<"left" | "right">;
  empty: string | null;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 border-b-2 border-[var(--color-ground)] pb-2">
        <Utility>{title}</Utility>
      </div>
      <div className="border-2 border-[var(--color-ground)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-ground)] text-[var(--color-field)]">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className={`px-5 py-3 t-utility !text-[var(--color-field)] !text-[12px] ${
                    align?.[i] === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--color-field)]">
            {empty ? (
              <tr>
                <td colSpan={headers.length} className="px-5 py-8 text-center">
                  <Caption className="!opacity-60">{empty}</Caption>
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatePill({
  kind,
  label,
}: {
  kind: "active" | "revoked" | "expired";
  label?: string;
}) {
  const base =
    "inline-flex items-center border-2 px-2 py-0.5 t-utility !text-[12px]";
  if (kind === "revoked") {
    return (
      <span
        className={`${base} border-[var(--color-mark)] bg-[var(--color-mark)] text-[var(--color-field)]`}
      >
        {label ?? "REVOKED"}
      </span>
    );
  }
  if (kind === "expired") {
    return (
      <span
        className={`${base} border-[var(--color-ground)] bg-transparent text-[var(--color-ground)] opacity-60`}
      >
        {label ?? "EXPIRED"}
      </span>
    );
  }
  return (
    <span
      className={`${base} border-[var(--color-ground)] bg-[var(--color-ground)] text-[var(--color-field)]`}
    >
      {label ?? "ACTIVE"}
    </span>
  );
}
