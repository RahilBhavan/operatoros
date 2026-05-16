import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";

const ReplaceSchema = z.object({
  file_path: z.string().min(1).max(512),
  file_type: z.string().min(1).max(80),
  file_name: z.string().min(1).max(256),
});

// Replace a document: archive the existing file into document_versions and
// update the canonical row to point at the new path. Atomic in the sense
// that we insert the version row before the update; if storage upload fails
// the client never reaches here.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = ReplaceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Verify the user owns the document via their business.
  const { data: doc } = await supabase
    .from("documents")
    .select("id, business_id, file_path, file_type")
    .eq("id", id)
    .single();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", doc.business_id)
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  await admin.from("document_versions").insert({
    document_id: doc.id,
    business_id: doc.business_id,
    file_path: doc.file_path,
    file_type: doc.file_type,
    uploaded_by: user.id,
  });

  const { error: updateErr } = await admin
    .from("documents")
    .update({
      file_path: parsed.data.file_path,
      file_type: parsed.data.file_type,
      file_name: parsed.data.file_name,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
      expiry_date: null,
    })
    .eq("id", id);

  if (updateErr) {
    return NextResponse.json({ error: "Replace failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// List version history for a document. Used to power the "previous versions"
// expansion in the document panel.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ownership is enforced by RLS on document_versions ("Owner reads document versions").
  const { data: versions } = await supabase
    .from("document_versions")
    .select("id, file_path, file_type, superseded_at")
    .eq("document_id", id)
    .order("superseded_at", { ascending: false });

  return NextResponse.json({ versions: versions ?? [] });
}
