import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkBaaForPhi } from "@/lib/security/baa-gate";
import { dbError } from "@/lib/api/respond";
import type { Database } from "@/types/supabase";

type StaffMemberUpdate =
  Database["public"]["Views"]["staff_members"]["Update"];

export const runtime = "nodejs";

const VALID_EMPLOYMENT = new Set(["w2", "1099", "volunteer", "owner", "other"]);

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
    .select("id, industry_slug")
    .eq("owner_id", user.id)
    .single();
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // Confirm the staff row belongs to this business — RLS enforces this too,
  // but an explicit check returns a clean 404 instead of a write-allowed-zero-rows.
  const { data: existing } = await supabase
    .from("staff_members")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baa = await checkBaaForPhi(supabase, {
    businessId: business.id,
    industrySlug: business.industry_slug,
  });
  if (baa) return NextResponse.json({ error: baa.error }, { status: baa.status });

  const patch: StaffMemberUpdate = {};

  if (typeof body.full_name === "string") {
    const v = body.full_name.trim();
    if (!v || v.length > 200) {
      return NextResponse.json(
        { error: "full_name must be 1-200 chars" },
        { status: 400 },
      );
    }
    patch.full_name = v;
  }
  if ("email" in body) {
    patch.email =
      typeof body.email === "string" && body.email.length > 0
        ? body.email.slice(0, 320)
        : null;
  }
  if ("role" in body) {
    patch.role =
      typeof body.role === "string" && body.role.length > 0
        ? body.role.slice(0, 100)
        : null;
  }
  if ("employment_type" in body) {
    if (typeof body.employment_type === "string" && body.employment_type.length > 0) {
      if (!VALID_EMPLOYMENT.has(body.employment_type)) {
        return NextResponse.json(
          { error: "Invalid employment_type" },
          { status: 400 },
        );
      }
      patch.employment_type =
        body.employment_type as StaffMemberUpdate["employment_type"];
    } else {
      patch.employment_type = null;
    }
  }
  if ("hire_date" in body) {
    patch.hire_date =
      typeof body.hire_date === "string" && body.hire_date.length > 0
        ? body.hire_date.slice(0, 10)
        : null;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { error } = await supabase
    .from("staff_members")
    .update(patch)
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) {
    return dbError("staff/PATCH", error);
  }

  return NextResponse.json({ id });
}
