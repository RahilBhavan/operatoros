import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  TagCard,
  Body,
  Caption,
  Utility,
  LinkButton,
} from "@/components/doctrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

const ROLE_CODE: Record<string, string> = {
  owner: "A",
  admin: "B",
  member: "C",
};

export default async function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();

  // Look up the pending invite. The admin client bypasses RLS so this works
  // even before the user has accepted (they may not be a member yet).
  const { data: invite } = await admin
    .from("memberships")
    .select(
      "id, business_id, role, invited_email, invite_expires_at, status, businesses!inner(name)",
    )
    .eq("invite_token", token)
    .maybeSingle();

  if (!invite)
    return renderShell({
      heading: "INVALID.",
      subtitle: "INVITE LINK",
      message: "This invite link is not valid.",
      role: null,
      action: null,
    });

  if (invite.status !== "pending") {
    return renderShell({
      heading: "USED.",
      subtitle: "ALREADY CLAIMED",
      message: "This invite has already been accepted or revoked.",
      role: null,
      action: null,
    });
  }

  if (
    invite.invite_expires_at &&
    new Date(invite.invite_expires_at).getTime() < now.getTime()
  ) {
    return renderShell({
      heading: "EXPIRED.",
      subtitle: "INVITE LAPSED",
      message: "This invite has expired. Ask the inviter to send a new one.",
      role: null,
      action: null,
    });
  }

  const businessName = Array.isArray(invite.businesses)
    ? invite.businesses[0]?.name
    : invite.businesses?.name;

  const roleLetter = ROLE_CODE[invite.role] ?? "C";

  if (!user) {
    const next = encodeURIComponent(`/invite/${token}/accept`);
    return renderShell({
      heading: "JOIN.",
      subtitle: businessName ?? "TEAM INVITE",
      role: invite.role,
      message: `Sign in to accept your invite to ${businessName ?? "this team"}.`,
      action: (
        <LinkButton href={`/sign-in?next=${next}`} variant="ground">
          Sign in to accept →
        </LinkButton>
      ),
    });
  }

  // Email check: only the invited address can claim.
  if (
    invite.invited_email &&
    user.email &&
    invite.invited_email.toLowerCase() !== user.email.toLowerCase()
  ) {
    return renderShell({
      heading: "MISMATCH.",
      subtitle: "WRONG ACCOUNT",
      role: invite.role,
      message: `This invite was sent to ${invite.invited_email}. Sign in with that email to accept.`,
      action: null,
    });
  }

  // Atomic accept: flip status, set user_id, accepted_at, and clear token.
  const { error } = await admin
    .from("memberships")
    .update({
      user_id: user.id,
      status: "active",
      accepted_at: nowIso,
      invite_token: null,
    })
    .eq("id", invite.id)
    .eq("status", "pending");

  if (error) {
    return renderShell({
      heading: "ERROR.",
      subtitle: "COULD NOT ACCEPT",
      role: invite.role,
      message: "Something went wrong accepting this invite.",
      action: null,
    });
  }

  await admin.from("audit_events").insert({
    business_id: invite.business_id,
    actor_user_id: user.id,
    event_type: "team.invite_accepted",
    target_id: invite.id,
    metadata: { role: invite.role },
  });

  redirect("/dashboard?invite_accepted=1");
}

function renderShell({
  heading,
  subtitle,
  message,
  action,
  role,
}: {
  heading: string;
  subtitle: string;
  message: string;
  action: React.ReactNode | null;
  role: string | null;
}) {
  const isError = !role;
  const roleLetter = role ? ROLE_CODE[role] ?? "C" : "X";

  return (
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <nav className="border-b-2 border-[var(--color-ground)] bg-[var(--color-field)] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link href="/" className="t-h3 font-black tracking-tight">
            OPERATOR<span className="text-[var(--color-mark)]">OS</span>
          </Link>
          <Utility className="opacity-60">PUBLIC PORTAL · READ-ONLY</Utility>
        </div>
      </nav>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[480px]">
          <TagCard
            variant={isError ? "mark" : "ground"}
            destination={
              <span className="block uppercase">{heading}</span>
            }
            subtitle={subtitle}
            topCode={isError ? "ERR" : `R-${roleLetter}`}
            topRight="TEAM INVITE"
            tabLabel="INVITE"
            sortSymbol={roleLetter}
            refNumber={role ? role.toUpperCase() : "ERROR"}
            perforated
          >
            <div className="flex flex-col gap-5">
              <Body>{message}</Body>
              {action ? (
                <div className="flex flex-col gap-3">
                  {action}
                  <LinkButton href="/" variant="ghost">
                    Decline
                  </LinkButton>
                </div>
              ) : (
                <LinkButton href="/" variant="ghost">
                  Return home →
                </LinkButton>
              )}
              <Caption className="!opacity-60 !text-[12px]">
                Generated by OperatorOS · operatoros.com
              </Caption>
            </div>
          </TagCard>
        </div>
      </main>
    </div>
  );
}
