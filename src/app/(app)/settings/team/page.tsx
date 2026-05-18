import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import InviteMemberForm from "@/components/dashboard/InviteMemberForm";
import RevokeInviteButton from "@/components/dashboard/RevokeInviteButton";
import {
  H1,
  H2,
  Body,
  Caption,
  Utility,
  Index,
  StampChip,
  Breadcrumb,
} from "@/components/doctrine";

export default async function TeamSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name, owner_id")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  const { data: myMembership } = await supabase
    .from("memberships")
    .select("role")
    .eq("business_id", business.id)
    .eq("user_id", user.id)
    .single();

  const isAdmin = myMembership?.role === "admin";

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="border-2 border-[var(--color-ground)] p-10 text-center flex flex-col items-center gap-3">
          <StampChip tone="mark">Admin only</StampChip>
          <H2 className="mb-1">Admin access required.</H2>
          <Body className="">
            Only an account admin can manage team members. Ask the person who
            originally set up <strong>{business.name}</strong> on OperatorOS to
            invite or promote you.
          </Body>
        </div>
      </div>
    );
  }

  const { data: members } = await supabase
    .from("memberships")
    .select(
      "id, role, user_id, invited_email, created_at, status, accepted_at, invite_expires_at"
    )
    .eq("business_id", business.id)
    .order("created_at", { ascending: true });

  const active = (members ?? []).filter((m) => m.status === "active");
  const pending = (members ?? []).filter((m) => m.status === "pending");
  const renderedAt = new Date();

  return (
    <div className="max-w-[900px] flex flex-col gap-5">
      <Breadcrumb
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Team" },
        ]}
      />
      <header className="border-b-4 border-[var(--color-ground)] pb-3">
        <div className="flex items-center gap-3 mb-2">
          <Index className="!text-[13px]">PA-TEAM</Index>
        </div>
        <H1>Team.</H1>
        <Caption className="!mt-1">
          Members of <strong>{business.name}</strong>. Admins manage billing and team. Members use the app.
        </Caption>
      </header>

      <section className="mb-10">
        <InviteMemberForm />
      </section>

      <section className="border-2 border-[var(--color-ground)] mb-8">
        <div className="bg-[var(--color-ground)] text-[var(--color-field)] px-5 py-2.5 grid grid-cols-[1fr_auto_auto] gap-4 items-center">
          <Utility className="!text-[var(--color-field)] ">
            MEMBER / EMAIL
          </Utility>
          <Utility className="!text-[var(--color-field)] ">ROLE</Utility>
          <Utility className="!text-[var(--color-field)]  hidden sm:block">JOINED</Utility>
        </div>
        <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
          {active.map((m) => (
              <li
                key={m.id}
                className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-2.5"
              >
                <div className="min-w-0">
                  <Body className="!font-bold truncate">
                    {m.user_id === user.id ? "You" : m.invited_email ?? `user ${m.user_id.slice(0, 6)}…`}
                  </Body>
                  {m.user_id === user.id && (
                    <Caption className="!mt-0.5 !text-[12px]">{user.email}</Caption>
                  )}
                </div>
                <span className="t-utility !text-[12px] uppercase">{m.role}</span>
                <Index className="!text-[12px] hidden sm:block">
                  {new Date(m.accepted_at ?? m.created_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric", year: "numeric" }
                  )}
                </Index>
              </li>
          ))}
        </ul>
      </section>

      {pending.length > 0 && (
        <section className="border-2 border-[var(--color-mark)]">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-5 py-2.5 flex items-center justify-between">
            <Utility className="!text-[var(--color-field)]">
              PENDING INVITES ({pending.length})
            </Utility>
          </div>
          <ul className="bg-[var(--color-field)] divide-y divide-[var(--color-ground)]">
            {pending.map((m) => {
              const expired =
                m.invite_expires_at &&
                new Date(m.invite_expires_at).getTime() < renderedAt.getTime();
              return (
                <li
                  key={m.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-4 py-2.5"
                >
                  <Body className="!font-bold truncate">{m.invited_email}</Body>
                  <span className="t-utility !text-[12px] uppercase">{m.role}</span>
                  <Caption className="!text-[12px]">
                    {expired
                      ? "EXPIRED"
                      : m.invite_expires_at
                      ? `EXPIRES ${new Date(m.invite_expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`
                      : "PENDING"}
                  </Caption>
                  <RevokeInviteButton membershipId={m.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
