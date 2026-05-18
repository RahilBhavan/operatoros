import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";

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
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const valueCents =
    typeof body.value_cents === "number" && body.value_cents >= 0
      ? Math.round(body.value_cents)
      : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      business_id: business.id,
      name,
      address:
        typeof body.address === "string" && body.address.length > 0
          ? body.address.slice(0, 1000)
          : null,
      jurisdiction_code:
        typeof body.jurisdiction_code === "string" &&
        body.jurisdiction_code.length > 0
          ? body.jurisdiction_code.slice(0, 10).toUpperCase()
          : null,
      customer_name:
        typeof body.customer_name === "string" && body.customer_name.length > 0
          ? body.customer_name.slice(0, 200)
          : null,
      gc_business_name:
        typeof body.gc_business_name === "string" &&
        body.gc_business_name.length > 0
          ? body.gc_business_name.slice(0, 200)
          : null,
      start_date:
        typeof body.start_date === "string" && body.start_date.length > 0
          ? body.start_date.slice(0, 10)
          : null,
      end_date:
        typeof body.end_date === "string" && body.end_date.length > 0
          ? body.end_date.slice(0, 10)
          : null,
      value_cents: valueCents,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("projects/POST", error);
  }

  return NextResponse.json({ id: data.id });
}
