import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";
import type { Database } from "@/types/supabase";

type ProjectUpdate = Database["public"]["Views"]["projects"]["Update"];

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
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
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: ProjectUpdate = {};

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
  if ("address" in body) {
    patch.address =
      typeof body.address === "string" && body.address.length > 0
        ? body.address.slice(0, 1000)
        : null;
  }
  if ("jurisdiction_code" in body) {
    patch.jurisdiction_code =
      typeof body.jurisdiction_code === "string" &&
      body.jurisdiction_code.length > 0
        ? body.jurisdiction_code.slice(0, 10).toUpperCase()
        : null;
  }
  if ("customer_name" in body) {
    patch.customer_name =
      typeof body.customer_name === "string" && body.customer_name.length > 0
        ? body.customer_name.slice(0, 200)
        : null;
  }
  if ("gc_business_name" in body) {
    patch.gc_business_name =
      typeof body.gc_business_name === "string" &&
      body.gc_business_name.length > 0
        ? body.gc_business_name.slice(0, 200)
        : null;
  }
  if ("start_date" in body) {
    patch.start_date =
      typeof body.start_date === "string" && body.start_date.length > 0
        ? body.start_date.slice(0, 10)
        : null;
  }
  if ("end_date" in body) {
    patch.end_date =
      typeof body.end_date === "string" && body.end_date.length > 0
        ? body.end_date.slice(0, 10)
        : null;
  }
  if ("value_cents" in body) {
    if (typeof body.value_cents === "number" && body.value_cents >= 0) {
      patch.value_cents = Math.round(body.value_cents);
    } else {
      patch.value_cents = null;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("projects")
    .update(patch)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return dbError("projects/PATCH", error);
  }

  return NextResponse.json({ id });
}
