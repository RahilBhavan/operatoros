import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";

export const runtime = "nodejs";

/**
 * Lock a binder: snapshot the current deadline list (filtered to the binder's
 * agency if set), store in the JSONB snapshot column, set status='locked'.
 * From this point the deadlines list shown to the surveyor never changes,
 * even if the underlying deadlines are edited or completed.
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: binder } = await supabase
    .from("audit_binders")
    .select("id, status, agency")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!binder) {
    return NextResponse.json({ error: "Binder not found" }, { status: 404 });
  }
  if (binder.status !== "draft") {
    return NextResponse.json(
      { error: "Binder is not in draft status." },
      { status: 409 }
    );
  }

  const { data: live } = await supabase
    .from("deadlines")
    .select(
      "id, name, due_date, governing_agency, status, severity_tier, statute_citation, source_url"
    )
    .eq("business_id", business.id);

  const agencyFilter = binder.agency?.toLowerCase() ?? null;
  const deadlines = (live ?? []).filter((d) => {
    if (!agencyFilter) return true;
    return d.governing_agency?.toLowerCase().includes(agencyFilter);
  });

  const snapshot = {
    generated_at: new Date().toISOString(),
    deadlines,
  };

  const { error } = await supabase
    .from("audit_binders")
    .update({
      status: "locked",
      snapshot,
      locked_at: new Date().toISOString(),
      locked_by: user.id,
    })
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return dbError("audit-binders/lock", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "export",
    userId: user.id,
  });

  return NextResponse.json({ ok: true });
}
