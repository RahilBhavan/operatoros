"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateInviteCode } from "@/lib/viral-attribution";

const MAX_ACTIVE_LINKS_PER_ACCOUNTANT = 50;

export type CreateLinkResult =
  | { ok: true; code: string }
  | { ok: false; error: string };

export async function createInviteLink(
  formData: FormData
): Promise<CreateLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: business } = await supabase
    .from("businesses")
    .select("plan_tier")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (business?.plan_tier !== "accountant") {
    return {
      ok: false,
      error: "Invite links are an Accountant plan feature.",
    };
  }

  const rawLabel = formData.get("label");
  const label =
    typeof rawLabel === "string" && rawLabel.trim().length > 0
      ? rawLabel.trim().slice(0, 120)
      : null;

  const admin = createAdminClient();

  const { count } = await admin
    .from("accountant_invite_links")
    .select("id", { count: "exact", head: true })
    .eq("accountant_id", user.id)
    .is("revoked_at", null);

  if ((count ?? 0) >= MAX_ACTIVE_LINKS_PER_ACCOUNTANT) {
    return {
      ok: false,
      error: `You already have ${MAX_ACTIVE_LINKS_PER_ACCOUNTANT} active links. Revoke an old one to add a new one.`,
    };
  }

  // Retry on the (vanishingly rare) collision against the unique index.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode();
    const { error } = await admin.from("accountant_invite_links").insert({
      accountant_id: user.id,
      code,
      label,
    });
    if (!error) {
      revalidatePath("/settings/network");
      return { ok: true, code };
    }
    if (error.code !== "23505") {
      return { ok: false, error: "Failed to create link." };
    }
  }
  return { ok: false, error: "Failed to generate a unique code. Try again." };
}

export type RevokeLinkResult =
  | { ok: true }
  | { ok: false; error: string };

export async function revokeInviteLink(
  linkId: string
): Promise<RevokeLinkResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // RLS on accountant_invite_links restricts to accountant_id = auth.uid().
  // Use the user client (not admin) so the policy enforces ownership.
  const { error } = await supabase
    .from("accountant_invite_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", linkId)
    .eq("accountant_id", user.id)
    .is("revoked_at", null);

  if (error) return { ok: false, error: "Failed to revoke link." };
  revalidatePath("/settings/network");
  return { ok: true };
}
