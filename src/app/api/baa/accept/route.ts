import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

const BAA_VERSION = "1.0-draft";

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

  const signerName =
    typeof body.signer_name === "string" ? body.signer_name.trim() : "";
  if (!signerName || signerName.length > 200) {
    return NextResponse.json(
      { error: "signer_name required (1-200 chars)" },
      { status: 400 }
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? null;

  // BAA rows are admin-write only (defense-in-depth — see migration). Use
  // the service-role client to insert on behalf of the authenticated owner.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("business_associate_agreements")
    .insert({
      business_id: business.id,
      version: BAA_VERSION,
      signed_at: new Date().toISOString(),
      signed_by_user_id: user.id,
      signer_name: signerName,
      signer_title:
        typeof body.signer_title === "string" && body.signer_title.length > 0
          ? body.signer_title.slice(0, 200)
          : null,
      signer_ip: ip ? ip.slice(0, 100) : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("baa/accept", error);
  }

  return NextResponse.json({ id: data.id });
}
