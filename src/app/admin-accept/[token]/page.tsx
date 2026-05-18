import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashToken } from "@/lib/security/token-hash";
import {
  Destination,
  Body,
  Utility,
  Index,
  LinkButton,
} from "@/components/doctrine";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

// Lives at /admin-accept/[token] (not under /admin) so the gated admin
// layout's requirePlatformAdmin check doesn't 404 invitees before they can claim.

export default async function AcceptAdminInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const renderedAt = new Date();

  const { data: invite } = await admin
    .from("platform_admin_invites")
    .select("id, invited_email, expires_at, used_at, revoked_at")
    // token_hash replaces the dropped plaintext token column.
    // Cast: generated supabase types haven't regenerated for new column.
    .eq("token_hash" as never, hashToken(token))
    .maybeSingle();

  if (!invite) return renderShell("INVALID.", "This invite link is not valid.", null);
  if (invite.used_at) return renderShell("USED.", "This invite has already been used.", null);
  if (invite.revoked_at) return renderShell("REVOKED.", "This invite has been revoked.", null);
  if (new Date(invite.expires_at).getTime() < renderedAt.getTime()) {
    return renderShell("EXPIRED.", "This invite has expired.", null);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(`/admin-accept/${token}`);
    return renderShell(
      "ADMIN.",
      `Sign in as ${invite.invited_email} to claim this admin invite.`,
      <LinkButton href={`/sign-in?next=${next}`} variant="mark">
        Sign in to claim →
      </LinkButton>
    );
  }

  if (user.email && user.email.toLowerCase() !== invite.invited_email.toLowerCase()) {
    return renderShell(
      "MISMATCH.",
      `This invite was issued to ${invite.invited_email}. Sign in with that email to claim.`,
      null
    );
  }

  const { data: claimed } = await supabase.rpc("claim_platform_admin_invite", {
    p_token: token,
    p_display_name: user.user_metadata?.display_name ?? user.email ?? "Admin",
  });

  if (!claimed) {
    return renderShell("FAILED.", "This invite could not be claimed.", null);
  }

  redirect("/admin");
}

function renderShell(heading: string, message: string, action: React.ReactNode | null) {
  return (
    <div className="min-h-screen bg-[var(--color-field)] flex flex-col">
      <nav className="border-b-2 border-[var(--color-ground)] bg-[var(--color-field)] px-6 py-4">
        <div className="max-w-[1100px] mx-auto flex items-center justify-between">
          <Link href="/" className="t-h3 font-black tracking-tight">
            OPERATOR<span className="text-[var(--color-mark)]">OS</span>
          </Link>
          <Utility className="">PLATFORM ADMIN · INVITE</Utility>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[520px] border-2 border-[var(--color-ground)]">
          <div className="bg-[var(--color-mark)] text-[var(--color-field)] px-7 pt-6 pb-7">
            <div className="flex items-center justify-between mb-5">
              <Index className="!text-[12px] !text-[var(--color-field)] ">
                PA-ADMIN
              </Index>
              <span className="tag-tab -mt-6">INVITE</span>
              <Utility className="">SECTOR · X</Utility>
            </div>
            <Destination className="!text-[var(--color-field)] !text-[60px] !leading-none">
              {heading}
            </Destination>
          </div>

          <div className="bg-[var(--color-field)] px-7 py-7">
            <Body className="mb-6">{message}</Body>
            {action ?? (
              <LinkButton href="/" variant="ghost">
                ← Back to home
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
