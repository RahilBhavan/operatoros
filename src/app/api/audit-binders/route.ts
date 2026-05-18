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

  const agency =
    typeof body.agency === "string" && body.agency.length > 0
      ? body.agency.slice(0, 200)
      : null;
  const scope =
    typeof body.scope === "string" && body.scope.length > 0
      ? body.scope.slice(0, 4000)
      : null;
  const inspection_date =
    typeof body.inspection_date === "string" && body.inspection_date.length > 0
      ? body.inspection_date.slice(0, 10)
      : null;

  const { data, error } = await supabase
    .from("audit_binders")
    .insert({
      business_id: business.id,
      name,
      agency,
      scope,
      inspection_date,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("audit-binders/POST", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: "create",
    userId: user.id,
  });

  return NextResponse.json({ id: data.id });
}
