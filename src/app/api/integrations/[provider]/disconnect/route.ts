import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PROVIDERS, type ProviderId } from "@/lib/integrations/providers";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ provider: string }> }
) {
  const { provider } = await ctx.params;
  if (!(provider in PROVIDERS)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", req.url));

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  await supabase
    .from("integration_connections")
    .update({ status: "revoked" })
    .eq("business_id", business.id)
    .eq("provider", provider as ProviderId);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    new URL(req.url).origin;
  return NextResponse.redirect(`${appUrl}/settings/integrations`);
}
