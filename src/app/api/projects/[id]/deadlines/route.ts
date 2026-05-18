import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dbError } from "@/lib/api/respond";

export const runtime = "nodejs";

const VALID_SEVERITY = new Set(["critical", "high", "medium", "low", "info"]);

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await ctx.params;
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
  const dueDate =
    typeof body.due_date === "string" ? body.due_date.slice(0, 10) : "";
  if (!name || !dueDate) {
    return NextResponse.json(
      { error: "name and due_date required" },
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

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("business_id", business.id)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const severity =
    typeof body.severity_tier === "string" &&
    VALID_SEVERITY.has(body.severity_tier)
      ? (body.severity_tier as
          | "critical"
          | "high"
          | "medium"
          | "low"
          | "info")
      : "medium";

  const { data, error } = await supabase
    .from("project_deadlines")
    .insert({
      project_id: projectId,
      business_id: business.id,
      name,
      due_date: dueDate,
      governing_agency:
        typeof body.governing_agency === "string" &&
        body.governing_agency.length > 0
          ? body.governing_agency.slice(0, 200)
          : null,
      severity_tier: severity,
      description:
        typeof body.description === "string" && body.description.length > 0
          ? body.description.slice(0, 4000)
          : null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError("projects/deadlines/POST", error);
  }

  return NextResponse.json({ id: data.id });
}
