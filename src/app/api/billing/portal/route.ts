import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getAppUrl } from "@/lib/app-url";

export async function POST(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("stripe_customer_id")
    .eq("owner_id", user.id)
    .single();

  if (!business?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const appUrl = getAppUrl();

  const session = await getStripe().billingPortal.sessions.create({
    customer: business.stripe_customer_id,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: session.url });
}
