import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
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

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 200) {
    return NextResponse.json(
      { error: "name required (1-200 chars)" },
      { status: 400 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const baa = await checkBaaForPhi(supabase, {
    businessId: business.id,
    industrySlug: business.industry_slug,
  });
  if (baa) return NextResponse.json({ error: baa.error }, { status: baa.status });

  const { data, error } = await supabase
    .from("coi_recipients")
    .insert({
      business_id: business.id,
      name,
      email:
        typeof body.email === "string" && body.email.length > 0
          ? body.email.slice(0, 320)
          : null,
      address:
        typeof body.address === "string" && body.address.length > 0
          ? body.address.slice(0, 1000)
          : null,
      requirements:
        typeof body.requirements === "string" && body.requirements.length > 0
          ? body.requirements.slice(0, 4000)
          : null,
      recurring: Boolean(body.recurring),
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("coi/recipients/POST", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "create",
    userId: user.id,
  });

  return NextResponse.json({ id: data.id });
}
