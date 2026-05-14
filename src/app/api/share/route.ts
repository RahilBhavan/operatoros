import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, plan_tier, billing_status")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const isEligible =
    business.billing_status === "active" ||
    business.billing_status === "trialing";

  const hasPlan =
    business.plan_tier === "growth" || business.plan_tier === "scale";

  if (!isEligible || !hasPlan) {
    return NextResponse.json(
      { error: "Upgrade to Growth or Scale to use shareable links" },
      { status: 403 }
    );
  }

  // Delete any existing unexpired token, then create a new one
  await supabase
    .from("share_tokens")
    .delete()
    .eq("business_id", business.id)
    .gt("expires_at", new Date().toISOString());

  const { data: token, error } = await supabase
    .from("share_tokens")
    .insert({ business_id: business.id })
    .select()
    .single();

  if (error || !token) {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }

  const url = `${req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL}/share/${token.token}`;
  return NextResponse.json({ url, expires_at: token.expires_at });
}
