import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";
import type { Database } from "@/types/supabase";

type LocationUpdate = Database["public"]["Tables"]["locations"]["Update"];

export const runtime = "nodejs";

const VALID_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
  "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
  "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
  "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

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
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("locations")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patch: LocationUpdate = {};

  if ("state" in body) {
    const state = typeof body.state === "string" ? body.state.toUpperCase() : "";
    if (!VALID_STATES.has(state)) {
      return NextResponse.json({ error: "Valid state required" }, { status: 400 });
    }
    patch.state = state;
  }
  if ("name" in body) {
    patch.name =
      typeof body.name === "string" && body.name.length > 0
        ? body.name.slice(0, 200)
        : null;
  }
  if ("city" in body) {
    patch.city =
      typeof body.city === "string" && body.city.length > 0
        ? body.city.slice(0, 200)
        : null;
  }
  if ("address" in body) {
    patch.address =
      typeof body.address === "string" && body.address.length > 0
        ? body.address.slice(0, 1000)
        : null;
  }
  if ("zip" in body) {
    patch.zip =
      typeof body.zip === "string" && body.zip.length > 0
        ? body.zip.slice(0, 20)
        : null;
  }
  if ("county" in body) {
    patch.county =
      typeof body.county === "string" && body.county.length > 0
        ? body.county.slice(0, 200)
        : null;
  }
  if ("open_date" in body) {
    patch.open_date =
      typeof body.open_date === "string" && body.open_date.length > 0
        ? body.open_date.slice(0, 10)
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("locations")
    .update(patch)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return dbError("locations/PATCH", error);
  }

  return NextResponse.json({ id });
}
