import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import { logPhiAccess } from "@/lib/security/phi-access-log";

export const runtime = "nodejs";

const VALID_CHANNELS = new Set(["email", "share_link", "manual"]);

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

  const recipientId =
    typeof body.recipient_id === "string" ? body.recipient_id : "";
  const expiryDate =
    typeof body.expiry_date === "string" ? body.expiry_date.slice(0, 10) : "";
  if (!recipientId || !expiryDate) {
    return NextResponse.json(
      { error: "recipient_id and expiry_date required" },
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

  const { data: recipient } = await supabase
    .from("coi_recipients")
    .select("id")
    .eq("id", recipientId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const deliveryChannel =
    typeof body.delivery_channel === "string" &&
    VALID_CHANNELS.has(body.delivery_channel)
      ? (body.delivery_channel as "email" | "share_link" | "manual")
      : "email";

  const { data, error } = await supabase
    .from("coi_issues")
    .insert({
      business_id: business.id,
      recipient_id: recipientId,
      effective_date:
        typeof body.effective_date === "string" && body.effective_date.length > 0
          ? body.effective_date.slice(0, 10)
          : null,
      expiry_date: expiryDate,
      delivery_channel: deliveryChannel,
      issued_by: user.id,
      notes:
        typeof body.notes === "string" && body.notes.length > 0
          ? body.notes.slice(0, 4000)
          : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("coi/issues/POST", error);
  }

  await logPhiAccess({
    businessId: business.id,
    action: deliveryChannel === "share_link" ? "share" : "create",
    userId: user.id,
  });

  return NextResponse.json({ id: data.id });
}
