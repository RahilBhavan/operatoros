import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";
import type { Database } from "@/types/supabase";

// coi_recipients lives under Views in generated types (schema quirk).
type CoiRecipientUpdate =
  Database["public"]["Views"]["coi_recipients"]["Update"];

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("coi_recipients")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baa = await checkBaaForPhi(supabase, {
    businessId: business.id,
    industrySlug: business.industry_slug,
  });
  if (baa) return NextResponse.json({ error: baa.error }, { status: baa.status });

  const patch: CoiRecipientUpdate = {};

  if (typeof body.name === "string") {
    const v = body.name.trim();
    if (!v || v.length > 200) {
      return NextResponse.json(
        { error: "name must be 1-200 chars" },
        { status: 400 },
      );
    }
    patch.name = v;
  }
  if ("email" in body) {
    patch.email =
      typeof body.email === "string" && body.email.length > 0
        ? body.email.slice(0, 320)
        : null;
  }
  if ("address" in body) {
    patch.address =
      typeof body.address === "string" && body.address.length > 0
        ? body.address.slice(0, 1000)
        : null;
  }
  if ("requirements" in body) {
    patch.requirements =
      typeof body.requirements === "string" && body.requirements.length > 0
        ? body.requirements.slice(0, 4000)
        : null;
  }
  if ("recurring" in body) {
    patch.recurring = Boolean(body.recurring);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("coi_recipients")
    .update(patch)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return dbError("coi/recipients/PATCH", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "update",
    userId: user.id,
  });

  return NextResponse.json({ id });
}
